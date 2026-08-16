import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../lib/prisma.js';
import { HTTPException } from 'hono/http-exception';
import { signinBodySchema } from '../lib/zod.schemas.js';
import { DELETE_MARKER_ACTIVE, DUMMY_PASSWORD_HASH } from '../lib/constants.js';
import { verifyArgon2PasswordHash } from '../lib/password.js';
import { createSessionId, hashSessionId } from '../lib/session.js';

export const auth = new Hono()
  /**
   * ログイン認証API
   * POST /api/v1/auth/signin
   */
  .post(
    '/signin',
    zValidator('json', signinBodySchema, (result, _c) => {
      if (!result.success) {
        throw new HTTPException(400, {
          message: '入力内容に誤りがあります。',
        });
      }
    }),

    async (c) => {
      const { userName, password } = c.req.valid('json');

      const activeUser = await prisma.user.findUnique({
        where: {
          userName_deleteMarker: {
            userName,
            deleteMarker: DELETE_MARKER_ACTIVE,
          },
        },
        select: { id: true, passwordHash: true },
      });

      // passwordHashがnullならダミーと照合する
      const passwordHash = activeUser?.passwordHash ?? DUMMY_PASSWORD_HASH;

      const isPasswordValid = await verifyArgon2PasswordHash(
        password,
        passwordHash,
      );

      // activeUserがNull or パスワード無効ならエラー
      if (!activeUser || !isPasswordValid) {
        throw new HTTPException(401, {
          message: 'ユーザー名またはパスワードが正しくありません。',
        });
      }

      const sessionId = createSessionId();
      const sessionIdHash = hashSessionId(sessionId);

      await prisma.loginSession.create({
        data: {
          sessionIdHash,
          userId: activeUser.id,
        },
      });

      setCookie(c, 'sessionId', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
      });
      return c.body(null, 204);
    },
  );
