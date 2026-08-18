import { atom } from 'jotai';

// カウントダウン対象の期限。対象が無い場合はnull。
// sync:resultの受信ごとにフェーズに応じた期限で更新される
const deadlineAtom = atom<string | null>(null);

// deadlineAtomまでの残り秒数。useCountdownTimerによって1秒ごとに更新される
const remainingSecondsAtom = atom(0);

export { deadlineAtom, remainingSecondsAtom };
