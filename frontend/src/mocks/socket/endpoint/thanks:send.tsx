import type { ScenarioHandler, ThanksReceive } from '../../types';
import { myUserId, opponentUserId } from '../settings';

/**
 * thanks:send  お礼送信
 */
const thanksSend: ScenarioHandler = (server) => {
  /** ---------- モラル違反なしの場合 ---------- */
  const payload: ThanksReceive = {
    // これまでの両者の全てのお礼
    thanksHistory: [
      { userId: myUserId, thanksMsg: '良い議論をありがとうございました。' },
      { userId: opponentUserId, thanksMsg: 'ありがとうございました。' },
    ],
  };
  server.emit('thanks:receive', payload, 1000);

  /** ---------- お礼にモラル違反があった場合 ---------- */
  // server.emit('thanks:moralViolation', undefined, 1000);
};

export { thanksSend };
