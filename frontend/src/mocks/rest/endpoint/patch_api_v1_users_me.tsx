import type { RestMock } from '../../types';

/**
 * PATCH /api/v1/users/me  ユーザー名変更
 */
const updateUserName: RestMock = {
  /** ---------- 変更成功の場合 ---------- */
  method: 'PATCH',
  path: '/api/v1/users/me',
  status: 200,
  body: {
    userName: 'testuser01',
  },
  /** ---------- リクエストのバリデーションNGの場合 ---------- */
  // method: 'PATCH',
  // path: '/api/v1/users/me',
  // status: 400,
  // body: { errorMsg: '入力内容に誤りがあります。' },
  /** ---------- 認証結果NG（未ログイン、または sessionId が無効）の場合 ---------- */
  // method: 'PATCH',
  // path: '/api/v1/users/me',
  // status: 401,
  // body: { errorMsg: 'ログインしていません。' },
  /** ---------- ユーザー名が重複の場合 ---------- */
  // method: 'PATCH',
  // path: '/api/v1/users/me',
  // status: 409,
  // body: { errorMsg: 'そのユーザー名は既に使用されています。' },
  /** ---------- サーバーエラーの場合 ---------- */
  // method: 'PATCH',
  // path: '/api/v1/users/me',
  // status: 500,
  // body: { errorMsg: '予期せぬエラーが発生しました。' },
};

export { updateUserName };
