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
    // match:standbyは1マウントにつき1回だけ送る
    let isStandbyRequested = false;

    function requestStandby() {
      if (isStandbyRequested) {
        return;
      }

      isStandbyRequested = true;
      socket.emit('match:standby');
    }

    function handleMatchFound() {
      socket.emit('match:isConfirm');
    }

    // 両者がマッチングを確認できたら、仮のお題と回答期限を渡してお題選定画面へ遷移する。
    // カウントダウンの開始は遷移先で初期処理で行う
    function handleMatchComplete(data: MatchComplete) {
      navigate('/debates/topic-selection', { state: data });
    }

    // ブラウザバック・リロードでこの画面に来た場合は、まだディベート中の可能性がある。
    // その状態のmatch:standbyはサーバー側でphase不一致として弾かれるため、
    // sync:resultでMATCHING(=どのディベートにも参加していない)と分かってから依頼する
    function handleSyncResult(data: SyncResult) {
      if (data.phase === 'MATCHING') {
        requestStandby();
      }
    }

    socket.on('match:isFound', handleMatchFound);
    socket.on('match:complete', handleMatchComplete);
    socket.on('sync:result', handleSyncResult);

    // 自分の操作でこの画面へ来た場合(POP以外)は、ディベート中でないことが分かっているので
    // sync:resultを待たずに依頼する。Socketの接続はSocketManagerが行うため、
    // 未接続の間は送信バッファに積まれ、接続完了後にまとめて送られる
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
