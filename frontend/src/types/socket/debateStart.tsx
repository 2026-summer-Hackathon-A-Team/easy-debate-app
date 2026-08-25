import type { ChatHistoryItem, JoinUser, TurnInfo } from '../sync/common';

// debate:start イベントのペイロード（両者の開始合図が揃った際にサーバーから送られる）
type DebateStart = {
  topic: string;
  users: [JoinUser, JoinUser];
  turn: TurnInfo;
  chatSubmitDeadline: string;
  chatHistory: ChatHistoryItem[];
};

export type { DebateStart };
