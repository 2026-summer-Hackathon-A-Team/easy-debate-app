import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { dbPasswordHashFormatSchema, dbPasswordHashSyntaxSchema } from './zod.schemas.js';

const ARGON2_OPTIONS = {
  parallelism: 3,
  tagLength: 64,
  memory: 65536,
  passes: 4,
};

const b64 = (buf: Buffer) => buf.toString('base64').replace(/=+$/, '');

export const argon2PasswordHash = async (password: string): Promise<string> => {
  const salt = randomBytes(16);

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    argon2(
      'argon2id',
      {
        message: password,
        nonce: salt,
        ...ARGON2_OPTIONS,
      },
      (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
  return [
    `$argon2id$v=19`,
    `m=${ARGON2_OPTIONS.memory},t=${ARGON2_OPTIONS.passes},p=${ARGON2_OPTIONS.parallelism}`,
    b64(salt),
    b64(derivedKey),
  ].join('$');
};

/**
 * 入力されたパスワードとArgon2idハッシュを比較
 * @param password 平文パスワード
 * @param passwordHash DBのパスワードハッシュ
 * @returns 一致の場合true、不一致の場合false
 */
export const verifyArgon2PasswordHash = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => {
  // passwordHashの全体構造が正しいかチェック
  const [, algorithm, version, params, saltBase64, hashBase64] = dbPasswordHashSyntaxSchema.parse(passwordHash);

  // DBに保存してあるハッシュ値形式のチェック
  const { memory, passes, parallelism, salt, expectedHash } =
    dbPasswordHashFormatSchema.parse({
      algorithm,
      version,
      params,
      saltBase64,
      hashBase64,
    });

  // 平文パスワードハッシュ化
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    argon2(
      'argon2id',
      {
        message: password,
        nonce: salt,
        memory,
        passes,
        parallelism,
        tagLength: expectedHash.length,
      },
      (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
  // DBと入力されたパスワードの比較（間違っていても即座に結果を返さない）
  return timingSafeEqual(derivedKey, expectedHash);
};
