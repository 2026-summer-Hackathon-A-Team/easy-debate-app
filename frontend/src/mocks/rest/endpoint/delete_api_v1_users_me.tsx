import type { RestMock } from '../../types';

/**
 * DELETE /api/v1/users/me  ユーザー退会
 */
const cancelMembership: RestMock = {
  /** ---------- 退会成功の場合 ---------- */
  method: 'DELETE',
  path: '/api/v1/users/me',
  status: 204,
  /** ---------- 認証情報NG（未ログイン、または sessionId が無効）の場合 ---------- */
  // method: 'DELETE',
  // path: '/api/v1/users/me',
  // status: 401,
  // body: { errorMsg: '認証情報が正しくありません。' },
  /** ---------- 対象ユーザーが存在しない（既に退会済みを含む）場合 ---------- */
  // method: 'DELETE',
  // path: '/api/v1/users/me',
  // status: 404,
  // body: { errorMsg: '対象のユーザーが見つかりません。' },
  /** ---------- サーバーエラーの場合 ---------- */
  // method: 'DELETE',
  // path: '/api/v1/users/me',
  // status: 500,
  // body: { errorMsg: '予期せぬエラーが発生しました。' },
};

export { cancelMembership };
