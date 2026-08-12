import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/'; //TODO:バックエンド作成後ディレクトリ、ファイル名記載
import { VITE_API_URL } from '../config/env';

const client = hc<AppType>(VITE_API_URL, {
  init: {
    credentials: 'include',
  },
});

export { client };
