import type { AppServer } from '../index.js';
import { userRoom } from '../rooms.js';
import { waitingUsers } from './matching.js';

/**
 * マッチング状態の削除
 *
 * マッチング待機オブジェクトからユーザーを削除する
 */
const releaseMatching = (userId: number): void => {
  waitingUsers.delete(userId);
};

/**
 * 離脱処理
 *
 * 同一ユーザーの他のソケットが残っていた場合、何もしない
 *
 * ユーザーの今の状態を判定し、各離脱処理を実行させる
 */
export const disconnectHandler = async (
  io: AppServer,
  userId: number,
): Promise<void> => {
  // 他タブ・他端末が接続中なら何もしない
  const sockets = await io.in(userRoom(userId)).fetchSockets();
  if (sockets.length > 0) return;

  releaseMatching(userId);
};

// TODO: 今後共通処理の離脱関係を実装する
