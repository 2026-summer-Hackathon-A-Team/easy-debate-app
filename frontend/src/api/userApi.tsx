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

// ユーザー名変更リクエストボディ
type UpdateUserNameRequest = {
  userName: string;
};

// ユーザー名変更レスポンス(200)
type UpdateUserNameResponse = {
  userName: string;
};

// パスワード変更リクエストボディ
type UpdatePasswordRequest = {
  currentPassword: string;
  newPassword: string;
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

// ユーザー名を変更する
async function updateUserName(
  data: UpdateUserNameRequest,
): Promise<UpdateUserNameResponse> {
  const response = await client.api.v1.users.me.$patch({ json: data });

  if (response.status === 200) {
    return (await response.json()) as UpdateUserNameResponse;
  }

  if (response.status === 401) {
    throw new ApiError(response.status, 'UNAUTHORIZED');
  }

  if (response.status === 400 || response.status === 409) {
    const body = (await response.json()) as ErrorResponseBody;

    throw new ApiError(
      response.status,
      body.errorMsg ?? 'ユーザー名の変更に失敗しました',
    );
  }

  throw new ApiError(response.status, 'ユーザー名の変更に失敗しました');
}

// パスワード変更
async function updatePassword(data: UpdatePasswordRequest): Promise<void> {
  const response = await client.api.v1.users.me.password.$put({
    json: data,
  });

  if (response.status === 204) {
    return;
  }

  if (response.status === 401) {
    throw new ApiError(response.status, 'UNAUTHORIZED');
  }

  if (response.status === 400 || response.status === 422) {
    const body = (await response.json()) as ErrorResponseBody;

    throw new ApiError(
      response.status,
      body.errorMsg ?? 'パスワードの変更に失敗しました',
    );
  }

  throw new ApiError(response.status, 'パスワードの変更に失敗しました');
}

// 退会処理
async function cancelMembership(): Promise<void> {
  const response = await client.api.v1.users.me.$delete();

  if (response.status === 204) {
    return;
  }

  throw new ApiError(response.status, '退会処理に失敗しました');
}

export {
  registerUser,
  getUserInfo,
  updateUserName,
  updatePassword,
  cancelMembership,
};
