import { prisma } from '../../lib/prisma.js';
import { requestJudge } from '../ai/judge.js';
import type { Debate } from '../Debate.js';
import type { AppServer } from '../index.js';
import { debateRoom } from '../rooms.js';
import { userDebateIds } from '../stores/user-debate.js';
import { startJudgeConfirmDeadline } from './rematch.js';

/** 判定に必要な情報 */
type JudgeOutcome = {
  winnerUserId: number;
  loserUserId: number;
  /** 勝者の点数 - 敗者の点数（不戦敗時は0） */
  scoreDiff: number;
  judgeReason: string;
};

/** レート・モラルスコアの上限 */
const SCORE_MAX = 9999;
/** レート・モラルスコアの下限 */
const SCORE_MIN = 0;
/** 通常勝利の最低変動値 */
const WIN_RATE_MIN = 20;
/** 通常敗北の最低変動 */
const LOSE_RATE_MIN = 10;
/** 不戦勝・不戦敗の固定変動 */
const WALKOVER_RATE = 20;
/** モラル違反敗北の最低変動 */
const MORAL_LOSE_RATE_BASE = 100;
/** 連勝インセンティブの上限 */
const STREAK_BONUS_MAX = 50;

/** 勝敗判定結果確認の期限（ミリ秒） */
export const JUDGE_CONFIRM_DEADLINE_MS = 120_000;

/** 不戦敗時の判定理由 */
const WALKOVER_JUDGE_REASON = {
  NO_CHAT: '2ターン連続で発言がなかったため、不戦敗として処理されました。',
  LEAVE: '接続が切断されたまま戻らなかったため、不戦敗として処理されました。',
} as const;

/** 固定お礼の選択肢 */
const FIXED_THANKS = [
  { fixedThanksId: 1, fixedThanksMsg: 'ありがとうございました！' },
  { fixedThanksId: 2, fixedThanksMsg: '楽しかったです！' },
  { fixedThanksId: 3, fixedThanksMsg: '再対戦しませんか？' },
] as const;

/** モラルスコアの変動値 */
const MORAL_SCORE_UPDOWN = {
  /** お礼の送信 */
  THANKS: 10,
  /** 対戦中のモラル違反 */
  VIOLATION_BATTLE: -100,
  /** お礼でのモラル違反 */
  VIOLATION_THANKS: -100,
  /** 2連続チャットなし */
  NO_CHAT: -30,
  /** 離脱 */
  LEAVE: -30,
} as const;

/** モラル違反カテゴリID */
export const MORAL_VIOLATION_CATEGORY = {
  /** 対戦中のモラル違反 */
  BATTLE: 1,
  /** お礼でのモラル違反 */
  THANKS: 2,
  /** 2連続チャットなし */
  NO_CHAT: 3,
  /** 離脱 */
  LEAVE: 4,
} as const;

/** レートモラルスコアを上限・下限に丸める */
const clampScore = (score: number): number =>
  Math.min(Math.max(score, SCORE_MIN), SCORE_MAX);

/**
 * 連勝インセンティブを算出
 *
 * 2連勝で10pt、以降1連勝ごとに10pt加算、7連勝以降は50pt固定
 *
 * @param streakCount 更新後の連勝数
 */
const getStreakBonus = (streakCount: number): number =>
  Math.min(Math.max((streakCount - 1) * 10, 0), STREAK_BONUS_MAX);

/**
 * 勝者のレート変動を計算
 *
 * @param violation 違反の種類
 * @param scoreDiff 勝者の点数 - 敗者の点数
 * @param streakCount 更新後の連勝数
 * */
const calcWinnerRateUpdown = (
  violation: Debate['violation'],
  scoreDiff: number,
  streakCount: number,
): number => {
  // 勝者の連勝数からインセンティブを算出
  const bonus = getStreakBonus(streakCount);

  // 相手が2連続チャットなし・離脱による不戦勝は固定値 + 連勝インセンティブ
  if (violation.is2NoChat || violation.isLeave) {
    return WALKOVER_RATE + bonus;
  }
  // 相手のモラル違反による勝利で、スコアで負けていた場合は固定値 + 連勝インセンティブ
  if (violation.isMoralViolationOfBattle && scoreDiff < 0) {
    return WALKOVER_RATE + bonus;
  }
  // 勝者は固定値・得点差 * 10のどちらか大きい方
  return Math.max(WIN_RATE_MIN, scoreDiff * 10) + bonus;
};

/**
 * 敗者のレート変動を計算
 *
 * @param violation 違反の種類
 * @param scoreDiff 勝者の点数 - 敗者の点数
 */
const calcLoserRateUpdown = (
  violation: Debate['violation'],
  scoreDiff: number,
): number => {
  // 2連続チャットなし・離脱による不戦敗は固定値
  if (violation.is2NoChat || violation.isLeave) {
    return -WALKOVER_RATE;
  }

  // モラル違反による敗北は、固定値 +（相手との点差 * 5）
  if (violation.isMoralViolationOfBattle) {
    return -(MORAL_LOSE_RATE_BASE + Math.max(scoreDiff, 0) * 5);
  }
  // 通常の敗北の場合、固定値 +（相手との点差 * 5）
  return -Math.max(LOSE_RATE_MIN, scoreDiff * 5);
};

/**
 *  レート・モラルスコアの更新後の値と変動値を算出
 *
 * 上限・下限を超える場合に値を丸めた結果とその変動値を出力する
 *
 * @example
 * 現在のスコア: 9990 もらえたスコア: 40  // 更新後: 9999, 実際に増加した値: 9（上限で丸め）
 */
export const applyScore = (
  current: number,
  updown: number,
): { updated: number; actualUpdown: number } => {
  const updated = clampScore(current + updown);
  return { updated, actualUpdown: updated - current };
};

/**
 *  不戦敗の勝敗を決める
 *
 * violationUserIdが敗者となる
 */
const resolveWalkover = (debate: Debate): JudgeOutcome => {
  // 違反者IDを取得
  const { violationUserId } = debate.violation;
  if (violationUserId === undefined) {
    throw new Error(`violationUserId is missing: debateId=${debate.debateId}`);
  }
  // 違反者ではないユーザーIDを勝者とする
  const winner = debate.users.find((u) => u.userId !== violationUserId);
  if (winner === undefined) {
    throw new Error(`winner not found: debateId=${debate.debateId}`);
  }
  return {
    winnerUserId: winner.userId,
    loserUserId: violationUserId,
    scoreDiff: 0,
    judgeReason: debate.violation.is2NoChat
      ? WALKOVER_JUDGE_REASON.NO_CHAT
      : WALKOVER_JUDGE_REASON.LEAVE,
  };
};

/**
 *  AIによる勝敗判定
 *
 * 反則が検知された場合はvoilationへ反映する
 * */
const resolveByAi = async (debate: Debate): Promise<JudgeOutcome> => {
  const firstUser = debate.users.find((u) => u.turn === 'FIRST');
  const secondUser = debate.users.find((u) => u.turn === 'SECOND');

  if (firstUser?.position === undefined || secondUser?.position === undefined) {
    throw new Error(`position is missing: debateId=${debate.debateId}`);
  }

  const result = await requestJudge(
    debate.topic,
    firstUser.position,
    secondUser.position,
    debate.chatHistory,
    firstUser.userId,
  );

  // A先行 B後攻を実際のユーザーIDへ戻す
  const winnerUserId =
    result.winner === 'A' ? firstUser.userId : secondUser.userId;
  const loserUserId =
    result.winner === 'A' ? secondUser.userId : firstUser.userId;

  const winnerScore = result.winner === 'A' ? result.scores.a : result.scores.b;
  const loserScore = result.winner === 'A' ? result.scores.b : result.scores.a;

  // 反則があった場合はviolationへ反映
  if (result.foul.detected && result.foul.loser !== null) {
    debate.violation.isMoralViolationOfBattle = true;
    debate.violation.violationUserId =
      result.foul.loser === 'A' ? firstUser.userId : secondUser.userId;
  }
  return {
    winnerUserId,
    loserUserId,
    scoreDiff: winnerScore - loserScore,
    judgeReason: result.win_loss_factors,
  };
};

/**
 * 敗者のモラルスコア変動値を算出する
 *
 * 違反・不戦敗をした本人のみ対象
 */
const getLoserMoralUpdown = (violation: Debate['violation']): number => {
  if (violation.isMoralViolationOfBattle) {
    return MORAL_SCORE_UPDOWN.VIOLATION_BATTLE;
  }
  if (violation.is2NoChat) return MORAL_SCORE_UPDOWN.NO_CHAT;
  if (violation.isLeave) return MORAL_SCORE_UPDOWN.LEAVE;
  return 0;
};

/**
 * DB保存用モラル違反カテゴリIDを判定する
 */
const getViolationCategoryId = (
  violation: Debate['violation'],
): number | undefined => {
  if (violation.isMoralViolationOfBattle) {
    return MORAL_VIOLATION_CATEGORY.BATTLE;
  }
  if (violation.is2NoChat) return MORAL_VIOLATION_CATEGORY.NO_CHAT;
  if (violation.isLeave) return MORAL_VIOLATION_CATEGORY.LEAVE;
  return undefined;
};

/**
 * 勝敗判定処理
 *
 * AI判定（不戦敗時はスキップ）
 * judge:resultを両者へ送信する
 */
export const processJudge = async (
  io: AppServer,
  debate: Debate,
): Promise<void> => {
  const { debateId } = debate;

  // 不戦敗の場合はAI判定を行わない
  const isWalkover = debate.violation.is2NoChat || debate.violation.isLeave;
  const outcome = isWalkover
    ? resolveWalkover(debate)
    : await resolveByAi(debate);

  // 勝者・敗者のレート・モラルスコア・連勝数をDBから取得
  const users = await prisma.user.findMany({
    where: { id: { in: [outcome.winnerUserId, outcome.loserUserId] } },
    select: { id: true, rate: true, moralScore: true, streakCount: true },
  });

  const winnerUser = users.find((u) => u.id === outcome.winnerUserId);
  const loserUser = users.find((u) => u.id === outcome.loserUserId);
  if (winnerUser === undefined || loserUser === undefined) {
    throw new Error(`user not found: debateId=${debateId}`);
  }

  // レートを計算
  const winnerStreak = winnerUser.streakCount + 1;
  const winnerRate = applyScore(
    winnerUser.rate,
    calcWinnerRateUpdown(debate.violation, outcome.scoreDiff, winnerStreak),
  );
  const loserRate = applyScore(
    loserUser.rate,
    calcLoserRateUpdown(debate.violation, outcome.scoreDiff),
  );

  // モラルスコアを計算（違反者のみ減点）
  const loserMoral = applyScore(
    loserUser.moralScore,
    getLoserMoralUpdown(debate.violation),
  );
  /** DB保存用モラル違反IDを取得 */
  const categoryId = getViolationCategoryId(debate.violation);

  // DBにディベート結果を登録（途中で失敗した場合全てロールバック）
  await prisma.$transaction(async (tx) => {
    // 勝敗結果を登録
    await tx.debateHistory.update({
      where: { id_userId: { id: debateId, userId: winnerUser.id } },
      data: { winnerFlag: true },
    });
    // 勝者レート・連勝数を更新
    await tx.user.update({
      where: { id: winnerUser.id },
      data: { rate: winnerRate.updated, streakCount: winnerStreak },
    });
    // 敗者のレート・連勝数を更新
    await tx.user.update({
      where: { id: loserUser.id },
      data: {
        rate: loserRate.updated,
        moralScore: loserMoral.updated,
        streakCount: 0,
      },
    });

    // レート変動履歴を登録
    await tx.rateUpdownHistory.createMany({
      data: [
        {
          debateHistoryId: debateId,
          userId: winnerUser.id,
          rateUpdown: winnerRate.actualUpdown,
        },
        {
          debateHistoryId: debateId,
          userId: loserUser.id,
          rateUpdown: loserRate.actualUpdown,
        },
      ],
    });
    // モラルスコア変動履歴を登録（モラル違反があった場合のみ）
    if (loserMoral.actualUpdown !== 0) {
      await tx.moralUpdownHistory.create({
        data: {
          debateHistoryId: debateId,
          userId: loserUser.id,
          moralScoreUpdown: loserMoral.actualUpdown,
        },
      });
    }
    // モラル違反履歴を登録（モラル違反があった場合のみ）
    if (categoryId !== undefined) {
      await tx.moralViolationHistory.create({
        data: {
          debateHistoryId: debateId,
          userId: loserUser.id,
          moralViolationCategoryId: categoryId,
          moralViolationReason: outcome.judgeReason.slice(0, 200),
        },
      });
    }
  });

  // 判定結果をメンバ変数へ保持
  const judgeConfirmDeadline = new Date(Date.now() + JUDGE_CONFIRM_DEADLINE_MS);
  const [user0, user1] = debate.users;

  debate.judge = {
    judgeConfirmDeadline,
    judgeReason: outcome.judgeReason,
    users: [
      {
        userId: user0.userId,
        isWinner: user0.userId === outcome.winnerUserId,
        updatedRate:
          user0.userId === winnerUser.id
            ? winnerRate.updated
            : loserRate.updated,
        rateUpDown:
          user0.userId === winnerUser.id
            ? winnerRate.actualUpdown
            : loserRate.actualUpdown,
      },
      {
        userId: user1.userId,
        isWinner: user1.userId === outcome.winnerUserId,
        updatedRate:
          user1.userId === winnerUser.id
            ? winnerRate.updated
            : loserRate.updated,
        rateUpDown:
          user1.userId === winnerUser.id
            ? winnerRate.actualUpdown
            : loserRate.actualUpdown,
      },
    ],
    // 違反があった場合はお礼・再対戦受付を除外
    thanks: categoryId === undefined ? [...FIXED_THANKS] : undefined,
  };

  debate.phase = 'JUDGE';
  io.to(debateRoom(debateId)).emit('judge:result', {
    judgeConfirmDeadline: judgeConfirmDeadline.toISOString(),
    judgeReason: outcome.judgeReason,
    users: debate.judge?.users,
    violation: {
      isMoralViolationOfBattle: debate.violation.isMoralViolationOfBattle,
      is2NoChat: debate.violation.is2NoChat,
      isLeave: debate.violation.isLeave,
      violationUserId: debate.violation.violationUserId,
    },
    isRematch: debate.isRematch,
    thanks: debate.judge?.thanks,
  });

  for (const u of debate.users) {
    u.isLeaveWatching = false;
  }

  if (debate.violation.violationUserId !== undefined) {
    const violationUser = debate.users.find(
      (u) => u.userId === debate.violation.violationUserId,
    );
    if (violationUser !== undefined) {
      violationUser.isRematchAnswered = true;
      violationUser.isHopeRematch = false;
    }
    userDebateIds.delete(debate.violation.violationUserId);
  }

  startJudgeConfirmDeadline(io, debateId);
};
