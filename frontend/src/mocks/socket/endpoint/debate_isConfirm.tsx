import { afterSeconds } from '../../helpers';
import type { DebateStart, ScenarioHandler } from '../../types';
import {
  changedTopic,
  chatSubmitDeadlineSec,
  myUserId,
  opponentUserId,
  totalTurn,
} from '../settings';

/**
 * debate:isConfirm  ディベートスタートの希望を両者それぞれが合図
 */
const debateIsConfirm: ScenarioHandler = (server) => {
  /** ---------- 両者スタート確認が完了の場合 ---------- */
  const payload: DebateStart = {
    topic: changedTopic,
    users: [
      { userId: myUserId, position: '優れている' },
      { userId: opponentUserId, position: '優れていない' },
    ],
    turn: {
      isCurrentTurnUserId: myUserId,
      currentTurn: 1,
      totalTurn,
    },
    chatSubmitDeadline: afterSeconds(chatSubmitDeadlineSec),
    chatHistory: [],
  };
  server.emit('debate:start', payload, 300);

  // 相手が離脱するケースを試したいときはコメントを外す
  // server.emit('topic:opponentLeave', undefined, 5000);
};

export { debateIsConfirm };
