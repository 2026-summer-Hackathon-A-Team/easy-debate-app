import type { SyncResult } from './types/phase.js';

/**
 * ディベートインスタンスのフェーズ
 *
 * 'MATCHING'はインスタンスがない為除外
 */
export type DebatePhase = Exclude<SyncResult['phase'], 'MATCHING'>;

/** ディベート参加ユーザごとの状態 */
type DebateUser = {
  userId: number;
  /** TOPIC_CHANGE / DEBATE_READY で自分が回答済みか */
  isAnswered: boolean;
  /** ポジション */
  position?: string;
  /** 先攻・後攻 */
  turn?: 'FIRST' | 'SECOND';
  /** 再対戦の希望を回答済みか */
  isRematchAnswered?: boolean;
  /** お礼を送信済みか */
  isThanksDone?: boolean;
  /** お題チェンジ希望の有無 */
  isHopeChangeTopic?: boolean;
};

/**ユーザーごとの勝敗判定結果 */
type JudgeUser = {
  userId: number;
  /** 勝敗フラグ */
  isWinner: boolean;
  /** 更新後レート */
  updatedRate: number;
  /** レート変動 */
  rateUpDown: number;
};

/**
 * サーバーが保持するディベートクラス
 *
 * 一部フィールドはインスタンス生成時、undefinedとし、エンドポイント内の処理にて代入します。
 */
export class Debate {
  readonly debateId: string;
  readonly users: [DebateUser, DebateUser];

  /** 現在のフェーズ */
  phase: DebatePhase;
  /** お題（TOPIC_CHANGE では仮のお題） */
  topic: string;
  /** お題がチェンジされたか */
  isChangeTopic: boolean;
  /** 回答期限 */
  answerDeadline: Date;
  /** チャット送信期限 */
  chatSubmitDeadline?: Date;
  /** 現在ターンのユーザーID */
  isCurrentTurnUserId?: number;
  /** 現在のターン数（初期値:0） */
  currentTurn: number;
  /** 合計ターン数 */
  readonly totalTurn: number;
  /** チャット送信履歴 */
  chatHistory: { userId: number; chatMsg: string }[];
  /** お礼履歴 */
  thanksHistory: { userId: number; thanksMsg: string }[];
  /** 勝敗表示開始時刻 */
  judgeDisplayStartAt?: Date;

  /** 勝敗判定結果 */
  judge?: {
    /** 勝敗確認期限 */
    judgeConfirmDeadline: Date;
    /** 勝敗理由 */
    judgeReason: string;

    /** ユーザーごとの判定結果 */
    users: [JudgeUser, JudgeUser];
    /** 固定お礼の選択肢 */
    thanks?: { fixedThanksId: number; fixedThanksMsg: string }[];
  };

  /** 違反・不戦敗の状態 */
  violation: {
    /** 対戦中のモラル違反の有無 */
    isMoralViolationOfBattle: boolean;
    /** 2連続でチャット送信がなかったか（不戦敗） */
    is2NoChat: boolean;
    /** 接続が切断されたまま戻らなかったか（不戦敗） */
    isLeave: boolean;
    /** お礼でのモラル違反の有無 */
    isMoralViolationOfThanks: boolean;
    /** 違反者のユーザーID（違反は片方のみ発生する） */
    violationUserId?: number;
  };

  /** 再対戦が可能か（同じ相手との対戦は合計3回まで） */
  isRematch: boolean;
  /** 再対戦の成立可否（両者の回答が揃うまでは undefined） */
  isRematchResult?: boolean;

  // インスタンス生成時、初期値を代入
  constructor(
    debateId: string,
    userIds: [number, number],
    topic: string,
    answerDeadline: Date,
    totalTurn: number,
    isRematch: boolean,
  ) {
    this.debateId = debateId;
    this.users = [
      {
        userId: userIds[0],
        isAnswered: false,
        isRematchAnswered: false,
        isThanksDone: false,
      },
      {
        userId: userIds[1],
        isAnswered: false,
        isRematchAnswered: false,
        isThanksDone: false,
      },
    ];
    this.phase = 'TOPIC_CHANGE';
    this.topic = topic;
    this.isChangeTopic = false;
    this.answerDeadline = answerDeadline;
    this.currentTurn = 0;
    this.totalTurn = totalTurn;
    this.chatHistory = [];
    this.thanksHistory = [];
    this.isRematch = isRematch;
    this.violation = {
      isMoralViolationOfBattle: false,
      is2NoChat: false,
      isLeave: false,
      isMoralViolationOfThanks: false,
    };
  }
}

/**
 * JUDGE_WAITING / JUDGE判定処理
 *
 * フロントの画面の状態をjudgeDisplayStartAtの経過時間で判定する
 */
export const resolveJudgePhase = (
  debate: Debate,
  now: number,
): 'JUDGE_WAITING' | 'JUDGE' => {
  // judgeがまだ無い（AI判定中）
  if (debate.judge === undefined) return 'JUDGE_WAITING';
  // judgeDisplayStartAtが無い
  if (debate.judgeDisplayStartAt === undefined) return 'JUDGE';
  // 現在時刻 < judgeDisplayStartAt
  if (now < debate.judgeDisplayStartAt.getTime()) return 'JUDGE_WAITING';
  // 現在時刻 >= judgeDisplayStartAt
  return 'JUDGE';
};
