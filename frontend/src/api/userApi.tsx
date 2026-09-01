import type { UserInfo } from '../types/user';
import ApiError from './apiError';
import { client } from './client';

type RegisterRequest = {
  userName: string;
  password: string;
};

type RegisterResponse = {
  userName: string;
};

type ErrorResponseBody = {
  errorMsg?: string;
};

// 新規ユーザー登録
async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await client.api.v1.users.$post({
    json: data,
  });

  if (response.status === 201) {
    return (await response.json()) as RegisterResponse;
  }

  if (response.status === 400 || response.status === 409) {
    const body = (await response.json()) as ErrorResponseBody;

    throw new ApiError(
      response.status,
      body.errorMsg ?? '新規登録に失敗しました',
    );
  }

  throw new ApiError(response.status, '新規登録に失敗しました');
}

// ユーザー情報を取得
async function getUserInfo(): Promise<UserInfo> {
  const response = await client.api.v1.users.me.$get();

  if (response.status === 200) {
    const data = (await response.json()) as UserInfo;

    return data;
  }

  if (response.status === 401) {
    throw new ApiError(response.status, 'UNAUTHORIZED');
  }

  throw new ApiError(response.status, 'ユーザー情報の取得に失敗しました');
}

export { registerUser, getUserInfo };
