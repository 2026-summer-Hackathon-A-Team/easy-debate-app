import { Hono } from 'hono';
import { argon2PasswordHash } from '../lib/password.js';
import { zValidator } from '@hono/zod-validator';
import { registerUserQuerySchema } from '../lib/zod.schemas.js';
import { prisma } from '../lib/prisma.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client.js';

const DELETE_MARKER_ACTIVE = 0;

export const users = new Hono().post(
  '/',
  zValidator('json', registerUserQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ errorMsg: '入力内容に誤りがあります。' }, 400);
    }
  }),
  async (c) => {
    const { userName, password } = c.req.valid('json');
    const existingUser = await prisma.user.findUnique({
      where: {
        userName_deleteMarker: { userName, deleteMarker: DELETE_MARKER_ACTIVE },
      },
      select: { id: true },
    });
    if (existingUser) {
      return c.json({ errorMsg: 'ユーザー名が既に使用されています。' }, 409);
    }

    const passwordHash = await argon2PasswordHash(password);

    try {
      await prisma.user.create({
        data: {
          userName,
          passwordHash,
        },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        return c.json({ errorMsg: 'ユーザー名が既に使用されています。' }, 409);
      }
      throw e;
    }
    return c.json({ userName: userName }, 201);
  },
);
