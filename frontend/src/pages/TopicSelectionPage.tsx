import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import CardLayout from '../Layouts/CardLayout';
import Heading from '../components/Heading';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { socket } from '../socket/socket';
import useCountdownTimer from '../hooks/useCountdownTimer';
import type { MatchComplete } from '../types/socket/matchComplete';
import type { TopicChangeRequest } from '../types/socket/topicChangeRequest';
import type { TopicChangeResult } from '../types/socket/topicChangeResult';

// カウントダウン終了・相手離脱を検知した際に表示するモーダル。
// opponentLeaveは「相手が離脱した」「相手が期限内に回答しなかった」の2パターン
type Outcome =
  | { type: 'opponentLeave'; reason: 'leave' | 'idle' }
  | { type: 'timeUp' }
  | null;

function TopicSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // MatchingPage(match:complete)またはSocketManager(sync:result)からnavigateのstateで渡ってくる値。
  // 画面リロード時・直接URLアクセス時はまだstateが無いため、SocketManagerがsync:resultを
  // 受け取って改めてnavigateしてくるまで何も描画しない
  const state = location.state as MatchComplete | null;

  // 回答期限までの残り秒数(stateが届くまでは既に期限切れの日時を渡してタイマーを動かさない)
  const remainingSeconds = useCountdownTimer(
    state?.answerDeadline ?? new Date(0).toISOString(),
  );

  // お題チェンジ希望を回答済みか(ボタンを押したら再度押せなくする)
  const [isAnswered, setIsAnswered] = useState(false);
  // 相手がdisconnectから20秒以内に復帰しなかったか
  const [isOpponentLeft, setIsOpponentLeft] = useState(false);

  // 回答期限が0になったか
  const isTimeUp = remainingSeconds <= 0;

  // 両者の回答が揃った場合と、相手が離脱した場合を監視する
  useEffect(() => {
    function handleAnyChangeResult(data: TopicChangeResult) {
      // カウントダウンの開始（setDeadline）は遷移先のTopicConfirmationPageの初期処理で行う
      navigate('/debates/topic-confirmation', {
        state: {
          topic: data.topic,
          isChangeTopic: data.isChangeTopic,
          answerDeadline: data.answerDeadline,
          users: data.users,
        },
      });
    }

    function handleOpponentLeave() {
      socket.disconnect();
      setIsOpponentLeft(true);
    }

    socket.on('topic:anyChangeResult', handleAnyChangeResult);
    socket.on('topic:opponentLeave', handleOpponentLeave);

    return () => {
      socket.off('topic:anyChangeResult', handleAnyChangeResult);
      socket.off('topic:opponentLeave', handleOpponentLeave);
    };
  }, [navigate]);

  // 期限切れになった瞬間に一度だけSocketを破棄する
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
      ? isAnswered
        ? { type: 'opponentLeave', reason: 'idle' }
        : { type: 'timeUp' }
      : null;

  function handleAnswer(isHopeChangeTopic: boolean) {
    const payload: TopicChangeRequest = { isHopeChangeTopic };

    socket.emit('topic:anyChangeRequest', payload);
    setIsAnswered(true);
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

  const { topic } = state;

  return (
    <>
      <CardLayout>
        <div className="flex flex-col items-center">
          <Heading level={3} className="font-body font-bold text-[#4c7e63]">
            お題選定
          </Heading>
          <div className="grid grid-cols-2 justify-items-center items-center mt-3 rounded-3xl bg-[#e8f0eb] p-3">
            <div className="text-[12px] text-[#2c4d3b] font-body font-bold">
              回答期限
            </div>
            <div className="text-[14px] text-[#2c4d3b] font-body font-extrabold">
              {remainingSeconds}秒
            </div>
          </div>
          <Heading level={1} className="mt-3">
            {topic}
          </Heading>
          {isAnswered && (
            <p className="mt-4 text-[13.5px] text-gray-400">
              相手の回答を待っています…
            </p>
          )}
        </div>
        <div className="mt-10 font-bold">
          <Heading level={3} className="text-center">
            お題チェンジ
          </Heading>
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <Button
              className="bg-white hover:bg-white text-gray-500 border border-gray-300"
              disabled={isAnswered}
              onClick={() => handleAnswer(true)}
            >
              希望する
            </Button>
            <Button disabled={isAnswered} onClick={() => handleAnswer(false)}>
              希望しない
            </Button>
          </div>
          <Heading
            level={3}
            className="text-center text-gray-400 font-normal mt-3"
          >
            ※両者がチェンジを希望した際に
            <br className="sm:hidden" />
            チェンジされます
          </Heading>
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

export default TopicSelectionPage;
