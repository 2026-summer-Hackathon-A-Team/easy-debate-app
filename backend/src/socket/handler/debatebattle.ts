import type { AppServer } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { userDebateIds } from '../stores/user-debate.js';
import type { AppSocket } from '../types/events.js';
import { getDebateAndJoinedUser } from './syncrequest.js';
import { debateRoom } from '../rooms.js';

/** チャット送信期限（ミリ秒） */
export const CHAT_SUBMIT_DEADLINE_MS = 120_000;

/**
 * ディベートスタート合図処理
 *
 * 回答が揃ったらディベート履歴をDBへ登録する
 *
 * 登録成功後、DEBATEへ遷移し1ターン目を開始
 */
export const debateIsConfirmHandler = async (
  io: AppServer,
  socket: AppSocket,
): Promise<void> => {
  const { userId } = socket.data;
  // ディベートIDを取得
  const debateId = userDebateIds.get(userId);
  if (debateId === undefined) return;

  const { debate, user } = getDebateAndJoinedUser(debateId, userId);

  // 1回のみ受け付ける（二重送信防止）
  if (user.isAnswered) return;
  user.isAnswered = true;

  // 2名の回答を待つ
  if (!debate.users.every((u) => u.isAnswered)) return;

  const [user0, user1] = debate.users;
  const isCurrentTurnUserId = debate.users.find(
    (u) => u.turn === 'FIRST',
  )?.userId;

  if (
    user0.position === undefined ||
    user1.position === undefined ||
    isCurrentTurnUserId === undefined
  ) {
    throw new Error(
      `DEBATE: required values are missing: debateId=${debateId}`,
    );
  }

  // ディベート履歴をDBへ登録（1ディベートにつき2行）
  await prisma.debateHistory.createMany({
    data: debate.users.map((u) => ({
      id: debateId,
      userId: u.userId,
      winnerFlag: false,
    })),
  });

  // DEBATEへ遷移
  debate.phase = 'DEBATE';
  debate.currentTurn = 1; // 1ターン目から
  debate.isCurrentTurnUserId = isCurrentTurnUserId;
  debate.chatSubmitDeadline = new Date(Date.now() + CHAT_SUBMIT_DEADLINE_MS);
  for (const u of debate.users) {
    u.isAnswered = false; // falseにリセット
  }

  io.to(debateRoom(debateId)).emit('debate:start', {
    topic: debate.topic,
    users: [
      { userId: user0.userId, position: user0.position },
      { userId: user1.userId, position: user1.position },
    ],
    turn: {
      isCurrentTurnUserId: debate.isCurrentTurnUserId,
      currentTurn: debate.currentTurn,
      totalTurn: debate.totalTurn,
    },
    chatSubmitDeadline: debate.chatSubmitDeadline.toISOString(),
    chatHistory: debate.chatHistory,
  });
};
