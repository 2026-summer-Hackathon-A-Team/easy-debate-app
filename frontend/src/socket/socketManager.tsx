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
      socket.disconnect();
    };
  }, [navigate]);

  return <Outlet />;
}

export default SocketManager;
