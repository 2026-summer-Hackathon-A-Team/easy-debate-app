import type { ChatHistoryItem, JoinUser, TurnInfo } from '../sync/common';

// debate:start イベントのペイロード
type DebateStart = {
  topic: string;
  users: [JoinUser, JoinUser];
  turn: TurnInfo;
  chatSubmitDeadline: string;
  chatHistory: ChatHistoryItem[];
};

export type { DebateStart };
