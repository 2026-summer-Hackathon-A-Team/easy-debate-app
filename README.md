# easy-debate-app

## 開発環境起動方法

### 環境変数設定

1. `.env.example` をコピーし `.env` を作成

   ```sh
   cp .env.example .env
   ```

2. （Claude 連携を利用する場合のみ）Claude の API キーを取得し、`.env` の `ANTHROPIC_API_KEY` に設定
   ```env
   ANTHROPIC_API_KEY=<取得したAPI_KEY>
   ```

### コンテナ起動

1. コンテナをビルド&起動
   ```sh
   docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
   ```

### コンテナ停止

1. MySQLのデータを残したい場合

   ```sh
   docker compose -f docker-compose.yml -f docker-compose.local.yml down
   ```

2. MySQLのデータを削除したい場合
   ```sh
   docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
   ```

### DB設定

- Prismaスキーマの内容をDBに反映

  ```sh
  docker compose exec backend sh -c 'npx prisma db push && npx prisma generate'
  ```

- 開発用DBを初期化して、Prismaスキーマの内容を再反映
  ```sh
  docker compose exec backend sh -c 'npx prisma db push --force-reset && npx prisma generate'
  ```

### DBの確認(Prisma Studioを使用)

1. 以下のコマンドを実行しPrisma Studioを起動

   ```sh
   docker compose exec backend npx prisma studio --port 51212 --hostname 0.0.0.0 --browser none
   ```

2. ブラウザで `http://localhost:51212` へアクセス

3. 起動中はターミナルがPrismaのDB管理ツールに占有されます。`ctrl + c` で終了
