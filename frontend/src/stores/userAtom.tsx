import { atom } from 'jotai';

import type { UserInfo } from '../types/user';
import type { LoginStatus } from '../types/auth'

// 現在のログイン状態を保持するグローバルな状態(jotai の atom)
const loginStatusAtom = atom<LoginStatus>('unchecked');

// ログインユーザーの情報を保持するグローバルな状態。未取得・未ログイン時は null
const userInfoAtom = atom<UserInfo | null>(null);

export { loginStatusAtom, userInfoAtom };

