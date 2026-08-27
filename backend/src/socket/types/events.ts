import { Socket } from 'socket.io';
import type {
  DebateState,
  JudgeResult,
  MatchComplete,
  SyncResult,
  ThanksReceive,
  TopicAnyChangeResult,
} from './phase.js';

export interface SocketData {
  userId: number;
}

export interface ClientToServerEvents {
  // 切断イベント
  disconnect: () => void;
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
  // 再対戦希望を送信
  'rematch:anyRequest': (data: { isHopeRematch: boolean }) => void;
  // チャット送信
  'thanks:send': (data: {
    fixedThanksId?: number;
    freeThanksMsg?: string;
  }) => void;
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
  // 勝敗結果を返却
  'judge:result': (data: JudgeResult) => void;
  // お礼モラル違反を通知
  'thanks:moralViolation': () => void;
  // 再対戦の有無を返却
  'rematch:anyResult': (data: {
    isRematchResult: boolean;
    topic?: string;
    answerDeadline?: string;
  }) => void;
  // お礼チャットを返却する
  'thanks:receive': (data: ThanksReceive) => void;
  // 相手の離脱を合図
  'topic:opponentLeave': () => void;
}

export interface InterServerEvents {}

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
