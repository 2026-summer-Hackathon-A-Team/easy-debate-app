import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSetAtom } from 'jotai';

import { socket } from './socket';
import useCountdownTimer from '../hooks/useCountdownTimer';
import { deadlineAtom } from '../stores/timerAtom';
import type { SyncResult } from '../types/sync/syncResult';

function SocketManager() {
  const navigate = useNavigate();
  const setDeadline = useSetAtom(deadlineAtom);

  // deadlineAtomの残り秒数カウントダウンを常時走らせておく
  useCountdownTimer();

  useEffect(() => {
    function handleConnect() {
      socket.emit('sync:request');
    }

    function handleSyncResult(data: SyncResult) {
      if (data.phase === 'MATCHING') {
        setDeadline(null);
        socket.emit('match:standby');
        navigate('/debates/matching');
        return;
      }

      if (data.phase === 'TOPIC_CHANGE') {
        setDeadline(data.answerDeadline);
        navigate('/debates/topic-selection', {
          state: { topic: data.topic },
        });
      }
    }

    socket.on('connect', handleConnect);
    socket.on('sync:result', handleSyncResult);

    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('sync:result', handleSyncResult);
    };
  }, [navigate, setDeadline]);

  return null;
}

export default SocketManager;
