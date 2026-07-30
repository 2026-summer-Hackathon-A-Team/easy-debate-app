import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CORS_ORIGINS } from './cors.js';

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
  });

export type AppType = typeof app;
