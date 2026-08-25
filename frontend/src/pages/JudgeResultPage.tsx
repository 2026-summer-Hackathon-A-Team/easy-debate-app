import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';

import Heading from '../components/Heading';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Modal from '../components/Modal';
import { socket } from '../socket/socket';
import useCountdownTimer from '../hooks/useCountdownTimer';
import { userInfoAtom } from '../stores/userAtom';
import type { ThanksHistoryItem } from '../types/sync/common';
import type { JudgeResult } from '../types/socket/judgeResult';
import type { ThanksSend } from '../types/socket/thanksSend';
import type { ThanksReceive } from '../types/socket/thanksReceive';
import type { RematchRequest } from '../types/socket/rematchRequest';
import type { RematchResult } from '../types/socket/rematchResult';
import type { MatchComplete } from '../types/socket/matchComplete';

// お礼メッセージは自分の送信分がこの通数に達すると送れなくなる
const THANKS_LIMIT = 5;

type RematchStatus = 'idle' | 'waiting' | 'declined';

// このページで実際に使う内部形。violationはJUDGE_WAITING中(判定はまだ確定していない)は
// 無いため省略可能とし、本物のjudge:resultが届くまで表示を待つためのガードに使う
type JudgeResultPageState = Omit<JudgeResult, 'violation'> & {
  violation?: JudgeResult['violation'];
  thanksHistory?: ThanksHistoryItem[];
  isThanksDone?: boolean;
  isRematchAnswered?: boolean;
  isRematchResult?: boolean;
};

function JudgeResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useAtomValue(userInfoAtom);

  // DebatePage(judge:result)またはSocketManager(sync:result)からnavigateのstateで
  // 渡ってくる値。JUDGE_WAITING(判定待ち)中のリロード・直接URLアクセス時はまだ無いため、
  // judge:resultを直接受け取るまで判定中スピナーを表示する
  const initialResult = location.state as JudgeResultPageState | null;

  const [result, setResult] = useState(initialResult);

  // 判定確認期限までの残り秒数(resultが届くまでは既に期限切れの日時を渡してタイマーを動かさない)
  const remainingSeconds = useCountdownTimer(
    result?.judgeConfirmDeadline ?? new Date(0).toISOString(),
  );

  // judgeDisplayStartAtが未来の時刻なら、それまでは「判定中…」を表示する
  const [isRevealed, setIsRevealed] = useState(
    () =>
      !!result &&
      (!result.judgeDisplayStartAt ||
        new Date(result.judgeDisplayStartAt).getTime() <= Date.now()),
  );

  const [thanksHistory, setThanksHistory] = useState<ThanksHistoryItem[]>(
    () => initialResult?.thanksHistory ?? [],
  );
  const [thanksInput, setThanksInput] = useState('');
  // isThanksDoneはリロード時に「既にお礼を終えていたか」を復元するための値
  const [isThanksCollapsed, setIsThanksCollapsed] = useState(
    () => initialResult?.isThanksDone ?? false,
  );
  // SocketManager(sync:result)経由でリロードした場合のみ、お礼でのモラル違反
  // (isMoralViolationOfThanks)を検知済みの可能性があるため、自分が違反者なら
  // 警告モーダルを復元する。judge:resultイベント自体にはisMoralViolationOfThanksが
  // 含まれないため(violationはJudgeResultViolation型)、ここだけ別途安全にキャストして読む
  const initialViolation = initialResult?.violation as
    | { isMoralViolationOfThanks?: boolean; violationUserId?: number }
    | undefined;

  const [showThanksViolationModal, setShowThanksViolationModal] = useState(
    () =>
      !!initialViolation?.isMoralViolationOfThanks &&
      initialViolation.violationUserId === userInfo?.userId,
  );

  // isRematchAnswered/isRematchResultはリロード時に「既に再対戦の希望を回答済みか」
  // 「回答済みなら結果はもう分かっているか」を復元するための値
  const [rematchStatus, setRematchStatus] = useState<RematchStatus>(() => {
    if (initialResult?.isRematchResult === false) {
      return 'declined';
    }

    return initialResult?.isRematchAnswered ? 'waiting' : 'idle';
  });

  // タイムアウトによる自動遷移と、他の操作による遷移が二重に走らないようにするガード。
  // 既に再対戦を回答済み(=何らかの操作が完了済み)ならリロード後も引き継ぐ
  const hasActedRef = useRef(initialResult?.isRematchAnswered ?? false);

  useEffect(() => {
    if (isRevealed || !result?.judgeDisplayStartAt) {
      return;
    }

    const waitMs = Math.max(
      0,
      new Date(result.judgeDisplayStartAt).getTime() - Date.now(),
    );
    const timer = setTimeout(() => setIsRevealed(true), waitMs);

    return () => clearTimeout(timer);
  }, [result?.judgeDisplayStartAt, isRevealed]);

  useEffect(() => {
    function handleJudgeResult(data: JudgeResult) {
      setResult(data);
    }

    function handleThanksReceive(data: ThanksReceive) {
      setThanksHistory(data.thanksHistory);
    }

    function handleThanksMoralViolation() {
      hasActedRef.current = true;
      const payload: RematchRequest = { isHopeRematch: false };

      socket.emit('rematch:anyRequest', payload);
      setShowThanksViolationModal(true);
    }

    function handleRematchResult(data: RematchResult) {
      hasActedRef.current = true;

      if (data.isRematchResult) {
        const payload: MatchComplete = {
          topic: data.topic,
          answerDeadline: data.answerDeadline,
        };

        navigate('/debates/topic-selection', { state: payload });
        return;
      }

      setRematchStatus('declined');
      setTimeout(() => navigate('/'), 3000);
    }

    socket.on('judge:result', handleJudgeResult);
    socket.on('thanks:receive', handleThanksReceive);
    socket.on('thanks:moralViolation', handleThanksMoralViolation);
    socket.on('rematch:anyResult', handleRematchResult);

    return () => {
      socket.off('judge:result', handleJudgeResult);
      socket.off('thanks:receive', handleThanksReceive);
      socket.off('thanks:moralViolation', handleThanksMoralViolation);
      socket.off('rematch:anyResult', handleRematchResult);
    };
    // navigateは依存に含めない(socketManager.tsxと同じ理由: pathnameが変わるたびに
    // 参照が作り直され、このeffectが不要に再実行されてしまうため)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 判定確認期限が切れたら、再対戦を希望しない扱いでホームへ戻る(resultが届くまでは常にfalse扱い)
  const isTimeUp = result !== null && remainingSeconds <= 0;

  useEffect(() => {
    if (isTimeUp && !hasActedRef.current) {
      hasActedRef.current = true;
      const payload: RematchRequest = { isHopeRematch: false };

      socket.emit('rematch:anyRequest', payload);
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp]);

  const myThanksCount = thanksHistory.filter(
    (thanks) => thanks.userId === userInfo?.userId,
  ).length;
  const isThanksLimitReached = myThanksCount >= THANKS_LIMIT;

  // 固定メッセージは改ざん防止のためID(fixedThanksId)を送る(本文は送らない)
  function sendFixedThanks(fixedThanksId: number) {
    if (isThanksLimitReached) {
      return;
    }

    const payload: ThanksSend = { fixedThanksId };

    socket.emit('thanks:send', payload);
  }

  function sendFreeThanks(freeThanksMsg: string) {
    if (freeThanksMsg === '' || isThanksLimitReached) {
      return;
    }

    const payload: ThanksSend = { freeThanksMsg };

    socket.emit('thanks:send', payload);
    setThanksInput('');
  }

  function handleRematchChoice(isHopeRematch: boolean) {
    if (rematchStatus !== 'idle') {
      return;
    }

    const payload: RematchRequest = { isHopeRematch };

    socket.emit('rematch:anyRequest', payload);
    setRematchStatus('waiting');
  }

  function handleGoHome() {
    hasActedRef.current = true;
    navigate('/');
  }

  // resultがまだ届いていない(JUDGE_WAITING中のリロード等)、judgeDisplayStartAtに
  // 到達していない、またはviolationが無い(JUDGE_WAITINGはまだ判定確定前でサーバーが
  // violationを送ってこないため、本物のjudge:resultが届くまでは絶対に公開しない)間は
  // 判定中スピナーを表示する
  if (!result || !isRevealed || !result.violation) {
    return (
      <div className="max-w-lg mx-auto px-5 py-10 flex flex-col items-center">
        <div className="h-16 w-16 animate-spin rounded-full border-5 border-[#cfe1d6] border-t-[#4c7e63]" />
        <Heading level={1} className="mt-5">
          勝敗判定中…
        </Heading>
      </div>
    );
  }

  const me =
    result.users.find((user) => user.userId === userInfo?.userId) ??
    result.users[0];

  // 対戦中の違反・不戦敗の場合はお礼・再対戦の受付を行わない
  const isForfeit =
    result.violation.isMoralViolationOfBattle ||
    result.violation.is2NoChat ||
    result.violation.isLeave;

  return (
    <>
      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-[#e8f0eb] px-5.5 py-2.5 flex items-center gap-2">
            <span className="text-xs font-bold text-[#2c4d3b]">残り時間</span>
            <span className="text-lg font-extrabold text-[#2c4d3b]">
              {remainingSeconds}秒
            </span>
          </div>
        </div>

        <div className="mt-4.5 rounded-3xl border border-[#e4e2dd] bg-white py-9 px-7.5 text-center">
          <div className="text-xs font-extrabold text-[#8a8f89] tracking-wide">
            AI判定
          </div>
          <div className="text-5xl mt-3">{me.isWinner ? '🏆' : '🍃'}</div>
          <Heading
            level={1}
            className={`mt-3 ${me.isWinner ? 'text-[#2c6a4a]' : 'text-[#8a5a2e]'}`}
          >
            {me.isWinner ? 'あなたの勝ち' : 'あなたの負け'}
          </Heading>
          <div
            className={`text-xs font-bold mt-1 ${
              me.isWinner ? 'text-[#3f6a52]' : 'text-[#8a5a2e]'
            }`}
          >
            レート {me.rateUpDown > 0 ? '+' : ''}
            {me.rateUpDown}（{me.updatedRate}）
          </div>
          <div className="mt-5 rounded-xl bg-[#f7f6f3] py-4.5 px-5 text-left text-sm leading-relaxed text-[#4a504a]">
            {result.judgeReason}
          </div>
        </div>

        {isForfeit ? (
          <div className="mt-4.5 rounded-2xl border border-[#f0c9b3] bg-[#fdf1ec] p-6 text-center">
            <Heading level={2} className="text-[#a6572f]">
              {result.violation.isMoralViolationOfBattle
                ? 'モラル違反が検知されました'
                : result.violation.is2NoChat
                  ? '2ターン連続で発言がありませんでした'
                  : '相手が離脱しました'}
            </Heading>
            <p className="mt-2 text-sm text-[#8a6250] leading-relaxed">
              今回はお礼・再対戦の受付を行いません。
            </p>
            <Button className="mt-5 w-full" onClick={handleGoHome}>
              ホームへ
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4.5 rounded-2xl border border-[#e4e2dd] bg-white p-6 px-6.5">
              <div className="text-xs font-extrabold text-[#4a504a] mb-3">
                お礼のメッセージを送ろう
              </div>

              {isThanksLimitReached ? (
                <div className="rounded-xl bg-[#f7f6f3] p-3 text-center text-xs font-bold text-[#8a8f89]">
                  お礼メッセージは{THANKS_LIMIT}
                  通まで送信できます。上限に達しました。
                </div>
              ) : (
                !isThanksCollapsed && (
                  <div className="flex flex-wrap gap-2">
                    {result.thanks?.map((preset) => (
                      <button
                        key={preset.fixedThanksId}
                        onClick={() => sendFixedThanks(preset.fixedThanksId)}
                        className="rounded-full border border-[#e4e2dd] bg-[#f7f6f3] px-4 py-2 text-xs font-bold text-[#4a504a] hover:border-[#4c7e63] cursor-pointer"
                      >
                        {preset.fixedThanksMsg}
                      </button>
                    ))}
                    <div className="flex flex-1 min-w-[180px] items-center rounded-full border border-[#e4e2dd] bg-[#f7f6f3] pl-4 pr-1.5 py-1">
                      <TextField
                        value={thanksInput}
                        onChange={(e) => setThanksInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            sendFreeThanks(thanksInput.trim());
                          }
                        }}
                        maxLength={100}
                        placeholder="自由に入力…"
                        className="flex-1 border-none bg-transparent text-xs font-bold text-[#4a504a] px-0 py-1.5"
                      />
                      <button
                        onClick={() => sendFreeThanks(thanksInput.trim())}
                        className="rounded-full bg-[#4c7e63] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#3f6a52] cursor-pointer"
                      >
                        送信
                      </button>
                    </div>
                  </div>
                )
              )}

              {thanksHistory.length > 0 && (
                <div className="flex flex-col gap-2 mt-4">
                  {thanksHistory.map((thanks, index) => {
                    const isMe = thanks.userId === userInfo?.userId;

                    return (
                      <div
                        key={index}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                            isMe
                              ? 'bg-[#4c7e63] text-white'
                              : 'bg-[#f2f1ee] text-[#232823]'
                          }`}
                        >
                          {thanks.thanksMsg}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isThanksLimitReached && (
                <button
                  onClick={() => setIsThanksCollapsed((v) => !v)}
                  className={`w-full mt-4 rounded-xl py-3 text-sm font-bold cursor-pointer ${
                    isThanksCollapsed
                      ? 'border border-[#e4e2dd] bg-white text-[#6f766f]'
                      : 'bg-[#4c7e63] text-white hover:bg-[#3f6a52]'
                  }`}
                >
                  {isThanksCollapsed ? 'メッセージ入力に戻る' : 'お礼を終える'}
                </button>
              )}
            </div>

            <div className="mt-4.5">
              {result.isRematch ? (
                <div className="flex gap-2.5">
                  <Button
                    className="flex-1 bg-white hover:bg-white text-gray-500 border border-gray-300"
                    disabled={rematchStatus !== 'idle'}
                    onClick={() => handleRematchChoice(false)}
                  >
                    再戦を希望しない
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={rematchStatus !== 'idle'}
                    onClick={() => handleRematchChoice(true)}
                  >
                    {rematchStatus === 'waiting'
                      ? '相手の返答待ち…'
                      : rematchStatus === 'declined'
                        ? '再戦は成立しませんでした'
                        : '再戦を希望する'}
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-[#a6572f] font-bold">
                    ※再対戦の上限回数に達しました
                  </p>
                  <Button className="mt-3 w-full" onClick={handleGoHome}>
                    ホームへ
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showThanksViolationModal && (
        <Modal>
          <Heading level={2}>
            あなたのモラル違反が
            <br />
            検知されました
          </Heading>
          <p className="mt-2 text-sm text-[#8a8f89] leading-relaxed">
            誹謗中傷と判定される発言があったため、
            <br />
            このメッセージは相手に送信されませんでした。
          </p>
          <Button className="mt-5 w-full" onClick={handleGoHome}>
            ホームへ
          </Button>
        </Modal>
      )}
    </>
  );
}

export default JudgeResultPage;
