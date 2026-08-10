import { atom } from 'jotai';

import type { UserInfo } from '../types/user';

// ログイン状態。
// 'unchecked': まだサーバーにセッション確認をしていない(アプリ起動直後の初期値)
// 'loggedIn'  : ログイン済み
// 'loggedOut' : 未ログイン
type LoginStatus = 'unchecked' | 'loggedIn' | 'loggedOut';

// 現在のログイン状態を保持するグローバルな状態(jotai の atom)
const loginStatusAtom = atom<LoginStatus>('unchecked');

// ログインユーザーの情報を保持するグローバルな状態。未取得・未ログイン時は null
const userInfoAtom = atom<UserInfo | null>(null);

export { loginStatusAtom, userInfoAtom };

export type { LoginStatus };
