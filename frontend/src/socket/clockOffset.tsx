import { socket } from './socket';

// 自端末のDate.now()に足し、サーバー側の現在時刻となる補正値（ミリ秒）
let clockOffset = 0;
let requestedAt = 0;

// サーバー側の現在時刻に換算した時刻
// カウントダウン計算ではDate.now()の代わりにこちらを使用
function getServerNow(): number {
  return Date.now() + clockOffset;
}

// 接続時に1回呼び、自端末とサーバー側の時刻のズレを測る
function syncClock(): void {
  requestedAt = Date.now();
  socket.emit('time:sync');
}

socket.on('time:result', (data: { serverTime: number }) => {
  const receivedAt = Date.now();
  const rtt = receivedAt - requestedAt;

  // serverTimeは往復のうち片道分(rtt/2)だけ過去の値のため、その分を足して受信時点に合わせる
  clockOffset = data.serverTime + rtt / 2 - receivedAt;
});

export { getServerNow, syncClock };
