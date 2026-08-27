import { z } from 'zod';
import type { AppServer } from '../index.js';
import { Debate } from '../Debate.js';
import { debateRoom } from '../rooms.js';
import { debates, userDebateIds } from '../stores/user-debate.js';
import { randomUUID } from 'node:crypto';
import {
  ANSWER_DEADLINE_MS,
  shufflePositions,
  TOTAL_TURN,
} from './matching.js';
import { requestTopic } from '../ai/topic.js';
import { JUDGE_CONFIRM_DEADLINE_MS } from './debatejudge.js';
import type { AppSocket } from '../types/events.js';
import { getDebateAndJoinedUser } from './syncrequest.js';

/** 再対戦可能な最大回数（この回数に達したら次は不可） */
const REMATCH_LIMIT = 2;

/** rematch:anyRequestのペイロードスキーマ */
const rematchRequestSchema = z.object({ isHopeRematch: z.boolean() });

/**
 * JUDGEフェーズ確認タイマー管理ストア
 *
 * - key: debateId
 * - value: タイムアウト用タイマー
 *
 * judgeConfirmDeadline（再対戦回答の締切） をサーバー内部のタイマーとして扱う
 */
const judgeConfirmTimers = new Map<string, NodeJS.Timeout>();

/** JUDGEフェーズ確認タイマー開始 */
export const startJudgeConfirmTimer = (
  debateId: string,
  callback: () => void,
  ms: number,
): void => {
  stopJudgeConfirmTimer(debateId);
  const timer = setTimeout(() => {
    judgeConfirmTimers.delete(debateId);
    callback();
  }, ms);
  judgeConfirmTimers.set(debateId, timer);
};

/** JUDGEフェーズ確認タイマー停止 */
export const stopJudgeConfirmTimer = (debateId: string): void => {
  const timer = judgeConfirmTimers.get(debateId);
  if (timer === undefined) return;
  clearTimeout(timer);
  judgeConfirmTimers.delete(debateId);
};

/**
 * インスタンス・ストアを全て削除し、両者切断する
 */
const destroyDebateAndDisconnect = (io: AppServer, debate: Debate): void => {
  stopJudgeConfirmTimer(debate.debateId);
  io.in(debateRoom(debate.debateId)).disconnectSockets(true);
  debates.delete(debate.debateId);
  for (const u of debate.users) {
    userDebateIds.delete(u.userId);
  }
};

/**
 * 再対戦を成立させる
 *
 * 新しいdebateIdでインスタンスを作り直し、TOPIC_CHANGEへ遷移する */
const startRematch = async (io: AppServer, debate: Debate): Promise<void> => {
  stopJudgeConfirmTimer(debate.debateId);

  const oldDebateId = debate.debateId;
  const userIds: [number, number] = [
    debate.users[0].userId,
    debate.users[1].userId,
  ];

  const rematchCount = debate.rematchCount + 1;

  /**
   * お題・ポジション・先行後攻を取得
   *
   * APIからのレスポンスの形式チェックが2回失敗すると何も返さない為、固定のお題を返してあげる
   */
  const { topic, positionA, positionB } = await requestTopic().catch((e) => {
    console.error('topic generation failed', e);
    return {
      topic: '一生無料になるなら外食と交通費どちらを選ぶべきか?',
      positionA: '外食を無料にするべき',
      positionB: '交通費を無料にするべき',
    };
  });

  const newDebateId = randomUUID();
  const answerDeadline = new Date(Date.now() + ANSWER_DEADLINE_MS);

  const newDebate = new Debate(
    newDebateId,
    userIds,
    topic,
    answerDeadline,
    TOTAL_TURN,
    rematchCount < REMATCH_LIMIT,
  );
  newDebate.rematchCount = rematchCount;

  shufflePositions(newDebate, positionA, positionB);

  // 古いインスタンスを削除し、新しいインスタンスに差し替え
  debates.delete(oldDebateId);
  debates.set(newDebateId, newDebate);
  for (const userId of userIds) {
    userDebateIds.set(userId, newDebateId);
  }

  // ルームを新しいdebateIdへ移動
  io.in(debateRoom(oldDebateId)).socketsJoin(debateRoom(newDebateId));
  io.in(debateRoom(oldDebateId)).socketsLeave(debateRoom(oldDebateId));

  io.to(debateRoom(newDebateId)).emit('rematch:anyResult', {
    isRematchResult: true,
    topic,
    answerDeadline: answerDeadline.toISOString(),
  });
};

/**
 * 再対戦の希望の有無を集計し、成立可否を判定
 *
 * disconnectHandler、rematchAnyRequestHandler、タイムアウト処理の
 * いずれからも呼ばれる共通の集計処理
 */
export const resolveRematch = async (
  io: AppServer,
  debate: Debate,
): Promise<void> => {
  // 両者の回答が揃っていなければ何もしない
  if (!debate.users.every((u) => u.isRematchAnswered === true)) return;

  const isRematchAgreed = debate.users.every((u) => u.isHopeRematch === true);

  if (isRematchAgreed) {
    await startRematch(io, debate);
    return;
  }
  io.to(debateRoom(debate.debateId)).emit('rematch:anyResult', {
    isRematchResult: false,
  });
};

/**
 * JUDGEフェーズ時間切れ処理
 *
 * 未回答のユーザーを「希望しない」として集計
 */
const judgeConfirmDeadlineTimeout = async (
  io: AppServer,
  debateId: string,
): Promise<void> => {
  const debate = debates.get(debateId);
  if (debate === undefined) return;
  if (debate.phase !== 'JUDGE') return;

  for (const u of debate.users) {
    if (u.isRematchAnswered !== true) {
      u.isRematchAnswered = true;
      u.isHopeRematch = false;
    }
  }

  await resolveRematch(io, debate);
};

/**
 * JUDGEフェーズ開始時に呼び出す
 *
 * judgeConfirmDeadline（2分）のタイマーを開始する
 */
export const startJudgeConfirmDeadline = (
  io: AppServer,
  debateId: string,
): void => {
  startJudgeConfirmTimer(
    debateId,
    () => {
      judgeConfirmDeadlineTimeout(io, debateId).catch((e: unknown) => {
        console.error('judgeConfirmDeadlineTimeoutの処理に失敗しました。', e);
      });
    },
    JUDGE_CONFIRM_DEADLINE_MS,
  );
};

/**
 * 再対戦希望有無受付受理
 */
export const rematchAnyRequestHandler = async (
  io: AppServer,
  socket: AppSocket,
  data: unknown,
): Promise<void> => {
  const { userId } = socket.data;

  const debateId = userDebateIds.get(userId);
  if (debateId === undefined) return;

  const { debate, user } = getDebateAndJoinedUser(debateId, userId);

  // すでに回答済みなら無視
  if (user.isRematchAnswered === true) return;
  // 再対戦の受付がない場合は無視
  if (!debate.isRematch) return;
  // バリデーションチェック NGなら何もしない
  const parsed = rematchRequestSchema.safeParse(data);
  if (!parsed.success) return;

  user.isRematchAnswered = true;
  user.isHopeRematch = parsed.data.isHopeRematch;
  await resolveRematch(io, debate);
};
