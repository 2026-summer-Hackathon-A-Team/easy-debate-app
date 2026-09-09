import type { RestMock } from '../types';
import { cancelMembership } from './endpoint/delete_api_v1_users_me';
import { authSession } from './endpoint/get_api_v1_auth_session';
import { usersMe } from './endpoint/get_api_v1_users_me';
import { updateUserName } from './endpoint/patch_api_v1_users_me';
import { authSignin } from './endpoint/post_api_v1_auth_signin';
import { authSignout } from './endpoint/post_api_v1_auth_signout';
import { usersCreate } from './endpoint/post_api_v1_users';
import { updatePassword } from './endpoint/put_api_v1_users_me_password';

/**
 * REST APIのモック一覧
 *
 * レスポンス内容を変える場合は endpoint/ の各ファイルを書き換え
 *
 * ファイル名は HTTPメソッド + エンドポイントの URL を _ で繋いだもの
 * GET    /api/v1/users/me  -> endpoint/get_api_v1_users_me.tsx
 * DELETE /api/v1/users/me  -> endpoint/delete_api_v1_users_me.tsx
 *
 * エンドポイントを追加する場合は、
 * 上記のルールで endpoint/ にファイルを1つ作成し、下記の配列に追加
 */
const restMocks: RestMock[] = [
  authSession,
  authSignin,
  authSignout,
  usersMe,
  usersCreate,
  cancelMembership,
  updateUserName,
  updatePassword,
];

export { restMocks };
