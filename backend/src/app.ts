import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CORS_ORIGINS } from './cors.js';
import { users } from './routes/users.js';
import type { ApplyGlobalResponse } from 'hono/client';

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
    console.error({ path: c.req.path, method: c.req.method, err });
    return c.json({ errorMsg: '予期せぬエラーが発生しました。' }, 500);
  });

export type AppType = ApplyGlobalResponse<
  typeof app,
  {
    500: { json: { errorMsg: string } };
  }
>;
