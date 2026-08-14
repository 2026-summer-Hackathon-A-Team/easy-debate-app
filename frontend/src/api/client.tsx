import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/app';
import { VITE_API_URL } from '../config/env';

const client = hc<AppType>(VITE_API_URL, {
  init: {
    credentials: 'include',
  },
});

export { client };
