// ログインユーザーの情報。サーバーから取得したユーザー情報を表す型。
type UserInfo = {
  userId: number; // ユーザーID
  userName: string; // ユーザー名
  rate: number; // レート(ディベートの成績等を示す数値)
};

export type { UserInfo };
