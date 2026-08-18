import { USE_MOCK } from '../config/env';

/**
 * モック有効時の初期化（src/main.tsx から1度だけ呼ぶ）
 */
function setupMock(): void {
  if (!USE_MOCK) {
    return;
  }

  console.info(
    '%c[mock]%c モック使用中（バックエンドに接続なし）',
    'background:#4c9e7e;color:#fff;padding:2px 6px;border-radius:4px;font-weight:bold',
    'color:inherit',
  );
  console.info(
    [
      '  APIの応答を変える  : src/mocks/rest/ (エンドポイントごとのファイル)',
      '  Socketの応答を変える: src/mocks/socket/ (イベントのエンドポイントごとのファイル)',
      '  本物のバックエンドに繋ぐ: .env.development の VITE_USE_MOCKを false として再起動',
    ].join('\n'),
  );
}

export { setupMock };
