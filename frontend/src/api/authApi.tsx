import type { LoginStatus } from '../types/auth';
import ApiError from './apiError';
import { client } from './client';

// TODO: バックエンドに/api/v1/auth/session が実装され AppType に反映されたら、
// client.api.v1.auth.session.$get() をそのまま使う
// as unknown as AuthClientも削除する
type AuthClient = {
  api: {
    v1: {
      auth: {
        session: {
          $get: () => Promise<Response>;
        };
      };
    };
  };
};

// サーバーに現在のセッションが有効かどうかを問い合わせる。
// 204(セッションあり)/401(セッションなし)はどちらも正常な結果として扱い、
// それ以外のステータスコードの場合のみ想定外のエラーとして throw する。
async function checkSession(): Promise<LoginStatus> {
  const response = await (
    client as unknown as AuthClient
  ).api.v1.auth.session.$get();

  if (response.status === 204) {
    return 'loggedIn';
  }

  if (response.status === 401) {
    return 'loggedOut';
  }

  throw new ApiError(response.status, 'ログイン状態の確認に失敗しました');
}

export { checkSession };
