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

  // 10ターン終了で勝敗判定へ進むケースを試したい場合は以下のコメントを削除

  // const now = Date.now();
  // const judgeResult = {
  //   judgeDisplayStartAt: new Date(now + 15 * 1000).toISOString(),
  //   judgeConfirmDeadline: new Date(now + 135 * 1000).toISOString(),
  //   judgeReason: '具体的な根拠を提示し、相手の主張に的確に反論できていたため。',
  //   users: [
  //     {
  //       userId: 1,
  //       isWinner: true,
  //       updatedRate: 1520,
  //       rateUpDown: 20,
  //     },
  //     {
  //       userId: 2,
  //       isWinner: false,
  //       updatedRate: 1480,
  //       rateUpDown: -20,
  //     },
  //   ],
  //   violation: {
  //     isMoralViolationOfBattle: false,
  //     is2NoChat: false,
  //     isLeave: false,
  //     violationUserId: myUserId,
  //   },
  //   isRematch: true,
  //   thanks: [
  //     {
  //       fixedThanksId: 1,
  //       fixedThanksMsg: 'ありがとうございました！',
  //     },
  //     {
  //       fixedThanksId: 2,
  //       fixedThanksMsg: '楽しかったです！',
  //     },
  //     {
  //       fixedThanksId: 3,
  //       fixedThanksMsg: '再対戦しませんか？',
  //     },
  //   ],
  // };

  // server.emit('judge:result', judgeResult, 200);
};

export { debateChatSend };
