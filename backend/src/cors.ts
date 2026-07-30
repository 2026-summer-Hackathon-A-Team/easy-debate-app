// 環境変数（CORS_ORIGINS）の有無チェック
const corsOrigins = process.env.CORS_ORIGINS;

if (!corsOrigins) {
  throw new Error('環境変数（CORS_ORIGINS）が未設定');
}

/**
 * 環境変数の「CORS_ORIGINS」をカンマ区切りで分割し、配列に変換し返却
 * @example "http://localhost:3000, https://example.com" ---> ["http://localhost:3000", "https://example.com"]
 * @returns {string[]} CORS_ORIGINSの配列
 */
export const CORS_ORIGINS = corsOrigins
  .split(',')
  .map((origin) => origin.trim());
