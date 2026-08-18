/**
 * ユーザーの個人用ルームを定義
 */
export const userRoom = (userId: number) => `user:${userId}`;

/**
 * マッチング後のルームを定義
 */
export const debateRoom = (debateId: number) => `debate:${debateId}`;
