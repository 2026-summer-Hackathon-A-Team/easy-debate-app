import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CORS_ORIGINS } from './cors.js';
import { users } from './routes/users.js';
import type { ApplyGlobalResponse } from 'hono/client';
import { HTTPException } from 'hono/http-exception';

export const app = new Hono()
  .use(
    '*',
    cors({
      origin: CORS_ORIGINS,
    }),
  )
  .get('/health', (c) => {
    return c.json({ status: 'ok' });
  })
  .get('/hello/:name', (c) => {
    const name = c.req.param('name');

    return c.text(`Hello, ${name}!`);
  })
  /**
   * 新規登録・退会・ユーザー情報取得・ユーザー名、パスワード変更処理へ
   */
  .route('/api/v1/users', users)

  .onError((err, c) => {
    const logData = logObj(err, c);
    const log = JSON.stringify(logData);
    // logObj生成時、判定したlevelを見て`console.error`と`console.warn`を切り替える
    logData.level === 'warn' ? console.warn(log) : console.error(log);
    // HTTPExceptionで投げられていないエラーは500
    if (err instanceof HTTPException) {
      return c.json({ errorMsg: err.message }, err.status);
    }
    return c.json({ errorMsg: '予期せぬエラーが発生しました。' }, 500);
  });
/**
 * ログ出力用のオブジェクトを生成する関数
 * @param err エラーオブジェクト
 * @param c Honoのコンテキストオブジェクト
 * @returns ログ出力用のオブジェクト
 */
const logObj = (err: Error, c: any) => {
  const level =
    err instanceof HTTPException && err.status < 500 ? 'warn' : 'error';
  return {
    level, // 'error' or 'warn'
    message: err.message, // エラーメッセージ（Railwayのログ本文になる）
    path: c.req.path, // パス部分のみ（api/v1/users/me）
    method: c.req.method, // HTTPメソッド
    name: err.name, // エラー名
    stack: err.stack, // エラー発生するまでの関数呼び出しの履歴（スタックトレース）
  };
};

/**
 * Hono RPCクライアント用の型
 *
 * @remarks
 * `onError`のレスポンス型は自動推論されないため、
 * `ApplyGlobalResponse`で全ルートにマージしている。
 */
export type AppType = ApplyGlobalResponse<
  typeof app,
  Record<400 | 401 | 409 | 500, { json: { errorMsg: string } }>
>;
