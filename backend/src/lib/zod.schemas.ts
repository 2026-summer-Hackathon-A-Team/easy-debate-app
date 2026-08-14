import { z } from 'zod';

/**
 * ユーザー新規登録スキーマ
 * @remarks
 * ユーザー名・パスワードのバリデーション
 */
export const registerUserBodySchema = z.object({
  userName: z
    .string()
    .min(6)
    .max(20)
    .regex(/^[A-Za-z0-9]+$/),
  password: z
    .string()
    .min(8)
    .max(64)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/),
});
