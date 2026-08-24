import type { UserInfo } from '../types/user';
import ApiError from './apiError';
import { client } from './client';

// 新規登録リクエストボディ
type RegisterRequest = {
  userName: string;
  password: string;
};

// 新規登録レスポンス(201)
type RegisterResponse = {
  userName: string;
};

// エラーレスポンス(400/409)。errorMsgは任意なので無い場合もある
type ErrorResponseBody = {
  errorMsg?: string;
};

// 新規ユーザーを登録する。登録のみで自動ログインはしない(セッションは発行されない)
async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await client.api.v1.users.$post({
    json: data,
  });

  if (response.status === 201) {
    return (await response.json()) as RegisterResponse;
  }

  // 400(入力値NG)/409(ユーザー名重複): 呼び出し元がモーダルを出し分けるためのエラー
  if (response.status === 400 || response.status === 409) {
    const body = (await response.json()) as ErrorResponseBody;

    throw new ApiError(
      response.status,
      body.errorMsg ?? '新規登録に失敗しました',
    );
  }

  throw new ApiError(response.status, '新規登録に失敗しました');
}

// TODO（動作確認用のため削除）
type UserClient = {
  api: {
    v1: {
      users: {
        $post: (input: { json: RegisterRequest }) => Promise<Response>;
        me: {
          $get: () => Promise<Response>;
        };
      };
    };
  };
};

// ログイン中のユーザー自身の情報をサーバーから取得する。
// 成功時の戻り値がユーザー情報そのものなので、失敗(未認証など)は
// checkSessionと違い戻り値では表現できずApiErrorをthrowして呼び出し元に伝える。
async function getUserInfo(): Promise<UserInfo> {
  const response = await (
    client as unknown as UserClient
  ).api.v1.users.me.$get();

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

export { registerUser, getUserInfo };
