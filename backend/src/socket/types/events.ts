import { Socket } from 'socket.io';
import type {
  DebateState,
  MatchComplete,
  SyncResult,
  TopicAnyChangeResult,
} from './phase.js';

export interface SocketData {
  userId: number;
}

export interface ClientToServerEvents {
  // サーバーの現在時刻を取得
  'time:sync': () => void;
  // 画面側で同期させる為に必要なデーターの返却を依頼
  'sync:request': () => void;
  // マッチング待機の依頼
  'match:standby': () => void;
  // マッチング完了の合図
  'match:isConfirm': () => void;
  // お題チェンジの有無を送信
  'topic:anyChangeRequest': (data: { isHopeChangeTopic: boolean }) => void;
  // ディベートスタートを合図
  'debate:isConfirm': () => void;
  // チャット送信
  'debate:chatSend': (data: { chatMsg: string }) => void;
}

export interface ServerToClientEvents {
  // サーバーの現在時刻を返却
  'time:result': (data: { serverTime: string }) => void;
  // 現在の状態を返却
  'sync:result': (data: SyncResult) => void;
  // マッチング相手が見つかった合図
  'match:isFound': () => void;
  // 両者マッチング確認を完了
  'match:complete': (data: MatchComplete) => void;
  // お題チェンジの結果を送信
  'topic:anyChangeResult': (data: TopicAnyChangeResult) => void;
  // ディベートスタートの合図
  'debate:start': (data: DebateState) => void;
  // 両者へチャット返却
  'debate:chatReceive': (data: DebateState) => void;
}

export interface InterServerEvents {}

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
