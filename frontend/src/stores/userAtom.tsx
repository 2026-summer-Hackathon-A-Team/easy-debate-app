import { atom } from 'jotai';

import type { UserInfo } from '../types/user';
import type { LoginStatus } from '../types/auth';

// 現在のログイン状態を保持するグローバルな状態(jotai の atom)
const loginStatusAtom = atom<LoginStatus>('unchecked');

// ログインユーザーの情報を保持するグローバルな状態。未取得・未ログイン時は null
const userInfoAtom = atom<UserInfo | null>(null);

// ログインチェック(GET /api/v1/auth/session)を呼び出し中かを保持
// 先に呼び出そうとした側が true にし、後から来た側は呼び出しをスキップする(二重呼び出し防止)
const isCheckingSessionAtom = atom(false);

// ユーザー情報取得(GET /api/v1/users/me)を呼び出し中かどうか。用途は isCheckingSessionAtom と同じ
const isFetchingUserInfoAtom = atom(false);

export {
  loginStatusAtom,
  userInfoAtom,
  isCheckingSessionAtom,
  isFetchingUserInfoAtom,
};
