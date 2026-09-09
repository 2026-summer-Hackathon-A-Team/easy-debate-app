import { parseCookie } from 'cookie';
import { SESSION_COOKIE_NAME } from './cookie.js';

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
