import type { RestMock } from '../../types';

/**
 * POST /api/v1/auth/signout  ログアウト
 */
const authSignout: RestMock = {
  /** ---------- ログアウト成功の場合 ---------- */
  method: 'POST',
  path: '/api/v1/auth/signout',
  status: 204,
  /** ---------- 認証結果NG（未ログイン、または sessionId が無効）の場合 ---------- */
  // method: 'POST',
  // path: '/api/v1/auth/signout',
  // status: 401,
  // body: { errorMsg: 'ログインしていません。' },
  /** ---------- サーバーエラーの場合 ---------- */
  // method: 'POST',
  // path: '/api/v1/auth/signout',
  // status: 500,
  // body: { errorMsg: '予期せぬエラーが発生しました。' },
};

export { authSignout };
