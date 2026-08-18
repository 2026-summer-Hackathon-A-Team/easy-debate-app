import type { RestMock } from '../../types';

/**
 * POST /api/v1/users  ユーザー新規登録
 */
const usersCreate: RestMock = {
  /** ---------- 登録成功の場合 ---------- */
  method: 'POST',
  path: '/api/v1/users',
  status: 201,
  body: {
    userName: 'testuser01',
  },
  /** ---------- リクエストのバリデーションNGの場合 ---------- */
  // method: 'POST',
  // path: '/api/v1/users',
  // status: 400,
  // body: {
  //   errorMsg: '入力内容に誤りがあります。',
  // },
  /** ---------- ユーザー名が重複の場合 ---------- */
  // method: 'POST',
  // path: '/api/v1/users',
  // status: 409,
  // body: {
  //   errorMsg: 'ユーザー名が既に使用されています。',
  // },
  /** ---------- サーバーエラーの場合 ---------- */
  // method: 'POST',
  // path: '/api/v1/users',
  // status: 500,
  // body: { errorMsg: '予期せぬエラーが発生しました。' },
};

export { usersCreate };
