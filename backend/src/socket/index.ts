import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'node:http';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './types/events.js';
import { socketAuth } from './middlewares/socket-auth.js';
import { onConnection } from './handler/connection.js';
import { CORS_ORIGINS } from '../cors.js';

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const createSocketServer = (httpServer: HTTPServer): AppServer => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
  });

  // ルーティング処理
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    try {
      // 例外が投げられたら接続を切る
      await onConnection(io, socket);
    } catch (e) {
      console.error(e);
      socket.disconnect(true);
    }
  });
  return io;
};

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
});
process.on('uncaughtException', (e) => {
  console.error('uncaughtException', e);
  process.exit(1);
});
