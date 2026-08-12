import type { UserInfo } from '../types/user';
import ApiError from './apiError';
import { client } from './client';

// TODO: バックエンドに/api/v1/users/me が実装され AppType に反映されたら、
// client.api.v1.users.me.$get() をそのまま使う
// as unknown as UserClientも削除する
type UserClient = {
  api: {
    v1: {
      users: {
        me: {
          $get: () => Promise<Response>;
        };
      };
    };
  };
};

// ログイン中のユーザー自身の情報をサーバーから取得する。
// 成功時の戻り値がユーザー情報そのものなので、失敗(未認証など)は
// checkSession と違い戻り値では表現できず、ApiError を throw して呼び出し元に伝える。
async function getUserInfo(): Promise<UserInfo> {
  const response = await (client as unknown as UserClient).api.v1.users.me.$get();

  if (response.status === 200) {
    const data = (await response.json()) as UserInfo;

    return data;
  }

  // 401(未認証): セッション切れなどで呼び出し元がログアウト扱いに切り替えるためのエラー
  if (response.status === 401) {
    throw new ApiError(response.status, 'UNAUTHORIZED');
  }

  // それ以外の想定外のエラー
  throw new ApiError(response.status, 'ユーザー情報の取得に失敗しました');
}

export { getUserInfo };
