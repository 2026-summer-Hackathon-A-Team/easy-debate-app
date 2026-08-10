// API呼び出し失敗時に投げる独自エラー。
// レスポンスの HTTP ステータスコードを保持することで、呼び出し元(AuthWrapper など)が
// 「401だから未ログイン扱いにする」といったステータスコードに応じた分岐ができるようにする。
class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export default ApiError;
