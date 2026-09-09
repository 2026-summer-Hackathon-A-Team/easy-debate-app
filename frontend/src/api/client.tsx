import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/app';
import { USE_MOCK, VITE_API_URL } from '../config/env';
import { mockFetch } from '../mocks/mockFetch';

const client = hc<AppType>(VITE_API_URL, {
  init: {
    credentials: 'include',
  },
  // モック有効時はバックエンドへ接続せず、src/mocks/rest/ の内容を返却
  // undefined の時は hono が通常の fetch を使用
  fetch: USE_MOCK ? mockFetch : undefined,
});

export { client };
