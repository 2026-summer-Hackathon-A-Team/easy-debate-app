import { serve } from '@hono/node-server';
import { app } from './app.js';
import { createSocketServer } from './socket/index.js';
import type { Server as HTTPServer } from 'node:http';

// サーバー起動
const httpServer = serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT) || 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

createSocketServer(httpServer as HTTPServer);
