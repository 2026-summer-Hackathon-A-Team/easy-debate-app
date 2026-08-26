import type { AppServer } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { userDebateIds } from '../stores/user-debate.js';
import type { AppSocket } from '../types/events.js';
import { getDebateAndJoinedUser } from './syncrequest.js';
import { debateRoom } from '../rooms.js';
import { z } from 'zod';
import { translateToJapanese } from '../ai/translate.js';

// debate:chatSendのペイロードスキーマ
const chatSendSchema = z.object({
  chatMsg: z.string().min(1).max(500),
});

/** ひらがな・カタカナ */
const KANA_PATTERN = /[\u3040-\u309F\u30A0-\u30FF]/;
/** ひらがな・カタカナ・漢字（グローバル） */
const JAPANESE_PATTERN = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g;
/** 日本語とみなす最低割合 */
const JAPANESE_RATIO_THRESHOLD = 0.5;

/** チャット送信期限（ミリ秒） */
export const CHAT_SUBMIT_DEADLINE_MS = 120_000;

/**
 * チャット内容が日本語かどうかを判定する
 *
 * かなを1文字以上含み、かつ日本語文字（かな・漢字）が
 * 全体の50%以上を占める場合は日本語とする
 *
 * かなの有無で中国語を、割合で英語主体の文を除外
 */
const isJapanese = (text: string): boolean => {
  // かなが1文字もなければ日本語ではない
  if (!KANA_PATTERN.test(text)) return false;

  // 空白を除いた文字数を分母にする
  const trimmed = text.replace(/\s/g, '');
  if (trimmed.length === 0) return false;

  const japaneseCount = trimmed.match(JAPANESE_PATTERN)?.length ?? 0;
  return japaneseCount / trimmed.length >= JAPANESE_RATIO_THRESHOLD;
};

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
      `DEBATE_READY: required values are missing: debateId=${debateId}`,
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

/**
 * チャット送信処理
 *
 * 現在のターンのユーザーからの送信のみ受け付け、
 *
 * チャット履歴へ追加してターンを進める
 */
export const debateChatSendHandler = async (
  io: AppServer,
  socket: AppSocket,
  data: unknown,
): Promise<void> => {
  const { userId } = socket.data;
  // ディベートIDを取得
  const debateId = userDebateIds.get(userId);
  if (debateId === undefined) return;

  // ディベートIDとユーザーIDからインスタンスを取得
  const { debate } = getDebateAndJoinedUser(debateId, userId);

  // リクエストのバリデーションチェック NGなら何もしない
  const parsed = chatSendSchema.safeParse(data);
  if (!parsed.success) return;

  // 現在ターンユーザー以外からの送信は無視
  if (debate.isCurrentTurnUserId !== userId) return;

  let chatMsg = parsed.data.chatMsg;
  // 日本語以外の場合はAIで翻訳する（翻訳失敗時はログだけ残して翻訳なしで処理）
  if (!isJapanese(chatMsg)) {
    try {
      chatMsg = await translateToJapanese(chatMsg);
    } catch (e) {
      console.error(`翻訳に失敗しました。: debateId=${debateId}`, e);
    }
  }

  // チャット履歴へ追加
  debate.chatHistory.push({ userId, chatMsg });

  // ターンを進める
  debate.currentTurn += 1;
  debate.isCurrentTurnUserId = debate.users.find(
    (u) => u.userId !== userId,
  )?.userId;
  debate.chatSubmitDeadline = new Date(Date.now() + CHAT_SUBMIT_DEADLINE_MS);

  const [user0, user1] = debate.users;
  if (
    user0.position === undefined ||
    user1.position === undefined ||
    debate.isCurrentTurnUserId === undefined
  ) {
    throw new Error(
      `DEBATE: required values are missing: debateId=${debateId}`,
    );
  }

  io.to(debateRoom(debateId)).emit('debate:chatReceive', {
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
