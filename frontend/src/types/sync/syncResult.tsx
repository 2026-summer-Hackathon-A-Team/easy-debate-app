// sync:result イベントを定義するファイル。
// 各フェーズで共有するサブタイプはcommon.tsxを参照する

import type {
  ChatHistoryItem,
  Judge,
  JoinUser,
  ThanksHistoryItem,
  TurnInfo,
  Violation,
} from './common';

// マッチング待ち画面
type MatchingSyncResult = {
  phase: 'MATCHING';
};

// お題選定画面
type TopicChangeSyncResult = {
  phase: 'TOPIC_CHANGE';
  topic: string;
  answerDeadline: string;
  isAnswered: boolean;
};

// お題決定画面
type DebateReadySyncResult = {
  phase: 'DEBATE_READY';
  isChangeTopic: boolean;
  topic: string;
  users: [JoinUser, JoinUser];
  answerDeadline: string;
  isAnswered: boolean;
};

// ディベート画面
type DebateSyncResult = {
  phase: 'DEBATE';
  topic: string;
  users: [JoinUser, JoinUser];
  turn: TurnInfo;
  chatSubmitDeadline: string;
  chatHistory: ChatHistoryItem[];
};

// ディベート画面
type JudgeWaitingSyncResult = {
  phase: 'JUDGE_WAITING';
  topic: string;
  users: [JoinUser, JoinUser];
  turn: TurnInfo;
  chatHistory: ChatHistoryItem[];
  judge?: Judge;
};

// 勝敗判定画面
type JudgeSyncResult = {
  phase: 'JUDGE';
  judge: Judge;
  violation: Violation;
  thanksHistory?: ThanksHistoryItem[];
  isThanksDone?: boolean;
  isRematch?: boolean;
  isRematchAnswered?: boolean;
  isRematchResult?: boolean;
};

type SyncResult =
  | MatchingSyncResult
  | TopicChangeSyncResult
  | DebateReadySyncResult
  | DebateSyncResult
  | JudgeWaitingSyncResult
  | JudgeSyncResult;

export type { SyncResult };
