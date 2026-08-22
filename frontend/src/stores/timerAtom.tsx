import { atom } from 'jotai';

// カウントダウン対象の期限。対象が無い場合はnull。
// sync:resultの受信ごとにフェーズに応じた期限で更新される
const deadlineAtom = atom<string | null>(null);

// 現在時刻(ミリ秒)。useCountdownTimerが1秒ごとに更新する
const nowAtom = atom(Date.now());

// deadlineAtomまでの残り秒数。deadlineAtom/nowAtomからその場で計算する派生atomにすることで、
// deadlineAtomが更新された直後でも同じレンダー内で必ず正しい値になる
const remainingSecondsAtom = atom((get) => {
  const deadline = get(deadlineAtom);

  if (!deadline) {
    return 0;
  }

  const remainingMs = new Date(deadline).getTime() - get(nowAtom);

  return Math.max(0, Math.ceil(remainingMs / 1000));
});

export { deadlineAtom, nowAtom, remainingSecondsAtom };
