import type { AppSocket } from '../types/events.js';
import { syncHandler } from './sync:request-handler.js';
import { userRoom, debateRoom } from '../rooms.js';
import { userDebateIds } from '../stores/user-debate.js';
import { phaseValidation } from '../middlewares/phaseValidation.js';

/**
 * 共通処理 個人ルーム参加処理
 *
 * socket.dataへuserIdを保持から先の処理を記載
 */
export const onConnection = async (socket: AppSocket): Promise<void> => {
  const { userId } = socket.data;
  // ユーザーの個人ルームに参加
  await socket.join(userRoom(userId));

  const debateId = userDebateIds.get(userId);
  // 参加中のディベートがあった場合はそのルームに参加
  if (debateId !== undefined) {
    await socket.join(debateRoom(debateId));
    // TODO: 離脱判定タイマー停止cancelDisconnectTimer(userId); // 未実装
  }

  // TODO: 再接続の猶予タイマーと disconnect ハンドラを実装する。
  // 未実装　socket.on('disconnect', () => {});

  // 受信イベントごとのphase検証（ハンドシェイクではない場合）
  socket.use(phaseValidation(socket));

  socket.on('sync:request', () => {
    void syncHandler(socket);
  });
};
