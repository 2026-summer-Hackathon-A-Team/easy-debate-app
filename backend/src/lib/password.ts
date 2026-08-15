import { argon2, randomBytes } from 'node:crypto';

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
