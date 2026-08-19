import { Socket } from 'socket.io';
import type { SyncResult } from './phase.js';

export interface SocketData {
  userId: number;
}

export interface ClientToServerEvents {
  // 画面側で同期させる為に必要なデーターの返却を依頼
  'sync:request': () => void;
  // マッチング待機の依頼
  // 未実装'match:standby': () => void;
}

export interface ServerToClientEvents {
  // 現在の状態を返却
  'sync:result': (data: SyncResult) => void;
  // マッチング相手が見つかった合図
  // 未実装'match:isFound': () => void;
}

export interface InterServerEvents {}

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
