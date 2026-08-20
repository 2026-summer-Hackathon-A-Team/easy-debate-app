/**
 * ユーザーの個人用ルームを定義
 */
export const userRoom = (userId: number) => `userRoom:${userId}`;

/**
 * マッチング後のルームを定義
 */
export const debateRoom = (debateId: string) => `debateRoom:${debateId}`;
