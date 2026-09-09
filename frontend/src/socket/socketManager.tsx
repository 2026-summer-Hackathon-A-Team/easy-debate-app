import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import Heading from '../components/Heading';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { socket } from './socket';
import { syncClock } from './clockOffset';
import type { SyncResult } from '../types/sync/syncResult';

// sync:request送信後、この時間内にsync:resultが届かなければ応答無しとみなす
const SYNC_TIMEOUT_MS = 5000;

function SocketManager() {
  const location = useLocation();
  const navigate = useNavigate();

  // 「接続失敗 or 意図しない切断 or sync:resultの応答無し」を検知した際に表示するモーダル
  const [showReconnectModal, setShowReconnectModal] = useState(false);

  useEffect(() => {
    let syncTimeoutId: number | undefined;
    // sync:resultでの遷移を履歴に追加するか、今の履歴を上書きするか
    // （ブラウザバック直後だけは1つ前の画面に居るため、正しい画面を積み直す必要あり）
    let shouldPushOnSync = false;

    function clearSyncTimeout() {
      if (syncTimeoutId !== undefined) {
        window.clearTimeout(syncTimeoutId);
        syncTimeoutId = undefined;
      }
    }

    /**
     * データ同期を依頼
     */
    function requestSync() {
      clearSyncTimeout();

      // 残り秒数の表示ズレ補正用に、自端末とサーバー側の時刻のズレを測る
      syncClock();
      socket.emit('sync:request');

      // sync:resultが一定時間内に届かない場合は応答無しとみなす
      syncTimeoutId = window.setTimeout(() => {
        setShowReconnectModal(true);
      }, SYNC_TIMEOUT_MS);
    }

    /**
     * Socket接続時の処理
     */
    function handleConnect() {
      // 接続直後の同期は「今いる画面を正しい画面に直す」だけなので履歴は追加しない
      shouldPushOnSync = false;
      requestSync();
    }

    function handleBrowserBack() {
      // 1つ前の画面へ移動してしまっているので、正しい画面を履歴へ追加し直す
      shouldPushOnSync = true;

      // 何らかの理由で切断されていた場合は繋ぎ直す
      if (!socket.connected) {
        socket.connect();
        return;
      }

      requestSync();
    }

    /**
     * 接続エラー時の処理
     */
    function handleConnectError() {
      clearSyncTimeout();
      setShowReconnectModal(true);
    }

    /**
     * 切断時の処理
     *
     * @param reason 切断理由
     * @returns void
     */
    function handleDisconnect(reason: string) {
      // アンマウント時のsocket.disconnect()等
      // 自分自身が意図して切断した場合は対象外
      if (reason === 'io client disconnect') {
        return;
      }

      clearSyncTimeout();
      setShowReconnectModal(true);
    }

    /**
     * フェーズごとに適した画面へ遷移
     *
     * @param path 遷移先パス
     * @param state 同期したデータ（ペイロード）
     */
    function goToPhasePage(path: string, state?: unknown) {
      navigate(path, { state, replace: !shouldPushOnSync });
    }

    function handleSyncResult(data: SyncResult) {
      clearSyncTimeout();

      if (data.phase === 'MATCHING') {
        goToPhasePage('/debates/matching');
        return;
      }

      if (data.phase === 'TOPIC_CHANGE') {
        goToPhasePage('/debates/topic-selection', data);
        return;
      }

      if (data.phase === 'DEBATE_READY') {
        goToPhasePage('/debates/topic-confirmation', data);
        return;
      }

      if (data.phase === 'DEBATE') {
        goToPhasePage('/debates/chat', data);
        return;
      }

      if (data.phase === 'JUDGE_WAITING') {
        goToPhasePage('/debates/chat', data);
        return;
      }

      if (data.phase === 'JUDGE') {
        const { judge, ...rest } = data;

        goToPhasePage('/debates/judge', { ...rest, ...judge });
        return;
      }
    }

    window.addEventListener('popstate', handleBrowserBack);

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('sync:result', handleSyncResult);

    // /debates/* の範囲に遷移したらここで接続
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      clearSyncTimeout();

      window.removeEventListener('popstate', handleBrowserBack);

      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('sync:result', handleSyncResult);

      // SocketManagerがアンマウントされた(=/debates/* から離脱)ら接続を破棄
      socket.disconnect();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 再接続を試みるため、現在の画面を読み込み直す
   */
  function handleReconnect() {
    window.location.reload();
  }

  return (
    <>
      <Outlet key={location.key} />

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
