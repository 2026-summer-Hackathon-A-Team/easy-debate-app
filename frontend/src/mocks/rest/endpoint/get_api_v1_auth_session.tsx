import type { RestMock } from '../../types';

/**
 * GET /api/v1/auth/session  セッション確認
 */
const authSession: RestMock = {
  /** ---------- ログイン済みの場合 ---------- */
  method: 'GET',
  path: '/api/v1/auth/session',
  status: 204,
  /** ---------- 未ログインの場合 ---------- */
  // method: 'GET',
  // path: '/api/v1/auth/session',
  // status: 401,
  // body: { errorMsg: 'ログインしていません。' },
  /** ---------- サーバーエラーの場合 ---------- */
  // method: 'GET',
  // path: '/api/v1/auth/session',
  // status: 500,
  // body: { errorMsg: '予期せぬエラーが発生しました。' },
};

export { authSession };
