import { afterSeconds } from '../../helpers';
import type { DebateChatReceive, ScenarioHandler } from '../../types';
import {
  changedTopic,
  chatSubmitDeadlineSec,
  myUserId,
  opponentUserId,
  totalTurn,
} from '../settings';

/**
 * debate:chatSend  チャット送信
 */
const debateChatSend: ScenarioHandler = (server) => {
  /** ---------- 相手のターンへ進む場合 ---------- */
  const payload: DebateChatReceive = {
    topic: changedTopic,
    users: [
      { userId: myUserId, position: '優れている' },
      { userId: opponentUserId, position: '優れていない' },
    ],
    // 送信後は相手のターンになり、ターン数が1つ進む
    turn: {
      isCurrentTurnUserId: opponentUserId,
      currentTurn: 2,
      totalTurn,
    },
    chatSubmitDeadline: afterSeconds(chatSubmitDeadlineSec),
    // これまでの全てのチャット
    chatHistory: [
      {
        userId: myUserId,
        chatMsg: 'リモートワークは通勤時間が削減され、生産性が上がります。',
      },
    ],
  };
  server.emit('debate:chatReceive', payload, 1000);

  // 10ターン終了で勝敗判定へ進むケースを試したい場合はコメントを外す
  // (judge:result のペイロードは未定義のため、決まり次第ここに書く)
  // server.emit('judge:result', undefined, 3000);
};

export { debateChatSend };
