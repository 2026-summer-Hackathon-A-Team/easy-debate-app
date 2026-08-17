import { socketScenario } from './socket';
import type { MockServer } from './types';

// 通常、編集不要
// socket.io-client の Socket と同じ使い方ができる最小限のモック
// src/socket/socket.tsx でモック有効時に本物の io() の代わりに使う

type Listener = (...args: unknown[]) => void;

function createMockSocket() {
  const listeners = new Map<string, Set<Listener>>();
  const timers = new Set<number>();

  let connected = false;
  let socketId = '';

  // 予約したタイマーは切断時にまとめて解除する
  function schedule(handler: () => void, delay: number): void {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      handler();
    }, delay);

    timers.add(timer);
  }

  function clearTimers(): void {
    for (const timer of timers) {
      window.clearTimeout(timer);
    }

    timers.clear();
  }

  // サーバーから届いたイベントとして、登録済みハンドラを呼ぶ
  function dispatch(event: string, payload?: unknown): void {
    const handlers = listeners.get(event);

    if (handlers === undefined || handlers.size === 0) {
      console.info(`[mock socket] server -> client: ${event} (受け手なし)`);

      return;
    }

    console.info(`[mock socket] server -> client: ${event}`, payload ?? '');

    for (const handler of [...handlers]) {
      if (payload === undefined) {
        handler();
      } else {
        handler(payload);
      }
    }
  }

  // mocks/socket/ のハンドラへ渡す「サーバー役」
  const server: MockServer = {
    emit: (event, payload, delayMs = 0) => {
      schedule(() => {
        if (!connected) {
          console.info(`[mock socket] 切断済みのため ${event} は届きません`);

          return;
        }

        dispatch(event, payload);
      }, delayMs);
    },
  };

  function connect(): void {
    if (connected) {
      return;
    }

    connected = true;
    socketId = `mock-${Math.random().toString(36).slice(2, 10)}`;

    // 本物の socket.io と同じく、ハンドラ登録が終わってから connect が飛ぶように非同期で通知する
    schedule(() => {
      dispatch('connect');
    }, 0);
  }

  function disconnect(): void {
    if (!connected) {
      return;
    }

    clearTimers();
    connected = false;
    dispatch('disconnect', 'io client disconnect');
  }

  function on(event: string, handler: Listener): void {
    const handlers = listeners.get(event) ?? new Set<Listener>();

    handlers.add(handler);
    listeners.set(event, handlers);
  }

  function off(event?: string, handler?: Listener): void {
    if (event === undefined) {
      listeners.clear();

      return;
    }

    if (handler === undefined) {
      listeners.delete(event);

      return;
    }

    listeners.get(event)?.delete(handler);
  }

  function once(event: string, handler: Listener): void {
    const wrapped: Listener = (...args) => {
      off(event, wrapped);
      handler(...args);
    };

    on(event, wrapped);
  }

  // クライアントからサーバーへの送信。mocks/socket/ の対応するハンドラを呼ぶ
  function emit(event: string, ...args: unknown[]): void {
    console.info(`[mock socket] client -> server: ${event}`, args[0] ?? '');

    const handler = socketScenario[event];

    if (handler === undefined) {
      console.warn(
        `[mock socket] "${event}" に対する応答がありません。src/mocks/socket/ にファイルを追加し、socket/index.tsx に登録してください。`,
      );

      return;
    }

    handler(server, args[0] as never);
  }

  return {
    get id() {
      return socketId;
    },
    get connected() {
      return connected;
    },
    connect,
    disconnect,
    on,
    off,
    once,
    emit,
  };
}

export { createMockSocket };
