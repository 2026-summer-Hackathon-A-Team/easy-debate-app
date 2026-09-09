import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAtomValue, useStore } from 'jotai';

import Heading from '../components/Heading';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Modal from '../components/Modal';
import { socket } from '../socket/socket';
import useCountdownTimer from '../hooks/useCountdownTimer';
import { isSendKeyEvent } from '../utils/keyboard';
import { userInfoAtom } from '../stores/userAtom';
import type { ThanksHistoryItem } from '../types/sync/common';
import type { JudgeResult } from '../types/socket/judgeResult';
import type { ThanksSend } from '../types/socket/thanksSend';
import type { ThanksReceive } from '../types/socket/thanksReceive';
import type { RematchRequest } from '../types/socket/rematchRequest';
import type { RematchResult } from '../types/socket/rematchResult';

// お礼メッセージの送信上限
const THANKS_LIMIT = 5;

type ResultTheme = {
  // 見出し・レート増減などの文字色
  text: string;
  // 残り時間バッジ（淡い背景 + 濃い文字）
  badge: string;
  // 塗りつぶしボタン
  solid: string;
  // 自分のお礼吹き出し
  bubble: string;
  // 固定お礼メッセージボタンのhover時の枠線
  hoverBorder: string;
};

const WINNER_THEME: ResultTheme = {
  text: 'text-[#4c7e63]',
  badge: 'bg-[#e9f1ec] text-[#375b47]',
  solid: 'bg-[#4c7e63] hover:bg-[#416b54]',
  bubble: 'bg-[#4c7e63]',
  hoverBorder: 'hover:border-[#6f9882]',
};

const LOSER_THEME: ResultTheme = {
  text: 'text-[#8b592b]',
  badge: 'bg-[#f5ece1] text-[#7a4a20]',
  solid: 'bg-[#8b592b] hover:bg-[#784c24]',
  bubble: 'bg-[#8b592b]',
  hoverBorder: 'hover:border-[#a9784a]',
};

type RematchStatus = 'idle' | 'waiting' | 'declined';

type JudgeResultPageState = JudgeResult & {
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
  const store = useStore();

  // navigateのstateで渡ってくる値
  const state = location.state as JudgeResultPageState | null;

  // 判定確認期限までの残り秒数
  const remainingSeconds = useCountdownTimer(
    state?.judgeConfirmDeadline ?? new Date(0).toISOString(),
  );

  const [thanksHistory, setThanksHistory] = useState<ThanksHistoryItem[]>(
    state?.thanksHistory ?? [],
  );

  // お礼チャット（入力中）
  const [thanksInput, setThanksInput] = useState('');

  // お礼フェーズが済んでいるか
  const [isThanksCollapsed, setIsThanksCollapsed] = useState(
    state?.isThanksDone ?? false,
  );

  // モラル違反内容
  const initialViolation = state?.violation as
    | { isMoralViolationOfThanks?: boolean; violationUserId?: number }
    | undefined;

  // お礼のモラル違反モーダル表示可否
  const [showThanksViolationModal, setShowThanksViolationModal] = useState(
    () =>
      !!initialViolation?.isMoralViolationOfThanks &&
      initialViolation.violationUserId === userInfo?.userId,
  );

  // 再対戦の希望を回答済みか
  const [rematchStatus, setRematchStatus] = useState<RematchStatus>(() => {
    if (state?.isRematchResult === false) {
      return 'declined';
    }

    return state?.isRematchAnswered ? 'waiting' : 'idle';
  });

  // 複数操作の2重実行防止
  const hasActedRef = useRef(state?.isRematchAnswered ?? false);

  // 判定確認期限が切れたら、再対戦を希望しない扱いでホームへ
  const isTimeUp = state !== null && remainingSeconds <= 0;

  useEffect(() => {
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
        navigate('/debates/topic-selection', { state: data });
        return;
      }

      setRematchStatus('declined');
      rematchDeclinedTimeoutId = window.setTimeout(() => navigate('/'), 3000);
    }

    let rematchDeclinedTimeoutId: number | undefined;

    socket.on('thanks:receive', handleThanksReceive);
    socket.on('thanks:moralViolation', handleThanksMoralViolation);
    socket.on('rematch:anyResult', handleRematchResult);

    return () => {
      if (rematchDeclinedTimeoutId !== undefined) {
        window.clearTimeout(rematchDeclinedTimeoutId);
      }

      socket.off('thanks:receive', handleThanksReceive);
      socket.off('thanks:moralViolation', handleThanksMoralViolation);
      socket.off('rematch:anyResult', handleRematchResult);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isTimeUp && !hasActedRef.current) {
      hasActedRef.current = true;
      const payload: RematchRequest = { isHopeRematch: false };

      socket.emit('rematch:anyRequest', payload);
      navigate('/');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp]);

  useEffect(() => {
    if (!state) {
      return;
    }
    const currentUserInfo = store.get(userInfoAtom);
    if (!currentUserInfo) {
      return;
    }

    const me =
      state.users.find((user) => user.userId === currentUserInfo.userId) ??
      state.users[0];

    if (currentUserInfo.rate === me.updatedRate) {
      return;
    }

    store.set(userInfoAtom, { ...currentUserInfo, rate: me.updatedRate });
  }, [state, store]);

  const myThanksCount = thanksHistory.filter(
    (thanks) => thanks.userId === userInfo?.userId,
  ).length;
  const isThanksLimitReached = myThanksCount >= THANKS_LIMIT;

  /**
   * 固定お礼メッセージ送信
   *
   * @param fixedThanksId 固定お礼ID
   * @returns void
   */
  function sendFixedThanks(fixedThanksId: number) {
    if (isThanksLimitReached) {
      return;
    }

    const payload: ThanksSend = { fixedThanksId };

    socket.emit('thanks:send', payload);
  }

  /**
   * フリーお礼メッセージ送信
   *
   * @param freeThanksMsg フリーお礼メッセージ
   * @returns void
   */
  function sendFreeThanks(freeThanksMsg: string) {
    if (freeThanksMsg === '' || isThanksLimitReached) {
      return;
    }

    const payload: ThanksSend = { freeThanksMsg };

    socket.emit('thanks:send', payload);
    setThanksInput('');
  }

  /**
   * 再対戦希望を送信
   *
   * @param isHopeRematch 再対戦希望
   * @returns void
   */
  function handleRematchChoice(isHopeRematch: boolean) {
    if (rematchStatus !== 'idle') {
      return;
    }

    const payload: RematchRequest = { isHopeRematch };

    socket.emit('rematch:anyRequest', payload);
    setRematchStatus('waiting');
  }

  /**
   * ホームへ遷移
   */
  function handleGoHome() {
    hasActedRef.current = true;
    navigate('/');
  }

  // navigateされるまで何も描画しない
  if (!state) {
    return null;
  }

  const me =
    state.users.find((user) => user.userId === userInfo?.userId) ??
    state.users[0];

  const theme = me.isWinner ? WINNER_THEME : LOSER_THEME;

  // 「対戦中の違反や不戦敗」の場合はお礼, 再対戦の受付を行わない
  const isForfeit =
    state.violation.isMoralViolationOfBattle ||
    state.violation.is2NoChat ||
    state.violation.isLeave;

  return (
    <>
      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="flex flex-col items-center">
          <div
            className={`rounded-full ${theme.badge} px-5.5 py-2.5 flex items-center gap-2`}
          >
            <span className="text-xs font-bold">残り時間</span>
            <span className="text-lg font-extrabold">{remainingSeconds}秒</span>
          </div>
        </div>

        <div className="mt-4.5 rounded-3xl border border-[#e4e2dd] bg-white py-9 px-7.5 text-center">
          <Heading level={1} className={`text-6xl mt-0.5 ${theme.text}`}>
            {me.isWinner ? '勝利' : '敗北'}
          </Heading>
          <div className={`text-md font-bold mt-2 ${theme.text}`}>
            レート {me.rateUpDown > 0 ? '+' : ''}
            {me.rateUpDown}（{me.updatedRate}）
          </div>
          <div className="mt-5 rounded-xl bg-[#f7f6f3] py-4.5 px-5 text-left text-sm leading-relaxed text-[#4a504a]">
            {state.judgeReason}
          </div>
        </div>

        {isForfeit ? (
          <>
            <div className="mt-4.5 rounded-2xl border border-[#d5bb9c] bg-[#f7ede3] p-6 text-center">
              <Heading level={2} className="text-[#8a5a2e]">
                {state.violation.isMoralViolationOfBattle
                  ? `${
                      state.violation.violationUserId === userInfo?.userId
                        ? 'あなた'
                        : '相手'
                    }のモラル違反が検知されました`
                  : state.violation.is2NoChat
                    ? `あなたは不戦${
                        state.violation.violationUserId === userInfo?.userId
                          ? '敗'
                          : '勝'
                      }となりました`
                    : '相手が離脱しました'}
              </Heading>
              <p className="mt-2 text-sm text-[#8a5a2e] leading-relaxed">
                {state.violation.isMoralViolationOfBattle ? (
                  <>
                    誹謗中傷と判定される発言があったため、
                    <br />
                    今回はお礼・再対戦の受付を行いません。
                  </>
                ) : state.violation.is2NoChat ? (
                  <>
                    2ターン連続で発言がなかったため、
                    <br />
                    今回はお礼・再対戦の受付を行いません。
                  </>
                ) : (
                  'お礼・再対戦の受付は行いません。'
                )}
              </p>
            </div>
            <Button
              className={`mt-5 w-full ${theme.solid}`}
              onClick={handleGoHome}
            >
              ホームへ
            </Button>
          </>
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
                    {state.thanks?.map((preset) => (
                      <button
                        key={preset.fixedThanksId}
                        onClick={() => sendFixedThanks(preset.fixedThanksId)}
                        className={`rounded-full border border-[#e4e2dd] bg-[#f7f6f3] px-4 py-2 text-xs font-bold text-[#4a504a] ${theme.hoverBorder} cursor-pointer`}
                      >
                        {preset.fixedThanksMsg}
                      </button>
                    ))}
                    <div className="flex flex-1 min-w-[180px] items-center rounded-full border border-[#e4e2dd] bg-[#f7f6f3] pl-4 pr-1.5 py-1">
                      <TextField
                        value={thanksInput}
                        onChange={(e) => setThanksInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (isSendKeyEvent(e)) {
                            e.preventDefault();
                            sendFreeThanks(thanksInput.trim());
                          }
                        }}
                        maxLength={100}
                        placeholder="自由に入力…"
                        className="flex-1 border-none bg-transparent text-xs font-bold text-[#4a504a] px-0 py-1.5"
                      />
                      <button
                        onClick={() => sendFreeThanks(thanksInput.trim())}
                        className={`rounded-full ${theme.solid} px-4 py-1.5 text-xs font-bold text-white cursor-pointer`}
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
                              ? `${theme.bubble} text-white`
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
                      : `${theme.solid} text-white`
                  }`}
                >
                  {isThanksCollapsed ? 'メッセージ入力に戻る' : 'お礼を終える'}
                </button>
              )}
            </div>

            {/* 「お礼完了の合図をした or お礼数の上限に達した」のいずれかで表示 */}
            {(isThanksCollapsed || isThanksLimitReached) && (
              <div className="mt-4.5">
                {state.isRematch ? (
                  <div className="flex gap-2.5">
                    <Button
                      className="flex-1 bg-white hover:bg-white text-gray-500 border border-gray-300"
                      disabled={rematchStatus !== 'idle'}
                      onClick={() => handleRematchChoice(false)}
                    >
                      再戦を希望しない
                    </Button>
                    <Button
                      className={`flex-1 ${theme.solid}`}
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
                    <Button
                      className={`mt-3 w-full ${theme.solid}`}
                      onClick={handleGoHome}
                    >
                      ホームへ
                    </Button>
                  </div>
                )}
              </div>
            )}
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
          <Button
            className={`mt-5 w-full ${theme.solid}`}
            onClick={handleGoHome}
          >
            ホームへ
          </Button>
        </Modal>
      )}
    </>
  );
}

export default JudgeResultPage;
