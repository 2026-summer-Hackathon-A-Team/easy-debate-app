import type { RestMock } from '../../types';

/**
 * GET /api/v1/users/me  ログイン中ユーザーの情報取得
 */
const usersMe: RestMock = {
  /** ---------- 取得成功の場合 ---------- */
  method: 'GET',
  path: '/api/v1/users/me',
  status: 200,
  body: {
    userId: 1,
    userName: 'testuser01',
    rate: 1500,
  },
  /** ---------- 認証結果NG（未ログイン、または sessionId が無効）の場合 ---------- */
  // method: 'GET',
  // path: '/api/v1/users/me',
  // status: 401,
  // body: { errorMsg: 'ログインしていません。' },
  /** ---------- サーバーエラーの場合 ---------- */
  // method: 'GET',
  // path: '/api/v1/users/me',
  // status: 500,
  // body: { errorMsg: '予期せぬエラーが発生しました。' },
};

export { usersMe };
