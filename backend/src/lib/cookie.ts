/**
 * セッションCookie名
 */
export const SESSION_COOKIE_NAME = 'sessionId';

/**
 * 本番の親ドメイン
 */
export const PRODUCTION_COOKIE_DOMAIN = '.easy-debate.app';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cookie共通属性
 */
export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  secure: isProduction,
  sameSite: 'Lax' as const,
  ...(isProduction ? { domain: PRODUCTION_COOKIE_DOMAIN } : {}),
};
