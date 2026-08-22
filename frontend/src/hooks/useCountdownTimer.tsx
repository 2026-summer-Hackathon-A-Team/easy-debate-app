import { useEffect, useState } from 'react';

// deadlineまでの残り秒数を1秒ごとに再計算して返す
function useCountdownTimer(deadline: string): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // 既に期限を過ぎている場合はタイマーを開始しない
    if (new Date(deadline).getTime() - Date.now() <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      const tickNow = Date.now();

      setNow(tickNow);

      // 0になったらタイマーを止める
      if (new Date(deadline).getTime() - tickNow <= 0) {
        clearInterval(timerId);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [deadline]);

  const remainingMs = new Date(deadline).getTime() - now;

  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export default useCountdownTimer;
