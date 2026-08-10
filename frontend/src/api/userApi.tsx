import type { UserInfo } from '../types/user';
import ApiError from './apiError';

// ログイン中のユーザー自身の情報をサーバーから取得する。
// 成功時の戻り値がユーザー情報そのものなので、失敗(未認証など)は
// checkSession と違い戻り値では表現できず、ApiError を throw して呼び出し元に伝える。
async function getUserInfo(): Promise<UserInfo> {
  const response = await fetch('http://localhost:3000/api/v1/users/me', {
    method: 'GET',
    credentials: 'include',
  });

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
