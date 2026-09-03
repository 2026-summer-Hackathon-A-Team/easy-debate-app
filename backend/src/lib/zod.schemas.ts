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

/**
 * ユーザー名変更用スキーマ
 */
export const updateUserNameBodySchema = z.object({
  userName: z
    .string()
    .min(6)
    .max(20)
    .regex(/^[A-Za-z0-9]+$/),
});

/**
 * パスワード変更用スキーマ
 */
export const updatePasswordBodySchema = z.object({
  currentPassword: z
    .string()
    .min(8)
    .max(64)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/),
  newPassword: z
    .string()
    .min(8)
    .max(64)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/),
});

/**
 * ログイン用スキーマ
 * @remarks
 * 文字数のみ制限
 */
export const signinBodySchema = z.object({
  userName: z.string().min(1).max(20),
  password: z.string().min(1).max(64),
});

/**
 * DBパスワードハッシュ全体の構文チェック&分解
 * @remarks 必ず6要素・先頭が空文字になります。
 * @returns `['', algorithm, version, params, saltBase64, hashBase64]`
 */
export const dbPasswordHashSyntaxSchema = z
  .string()
  .regex(
    /^\$argon2id\$v=19\$m=\d{1,10},t=\d{1,10},p=\d{1,8}\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/,
  )
  .transform((s) => s.split('$'))
  .pipe(
    z.tuple([
      z.literal(''),
      z.string(), // algorithm
      z.string(), // version
      z.string(), // params
      z.string(), // saltBase64
      z.string(), // hashBase64
    ]),
  );

// DBのpasswordHashから「m=65536,t=4,p=3」の形でパラメーターの値を取り出す
const PARAMS_PATTERN = /^m=(\d{1,10}),t=(\d{1,10}),p=(\d{1,8})$/;
// パディング無しのbase64の文字だけにする
const BASE64_NO_PAD = /^[A-Za-z0-9+/]+$/;

/**
 * DBに保存してあるハッシュ値のパラメーターチェック&型整形
 * @remarks
 * argon2の関数にかけられる型に整形します
 */
export const dbPasswordHashFormatSchema = z
  .object({
    algorithm: z.literal('argon2id'),
    version: z.literal('v=19'),
    params: z.string().regex(PARAMS_PATTERN),
    saltBase64: z.string().regex(BASE64_NO_PAD),
    hashBase64: z.string().regex(BASE64_NO_PAD),
  })
  // 構文チェック通過後、argon2()に渡す形へ変換
  .transform((v) => {
    const [, m, t, p] = v.params.match(PARAMS_PATTERN)!;
    return {
      memory: Number(m),
      passes: Number(t),
      parallelism: Number(p),
      salt: Buffer.from(v.saltBase64, 'base64'),
      expectedHash: Buffer.from(v.hashBase64, 'base64'),
    };
  });
