import Heading from '../components/Heading';

import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { socket } from '../socket/socket';
import type { MatchComplete } from '../types/socket/matchComplete';

function MatchingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleMatchFound() {
      socket.emit('match:isConfirm');
    }

    // 両者がマッチングを確認できたら、仮のお題と回答期限を渡してお題選定画面へ遷移する。
    // カウントダウンの開始は遷移先で初期処理で行う
    function handleMatchComplete(data: MatchComplete) {
      navigate('/debates/topic-selection', { state: data });
    }

    // Socket接続
    socket.connect();

    socket.on('match:isFound', handleMatchFound);
    socket.on('match:complete', handleMatchComplete);

    // 受け口を用意してからマッチング待ちをリクエストする
    socket.emit('match:standby');

    return () => {
      socket.off('match:isFound', handleMatchFound);
      socket.off('match:complete', handleMatchComplete);
    };
  }, [navigate]);

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
