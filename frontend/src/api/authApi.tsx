import type { LoginStatus } from '../types/auth';
import ApiError from './apiError';
import { client } from './client';

type SigninRequest = {
  userName: string;
  password: string;
};

type ErrorResponseBody = {
  errorMsg?: string;
};

// 現在のログイン状況を確認
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

// ユーザー名とパスワードで認証
async function signin(data: SigninRequest): Promise<void> {
  const response = await client.api.v1.auth.signin.$post({ json: data });

  if (response.status === 204) {
    return;
  }

  if (response.status === 400 || response.status === 401) {
    const body = (await response.json()) as ErrorResponseBody;

    throw new ApiError(
      response.status,
      body.errorMsg ?? 'ログインに失敗しました',
    );
  }

  throw new ApiError(response.status, 'ログインに失敗しました');
}

// ログアウト
async function signout(): Promise<void> {
  const response = await client.api.v1.auth.signout.$post();

  if (response.status === 204) {
    return;
  }

  throw new ApiError(response.status, 'ログアウトに失敗しました');
}

export { checkSession, signin, signout };
