import { afterSeconds } from '../../helpers';
import type { MatchComplete, ScenarioHandler } from '../../types';
import { answerDeadlineSec, topic } from '../settings';

/**
 * match:isConfirm  マッチング完了を確認した合図
 */
const matchIsConfirm: ScenarioHandler = (server) => {
  /** ---------- 両者マッチング確認が完了の場合 ---------- */
  const payload: MatchComplete = {
    topic,
    // 回答期限は「今から○秒後」で指定
    answerDeadline: afterSeconds(answerDeadlineSec),
  };
  server.emit('match:complete', payload, 300);

  // 相手が離脱するケースを試したいときはコメントを外す
  // server.emit('topic:opponentLeave', undefined, 5000);
};

export { matchIsConfirm };
