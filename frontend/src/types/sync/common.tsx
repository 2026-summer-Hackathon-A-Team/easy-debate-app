// sync:result の各フェーズ共通で使い回すサブタイプ置き場。
// フェーズごとの形はsyncResult.tsxで定義する

type Phase =
  | 'MATCHING'
  | 'TOPIC_CHANGE'
  | 'DEBATE_READY'
  | 'DEBATE'
  | 'JUDGE_WAITING'
  | 'JUDGE';

// 参加ユーザー
type JoinUser = {
  userId: number;
  position: string;
  turn?: 'FIRST' | 'SECOND';
};

// ターン情報（DEBATE）
type TurnInfo = {
  isCurrentTurnUserId: number;
  currentTurn: number;
  totalTurn: number;
};

// チャット送信履歴の1件
type ChatHistoryItem = {
  userId: number;
  chatMsg: string;
};

// お礼履歴の1件
type ThanksHistoryItem = {
  userId: number;
  thanksMsg: string;
};

// 固定お礼の選択肢
type FixedThanks = {
  fixedThanksId: number;
  fixedThanksMsg: string;
};

// ユーザーごとの勝敗判定結果
type JudgeUserResult = {
  userId: number;
  isWinner: boolean;
  updatedRate: number;
  rateUpDown: number;
};

// 勝敗判定結果（JUDGE_WAITING / JUDGE）
type Judge = {
  judgeConfirmDeadline: string;
  judgeReason: string;
  users: [JudgeUserResult, JudgeUserResult];
  thanks?: FixedThanks[];
};

// 違反・不戦敗の状態
type Violation = {
  isMoralViolationOfBattle: boolean;
  is2NoChat: boolean;
  isLeave: boolean;
  isMoralViolationOfThanks: boolean;
  violationUserId?: number;
};

export type {
  Phase,
  JoinUser,
  TurnInfo,
  ChatHistoryItem,
  ThanksHistoryItem,
  FixedThanks,
  JudgeUserResult,
  Judge,
  Violation,
};
