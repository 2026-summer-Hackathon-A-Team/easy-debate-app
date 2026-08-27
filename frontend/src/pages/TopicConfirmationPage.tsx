import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';
import { useAtomValue } from 'jotai';

import CardLayout from '../Layouts/CardLayout';
import Heading from '../components/Heading';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { socket } from '../socket/socket';
import useCountdownTimer from '../hooks/useCountdownTimer';
import { userInfoAtom } from '../stores/userAtom';
import type { DebateStart } from '../types/socket/debateStart';
import type { TopicChangeResult } from '../types/socket/topicChangeResult';

// カウントダウン終了・相手離脱を検知した際に表示するモーダル。
// opponentLeaveは「相手が離脱した」「相手が期限内に回答しなかった」の2パターン
type Outcome =
  | { type: 'opponentLeave'; reason: 'leave' | 'idle' }
  | { type: 'timeUp' }
  | null;

function turnLabel(turn: 'FIRST' | 'SECOND') {
  return turn === 'FIRST' ? '先攻' : '後攻';
}

function TopicConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const userInfo = useAtomValue(userInfoAtom);

  // TopicSelectionPage(topic:anyChangeResult)またはSocketManager(sync:result)から
  // navigateのstateで渡ってくる値。画面リロード時・直接URLアクセス時はまだstateが無いため、
  // SocketManagerがsync:resultを受け取って改めてnavigateしてくるまで何も描画しない。
  // isAnsweredはSocketManager(sync:result)経由の場合のみ含まれ、リロード時に
  // 回答済み状態を復元してdebate:isConfirmの二重送信を防ぐために使う
  const state = location.state as
    (TopicChangeResult & { isAnswered?: boolean }) | null;

  // 回答期限までの残り秒数(stateが届くまでは既に期限切れの日時を渡してタイマーを動かさない)
  const remainingSeconds = useCountdownTimer(
    state?.answerDeadline ?? new Date(0).toISOString(),
  );

  // ディベート開始の準備完了を回答済みか(ボタンを押したら再度押せなくする)
  const [isReady, setIsReady] = useState(() => state?.isAnswered ?? false);
  // 相手がdisconnectから20秒以内に復帰しなかったか
  const [isOpponentLeft, setIsOpponentLeft] = useState(false);

  // 回答期限が0になったか。
  // ブラウザバック・リロード(POP)で表示している間のstateは履歴から復元された当時の値で、
  // answerDeadlineが既に過ぎている。これを本物の期限切れとして扱うとsocketを切ってしまい、
  // sync:resultで正しい画面へ戻れなくなるため、POPの間は期限切れとみなさない
  // (SocketManagerがsync:resultで改めてnavigateすると、この判定は自動的に有効に戻る)
  const isTimeUp = navigationType !== 'POP' && remainingSeconds <= 0;

  // 両者の合図が揃った場合と、相手が離脱した場合を監視する
  useEffect(() => {
    function handleDebateStart(data: DebateStart) {
      navigate('/debates/chat', { state: data });
    }

    function handleOpponentLeave() {
      socket.disconnect();
      setIsOpponentLeft(true);
    }

    socket.on('debate:start', handleDebateStart);
    socket.on('topic:opponentLeave', handleOpponentLeave);

    return () => {
      socket.off('debate:start', handleDebateStart);
      socket.off('topic:opponentLeave', handleOpponentLeave);
    };
  }, [navigate]);

  // 期限切れになったらSocketを破棄する
  useEffect(() => {
    if (isTimeUp) {
      socket.disconnect();
    }
  }, [isTimeUp]);

  // 期限切れ時、自分が回答済みなら「相手が期限内に回答しなかった」
  // 未回答なら「自分の時間切れ」
  const outcome: Outcome = isOpponentLeft
    ? { type: 'opponentLeave', reason: 'leave' }
    : isTimeUp
      ? isReady
        ? { type: 'opponentLeave', reason: 'idle' }
        : { type: 'timeUp' }
      : null;

  function handleReady() {
    socket.emit('debate:isConfirm');
    setIsReady(true);
  }

  function handleGoToMatching() {
    navigate('/debates/matching');
  }

  function handleGoToHome() {
    navigate('/');
  }

  // SocketManagerがsync:resultを受け取って改めてnavigateしてくるまで何も描画しない
  if (!state) {
    return null;
  }

  const { topic, isChangeTopic, users } = state;
  const me = users.find((user) => user.userId === userInfo?.userId) ?? users[0];
  const opponent =
    users.find((user) => user.userId !== userInfo?.userId) ?? users[1];

  return (
    <>
      <CardLayout>
        <div className="flex flex-col items-center">
          <Heading level={3} className="font-body font-bold text-[#4c7e63]">
            お題決定
          </Heading>
          <div className="grid grid-cols-2 justify-items-center items-center mt-3 rounded-3xl bg-[#e8f0eb] p-3">
            <div className="text-[12px] text-[#2c4d3b] font-body font-bold">
              回答期限
            </div>
            <div className="text-[14px] text-[#2c4d3b] font-body font-extrabold">
              {remainingSeconds}秒
            </div>
          </div>
          <div className="mt-3 text-[12px] font-bold text-[#5c6560] bg-[#f7f6f3] rounded-full px-3 py-1">
            {isChangeTopic
              ? 'お題はチェンジされました'
              : 'お題はチェンジされませんでした'}
          </div>
          <Heading level={1} className="mt-3 text-center">
            {topic}
          </Heading>
        </div>

        <div className="mt-10">
          <div className="flex flex-col gap-2.5">
            <div className="text-center rounded-2xl border border-[#cfe1d6] bg-[#e7f0ea] px-5 py-3.5">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[11.5px] font-bold text-[#5c6560]">
                  あなた
                </span>
                <span className="text-[10.5px] font-extrabold text-[#3f6a52] bg-[#d6e6dc] rounded-full px-2 py-0.5">
                  {turnLabel(me.turn)}
                </span>
              </div>
              <div className="mt-1 font-heading font-extrabold text-[15px] text-[#2c4d3b] leading-snug">
                {me.position}
              </div>
            </div>

            <div className="text-center font-bold text-[#c9c6bf]">vs</div>

            <div className="text-center rounded-2xl border border-[#ecd8bf] bg-[#f7ede3] px-5 py-3.5">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-[11.5px] font-bold text-[#5c6560]">
                  相手
                </span>
                <span className="text-[10.5px] font-extrabold text-[#8a5a2e] bg-[#f0ddc6] rounded-full px-2 py-0.5">
                  {turnLabel(opponent.turn)}
                </span>
              </div>
              <div className="mt-1 font-heading font-extrabold text-[15px] text-[#8a5a2e] leading-snug">
                {opponent.position}
              </div>
            </div>
          </div>

          {isReady && (
            <p className="mt-4 text-center text-[13.5px] text-gray-400">
              相手の準備を待っています…
            </p>
          )}

          <Button
            className="mt-8 w-full"
            disabled={isReady}
            onClick={handleReady}
          >
            {isReady ? '準備完了' : 'ディベートを始める'}
          </Button>
        </div>
      </CardLayout>

      {outcome?.type === 'opponentLeave' && (
        <Modal>
          <Heading level={2}>
            {outcome.reason === 'idle'
              ? '相手が期限内に回答しませんでした'
              : '相手が離脱しました'}
          </Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            {outcome.reason === 'idle'
              ? '相手の回答がなかったため、'
              : '相手が離脱したため、'}
            <br />
            マッチング待ち画面へ戻ります。
          </p>
          <Button className="mt-5 w-full" onClick={handleGoToMatching}>
            OK
          </Button>
        </Modal>
      )}

      {outcome?.type === 'timeUp' && (
        <Modal>
          <Heading level={2}>回答期限が過ぎました</Heading>
          <p className="mt-2 text-[13.5px] text-[#8a8f89] leading-relaxed">
            2分以内に操作が行われなかったため、
            <br />
            ホーム画面へ戻ります。
          </p>
          <Button className="mt-5 w-full" onClick={handleGoToHome}>
            OK
          </Button>
        </Modal>
      )}
    </>
  );
}

export default TopicConfirmationPage;
