// ログイン状態
// 'unchecked': サーバーにセッション未確認（初期値）
// 'loggedIn'  : ログイン済み
// 'loggedOut' : 未ログイン
type LoginStatus = 'unchecked' | 'loggedIn' | 'loggedOut';

export type { LoginStatus };
