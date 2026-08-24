import type { AppServer } from '../index.js';
import { prisma } from '../../lib/prisma.js';
import { debateRoom, userRoom } from '../rooms.js';
import type { AppSocket } from '../types/events.js';
import { randomUUID } from 'node:crypto';
import { Debate } from '../Debate.js';
import { debates, userDebateIds } from '../stores/user-debate.js';
import { requestTopic } from '../ai/topic.js';

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
 * マッチング確認待ちルームストア
 *
 * - key: debateID
 * - value: {@link MatchingRoom} マッチング確認待ちオブジェクト
 *
 * phase:"TOPIC_CHANGE"になるまでこちらで管理
 */
export const matchingRooms = new Map<string, MatchingRoom>();

/**
 * マッチング待機ユーザーストア
 *
 * - key: userId
 * - value: {@link WaitingUser} マッチング待機中ユーザー情報
 */
export const waitingUsers = new Map<number, WaitingUser>();

/**
 * マッチング確認のタイムアウトタイマー管理用ストア
 *
 * - key: debateId
 * - value: タイムアウト用タイマー
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
/** answerDeadlineの回答期限（ミリ秒） */
const ANSWER_DEADLINE_MS = 120_000;

/** ディベートの合計ターン数 */
const TOTAL_TURN = 10;

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
 * マッチング確認のタイムアウトタイマー停止
 */
const stopMatchConfirmTimer = (debateId: string): void => {
  const timer = matchConfirmTimers.get(debateId);
  if (timer === undefined) return;

  clearTimeout(timer);
  matchConfirmTimers.delete(debateId);
};

/**
 * マッチング確認タイムアウト処理
 *
 * 時間内に'match:isConfirm'が届かなかった場合に実行
 *
 * 応答がないユーザーの接続を破棄し、
 * 応答したユーザーはマッチング待機へ戻す
 */
const confirmTimeout = async (
  io: AppServer,
  debateId: string,
): Promise<void> => {
  try {
    const room = matchingRooms.get(debateId);
    // 両者確認済み・room無しの場合何もしない
    if (room === undefined) return;

    matchingRooms.delete(debateId);

    /** 応答したユーザー */
    const confirmed = room.userIds.filter((id) =>
      room.confirmedUserIds.has(id),
    );
    /** 応答がなかったユーザー */
    const unconfirmed = room.userIds.filter(
      (id) => !room.confirmedUserIds.has(id),
    );

    // 応答がなかったユーザーの接続を破棄
    for (const uid of unconfirmed) {
      io.in(userRoom(uid)).disconnectSockets(true);
    }

    // debateRoomから全員退出
    io.in(debateRoom(debateId)).socketsLeave(debateRoom(debateId));

    // 応答があったユーザーはマッチング待機処理へ
    for (const uid of confirmed) {
      await matchStandbyHandler(io, uid);
    }
  } catch (e) {
    console.error(
      'マッチング確認のタイムアウト処理に失敗しました。',
      {
        debateId,
      },
      e,
    );
  }
};

/**
 * ポジションと先行後攻をランダムに割り当てる
 *
 * 0以上1未満のランダムな小数を0.5以上以下かで判定
 * */
export const shufflePositions = (
  debate: Debate,
  positionA: string,
  positionB: string,
): void => {
  // 0以上1未満のランダムな小数が0.5より大きいかで入れ替えを判定
  const isSwapped = Math.random() > 0.5;
  debate.users[0].position = isSwapped ? positionB : positionA;
  debate.users[0].turn = isSwapped ? 'SECOND' : 'FIRST';
  debate.users[1].position = isSwapped ? positionA : positionB;
  debate.users[1].turn = isSwapped ? 'FIRST' : 'SECOND';
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
  userId: number,
): Promise<void> => {
  // 二重登録防止
  if (isUserMatchInProgress(userId)) return;

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
  io.in(userRoom(userId)).socketsJoin(debateRoom(debateId));
  io.in(userRoom(matchedUser.userId)).socketsJoin(debateRoom(debateId));
  io.to(debateRoom(debateId)).emit('match:isFound');

  // タイムアウト用タイマー開始
  startMatchConfirmTimer(
    debateId,
    () => void confirmTimeout(io, debateId),
    MATCH_CONFIRM_TIMEOUT_MS,
  );
};

/**
 * マッチング完了お題生成処理
 * @param io
 * @param socket
 */
export const matchIsConfirmHandler = async (
  io: AppServer,
  socket: AppSocket,
): Promise<void> => {
  const { userId } = socket.data;

  // socketが参加中のルーム名からdebateIdを取り出す
  const debateId = ((): string | undefined => {
    for (const room of socket.rooms) {
      if (room.startsWith('debateRoom:')) {
        return room.slice('debateRoom:'.length);
      }
    }
    return undefined;
  })();

  // debateIdがない（参加していない）場合何もしない
  if (debateId === undefined) return;
  // socketがマッチング確認待ちにいるか確認
  const room = matchingRooms.get(debateId);
  // debateIdはあるがmatchingRoomがない場合何もしない
  if (room === undefined) return;

  // 'match:isConfirm'を送ったユーザーID（ユーザーが2回送っても1件のまま）
  room.confirmedUserIds.add(userId);

  // 2名揃うまで待つ
  if (room.confirmedUserIds.size < 2) return;

  // 2名揃ったらタイマー停止・マッチング確認待ちオブジェクトから削除
  stopMatchConfirmTimer(debateId);
  matchingRooms.delete(debateId);

  /**
   * お題・ポジション・先行後攻を取得
   *
   * APIからのレスポンスの形式チェックが2回失敗すると何も返さない為、固定のお題を返してあげる
   */
  const { topic, positionA, positionB } = await requestTopic().catch((e) => {
    console.error('topic generation failed', e);
    return {
      topic: 'PCのOSはWindowsかMacどちらが優れている?',
      positionA: 'Windowsが優れている',
      positionB: 'Macが優れている',
    };
  });

  /** 回答期限
   *
   * 現在時刻 + 制限時間（ミリ秒）
   */
  const answerDeadline = new Date(Date.now() + ANSWER_DEADLINE_MS);

  // ディベートインスタンス生成
  const debate = new Debate(
    debateId,
    room.userIds,
    topic,
    answerDeadline,
    TOTAL_TURN,
    true,
  );

  shufflePositions(debate, positionA, positionB);

  // インスタンス対応表に登録
  debates.set(debateId, debate);
  for (const uid of room.userIds) {
    userDebateIds.set(uid, debateId);
  }

  // 2名へマッチング完了を通知
  io.to(debateRoom(debateId)).emit('match:complete', {
    topic,
    answerDeadline: answerDeadline.toISOString(),
  });
};
