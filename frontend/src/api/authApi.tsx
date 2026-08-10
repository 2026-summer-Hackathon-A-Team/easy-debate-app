import type { LoginStatus } from '../stores/authAtom';
import ApiError from './apiError';

// サーバーに現在のセッションが有効かどうかを問い合わせる。
// 204(セッションあり)/401(セッションなし)はどちらも正常な結果として扱い、
// それ以外のステータスコードの場合のみ想定外のエラーとして throw する。
async function checkSession(): Promise<LoginStatus> {
  const response = await fetch('http://localhost:3000/api/v1/auth/session', {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 204) {
    return 'loggedIn';
  }

  if (response.status === 401) {
    return 'loggedOut';
  }

  throw new ApiError(response.status, 'ログイン状態の確認に失敗しました');
}

export { checkSession };
