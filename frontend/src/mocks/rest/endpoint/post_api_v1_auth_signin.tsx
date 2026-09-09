import type { RestMock } from '../../types';

/**
 * POST /api/v1/auth/signin  ログイン
 */
const authSignin: RestMock = {
  /** ---------- ログイン成功の場合 ---------- */
  method: 'POST',
  path: '/api/v1/auth/signin',
  status: 204,
  /** ---------- リクエストのバリデーションNGの場合 ---------- */
  // method: 'POST',
  // path: '/api/v1/auth/signin',
  // status: 400,
  // body: { errorMsg: '入力内容に誤りがあります。' },
  /** ---------- 認証結果NG（ユーザー名またはパスワードが不正）の場合 ---------- */
  // method: 'POST',
  // path: '/api/v1/auth/signin',
  // status: 401,
  // body: { errorMsg: 'ユーザー名またはパスワードが正しくありません。' },
  /** ---------- サーバーエラーの場合 ---------- */
  // method: 'POST',
  // path: '/api/v1/auth/signin',
  // status: 500,
  // body: { errorMsg: '予期せぬエラーが発生しました。' },
};

export { authSignin };
