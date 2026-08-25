import { socket } from './socket';

// 自端末のDate.now()に足すと、サーバー時計の現在時刻になる補正値(ミリ秒)
let clockOffset = 0;
let requestedAt = 0;

// サーバー時計に換算した現在時刻。カウントダウン計算ではDate.now()の代わりにこちらを使う
function getServerNow(): number {
  return Date.now() + clockOffset;
}

// 接続時に1回呼んで、自端末とサーバーの時計のズレを測る
function syncClock(): void {
  requestedAt = Date.now();
  socket.emit('time:sync');
}

socket.on('time:result', (data: { serverTime: number }) => {
  const receivedAt = Date.now();
  const rtt = receivedAt - requestedAt;

  // serverTimeは往復のうち片道分(rtt/2)だけ過去の値なので、その分足して受信時点に合わせる
  clockOffset = data.serverTime + rtt / 2 - receivedAt;
});

export { getServerNow, syncClock };
