# Node.jsの公式イメージ(24バージョン)
FROM node:24

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

# ビルド実行
RUN npm run build

# サーバー起動
CMD ["npm", "run", "start"]