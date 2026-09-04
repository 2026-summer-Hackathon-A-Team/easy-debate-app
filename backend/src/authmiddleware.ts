import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { prisma } from './lib/prisma.js';
import { hashSessionId } from './lib/session.js';
import { SESSION_COOKIE_NAME } from './lib/cookie.js';

export type UserEnv = {
  Variables: {
    userId: number;
    sessionIdHash: string;
  };
};

/**
 * セッションチェック
 *
 * @returns ユーザーID セッションIDハッシュ値
 */
export const sessionMiddleware = createMiddleware<UserEnv>(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  // CookieにsessionIdが存在しない場合
  if (!sessionId) {
    throw new HTTPException(401, { message: 'ログインしていません。' });
  }
  // CookieのsessionIdをハッシュ化
  const sessionIdHash = hashSessionId(sessionId);
  // DBのセッションIDハッシュ値確認
  const session = await prisma.loginSession.findUnique({
    where: { sessionIdHash },
    select: { userId: true },
  });

  // sessionが存在しない場合
  if (!session) {
    throw new HTTPException(401, { message: 'ログインしていません。' });
  }
  c.set('userId', session.userId);
  c.set('sessionIdHash', sessionIdHash);
  await next();
});
