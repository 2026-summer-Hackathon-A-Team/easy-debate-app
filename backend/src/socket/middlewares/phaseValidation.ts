import type { DebatePhase } from '../debate-instance.js';
import type { AppSocket } from '../types/events.js';
import { debates, userDebateIds } from '../stores/user-debate.js';

/**
 * phase検証対象外のイベント
 * */
const PHASE_CHECK_EXCLUDED_EVENTS = new Set([
  'match:standby',
  'match:isConfirm',
  'sync:request',
]);

/**
 * イベントごとに実行を許可するphaseを定義
 * */
const EVENT_ALLOWED_PHASES: Partial<Record<string, readonly DebatePhase[]>> = {
  'topic:anyChangeRequest': ['TOPIC_CHANGE'],
  'debate:isConfirm': ['DEBATE_READY'],
  'debate:chatSend': ['DEBATE'],
  'thanks:send': ['JUDGE'],
  'rematch:anyRequest': ['JUDGE'],
};

/**
 * phase検証イベント
 *
 * 'match:standby', 'match:isConfirm', 'sync:request'は対象外
 */
export const phaseValidation =
  (socket: AppSocket) =>
  ([event]: [string, ...unknown[]], next: (err?: Error) => void): void => {
    // phase検証対象外
    if (PHASE_CHECK_EXCLUDED_EVENTS.has(event)) {
      next();
      return;
    }

    const { userId } = socket.data;

    // userIdからdebateId取得
    const debateId = userDebateIds.get(userId);

    if (debateId === undefined) {
      next(new Error());
      return;
    }

    // debateIdからDebateインスタンス取得
    const debate = debates.get(debateId);

    if (debate === undefined) {
      console.warn(`ディベートインスタンスがありません。`);
      next(new Error());
      return;
    }

    // イベントに許可されているphaseを取得
    const allowedPhases = EVENT_ALLOWED_PHASES[event];

    if (allowedPhases === undefined) {
      next(new Error());
      return;
    }
    // 現在のphaseが許可されているか検証
    if (!allowedPhases.includes(debate.phase)) {
      console.warn(`現在のphaseでは実行できないイベントです。`);
      next(new Error());
      return;
    }
    next();
  };
