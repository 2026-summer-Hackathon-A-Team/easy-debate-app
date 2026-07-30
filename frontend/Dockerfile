# Node.jsの公式イメージ(24バージョン)---buildステージ(複数ステージを作る)---
FROM node:24-alpine AS builder

# 作業ディレクトリ
WORKDIR /frontend

# パッケージの依存定義をコピー
COPY package*.json .

# パッケージインストール(package-lock.json)
RUN npm ci

# パッケージ関係以外のソースをコピー
COPY . .

# ビルド実行
RUN npm run build

# ---実行ステージ(Nginx)---（本番環境）
FROM nginx:1.31.3-alpine AS runner

# デフォルトのNginx設定を削除、SPA用設定に変更（本番環境）
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/nginx.conf

# 非rootユーザーで実行するための権限設定（本番環境）
RUN chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx

USER nginx

# ポート番号（本番環境）
EXPOSE 8080

# 開発用サーバー起動
CMD [ "nginx", "-g", "daemon off;" ]