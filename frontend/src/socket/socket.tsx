import { io, type Socket } from 'socket.io-client';

import { USE_MOCK, VITE_API_URL } from '../config/env';
import { createMockSocket } from '../mocks/mockSocket';

// アプリ全体で使い回すsocket
// モック有効時はバックエンドへ接続せず、src/mocks/socket/ へ記載されたmockのレスポンスを返却
const socket: Socket = USE_MOCK
  ? (createMockSocket() as unknown as Socket)
  : io(VITE_API_URL, {
      withCredentials: true,
      autoConnect: false,
    });

export { socket };
