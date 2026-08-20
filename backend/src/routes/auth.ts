import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../lib/prisma.js';
import { HTTPException } from 'hono/http-exception';
import { signinBodySchema } from '../lib/zod.schemas.js';
import {
  DELETE_MARKER_ACTIVE,
  DUMMY_PASSWORD_HASH,
  PRISMA_ERROR_CODE,
} from '../lib/constants.js';
import { verifyArgon2PasswordHash } from '../lib/password.js';
import { createSessionId, hashSessionId } from '../lib/session.js';
import { Prisma } from '../generated/prisma/client.js';

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

      // ユーザー未存在時でもタイミング差を小さくするため、ダミーハッシュと照合する
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
      });
      return c.body(null, 204);
    },
  )

  /**
   * ログインチェックAPI
   * GET /api/v1/auth/session
   */
  .get('/session', async (c) => {
    // CookieからsessionIdを取得
    const sessionId = getCookie(c, 'sessionId');

    // CookieにsessionIdが存在しない場合
    if (!sessionId) {
      throw new HTTPException(401, { message: 'ログインしていません。' });
    }
    // CookieのsessionIdをハッシュ化
    const sessionIdHash = hashSessionId(sessionId);
    // DBのセッションIDハッシュ値確認
    const session = await prisma.loginSession.findUnique({
      where: {
        sessionIdHash,
      },
      select: {
        userId: true,
      },
    });
    // sessionが存在しない場合
    if (session === null) {
      throw new HTTPException(401, { message: 'ログインしていません。' });
    }
    // 新しいsessionIdを発行
    const newSessionId = createSessionId();
    // 新しいsessionIdをハッシュ化
    const newSessionIdHash = hashSessionId(newSessionId);

    /**
     * 新しいsessionIdハッシュ値に更新
     *
     * 短時間に連続して送られてきた場合最初のリクエストのみDBへ更新し
     * あとから来たリクエストはDB更新を行わない。
     */
    try {
      await prisma.loginSession.update({
        where: { sessionIdHash },
        data: {
          sessionIdHash: newSessionIdHash,
          lastLoginAt: new Date(),
        },
      });

      // 新しいsessionIdをCookieに設定
      setCookie(c, 'sessionId', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
      });
    } catch (e) {
      //
      if (!(
        // DBにすでに更新がかけられていた場合はCookieを触らず204それ以外は500エラー
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PRISMA_ERROR_CODE.RECORD_NOT_FOUND
      ))
        throw e;
    }
    c.header('Cache-Control', 'no-store');
    return c.body(null, 204);
  })

  /**
   * ログアウトAPI
   *
   * POST /api/v1/auth/signout
   */
  .post('/signout', async (c) => {
    // CookieからsessionIdを取得
    const sessionId = getCookie(c, 'sessionId');

    // CookieにsessionIdが存在しない場合
    if (!sessionId) {
      throw new HTTPException(401, { message: 'ログインしていません。' });
    }

    // CookieのsessionIdをハッシュ化
    const sessionIdHash = hashSessionId(sessionId);
    // DBのセッションIDハッシュ値確認
    const session = await prisma.loginSession.findUnique({
      where: {
        sessionIdHash,
      },
    });
    // sessionが存在しない場合
    if (session === null) {
      throw new HTTPException(401, { message: 'ログインしていません。' });
    }

    // DBのsessionIdHashを削除
    await prisma.loginSession.deleteMany({
      where: {
        sessionIdHash,
      },
    });
    // CookieからsessionIdを削除
    deleteCookie(c, 'sessionId', {
      path: '/',
    });
    return c.body(null, 204);
  });
