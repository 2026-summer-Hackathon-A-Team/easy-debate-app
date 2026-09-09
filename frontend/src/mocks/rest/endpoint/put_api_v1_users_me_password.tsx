import type { RestMock } from '../../types';

/**
 * PUT /api/v1/users/me/password  パスワード変更
 */
const updatePassword: RestMock = {
  /** ---------- 変更成功の場合 ---------- */
  method: 'PUT',
  path: '/api/v1/users/me/password',
  status: 204,
  /** ---------- リクエストのバリデーションNGの場合 ---------- */
  // method: 'PUT',
  // path: '/api/v1/users/me/password',
  // status: 400,
  // body: { errorMsg: '入力内容に誤りがあります。' },
  /** ---------- 認証結果NG（未ログイン、または sessionId が無効）の場合 ---------- */
  // method: 'PUT',
  // path: '/api/v1/users/me/password',
  // status: 401,
  // body: { errorMsg: 'ログインしていません。' },
  /** ---------- 現在パスワード誤りの場合 ---------- */
  // method: 'PUT',
  // path: '/api/v1/users/me/password',
  // status: 422,
  // body: { errorMsg: '現在のパスワードが正しくありません。' },
  /** ---------- サーバーエラーの場合 ---------- */
  // method: 'PUT',
  // path: '/api/v1/users/me/password',
  // status: 500,
  // body: { errorMsg: '予期せぬエラーが発生しました。' },
};

export { updatePassword };
