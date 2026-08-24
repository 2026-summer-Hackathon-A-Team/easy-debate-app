import type { DebatePhase } from '../Debate.js';
import type { AppSocket } from '../types/events.js';
import { debates, userDebateIds } from '../stores/user-debate.js';

/**
 * phase検証対象外のイベント
 * */
const PHASE_CHECK_EXCLUDED_EVENTS = new Set(['sync:request']);

/**
 * インスタンスが存在しない状態を表す擬似phase
 */
const NO_DEBATE = 'NO_DEBATE' as const;
type ValidationPhase = DebatePhase | typeof NO_DEBATE;

/**
 * イベントごとに実行を許可するphaseを定義
 * */
const EVENT_ALLOWED_PHASES: Partial<
  Record<string, readonly ValidationPhase[]>
> = {
  'match:standby': [NO_DEBATE],
  'match:isConfirm': [NO_DEBATE],
  'topic:anyChangeRequest': ['TOPIC_CHANGE'],
  'debate:isConfirm': ['DEBATE_READY'],
  'debate:chatSend': ['DEBATE'],
  'thanks:send': ['JUDGE'],
  'rematch:anyRequest': ['JUDGE'],
};

/**
 * ユーザーの現在の状態を確認する
 */
const resolveCurrentPhase = (userId: number): ValidationPhase | undefined => {
  const debateId = userDebateIds.get(userId);
  // ユーザーがどのディベートにも紐づいていない
  if (debateId === undefined) return NO_DEBATE;
  // ユーザーがディベートIDと紐づいているがインスタンスがない
  const debate = debates.get(debateId);
  if (debate === undefined) return undefined;

  return debate.phase;
};

/**
 * phase検証イベント
 *
 * 'sync:request'は対象外
 */
export const phaseValidation =
  (socket: AppSocket) =>
  ([event]: [string, ...unknown[]], next: (err?: Error) => void): void => {
    // phase検証対象外は下記処理をスルー
    if (PHASE_CHECK_EXCLUDED_EVENTS.has(event)) {
      next();
      return;
    }

    // 対応表に載っていないイベントは拒否
    const allowedPhases = EVENT_ALLOWED_PHASES[event];
    if (allowedPhases === undefined) {
      next(new Error('INVALID EVENT'));
      return;
    }

    const { userId } = socket.data;

    const currentPhase = resolveCurrentPhase(userId);

    if (currentPhase === undefined) {
      next(new Error('Internal Server Error'));
      return;
    }
    // イベントごとに実行を許可するphaseに該当するか確認
    if (!allowedPhases.includes(currentPhase)) {
      next(new Error('INVALID EVENT'));
      return;
    }
    next();
  };
