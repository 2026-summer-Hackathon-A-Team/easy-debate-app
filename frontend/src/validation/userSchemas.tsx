import { z } from 'zod';

// ユーザー名: 6〜20文字の英数字
const usernameSchema = z
  .string()
  .min(6)
  .max(20)
  .regex(/^[A-Za-z0-9]+$/);

// パスワード: 8〜64文字、英字と数字を両方含む
const passwordSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/);

export { usernameSchema, passwordSchema };
