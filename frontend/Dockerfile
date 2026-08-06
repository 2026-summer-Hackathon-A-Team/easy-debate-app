# Node.jsの公式イメージ(24バージョン)
FROM node:24

# 作業ディレクトリ
WORKDIR /frontend

# パッケージの依存定義をコピー
COPY package*.json .

# パッケージインストール(package-lock.json)
RUN npm ci

# パッケージ関係以外のソースをコピー
COPY . .

# ポート番号
EXPOSE 5173

# 開発用サーバー起動
CMD [ "npm", "run", "dev", "--", "--host", "0.0.0.0" ]

