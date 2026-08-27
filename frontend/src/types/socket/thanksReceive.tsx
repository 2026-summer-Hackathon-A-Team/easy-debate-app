import type { ThanksHistoryItem } from '../sync/common';

// thanks:receive イベントのペイロード（両者のお礼をまとめてサーバーから受け取る）
type ThanksReceive = {
  thanksHistory: ThanksHistoryItem[];
};

export type { ThanksReceive };
