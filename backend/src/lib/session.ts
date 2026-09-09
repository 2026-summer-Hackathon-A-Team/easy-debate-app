import { createHash, randomBytes } from 'node:crypto';

/**
 * セッションID生成
 *
 * ランダムな値を文字列で出力
 */
export const createSessionId = (): string =>
  randomBytes(32).toString('base64url');

/**
 * セッションIDのハッシュ化
 * @param sessionId
 *
 * sessionIdをSHA256でハッシュ化
 * @returns 小文字64字
 */
export const hashSessionId = (sessionId: string): string =>
  createHash('sha256').update(sessionId, 'utf-8').digest('hex');
