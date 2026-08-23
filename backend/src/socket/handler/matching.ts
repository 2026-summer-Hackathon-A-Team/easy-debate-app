import type { AppServer } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { debateRoom, userRoom } from '../rooms.js';
import type { AppSocket } from '../types/events.js';
import { randomUUID } from 'node:crypto';

/**
 * マッチング待機中ユーザー情報
 */
export type WaitingUser = {
  userId: number;
  rate: number;
  moralScore: number;
};

/**
 * マッチング確認待ちオブジェクト
 *
 * phase:"TOPIC_CHANGE"になるまで
 */
type MatchingRoom = {
  userIds: [number, number];
  /** `match:isConfirm`を送ったユーザーID */
  confirmedUserIds: Set<number>;
};

/**
 * マッチング確認待ちオブジェクト
 *
 * phase:"TOPIC_CHANGE"になるまでこちらで管理
 */
export const matchingRooms = new Map<string, MatchingRoom>();

/**
 * マッチング待機オブジェクト
 *
 * key: userId
 *
 * value: 待機中のユーザーID・レート・モラルスコアを保持
 */
export const waitingUsers = new Map<number, WaitingUser>();

/**
 * マッチング確認のタイムアウトタイマー管理用ストア
 *
 * debateIdの数だけタイマーがある
 */
const matchConfirmTimers = new Map<string, NodeJS.Timeout>();

/**
 * モラルスコアの許容差
 *
 * ディベート相手検索時のモラルスコア差を定義
 */
const MORAL_SCORE_TOLERANCES = [100, 200, 300, Infinity] as const;

/**
 * match:isConfirm 受付時間（ミリ秒）
 *
 * @defaultValue 20_000
 */
const MATCH_CONFIRM_TIMEOUT_MS = 20_000;

/**
 * ユーザーがすでにマッチング処理中か判定
 *
 * 待機中またはマッチング確認待ちのどちらかであればtrue
 * @param userId
 * @returns true | false
 */
const isUserMatchInProgress = (userId: number): boolean => {
  // マッチング待機中
  if (waitingUsers.has(userId)) return true;
  // マッチング確認待ち
  for (const room of matchingRooms.values()) {
    if (room.userIds.includes(userId)) return true;
  }
  // どこにもいなければfalse
  return false;
};

/**
 * マッチング相手検索
 *
 * モラルスコアの範囲を段階的に広げながら、各段階でレートが近いユーザーを選ぶ
 *
 * @returns マッチング相手・見つからない場合はundefined
 */
const findMatchedUser = (me: WaitingUser): WaitingUser | undefined => {
  for (const tolerance of MORAL_SCORE_TOLERANCES) {
    // 現時点でレートが近い候補を代入する変数
    let match: WaitingUser | undefined;
    // 最初の候補が必ず代入されるようにInfinityを設定
    let bestRateDiff = Infinity;

    for (const candidate of waitingUsers.values()) {
      // 自分は候補から外す
      if (candidate.userId === me.userId) continue;
      // モラルスコアの差で絞り込み
      if (Math.abs(candidate.moralScore - me.moralScore) > tolerance) continue;

      const rateDiff = Math.abs(candidate.rate - me.rate);
      if (rateDiff < bestRateDiff) {
        match = candidate;
        bestRateDiff = rateDiff;
      }
    }
    // 見つかればその段階で確定
    if (match !== undefined) return match;
  }

  return undefined;
};

/**
 * マッチング確認のタイムアウトタイマー開始
 *
 * すでに開始済みの場合、何もしない
 */
const startMatchConfirmTimer = (
  debateId: string,
  callback: () => void,
  ms: number,
): void => {
  // すでにdebateIdにタイマーが登録されていれば何もしない
  if (matchConfirmTimers.has(debateId)) return;
  const timer = setTimeout(() => {
    matchConfirmTimers.delete(debateId);
    callback();
  }, ms);
  matchConfirmTimers.set(debateId, timer);
};

/**
 * マッチング待機処理
 *
 * ユーザーをマッチング待機オブジェクトに登録し、条件に一致する相手を検索する。
 *
 * 2名を同じルームへ参加させ'match:isFound'を通知
 */
export const matchStandbyHandler = async (
  io: AppServer,
  socket: AppSocket,
): Promise<void> => {
  const { userId } = socket.data;

  // 二重登録防止
  if (isUserMatchInProgress(userId)) return;
  }

  // マッチングに必要なユーザー情報をDBから取得
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      rate: true,
      moralScore: true,
    },
  });
  if (user === null) {
    return;
  }

  // 二重登録再確認（DB問い合わせ中の連続送信時対応）
  if (isUserMatchInProgress(userId)) return;

  /** 待機中ユーザー情報 */
  const waitingUser: WaitingUser = {
    userId,
    rate: user.rate,
    moralScore: user.moralScore,
  };
  // マッチング待機オブジェクトへユーザーとスコアを追加
  waitingUsers.set(userId, waitingUser);

  /** マッチした相手ユーザー */
  const matchedUser = findMatchedUser(waitingUser);

  // マッチしなければ、そのまま待機
  if (matchedUser === undefined) {
    return;
  }

  // マッチング成功したユーザー2名をマッチング待機オブジェクトから削除
  waitingUsers.delete(userId);
  waitingUsers.delete(matchedUser.userId);

  // debateIdを生成
  const debateId = randomUUID();

  // マッチング確認待ちに登録
  matchingRooms.set(debateId, {
    userIds: [userId, matchedUser.userId],
    confirmedUserIds: new Set(),
  });

  // マッチした2名を同じRoomへ
  await socket.join(debateRoom(debateId));
  io.in(userRoom(matchedUser.userId)).socketsJoin(debateRoom(debateId));
  io.to(debateRoom(debateId)).emit('match:isFound');

  // タイムアウト用タイマー開始
  startMatchConfirmTimer(
    debateId,
    () => void confirmTimeout(io, debateId),
    MATCH_CONFIRM_TIMEOUT_MS,
  );
};
