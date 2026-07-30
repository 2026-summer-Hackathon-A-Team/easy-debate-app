# Node.jsの公式イメージ(24バージョン)---buildステージ(複数ステージを作る)---
FROM node:24-alpine AS builder

# 作業ディレクトリ
WORKDIR /backend

# パッケージの依存定義をコピー
COPY package*.json .

# パッケージインストール(package-lock.json)
RUN npm ci

# パッケージ関係以外のソースをコピー
COPY . .

# ビルド実行
RUN npm run build

# ---実行ステージ(本番環境)---

FROM node:24-alpine AS runner

ENV NODE_ENV=production

WORKDIR /backend

# 非rootユーザーで実行するための権限設定(本番環境)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# パッケージの依存定義をコピー(本番環境)
COPY package*.json .
RUN npm ci --omit=dev

# ビルドされたファイルを所有権付きでコピー(本番環境)
COPY --from=builder --chown=appuser:appgroup /backend/dist ./dist

USER appuser

# ポート番号3000(Honoデフォルトポート番号)
EXPOSE 3000

# サーバー起動
CMD ["node", "dist/index.js"]