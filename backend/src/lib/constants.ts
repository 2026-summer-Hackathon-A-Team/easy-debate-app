/**
 * 削除マーカー
 * @remarks
 * ユーザー名重複チェック時に削除されているユーザーを除外する為に使用
 */
export const DELETE_MARKER_ACTIVE = 0;

/**
 * Prismaエラーコード
 */
export const PRISMA_ERROR_CODE = {
  /**
   * 一意（ユニーク）制約違反
   */
  UNIQUE_CONSTRAINT_FAILED: 'P2002',

  /**
   * 処理に必要なレコードが存在しない
   */
  RECORD_NOT_FOUND: 'P2025',
} as const;

/**
 * ユーザー未存在時でもパスワード検証処理を走らせ、応答時間差を小さくするためのダミーハッシュ。
 * 秘密情報ではない（ユーザー未存在の場合はパスワード検証結果に関わらず必ず401を返す）
 */
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=4,p=3$f1eZ0Q/D8ujIWpX8zFPN3Q$iLElFLzaebEqp+C0sVE2iaPaM1nsSKYgH6uBE1EYofu8NsdzP08nM6sY9C0RxT8gxuDqV1S9cLa2aoEo+35KuQ';
