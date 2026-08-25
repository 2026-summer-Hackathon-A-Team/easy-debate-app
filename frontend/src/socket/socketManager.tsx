import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { socket } from './socket';
import type { SyncResult } from '../types/sync/syncResult';

function SocketManager() {
  const navigate = useNavigate();

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
        return;
      }

      if (data.phase === 'DEBATE_READY') {
        navigate('/debates/topic-confirmation', {
          state: {
            isChangeTopic: data.isChangeTopic,
            topic: data.topic,
            answerDeadline: data.answerDeadline,
            users: data.users,
          },
        });
        return;
      }

      if (data.phase === 'DEBATE') {
        navigate('/debates/chat', {
          state: {
            topic: data.topic,
            users: data.users,
            turn: data.turn,
            chatSubmitDeadline: data.chatSubmitDeadline,
            chatHistory: data.chatHistory,
          },
        });
        return;
      }

      // JUDGE_WAITING(判定待ち)は、判定自体は既に完了していて相手の最後のチャットを
      // 確認してもらうために15秒ステイしているだけなので、judgeが含まれていればそれを
      // 使って遷移する(不戦敗を経由しないフェーズなので違反は無し扱いで組み立てる)。
      // 稀にjudgeがまだ無い場合のみstateを渡さずに遷移し、JudgeResultPageが
      // judge:resultを直接受け取るのを待つ
      if (data.phase === 'JUDGE_WAITING') {
        if (data.judge) {
          navigate('/debates/judge', {
            state: {
              judgeDisplayStartAt: data.judge.judgeDisplayStartAt,
              judgeConfirmDeadline: data.judge.judgeConfirmDeadline,
              judgeReason: data.judge.judgeReason,
              users: data.judge.users,
              thanks: data.judge.thanks,
              violation: {
                isMoralViolationOfBattle: false,
                is2NoChat: false,
                isLeave: false,
              },
            },
          });
          return;
        }

        navigate('/debates/judge');
        return;
      }

      if (data.phase === 'JUDGE') {
        navigate('/debates/judge', {
          state: {
            judgeDisplayStartAt: data.judge.judgeDisplayStartAt,
            judgeConfirmDeadline: data.judge.judgeConfirmDeadline,
            judgeReason: data.judge.judgeReason,
            users: data.judge.users,
            thanks: data.judge.thanks,
            violation: data.violation,
            isRematch: data.isRematch,
          },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Outlet />;
}

export default SocketManager;
