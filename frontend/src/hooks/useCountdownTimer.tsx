import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import { deadlineAtom, remainingSecondsAtom } from '../stores/timerAtom';

// 期限までの残り秒数を計算する。期限を過ぎていたら0秒とする
function getRemainingSeconds(deadline: string) {
  const remainingMs = new Date(deadline).getTime() - Date.now();

  return Math.max(0, Math.ceil(remainingMs / 1000));
}

// deadlineAtomを監視しremainingSecondsAtomを1秒ごとに更新する。
// SocketManagerで1度だけ呼び出す
function useCountdownTimer() {
  const deadline = useAtomValue(deadlineAtom);
  const setRemainingSeconds = useSetAtom(remainingSecondsAtom);

  useEffect(() => {
    if (!deadline) {
      setRemainingSeconds(0);
      return;
    }

    const initialRemaining = getRemainingSeconds(deadline);

    setRemainingSeconds(initialRemaining);

    // 既に期限を過ぎている場合はタイマーを開始しない
    if (initialRemaining <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      const remaining = getRemainingSeconds(deadline);

      setRemainingSeconds(remaining);

      // 0になったらタイマーを止める
      if (remaining <= 0) {
        clearInterval(timerId);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [deadline, setRemainingSeconds]);
}

export default useCountdownTimer;
