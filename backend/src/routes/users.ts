import { Hono } from 'hono';
import {
  argon2PasswordHash,
  verifyArgon2PasswordHash,
} from '../lib/password.js';
import { zValidator } from '@hono/zod-validator';
import {
  registerUserBodySchema,
  updatePasswordBodySchema,
  updateUserNameBodySchema,
} from '../lib/zod.schemas.js';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { DELETE_MARKER_ACTIVE, PRISMA_ERROR_CODE } from '../lib/constants.js';
import { HTTPException } from 'hono/http-exception';
import type { UserEnv } from '../authmiddleware.js';
import { deleteCookie } from 'hono/cookie';

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
      where: { id: userId, deleteMarker: DELETE_MARKER_ACTIVE },
      select: { id: true, userName: true, rate: true, deleteMarker: true },
    });

    // ユーザー情報なし
    if (!userStatus) {
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
  })

  /**
   * ユーザー退会API
   * DELETE /api/v1/users/me
   */
  .delete('/me', async (c) => {
    const userId = c.get('userId');
    const result = await prisma.$transaction(async (tx) => {
      // ユーザーIDに対応するセッションIDを全て削除
      await tx.loginSession.deleteMany({
        where: { userId },
      });
      // 削除マーカー更新
      const updateResult = await tx.user.updateMany({
        where: { id: userId, deleteMarker: DELETE_MARKER_ACTIVE },
        data: { deleteMarker: userId, deletedAt: new Date() },
      });
      return updateResult;
    });

    // CookieからsessionIdを削除
    deleteCookie(c, 'sessionId', {
      path: '/',
    });

    // 削除マーカー更新件数0だった場合、404エラー
    if (result.count === 0) {
      throw new HTTPException(404, {
        message: '対象のユーザーが見つかりません。',
      });
    }
    return c.body(null, 204);
  })

  /**
   * ユーザー名変更API
   * PATCH /api/v1/users/me
   */
  .patch(
    '/me',
    zValidator('json', updateUserNameBodySchema, (result, _c) => {
      if (!result.success) {
        throw new HTTPException(400, {
          message: '入力内容に誤りがあります。',
        });
      }
    }),
    async (c) => {
      const userId = c.get('userId');

      const { userName: newUserName } = c.req.valid('json');
      try {
        await prisma.user.update({
          where: { id: userId, deleteMarker: DELETE_MARKER_ACTIVE },
          data: { userName: newUserName },
        });
      } catch (e) {
        // Prisma関連のエラー以外は、500
        if (!(e instanceof Prisma.PrismaClientKnownRequestError)) {
          throw e;
        }
        // ユーザー名重複なら409
        if (e.code === PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED) {
          throw new HTTPException(409, {
            message: 'そのユーザー名は既に使用されています。',
          });
        }
        // 対象のレコードが存在しない場合、401
        if (e.code === PRISMA_ERROR_CODE.RECORD_NOT_FOUND) {
          throw new HTTPException(401, {
            message: 'ログインしていません。',
          });
        }
        // それ以外のエラーコードの場合はスロー
        throw e;
      }

      c.header('Cache-Control', 'no-store');
      return c.json(
        {
          userName: newUserName,
        },
        200,
      );
    },
  )

  /**
   * パスワード変更API
   * PUT /api/v1/users/me/password
   */
  .put(
    '/me/password',
    zValidator('json', updatePasswordBodySchema, (result, _c) => {
      if (!result.success) {
        throw new HTTPException(400, {
          message: '入力内容に誤りがあります。',
        });
      }
    }),
    async (c) => {
      const userId = c.get('userId');
      const { currentPassword, newPassword } = c.req.valid('json');

      const user = await prisma.user.findUnique({
        where: { id: userId, deleteMarker: DELETE_MARKER_ACTIVE },
        select: { passwordHash: true },
      });

      if (user === null) {
        throw new HTTPException(401, { message: 'ログインしていません。' });
      }
      // リクエストの現在のパスワードとDB側パスワードハッシュ値を比較
      const isPasswordValid = await verifyArgon2PasswordHash(
        currentPassword,
        user.passwordHash,
      );

      // 不一致であれば422エラー
      if (!isPasswordValid) {
        throw new HTTPException(422, {
          message: '現在のパスワードが正しくありません。',
        });
      }

      // 新しいパスワードをハッシュ化
      const newPasswordHash = await argon2PasswordHash(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      return c.body(null, 204);
    },
  );
