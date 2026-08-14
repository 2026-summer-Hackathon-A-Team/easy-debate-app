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
  .route('/api/v1/users', users)

  .onError((err, c) => {
    if (err instanceof HTTPException) {
      console.warn(JSON.stringify(logObj(err, c)));
      return c.json({ errorMsg: err.message }, err.status);
    }
    console.error(JSON.stringify(logObj(err, c)));
    return c.json({ errorMsg: '予期せぬエラーが発生しました。' }, 500);
  });

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
