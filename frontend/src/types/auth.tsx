// ログイン状態。
// 'unchecked': まだサーバーにセッション確認をしていない(アプリ起動直後の初期値)
// 'loggedIn'  : ログイン済み
// 'loggedOut' : 未ログイン
type LoginStatus = 'unchecked' | 'loggedIn' | 'loggedOut';

export type { LoginStatus };
