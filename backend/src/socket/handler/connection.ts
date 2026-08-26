import type { AppSocket } from '../types/events.js';
import type { AppServer } from '../index.js';
import { userRoom, debateRoom } from '../rooms.js';
import { userDebateIds } from '../stores/user-debate.js';
import { phaseValidation } from '../middlewares/phaseValidation.js';
import {
  matchStandbyHandler,
  matchIsConfirmHandler,
  topicAnyChangeRequestHandler,
} from './matching.js';
import { disconnectHandler } from './disconnect.js';
import { syncRequestHandler } from './syncrequest.js';

/**
 * 共通処理 個人ルーム参加処理
 *
 * 接続ユーザーを個人ルームへ参加させる。
 *
 * 参加中のディベートがある場合はディベートルームへ再参加させる。
 *
 * socket.dataへuserIdを保持から先の処理を記載
 */
export const onConnection = async (
  io: AppServer,
  socket: AppSocket,
): Promise<void> => {
  const { userId } = socket.data;
  // ユーザーの個人ルームに参加
  await socket.join(userRoom(userId));

  const debateId = userDebateIds.get(userId);
  // 参加中のディベートがあった場合はそのルームに参加
  if (debateId !== undefined) {
    await socket.join(debateRoom(debateId));
    // TODO: 離脱判定タイマー停止cancelDisconnectTimer(userId); // 未実装
  }

  // 受信イベントごとのphase検証（ハンドシェイクではない場合）
  socket.use(phaseValidation(socket));

  // disconnectハンドラ
  socket.on('disconnect', () => {
    try {
      disconnectHandler(io, userId);
    } catch (e) {
      console.error('disconnectの処理に失敗しました。', e);
    }
  });

  socket.on('sync:request', () => {
    try {
      syncRequestHandler(socket);
    } catch (e) {
      console.error('sync:requestの処理に失敗しました。', e);
    }
  });

  socket.on('match:standby', () => {
    try {
      matchStandbyHandler(io, socket.data.userId);
    } catch (e) {
      console.error('match:standbyの処理に失敗しました。', e);
    }
  });

  socket.on('match:isConfirm', () => {
    try {
      matchIsConfirmHandler(io, socket);
    } catch (e) {
      console.error('match:isConfirmの処理に失敗しました。', e);
    }
  });

  socket.on('topic:anyChangeRequest', async (data) => {
    try {
      await topicAnyChangeRequestHandler(io, socket, data);
    } catch (e) {
      console.error('topic:anyChangeRequestの処理に失敗しました。', e);
    }
  });
};
