import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import { deadlineAtom, nowAtom } from '../stores/timerAtom';

// deadlineAtomを監視し、nowAtomを1秒ごとに更新することでremainingSecondsAtom(派生atom)を
// 再計算させる。SocketManagerで1度だけ呼び出す
function useCountdownTimer() {
  const deadline = useAtomValue(deadlineAtom);
  const setNow = useSetAtom(nowAtom);

  useEffect(() => {
    if (!deadline) {
      return;
    }

    const now = Date.now();

    setNow(now);

    // 既に期限を過ぎている場合はタイマーを開始しない
    if (new Date(deadline).getTime() - now <= 0) {
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
  }, [deadline, setNow]);
}

export default useCountdownTimer;
