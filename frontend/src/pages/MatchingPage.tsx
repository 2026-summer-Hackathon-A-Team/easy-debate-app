import Heading from '../components/Heading';

import { useEffect } from 'react';
import { useNavigate, useNavigationType } from 'react-router';

import { socket } from '../socket/socket';
import type { MatchComplete } from '../types/socket/matchComplete';
import type { SyncResult } from '../types/sync/syncResult';

function MatchingPage() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  useEffect(() => {
    // match:standbyを初期表示につき1度しか送らないように
    let isStandbyRequested = false;

    /**
     * マッチング待機列へ並ぶ
     */
    function requestStandby() {
      if (isStandbyRequested) {
        return;
      }

      isStandbyRequested = true;
      socket.emit('match:standby');
    }

    /**
     * マッチング完了時の疎通（離脱していないか）確認
     */
    function handleMatchFound() {
      socket.emit('match:isConfirm');
    }

    /**
     * 両者がマッチング確認済みとなったらお題選定画面へ遷移
     *
     * @param data ペイロード
     */
    function handleMatchComplete(data: MatchComplete) {
      navigate('/debates/topic-selection', { state: data });
    }

    /**
     * 現在のデータを同期
     * （ここではマッチング待機列へ並ぶために使用）
     *
     * @param data ペイロード
     */
    function handleSyncResult(data: SyncResult) {
      if (data.phase === 'MATCHING') {
        requestStandby();
      }
    }

    socket.on('match:isFound', handleMatchFound);
    socket.on('match:complete', handleMatchComplete);
    socket.on('sync:result', handleSyncResult);

    // ユーザー操作でこの画面へ遷移してきた場合はsync:resultを待たずに依頼
    if (navigationType !== 'POP') {
      requestStandby();
    }

    return () => {
      socket.off('match:isFound', handleMatchFound);
      socket.off('match:complete', handleMatchComplete);
      socket.off('sync:result', handleSyncResult);
    };
  }, [navigate, navigationType]);

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
