import { Hono } from 'hono';
import { argon2PasswordHash } from '../lib/password.js';
import { zValidator } from '@hono/zod-validator';
import { registerUserBodySchema } from '../lib/zod.schemas.js';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { DELETE_MARKER_ACTIVE, PRISMA_ERROR_CODE } from '../lib/constants.js';
import { HTTPException } from 'hono/http-exception';
import type { UserEnv } from '../authmiddleware.js';

export const users = new Hono<UserEnv>()
  /**
   * ユーザー新規登録API
   * POST /api/v1/users/
   */
  .post(
    '/',
    zValidator('json', registerUserBodySchema, (result, _c) => {
      if (!result.success) {
        throw new HTTPException(400, {
          message: '入力内容に誤りがあります。',
        });
      }
    }),
    async (c) => {
      const { userName, password } = c.req.valid('json');
      // 重複チェック「existingUser」が取得できた場合（重複あり）は409をthrow
      const existingUser = await prisma.user.findUnique({
        where: {
          userName_deleteMarker: {
            userName,
            deleteMarker: DELETE_MARKER_ACTIVE,
          },
        },
        select: { id: true },
      });
      if (existingUser) {
        throw new HTTPException(409, {
          message: 'ユーザー名が既に使用されています。',
        });
      }
      const passwordHash = await argon2PasswordHash(password);
      try {
        await prisma.user.create({
          data: {
            userName,
            passwordHash,
          },
        });
        // Prismaの重複エラー時は409をthrow
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED
        ) {
          throw new HTTPException(409, {
            message: 'ユーザー名が既に使用されています。',
          });
        }
        throw e;
      }
      return c.json({ userName: userName }, 201);
    },
  )

  /**
   * ユーザー情報取得API
   * GET /api/v1/users/me
   */
  .get('/me', async (c) => {
    const userId = c.get('userId');

    // ユーザー情報取得
    const userStatus = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userName: true, rate: true, deleteMarker: true },
    });

    // ユーザー情報なし&削除マーカーが0以外なら401エラー
    if (!userStatus || userStatus.deleteMarker !== DELETE_MARKER_ACTIVE) {
      throw new HTTPException(401, { message: 'ログインしていません。' });
    }

    c.header('Cache-Control', 'no-store');
    return c.json(
      {
        userId: userStatus.id,
        userName: userStatus.userName,
        rate: userStatus.rate,
      },
      200,
    );
  });
