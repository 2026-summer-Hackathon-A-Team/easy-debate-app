import type { LoginStatus } from '../types/auth';
import ApiError from './apiError';
import { client } from './client';

// ログイン認証リクエストボディ
type SigninRequest = {
  userName: string;
  password: string;
};

// エラーレスポンス(400/401)。errorMsgは任意なので無い場合もある
type ErrorResponseBody = {
  errorMsg?: string;
};

// サーバーに現在のセッションが有効かどうかを問い合わせる。
// 204(セッションあり)/401(セッションなし)はどちらも正常な結果として扱い、
// それ以外のステータスコードの場合のみ想定外のエラーとして throw する。
async function checkSession(): Promise<LoginStatus> {
  const response = await client.api.v1.auth.session.$get();

  if (response.status === 204) {
    return 'loggedIn';
  }

  if (response.status === 401) {
    return 'loggedOut';
  }

  throw new ApiError(response.status, 'ログイン状態の確認に失敗しました');
}

// ユーザー名とパスワードで認証する。成功時はサーバー側でセッションが発行され、
// Cookie(sessionId)がセットされる(レスポンスボディは無し)。
async function signin(data: SigninRequest): Promise<void> {
  const response = await client.api.v1.auth.signin.$post({ json: data });

  if (response.status === 204) {
    return;
  }

  // 400(入力値NG)/401(ユーザー名またはパスワードが不正): 呼び出し元がモーダルを出し分けるためのエラー
  if (response.status === 400 || response.status === 401) {
    const body = (await response.json()) as ErrorResponseBody;

    throw new ApiError(
      response.status,
      body.errorMsg ?? 'ログインに失敗しました',
    );
  }

  throw new ApiError(response.status, 'ログインに失敗しました');
}

export { checkSession, signin };
