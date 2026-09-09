import type { Debate } from '../Debate.js';
import type { AppServer } from '../index.js';
import { userRoom } from '../rooms.js';
import { debates, userDebateIds } from '../stores/user-debate.js';
import { processJudge } from './debatejudge.js';
import { waitingUsers } from './matching.js';
import { resolveRematch } from './rematch.js';

/**
 * 離脱判定タイマー管理ストア
 *
 * - key: userId
 * - value: タイムアウト用タイマー
 *  */
const disconnectTimers = new Map<number, NodeJS.Timeout>();

/** 離脱判定カウントダウン */
const LEAVE_JUDGE_MS = 20_000;

/**
 * マッチング状態の削除
 *
 * マッチング待機オブジェクトからユーザーを削除する
 */
const releaseMatching = (userId: number): void => {
  waitingUsers.delete(userId);
};

/**
 *  JUDGEフェーズ中の切断を処理する
 *
 * 切断したユーザーを「再対戦を希望しない」とし再戦フローと同じ集計処理へ渡す。
 */
const judgePhaseDisconnect = async (
  io: AppServer,
  userId: number,
  debateId: string,
): Promise<void> => {
  const debate = debates.get(debateId);
  if (debate === undefined) return;

  const user = debate.users.find((u) => u.userId === userId);
  if (user === undefined) return;

  user.isRematchAnswered = true;
  user.isHopeRematch = false;

  await resolveRematch(io, debate);
};

/**
 * 離脱処理
 *
 * 同一ユーザーの他のソケットが残っていた場合、何もしない
 *
 * ユーザーの今の状態を判定し、各離脱処理を実行させる
 */
export const disconnectHandler = async (
  io: AppServer,
  userId: number,
): Promise<void> => {
  // 他タブ・他端末が接続中なら何もしない
  const sockets = await io.in(userRoom(userId)).fetchSockets();
  if (sockets.length > 0) return;

  releaseMatching(userId);

  const debateId = userDebateIds.get(userId);
  if (debateId === undefined) return;

  const debate = debates.get(debateId);
  if (debate === undefined) {
    // ストア不整合 userDebateIdsだけ残っていれば解放しておく
    userDebateIds.delete(userId);
    return;
  }
  if (debate.phase === 'JUDGE') {
    await judgePhaseDisconnect(io, userId, debateId);
    return;
  }

  const user = debate.users.find((u) => u.userId === userId);
  if (user?.isLeaveWatching === true) {
    startDisconnectTimer(
      userId,
      () => {
        disconnectTimeout(io, userId, debateId).catch((e: unknown) => {
          console.error('disconnectTimeoutの処理に失敗しました。', e);
        });
      },
      LEAVE_JUDGE_MS,
    );
  }
};

/** 離脱判定タイマー開始 */
export const startDisconnectTimer = (
  userId: number,
  callback: () => void,
  ms: number,
): void => {
  stopDisconnectTimer(userId);
  const timer = setTimeout(() => {
    disconnectTimers.delete(userId);
    callback();
  }, ms);
  disconnectTimers.set(userId, timer);
};

/** 離脱判定タイマー停止 */
export const stopDisconnectTimer = (userId: number): void => {
  const timer = disconnectTimers.get(userId);
  if (timer === undefined) return;
  clearTimeout(timer);
  disconnectTimers.delete(userId);
};

/**
 * TOPIC_CHANGE / DEBATE_READY での離脱確定処理
 *
 * インスタンス・ストアを破棄し、残存ユーザーへ通知する
 */
const handleTopicOrReadyLeave = (
  io: AppServer,
  debate: Debate,
  leftUserId: number,
): void => {
  const remainingUser = debate.users.find((u) => u.userId !== leftUserId);

  debates.delete(debate.debateId);
  for (const u of debate.users) {
    userDebateIds.delete(u.userId);
  }
  if (remainingUser !== undefined) {
    io.in(userRoom(remainingUser.userId)).emit('topic:opponentLeave');
  }
};

/**
 * DEBATEでの離脱確定処理
 *
 * 敗北扱いとしてprocessJugeを呼び出す
 */
const handleDebateLeave = async (
  io: AppServer,
  debate: Debate,
  leftUserId: number,
): Promise<void> => {
  debate.violation.isLeave = true;
  debate.violation.violationUserId = leftUserId;
  await processJudge(io, debate);
};

/**
 * 離脱判定用タイムアウト処理
 *
 * 20秒以内に再接続がなかった場合に実行
 */
const disconnectTimeout = async (
  io: AppServer,
  userId: number,
  debateId: string,
): Promise<void> => {
  const debate = debates.get(debateId);
  if (debate === undefined) return;

  const user = debate.users.find((u) => u.userId === userId);
  if (user === undefined || user.isLeaveWatching !== true) return;

  if (debate.phase === 'TOPIC_CHANGE' || debate.phase === 'DEBATE_READY') {
    handleTopicOrReadyLeave(io, debate, userId);
    return;
  }
  if (debate.phase === 'DEBATE') {
    await handleDebateLeave(io, debate, userId);
  }
};
