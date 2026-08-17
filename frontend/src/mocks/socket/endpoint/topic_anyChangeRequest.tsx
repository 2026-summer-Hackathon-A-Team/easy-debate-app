import { afterSeconds } from '../../helpers';
import type { ScenarioHandler, TopicChangeResult } from '../../types';
import {
  answerDeadlineSec,
  changedTopic,
  myUserId,
  opponentUserId,
} from '../settings';

/**
 * topic:anyChangeRequest  お題チェンジ有無を送信
 */
const topicAnyChangeRequest: ScenarioHandler = (server) => {
  /** ---------- 両者が正常に回答した場合 ---------- */
  // 期限を送信時刻から数えるため、ハンドラの中で組み立てる
  const result: TopicChangeResult = {
    // お題がチェンジされたかどうか
    isChangeTopic: true,
    // 確定したお題
    topic: changedTopic,
    // 次の画面の回答期限
    answerDeadline: afterSeconds(answerDeadlineSec),
    // 参加者の立場と先攻後攻
    users: [
      { userId: myUserId, position: '優れている', turn: 'FIRST' },
      { userId: opponentUserId, position: '優れていない', turn: 'SECOND' },
    ],
  };
  server.emit('topic:anyChangeResult', result, 1000);

  // 相手が離脱するケースを試したいときはコメントを外す
  // server.emit('topic:opponentLeave', undefined, 5000);
};

export { topicAnyChangeRequest };
