import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';

import Heading from '../components/Heading';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { socket } from './socket';
import { syncClock } from './clockOffset';
import type { SyncResult } from '../types/sync/syncResult';

// sync:request送信後、この時間内にsync:resultが届かなければ応答無しとみなす
const SYNC_TIMEOUT_MS = 5000;

function SocketManager() {
  const navigate = useNavigate();
  // 接続失敗・意図しない切断・sync:resultの応答無しを検知した際に表示する
  const [showReconnectModal, setShowReconnectModal] = useState(false);

  useEffect(() => {
    let syncTimeoutId: number | undefined;

    function handleBrowserBack() {
      handleConnect();
    }

    function clearSyncTimeout() {
      if (syncTimeoutId !== undefined) {
        window.clearTimeout(syncTimeoutId);
        syncTimeoutId = undefined;
      }
    }

    function handleConnect() {
      // 残り秒数の表示ズレ補正用に、まず自端末とサーバーの時計のズレを測っておく
      syncClock();
      socket.emit('sync:request');

      // sync:resultが一定時間内に届かない場合は応答無しとみなす
      syncTimeoutId = window.setTimeout(() => {
        setShowReconnectModal(true);
      }, SYNC_TIMEOUT_MS);
    }

    function handleConnectError() {
      clearSyncTimeout();
      setShowReconnectModal(true);
    }

    function handleDisconnect(reason: string) {
      // unmount時のsocket.disconnect()等、自分自身が意図して切断した場合は対象外
      if (reason === 'io client disconnect') {
        return;
      }

      clearSyncTimeout();
      setShowReconnectModal(true);
    }

    // 遷移先の画面が期待する項目は元々dataのサブセットなので、そのまま渡す
    // (項目を1つずつ書き写すと、sync:resultに項目が増えたときに書き漏らす恐れがあるため)
    function handleSyncResult(data: SyncResult) {
      clearSyncTimeout();

      if (data.phase === 'MATCHING') {
        navigate('/debates/matching');
        return;
      }

      if (data.phase === 'TOPIC_CHANGE') {
        navigate('/debates/topic-selection', { state: data });
        return;
      }

      if (data.phase === 'DEBATE_READY') {
        navigate('/debates/topic-confirmation', { state: data });
        return;
      }

      if (data.phase === 'DEBATE') {
        navigate('/debates/chat', { state: data });
        return;
      }

      // JUDGE_WAITING(判定待ち)は、相手の最後のチャットを確認してもらうために
      // 15秒ステイしているだけの状態。judgeが含まれていればカウントダウン表示用に
      // 渡すが、violationはこの時点でサーバーからまだ送られてこない(判定確定前のため)
      // ので絶対に補って組み立てない。JudgeResultPage側で「violationが届くまでは
      // カウントダウンが0になっても公開しない」ガードをかけ、本物のjudge:resultを待つ
      if (data.phase === 'JUDGE_WAITING') {
        navigate('/debates/chat', { state: data });
        return;
      }

      if (data.phase === 'JUDGE') {
        navigate('/debates/judge', { state: data });
        return;
      }
    }

    window.addEventListener('popstate', handleBrowserBack);

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('sync:result', handleSyncResult);

    return () => {
      clearSyncTimeout();

      window.removeEventListener('popstate', handleBrowserBack);

      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('sync:result', handleSyncResult);

      // SocketManagerがアンマウントされた(=/debates/*から離れた)ら接続を破棄する
      socket.disconnect();
    };
    // navigateは依存に含めない: react-routerではpathnameが変わるたびに参照が
    // 作り直されるため、依存に入れると/debates/*内で画面遷移するたびにこのeffectが
    // 再実行され、その都度disconnect()が呼ばれて通信が切れてしまう。
    // ここで呼ぶnavigate()は全て絶対パスなので、マウント時に捕まえた参照のままで問題ない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 再接続を試みるため、現在の画面を読み込み直す
  function handleReconnect() {
    window.location.reload();
  }

  return (
    <>
      <Outlet />

      {showReconnectModal && (
        <Modal>
          <Heading level={2}>通信エラーが発生しました</Heading>
          <p className="mt-2 text-sm text-[#8a8f89] leading-relaxed">
            サーバーとの接続が切れました。
            <br />
            もう一度お試しください。
          </p>
          <Button className="mt-5 w-full" onClick={handleReconnect}>
            OK
          </Button>
        </Modal>
      )}
    </>
  );
}

export default SocketManager;
