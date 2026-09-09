import type { ScenarioHandler } from '../../types';

// 相手が見つかるまでの待ち時間（ミリ秒）
const delayMs = 1000;

/**
 * match:standby  マッチング待機の依頼
 */
const matchStandby: ScenarioHandler = (server) => {
  /** ---------- マッチングした場合（delayMs（ミリ秒）だけ時間が経過） ---------- */
  server.emit('match:isFound', undefined, delayMs);
};

export { matchStandby };
