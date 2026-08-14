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
} as const;
