import type { ChatHistoryItem, JoinUser, TurnInfo } from '../sync/common';

// debate:chatReceive イベントのペイロード
type DebateChatReceive = {
  topic: string;
  users: [JoinUser, JoinUser];
  turn: TurnInfo;
  chatSubmitDeadline: string;
  chatHistory: ChatHistoryItem[];
};

export type { DebateChatReceive };
