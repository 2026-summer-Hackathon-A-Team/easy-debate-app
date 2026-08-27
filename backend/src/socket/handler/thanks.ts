import { z } from 'zod';
import type { AppServer } from '../index.js';
import type { AppSocket } from '../types/events.js';
import { userDebateIds } from '../stores/user-debate.js';
import { getDebateAndJoinedUser } from './syncrequest.js';
import { prisma } from '../../lib/prisma.js';
import { applyScore, MORAL_VIOLATION_CATEGORY } from './debatejudge.js';
import { debateRoom, userRoom } from '../rooms.js';
import { checkThanksMessage } from '../ai/thankscheck.js';

const FIXED_THANKS_MESSAGES: Record<number, string> = {
  1: 'ありがとうございました！',
  2: '楽しかったです！',
  3: '再対戦しませんか？',
};

const THANKS_SEND_LIMIT = 5;
/** お礼送信によるモラルスコア加点 */
const THANKS_MORAL_BONUS = 10;
/** お礼のモラル違反によるモラルスコア減点 */
const THANKS_VIOLATION_PENALTY = -100;

const thanksSendSchema = z
  .object({
    fixedThanksId: z.number().optional(),
    freeThanksMsg: z.string().min(1).max(100).optional(),
  })
  .refine(
    (d) => d.fixedThanksId !== undefined || d.freeThanksMsg !== undefined,
  );

/**
 * お礼送信処理
 */
export const thanksSendHandler = async (
  io: AppServer,
  socket: AppSocket,
  data: unknown,
): Promise<void> => {
  const { userId } = socket.data;

  const debateId = userDebateIds.get(userId);
  if (debateId === undefined) return;

  // リクエストユーザーのディベート情報を取得
  const { debate, user } = getDebateAndJoinedUser(debateId, userId);

  // バリデーションチェック NGなら何もしない
  const parsed = thanksSendSchema.safeParse(data);
  if (!parsed.success) return;

  // ペナルティ済み、または送信回数が上限であれば無視
  const sendCount = user.thanksSendCount ?? 0;
  if (user.isThanksPenalized === true || sendCount >= THANKS_SEND_LIMIT) {
    return;
  }

  let thanksMsg: string;
  let isViolation = false;

  if (parsed.data.freeThanksMsg !== undefined) {
    // フリー入力の場合、AIで違反チェック
    const checkResult = await checkThanksMessage(parsed.data.freeThanksMsg);
    isViolation = checkResult.blocked;
    thanksMsg = parsed.data.freeThanksMsg;
  } else {
    // 固定チャットの場合IDに対応するメッセージを入れる 存在しないIDなら何もしない
    thanksMsg = FIXED_THANKS_MESSAGES[parsed.data.fixedThanksId ?? -1] ?? '';
    if (thanksMsg === '') return;
  }

  // 送信回数をカウントアップ
  user.thanksSendCount = sendCount + 1;

  if (isViolation) {
    // モラル違反: モラルスコア減点、違反履歴登録
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { moralScore: true },
    });
    if (dbUser === null) {
      throw new Error(`user not found: userId=${userId}`);
    }
    const moralResult = applyScore(dbUser.moralScore, THANKS_VIOLATION_PENALTY);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { moralScore: moralResult.updated },
      });
      await tx.moralUpdownHistory.create({
        data: {
          debateHistoryId: debateId,
          userId,
          moralScoreUpdown: moralResult.actualUpdown,
        },
      });
      await tx.moralViolationHistory.create({
        data: {
          debateHistoryId: debateId,
          userId,
          moralViolationCategoryId: MORAL_VIOLATION_CATEGORY.THANKS,
          moralViolationReason: thanksMsg.slice(0, 200),
        },
      });
    });

    // ペナルティ確定、再対戦希望false
    user.isThanksPenalized = true;
    debate.violation.isMoralViolationOfThanks = true;
    debate.violation.violationUserId = userId;

    // 違反ユーザーへ通知
    io.in(userRoom(userId)).emit('thanks:moralViolation');
    return;
  }

  // モラル違反なしの場合、お礼履歴へ追加
  debate.thanksHistory.push({ userId, thanksMsg });

  // 初回の正常送信のみモラルスコア加点
  if (sendCount === 0) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { moralScore: true },
    });
    if (dbUser !== null) {
      const moralResult = applyScore(dbUser.moralScore, THANKS_MORAL_BONUS);
      await prisma.user.update({
        where: { id: userId },
        data: { moralScore: moralResult.updated },
      });
    }
  }

  // 両者へお礼履歴を送信
  io.to(debateRoom(debateId)).emit('thanks:receive', {
    thanksHistory: debate.thanksHistory,
  });
};
