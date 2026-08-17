# モック

バックエンドの実装を待たずにフロントエンドを開発するための、**フロント内で完結するモック**。

- バックエンドも DB も **起動不要**（`npm run dev` だけで動く）
- 本番ビルドでは `VITE_USE_MOCK` を設定しないため、モックは無効になる

---

## 使い方

```sh
cd frontend
npm run dev
```

起動してブラウザのコンソールに次が表示されればモックが有効

```
[mock] モック使用中（バックエンドには接続なし）
```

**モックは実際の通信を行わないため、DevTools の Network タブには表示されない。**

## 本物のバックエンドに繋ぎたい場合

1. リポジトリルートの [README](../../../README.md) の「環境変数設定」を済ませたうえで、バックエンドと DB のコンテナを起動する

   ```sh
   docker compose up -d --build backend db
   ```

2. `frontend/.env.development` の VITE_USE_MOCK を下記に変更する

   ```env
   VITE_USE_MOCK=false
   ```

3. フロントエンドを再起動する
   <br />
   Vite は起動時にしか `.env` を読み込まないため、値を変えただけでは反映されない

   - `npm run dev` で起動している場合
     <br />
     そのターミナルで `Ctrl + C` を押して停止し、再度 `npm run dev`

   - frontend コンテナで起動している場合

     ```sh
     docker compose restart frontend
     ```

モックに戻す場合は `VITE_USE_MOCK=true` に戻し、同じ手順で再起動する
<br />
`.env.development` はコミット対象のファイルなので、`false` のまま commit しないよう注意（チーム全員のモックが無効になる）
<br />
サービス名を指定しない `docker compose up -d --build` は frontend コンテナも起動するため、ローカルの `npm run dev` と併用するとポート 5173 が競合する

| 状況                                        | 接続先                                                     |
| ------------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`（既定）                       | モック                                                     |
| `.env.development` の `VITE_USE_MOCK=false` | `VITE_API_URL` の本物のバックエンド                        |
| `npm run build`（本番）                     | 本物（`VITE_USE_MOCK` を設定しないためモックは含まれない） |

---

## ファイル構成

```
src/mocks/
├── rest/                          ★ REST API
│   ├── endpoint/                    エンドポイントごとに1ファイル
│   │   ├── delete_api_v1_users_me.tsx        DELETE /api/v1/users/me
│   │   ├── get_api_v1_auth_session.tsx       GET    /api/v1/auth/session
│   │   ├── get_api_v1_users_me.tsx           GET    /api/v1/users/me
│   │   └── ...
│   ├── settings.tsx                 共通の設定
│   └── index.tsx                    endpoint/ の一覧（登録するだけ）
├── socket/                        ★ WebSocket
│   ├── endpoint/                    イベントごとに1ファイル
│   │   ├── sync:request.tsx           sync:request
│   │   ├── match:standby.tsx          match:standby
│   │   ├── match:isConfirm.tsx        match:isConfirm
│   │   └── ...
│   ├── settings.tsx                 共通の値
│   └── index.tsx                    endpoint/ の一覧（登録するだけ）
├── helpers.tsx                    使用する関数
├── types.tsx                      型定義
├── mockFetch.tsx                  rest/ を読んで Response を返す fetch 互換関数（編集不要）
├── mockSocket.tsx                 socket.io-client 互換の最小実装（編集不要）
└── index.tsx                      起動バナーの表示（編集不要）
```

普段書き換えるのは `rest/endpoint/` と `socket/endpoint/` の中のみ
<br />
（共通の設定のみ各 `settings.tsx`）

### ファイル名のルール

| 対象   | ルール                                                | 例                                                               |
| ------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| REST   | HTTPメソッド + URL を `_` で繋ぐ（先頭の `/` は省略） | `GET /api/v1/users/me` → `rest/endpoint/get_api_v1_users_me.tsx` |
| socket | イベント名をそのまま使う（`:` も残す）                | `match:standby` → `socket/endpoint/match:standby.tsx`            |

---

### エンドポイントを追加

1. `rest/endpoint/` や `socket/endpoint/` に上記のルールでファイルを作成
2. `rest/index.tsx` や `socket/index.tsx` に1行追加

---
