import { afterSeconds } from '../../helpers';
import type { RematchResult, ScenarioHandler } from '../../types';
import { answerDeadlineSec, topic } from '../settings';

/**
 * rematch:anyRequest  再対戦の希望有無を送信
 */
const rematchAnyRequest: ScenarioHandler = (server) => {
  /** ---------- 両者が再対戦を希望した場合 ---------- */
  const payload: RematchResult = {
    // 再対戦有無
    isRematchResult: true,
    // 再対戦の仮のお題
    topic,
    // お題選定画面の回答期限
    answerDeadline: afterSeconds(answerDeadlineSec),
  };
  server.emit('rematch:anyResult', payload, 1000);

  /** ---------- どちらかが再対戦を希望しなかった場合 ---------- */
  // server.emit('rematch:anyResult', { isRematchResult: false }, 1000);
};

export { rematchAnyRequest };
