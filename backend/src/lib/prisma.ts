import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

const databaseUrlEnv = process.env.DATABASE_URL;
if (!databaseUrlEnv) {
  throw new Error('環境変数（DATABASE_URL）が未設定');
}

const databaseUrl = new URL(databaseUrlEnv);

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
});

export const prisma = new PrismaClient({
  adapter,
});
