# easy-debate-app

## 開発環境起動方法

### 環境変数設定

1. `.env.example` をコピーし `.env` を作成

   ```sh
   cp .env.example .env
   ```

2. （Claude 連携を利用する場合のみ）Claude の API キーを取得し、`.env` の `ANTHROPIC_API_KEY` に設定（必要な場合は Mattermost で管理者に連絡して取得）

```env
ANTHROPIC_API_KEY=<取得したAPI_KEY>
```

### コンテナ起動

1. コンテナをビルド & 起動
   ```sh
   docker compose up -d --build
   ```

### コンテナ停止

1. MySQLのデータを残したい場合

   ```sh
   docker compose down
   ```

2. MySQLのデータを削除したい場合
   ```sh
   docker compose down -v
   ```

### DB設定

- Prismaスキーマの内容をDBに反映

  ```sh
  docker compose exec backend sh -c 'npx prisma migrate dev && npx prisma generate'
  ```

- 開発用DBを初期化し、Prismaスキーマの内容を再反映
  ```sh
  docker compose exec backend sh -c 'npx prisma migrate reset --force && npx prisma generate'
  ```

## フロントエンドのモック

バックエンドの実装を待たずにフロントエンドを開発するためのモックを `frontend/src/mocks/` に用意済み。
<br />
バックエンドと DB は起動不要。

1. フロントエンドを起動（これだけでモックが有効になる）

   ```sh
   cd frontend && npm run dev
   ```

2. API のレスポンスを変えたい場合は `frontend/src/mocks/rest/endpoint`
   <br />
   socket の応答を変えたい場合は `frontend/src/mocks/socket/endpoint` を書き換える

3. 本物のバックエンドと繋いで確認したい場合
   1. 上記「環境変数設定」を済ませた上で、バックエンドと DB のコンテナを起動

      ```sh
      docker compose up -d --build backend db
      ```

   2. `frontend/.env.development` の VITE_USE_MOCK を下記に変更

      ```env
      VITE_USE_MOCK=false
      ```

   3. フロントエンドを再起動
      <br />
      Vite は起動時にしか `.env` を読み込まないため、値を変えただけでは反映されない
      - `npm run dev` で起動している場合
        <br />
        そのターミナルで `Ctrl + C` を押して停止し、再度 `npm run dev`

      - frontend コンテナで起動している場合

        ```sh
        docker compose restart frontend
        ```

   モックに戻す場合は `VITE_USE_MOCK=true` に戻し、同じ手順で再起動
   <br />
   `.env.development` はコミット対象のため、`false` のまま commit しないよう注意
   <br />
   サービス名を指定しない `docker compose up -d --build` は frontend コンテナも起動するため、ローカルの `npm run dev` と併用するとポート 5173 が競合する

詳しい使い方は [frontend/src/mocks/README.md](frontend/src/mocks/README.md) を参照

## DBの確認(Prisma Studioを使用)

1. 以下のコマンドを実行しPrisma Studioを起動

   ```sh
   docker compose exec backend npx prisma studio --port 51212 --browser none
   ```

2. ブラウザで `http://localhost:51212` へアクセス

3. 起動中はターミナルがPrismaのDB管理ツールに占有されます。`ctrl + c` で終了
