import Heading from '../components/Heading';

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';

import { socket } from '../socket/socket';
import { deadlineAtom } from '../stores/timerAtom';
import type { MatchComplete } from '../types/socket/matchComplete';

function MatchingPage() {
  const navigate = useNavigate();
  const setDeadline = useSetAtom(deadlineAtom);

  useEffect(() => {
    function handleMatchFound() {
      socket.emit('match:isConfirm');
    }

    // 両者がマッチングを確認できたら、仮のお題を渡してお題選定画面へ遷移する。
    // 回答期限はdeadlineAtomにセットし、TopicSelectionPage側でカウントダウン表示する
    function handleMatchComplete({ topic, answerDeadline }: MatchComplete) {
      setDeadline(answerDeadline);
      navigate('/debates/topic-selection', {
        state: { topic },
      });
    }

    socket.on('match:isFound', handleMatchFound);
    socket.on('match:complete', handleMatchComplete);

    return () => {
      socket.off('match:isFound', handleMatchFound);
      socket.off('match:complete', handleMatchComplete);
    };
  }, [navigate, setDeadline]);

  return (
    <>
      <div className="flex flex-col items-center mt-5">
        <div className="h-16 w-16 animate-spin rounded-full border-5 border-[#cfe1d6] border-t-[#4c7e63]" />
        <Heading level={1} className="mt-5">
          対戦相手を探しています...
        </Heading>
        <div className="mt-5 rounded-2xl border border-[#e4e2dd] bg-[#e8f0eb] p-5">
          <div className="text-[#2c4d3b] font-body font-bold">
            時間切れでも諦めないで！
          </div>
          <div className="text-[#2c4d3b] font-body font-bold">
            入力途中でも送信されます。
          </div>
        </div>
      </div>
    </>
  );
}

export default MatchingPage;
