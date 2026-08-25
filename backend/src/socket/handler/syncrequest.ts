import type { AppSocket } from '../types/events.js';
import { userDebateIds, debates } from '../stores/user-debate.js';
import { type Debate, resolveJudgePhase } from '../Debate.js';

/**
 * ディベートインスタンスと参加ユーザー取得処理
 *
 * ディベートIDから、そのディベートに参加しているユーザーとディベートインスタンスを取得する
 *
 * @param debateId ディベートID
 * @param userId ユーザーID
 *
 * @returns ディベートインスタンスと参加ユーザー情報
 */
export const getDebateAndJoinedUser = (debateId: string, userId: number) => {
  const debate = debates.get(debateId);
  if (debate === undefined) {
    throw new Error(`debate not found: debateId=${debateId}, userId=${userId}`);
  }
  const user = debate.users.find((u) => u.userId === userId);
  if (user === undefined) {
    throw new Error(
      `user not joined: userId=${userId}, debateId=${debate.debateId}`,
    );
  }
  return { debate, user };
};

/**
 * 判定結果を送信用に変換する
 *
 * 判定中の場合judgeをペイロードに含めない
 * */
const buildJudge = (debate: Debate) => {
  if (debate.judge === undefined) return undefined;
  return {
    judgeDisplayStartAt: debate.judgeDisplayStartAt?.toISOString(),
    judgeConfirmDeadline: debate.judge.judgeConfirmDeadline.toISOString(),
    judgeReason: debate.judge.judgeReason,
    users: debate.judge.users,
    thanks: debate.judge.thanks,
  };
};

/**
 * 現在の状態返却処理
 *
 * 現在のフェーズに応じてフロントに必要な値を返す。
 *
 * 返す値にundefinedがあれば不整合としエラーにする
 */
export const syncRequestHandler = (socket: AppSocket): void => {
  const { userId } = socket.data;

  const debateId = userDebateIds.get(userId);

  // ディベートに参加していない場合
  if (debateId === undefined) {
    socket.emit('sync:result', { phase: 'MATCHING' });
    return;
  }
  // ディベートと参加ユーザーを取得
  const { debate, user } = getDebateAndJoinedUser(debateId, userId);
  // user0/user1に分割代入
  const [user0, user1] = debate.users;

  // ディベートインスタンスが一致したものを実行
  switch (debate.phase) {
    case 'TOPIC_CHANGE': {
      socket.emit('sync:result', {
        phase: 'TOPIC_CHANGE',
        topic: debate.topic,
        answerDeadline: debate.answerDeadline.toISOString(),
        isAnswered: user.isAnswered,
      });
      return;
    }

    case 'DEBATE_READY': {
      // 必須項目チェック
      if (
        user0.position === undefined ||
        user0.turn === undefined ||
        user1.position === undefined ||
        user1.turn === undefined
      ) {
        throw new Error(
          `DEBATE_READY: required values are missing: debateId=${debate.debateId}`,
        );
      }
      socket.emit('sync:result', {
        phase: 'DEBATE_READY',
        isChangeTopic: debate.isChangeTopic,
        topic: debate.topic,
        users: [
          { userId: user0.userId, position: user0.position, turn: user0.turn },
          { userId: user1.userId, position: user1.position, turn: user1.turn },
        ],
        answerDeadline: debate.answerDeadline.toISOString(),
        isAnswered: user.isAnswered,
      });
      return;
    }

    case 'DEBATE': {
      // 必須項目チェック
      if (
        user0.position === undefined ||
        user1.position === undefined ||
        debate.isCurrentTurnUserId === undefined ||
        debate.chatSubmitDeadline === undefined
      ) {
        throw new Error(
          `DEBATE: required values are missing: debateId=${debate.debateId}`,
        );
      }
      socket.emit('sync:result', {
        phase: 'DEBATE',
        topic: debate.topic,
        users: [
          {
            userId: user0.userId,
            position: user0.position,
          },
          {
            userId: user1.userId,
            position: user1.position,
          },
        ],
        turn: {
          isCurrentTurnUserId: debate.isCurrentTurnUserId,
          currentTurn: debate.currentTurn,
          totalTurn: debate.totalTurn,
        },
        chatSubmitDeadline: debate.chatSubmitDeadline.toISOString(),
        chatHistory: debate.chatHistory,
      });
      return;
    }
    // 画面にJUDGE_WAITINGとJUDGEどちらを返すか判定
    case 'JUDGE_WAITING':
    case 'JUDGE': {
      const judgePhase = resolveJudgePhase(debate, Date.now());
      if (judgePhase === 'JUDGE_WAITING') {
        // 必須項目チェック
        if (
          user0.position === undefined ||
          user1.position === undefined ||
          debate.isCurrentTurnUserId === undefined
        ) {
          throw new Error(
            `JUDGE_WAITING: required values are missing: debateId=${debate.debateId}`,
          );
        }
        socket.emit('sync:result', {
          phase: 'JUDGE_WAITING',
          topic: debate.topic,
          users: [
            {
              userId: user0.userId,
              position: user0.position,
            },
            {
              userId: user1.userId,
              position: user1.position,
            },
          ],
          turn: {
            isCurrentTurnUserId: debate.isCurrentTurnUserId,
            currentTurn: debate.currentTurn,
            totalTurn: debate.totalTurn,
          },
          chatHistory: debate.chatHistory,
          judge: buildJudge(debate),
        });
        return;
      }
      const judge = buildJudge(debate);
      if (judge === undefined) {
        throw new Error(
          `JUDGE: judge result is missing: debateId=${debate.debateId}`,
        );
      }

      socket.emit('sync:result', {
        phase: 'JUDGE',
        judge: judge,
        thanksHistory: debate.thanksHistory,
        violation: {
          isMoralViolationOfBattle: debate.violation.isMoralViolationOfBattle,
          is2NoChat: debate.violation.is2NoChat,
          isLeave: debate.violation.isLeave,
          isMoralViolationOfThanks: debate.violation.isMoralViolationOfThanks,
          violationUserId: debate.violation.violationUserId,
        },
        isThanksDone: user.isThanksDone,
        isRematch: debate.isRematch,
        isRematchAnswered: user.isRematchAnswered,
        isRematchResult: debate.isRematchResult,
      });
      return;
    }
  }
};
