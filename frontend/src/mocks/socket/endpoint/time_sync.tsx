import type { ScenarioHandler } from '../../types';

/**
 * time:sync  サーバー時刻の問い合わせ(クライアントの時計ズレ補正用)
 */
const timeSync: ScenarioHandler = (server) => {
  // モックは同一PC上で完結するため、ズレは常に0として扱われる
  server.emit('time:result', { serverTime: Date.now() });
};

export { timeSync };
