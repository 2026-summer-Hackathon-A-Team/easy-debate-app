import type { ChatHistoryItem, JoinUser, TurnInfo } from '../sync/common';

// debate:chatReceive イベントのペイロード（チャット送信の結果としてサーバーから返る）
type DebateChatReceive = {
  topic: string;
  users: [JoinUser, JoinUser];
  turn: TurnInfo;
  chatSubmitDeadline: string;
  chatHistory: ChatHistoryItem[];
};

export type { DebateChatReceive };
