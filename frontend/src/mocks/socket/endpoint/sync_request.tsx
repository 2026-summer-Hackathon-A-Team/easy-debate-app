import { afterSeconds } from '../../helpers';
import type {
  ChatHistoryItem,
  JoinUser,
  JudgeUserResult,
  ScenarioHandler,
  SyncResult,
  Violation,
} from '../../types';
import {
  answerDeadlineSec,
  changedTopic,
  chatSubmitDeadlineSec,
  judgeConfirmDeadlineSec,
  myUserId,
  opponentUserId,
  totalTurn,
} from '../settings';

/**
 * sync:request  リロード時のデータ同期依頼（現在のフェーズの問い合わせ）
 */
const syncRequest: ScenarioHandler = (server) => {
  /** ---------- syncResultSamples の中から再現したいケースを選ぶ ---------- */
  server.emit('sync:result', syncResultSamples.matching());
};

const syncResultSamples: Record<string, () => SyncResult> = {
  // マッチング待ち画面
  matching: () => ({
    phase: 'MATCHING',
  }),

  // お題選定画面(未回答)
  topicChange: () => ({
    phase: 'TOPIC_CHANGE',
    topic: changedTopic,
    answerDeadline: afterSeconds(answerDeadlineSec),
    isAnswered: false,
  }),

  // お題決定画面(未回答)
  debateReady: () => ({
    phase: 'DEBATE_READY',
    isChangeTopic: false,
    topic: changedTopic,
    users: debateReadyUsers,
    answerDeadline: afterSeconds(answerDeadlineSec),
    isAnswered: false,
  }),

  // ディベート画面(2ターン目・自分の番)
  debate: () => ({
    phase: 'DEBATE',
    topic: changedTopic,
    users,
    turn: { isCurrentTurnUserId: myUserId, currentTurn: 2, totalTurn },
    chatSubmitDeadline: afterSeconds(chatSubmitDeadlineSec),
    chatHistory,
  }),

  // ディベート画面(最終チャット後の15秒待機。判定結果を先行して受け取っている状態)
  judgeWaiting: () => ({
    phase: 'JUDGE_WAITING',
    topic: changedTopic,
    users,
    turn: {
      isCurrentTurnUserId: opponentUserId,
      currentTurn: totalTurn,
      totalTurn,
    },
    chatHistory,
    judge: {
      // まだ先の時刻なので待機中として扱われる
      judgeDisplayStartAt: afterSeconds(judgeDisplayWaitSec),
      judgeConfirmDeadline: afterSeconds(
        judgeDisplayWaitSec + judgeConfirmDeadlineSec,
      ),
      judgeReason,
      users: iWin,
      thanks,
    },
  }),

  // 勝敗判定画面(自分の勝ち・お礼未送信)
  judgeWin: () => ({
    phase: 'JUDGE',
    judge: {
      // 過ぎた時刻なので判定表示済みとして扱われる
      judgeDisplayStartAt: afterSeconds(-judgeDisplayWaitSec),
      judgeConfirmDeadline: afterSeconds(judgeConfirmDeadlineSec),
      judgeReason,
      users: iWin,
      thanks,
    },
    violation: noViolation,
    thanksHistory: [],
    isThanksDone: false,
    isRematch: true,
    isRematchAnswered: false,
  }),

  // 勝敗判定画面(自分の負け・お礼未送信)
  judgeLose: () => ({
    phase: 'JUDGE',
    judge: {
      judgeDisplayStartAt: afterSeconds(-judgeDisplayWaitSec),
      judgeConfirmDeadline: afterSeconds(judgeConfirmDeadlineSec),
      judgeReason,
      users: iLose,
      thanks,
    },
    violation: noViolation,
    thanksHistory: [],
    isThanksDone: false,
    isRematch: true,
    isRematchAnswered: false,
  }),

  // 勝敗判定画面(対戦中のモラル違反による不戦勝。お礼と再対戦の受付なし)
  judgeMoralViolationOfButtle: () => ({
    phase: 'JUDGE',
    judge: {
      judgeDisplayStartAt: afterSeconds(-judgeDisplayWaitSec),
      judgeConfirmDeadline: afterSeconds(judgeConfirmDeadlineSec),
      judgeReason:
        '誹謗中傷と判定される発言があったため、敗北として処理されました。',
      users: iWin,
    },
    violation: {
      ...noViolation,
      isMoralViolationOfButtle: true,
      violationUserId: opponentUserId,
    },
  }),

  // 勝敗判定画面(お礼でのモラル違反。違反者のお礼は履歴に含まれない)
  judgeMoralViolationOfThanks: () => ({
    phase: 'JUDGE',
    judge: {
      judgeDisplayStartAt: afterSeconds(-judgeDisplayWaitSec),
      judgeConfirmDeadline: afterSeconds(judgeConfirmDeadlineSec),
      judgeReason,
      users: iWin,
      thanks,
    },
    violation: {
      ...noViolation,
      isMoralViolationOfThanks: true,
      violationUserId: opponentUserId,
    },
    thanksHistory: [
      { userId: myUserId, thanksMsg: 'ありがとうございました！' },
    ],
    isThanksDone: true,
    isRematch: true,
    isRematchAnswered: false,
  }),

  // 勝敗判定画面(2連続でチャット送信がなかったことによる不戦勝)
  judge2NoChat: () => ({
    phase: 'JUDGE',
    judge: {
      judgeConfirmDeadline: afterSeconds(judgeConfirmDeadlineSec),
      judgeReason:
        '2ターン連続で発言がなかったため、不戦敗として処理されました。',
      users: iWin,
    },
    violation: {
      ...noViolation,
      is2NoChat: true,
      violationUserId: opponentUserId,
    },
  }),

  // 勝敗判定画面(相手の離脱による不戦勝)
  judgeLeave: () => ({
    phase: 'JUDGE',
    judge: {
      judgeConfirmDeadline: afterSeconds(judgeConfirmDeadlineSec),
      judgeReason:
        '接続が切断されたまま戻らなかったため、不戦敗として処理されました。',
      users: iWin,
    },
    violation: {
      ...noViolation,
      isLeave: true,
      violationUserId: opponentUserId,
    },
  }),
};

// 勝敗判定の表示開始までの待機秒数
const judgeDisplayWaitSec = 15;

// 参加者(DEBATE_READY 用。先攻・後攻はこのフェーズでのみ使う)
const debateReadyUsers: [JoinUser, JoinUser] = [
  { userId: myUserId, position: '優れている', turn: 'FIRST' },
  { userId: opponentUserId, position: '優れていない', turn: 'SECOND' },
];

// 参加者(DEBATE 以降。先攻・後攻は含めない)
const users: [JoinUser, JoinUser] = [
  { userId: myUserId, position: '優れている' },
  { userId: opponentUserId, position: '優れていない' },
];

// チャットの履歴
const chatHistory: ChatHistoryItem[] = [
  {
    userId: myUserId,
    chatMsg: '出社と比べて通勤時間の分だけ作業時間が増えます。',
  },
  {
    userId: opponentUserId,
    chatMsg: 'その分だけ雑談による情報共有が減ります。',
  },
];

// 固定お礼の選択肢
const thanks = [
  { fixedThanksId: 1, fixedThanksMsg: 'ありがとうございました！' },
  { fixedThanksId: 2, fixedThanksMsg: '楽しかったです！' },
  { fixedThanksId: 3, fixedThanksMsg: '再対戦しませんか？' },
];

// 自分が勝ったときのレート変動
const iWin: [JudgeUserResult, JudgeUserResult] = [
  { userId: myUserId, isWinner: true, updatedRate: 1516, rateUpDown: 16 },
  {
    userId: opponentUserId,
    isWinner: false,
    updatedRate: 1486,
    rateUpDown: -14,
  },
];

// 自分が負けたときのレート変動
const iLose: [JudgeUserResult, JudgeUserResult] = [
  { userId: myUserId, isWinner: false, updatedRate: 1486, rateUpDown: -14 },
  {
    userId: opponentUserId,
    isWinner: true,
    updatedRate: 1516,
    rateUpDown: 16,
  },
];

// 判定理由
const judgeReason = '再反論の一貫性で上回っていたため、勝者と判定しました。';

// 違反なし
const noViolation: Violation = {
  isMoralViolationOfButtle: false,
  is2NoChat: false,
  isLeave: false,
  isMoralViolationOfThanks: false,
};

export { syncRequest };
