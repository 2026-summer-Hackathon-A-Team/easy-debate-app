import { useEffect, useState } from 'react';

import { getServerNow } from '../socket/clockOffset';

// deadlineまでの残り秒数を1秒ごとに再計算して返却
// 端末ごとのシステムクロックのズレで表示が数秒ずれるのを避けるため、
// Date.now()ではなくサーバー時計に換算したgetServerNow()を基準に計算
function useCountdownTimer(deadline: string): number {
  const [now, setNow] = useState(() => getServerNow());

  useEffect(() => {
    // 既に期限を過ぎている場合はタイマーを開始しない
    if (new Date(deadline).getTime() - getServerNow() <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      const tickNow = getServerNow();

      setNow(tickNow);

      // カウントダウン0でタイマーを止める
      if (new Date(deadline).getTime() - tickNow <= 0) {
        clearInterval(timerId);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [deadline]);

  const remainingMs = new Date(deadline).getTime() - now;

  return Math.max(0, Math.floor(remainingMs / 1000));
}

export default useCountdownTimer;
