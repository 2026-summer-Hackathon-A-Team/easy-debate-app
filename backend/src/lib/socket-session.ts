import { parseCookie } from 'cookie';
/**
 * cookie内のsessionId名
 */
const SESSION_COOKIE_NAME = 'sessionId';

/**
 * Socket用クッキー取得関数
 *
 * @param `socket.handshake.headers.cookie`の値
 * @returns sessionId / Cookieが無い場合 `undefined`
 */
export const getSessionId = (
  cookieHeader: string | undefined,
): string | undefined => {
  if (!cookieHeader) return undefined;
  const value = parseCookie(cookieHeader)[SESSION_COOKIE_NAME];
  return value === '' ? undefined : value;
};
