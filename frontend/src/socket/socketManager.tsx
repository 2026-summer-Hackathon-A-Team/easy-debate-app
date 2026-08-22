import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { socket } from './socket';
import useCountdownTimer from '../hooks/useCountdownTimer';
import type { SyncResult } from '../types/sync/syncResult';

function SocketManager() {
  const navigate = useNavigate();

  // deadlineAtomの残り秒数カウントダウンを常時走らせておく
  useCountdownTimer();

  useEffect(() => {
    function handleConnect() {
      socket.emit('sync:request');
    }

    // 画面固有の処理（setDeadline等）はここでは行わず、遷移先の画面の初期処理に任せる
    function handleSyncResult(data: SyncResult) {
      if (data.phase === 'MATCHING') {
        navigate('/debates/matching');
        return;
      }

      if (data.phase === 'TOPIC_CHANGE') {
        navigate('/debates/topic-selection', {
          state: { topic: data.topic, answerDeadline: data.answerDeadline },
        });
      }
    }

    socket.on('connect', handleConnect);
    socket.on('sync:result', handleSyncResult);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('sync:result', handleSyncResult);

      // SocketManagerがアンマウントされた(=/debates/*から離れた)ら接続を破棄する
      socket.disconnect();
    };
    // navigateは依存に含めない: react-routerではpathnameが変わるたびに参照が
    // 作り直されるため、依存に入れると/debates/*内で画面遷移するたびにこのeffectが
    // 再実行され、その都度disconnect()が呼ばれて通信が切れてしまう。
    // ここで呼ぶnavigate()は全て絶対パスなので、マウント時に捕まえた参照のままで問題ない
  }, []);

  return <Outlet />;
}

export default SocketManager;
