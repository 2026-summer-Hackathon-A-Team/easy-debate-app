import type { ThanksHistoryItem } from '../sync/common';

// thanks:receive イベントのペイロード
type ThanksReceive = {
  thanksHistory: ThanksHistoryItem[];
};

export type { ThanksReceive };
