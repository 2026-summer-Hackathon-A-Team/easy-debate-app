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

    setRemainingSeconds(getRemainingSeconds(deadline));

    const timerId = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(deadline));
    }, 1000);

    return () => clearInterval(timerId);
  }, [deadline, setRemainingSeconds]);
}

export default useCountdownTimer;
