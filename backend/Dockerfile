# ---buildステージ(マルチステージビルド構成)---

# Node.jsの公式イメージ(24バージョン)
FROM node:24 AS builder

# 作業ディレクトリ
WORKDIR /backend

# パッケージの依存定義をコピー
COPY package*.json .

# パッケージインストール(package-lock.json)
RUN npm ci

# Prisma clientの生成
CMD ["npx", "prisma", "generate"]

# パッケージ関係以外のソースをコピー
COPY . .

# ポート番号3000(Honoデフォルトポート番号)
EXPOSE 3000

# ビルド実行
RUN npm run build

# ---開発用ステージ(開発環境を作る)---
FROM node:24 AS development

# 開発環境の環境変数の設定
ENV NODE_ENV=development

# 作業ディレクトリ
WORKDIR /backend

# パッケージの依存定義をコピー
COPY package*.json .

# パッケージインストール(package-lock.json)
RUN npm ci

# パッケージ関係以外のソースをコピー
COPY . .

# ポート番号3000(Honoデフォルトポート番号)
EXPOSE 3000

# サーバー起動
CMD [ "npm", "run", "dev" ]

# ---本番用ステージ(本番環境、パッケージを限定する)---
FROM node:24 AS production

# 本番環境の環境変数の設定
ENV NODE_ENV=production

# 作業ディレクトリ
WORKDIR /backend

# 成果物のみをコピー(本番環境)
COPY package*.json .
RUN npm ci --omit=dev

# ビルドされたファイルをコピー(本番環境)
COPY --from=builder  /backend/dist ./dist


# ポート番号3000(Honoデフォルトポート番号)
EXPOSE 3000

# サーバー起動
CMD [ "npx", "prisma", "migrate", "deploy", "&&", "node", "dist/index.js"]