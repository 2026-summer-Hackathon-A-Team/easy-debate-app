/**
 * cookie内のsessionId名
 */
const SESSION_COOKIE_NAME = 'sessionId';

/**
 * Socket用クッキー取得関数
 *
 * socket.handshake.headers.cookieにて取得したcookieからsessionIdを取り出す
 */
export const getSessionId = (
  cookieHeader: string | undefined,
): string | undefined => {
  if (cookieHeader === undefined) {
    return undefined;
  }

  const sessionCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));

  // セッションID自体がない場合
  if (sessionCookie === undefined) {
    return undefined;
  }
  return sessionCookie.slice(SESSION_COOKIE_NAME.length + 1);
};
