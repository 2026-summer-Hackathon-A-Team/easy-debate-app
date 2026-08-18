import { restMocks } from './rest';
import { delayMs as defaultDelayMs } from './rest/settings';
import type { RestMock } from './types';

// 通常、編集不要
// mocks/rest/ に書かれた内容から Response を組み立てる fetch 互換の関数
// src/api/client.tsx で hono クライアントの fetch オプションに渡す

// 本文を持てないステータス
const NO_BODY_STATUSES = [204, 205, 304];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// メソッドとパスが一致するモックを探す
function findMock(method: string, pathname: string): RestMock | undefined {
  return restMocks.find(
    (mock) => mock.method.toUpperCase() === method && mock.path === pathname,
  );
}

function toResponse(status: number, body: unknown): Response {
  if (body === undefined || NO_BODY_STATUSES.includes(status)) {
    return new Response(null, { status });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=UTF-8' },
  });
}

// fetch の第1引数(文字列 / URL / Request)から URL 文字列を取り出す
function toUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}

const mockFetch: typeof fetch = async (input, init) => {
  const method = (
    init?.method ?? (input instanceof Request ? input.method : 'GET')
  ).toUpperCase();

  // hono クライアントは絶対URL(VITE_API_URL 起点)を渡してくるが、
  // 相対URLで呼ばれても解決できるように第2引数を渡しておく
  const url = new URL(toUrlString(input), window.location.origin);
  const key = `${method} ${url.pathname}`;
  const mock = findMock(method, url.pathname);
  const delay = mock?.delayMs ?? defaultDelayMs;

  if (delay > 0) {
    await sleep(delay);
  }

  if (mock === undefined) {
    console.warn(
      `[mock] "${key}" のモックがありません。src/mocks/rest/ にファイルを追加し、rest/index.tsx に登録してください。`,
    );

    return toResponse(404, { errorMsg: `モックが未定義です(${key})` });
  }

  console.info(`[mock] ${key} -> ${mock.status}`);

  return toResponse(mock.status, mock.body);
};

export { mockFetch };
