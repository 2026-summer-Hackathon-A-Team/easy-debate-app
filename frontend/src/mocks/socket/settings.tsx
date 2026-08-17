// ============================================================================
// 複数のイベントにまたがる設定
// ============================================================================

// 対戦のお題
const topic = '朝食はごはん派？パン派？';

// お題チェンジが成立したときの新しいお題
const changedTopic = 'リモートワークは出社より優れているか';

// 自分と対戦相手の userId
// 自分の userId は mocks/rest/endpoint/get_api_v1_users_me.tsx の body と揃える
const myUserId = 1;
const opponentUserId = 2;

// ディベートの合計ターン数
const totalTurn = 10;

// 回答期限・発言期限の秒数
const answerDeadlineSec = 120;
// 発言期限は仕様上2分（送信せず2分経過すると入力中の内容が自動送信）
const chatSubmitDeadlineSec = 120;
const judgeConfirmDeadlineSec = 120;

export {
  topic,
  changedTopic,
  myUserId,
  opponentUserId,
  totalTurn,
  answerDeadlineSec,
  chatSubmitDeadlineSec,
  judgeConfirmDeadlineSec,
};
