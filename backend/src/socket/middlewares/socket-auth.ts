import type { AppSocket } from '../types/events.js';
import { getSessionId } from '../../lib/socket-session.js';
import { prisma } from '../../lib/prisma.js';
import { hashSessionId } from '../../lib/session.js';

/**
 * 共通処理 認証
 *
 * 初回接続時、socket.dataへユーザーIDを保持する
 */
export const socketAuth = async (
  socket: AppSocket,
  next: (err?: Error) => void,
) => {
  try {
    // セッションIDの取り出し
    const sessionId = getSessionId(socket.handshake.headers.cookie);
    if (sessionId === undefined) {
      next(new Error());
      return;
    }
    // DB側にセッションIDが保存されているか検索
    const session = await prisma.loginSession
      .findUnique({
        where: { sessionIdHash: hashSessionId(sessionId) },
        select: { userId: true },
      })
      .catch((_e) => {
        return null;
      });
    // セッションIDがなければ処理せず終了
    if (session === null) {
      next(new Error());
      return;
    }
    // ユーザーIDをsocket.dataへ保持
    socket.data.userId = session.userId;
    next();
  } catch (e) {
    next(new Error());
  }
};
