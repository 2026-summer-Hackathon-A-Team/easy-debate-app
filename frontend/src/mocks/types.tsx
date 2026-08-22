// socket のペイロード型

type Phase =
  | 'MATCHING'
  | 'TOPIC_CHANGE'
  | 'DEBATE_READY'
  | 'DEBATE'
  | 'JUDGE_WAITING'
  | 'JUDGE';

// 参加ユーザー
type JoinUser = {
  userId: number;
  position: string;
  turn?: 'FIRST' | 'SECOND';
};

// ターン情報(DEBATE)
type TurnInfo = {
  isCurrentTurnUserId: number;
  currentTurn: number;
  totalTurn: number;
};

// チャット送信履歴の1件
type ChatHistoryItem = {
  userId: number;
  chatMsg: string;
};

// お礼履歴の1件
type ThanksHistoryItem = {
  userId: number;
  thanksMsg: string;
};

// 固定お礼の選択肢
type FixedThanks = {
  fixedThanksId: number;
  fixedThanksMsg: string;
};

// ユーザーごとの勝敗判定結果
type JudgeUserResult = {
  userId: number;
  isWinner: boolean;
  updatedRate: number;
  rateUpDown: number;
};

// 勝敗判定結果(JUDGE_WAITING / JUDGE)
type Judge = {
  judgeDisplayStartAt?: string;
  judgeConfirmDeadline: string;
  judgeReason: string;
  users: [JudgeUserResult, JudgeUserResult];
  thanks?: FixedThanks[];
};

// 違反・不戦敗の状態
type Violation = {
  isMoralViolationOfBattle: boolean;
  is2NoChat: boolean;
  isLeave: boolean;
  isMoralViolationOfThanks: boolean;
  violationUserId?: number;
};

type SyncResult =
  | { phase: 'MATCHING' }
  | {
      phase: 'TOPIC_CHANGE';
      topic: string;
      answerDeadline: string;
      isAnswered: boolean;
    }
  | {
      phase: 'DEBATE_READY';
      isChangeTopic: boolean;
      topic: string;
      users: [JoinUser, JoinUser];
      answerDeadline: string;
      isAnswered: boolean;
    }
  | {
      phase: 'DEBATE';
      topic: string;
      users: [JoinUser, JoinUser];
      turn: TurnInfo;
      chatSubmitDeadline: string;
      chatHistory: ChatHistoryItem[];
    }
  | {
      phase: 'JUDGE_WAITING';
      topic: string;
      users: [JoinUser, JoinUser];
      turn: TurnInfo;
      chatHistory: ChatHistoryItem[];
      judge?: Judge;
    }
  | {
      phase: 'JUDGE';
      judge: Judge;
      violation: Violation;
      thanksHistory?: ThanksHistoryItem[];
      isThanksDone?: boolean;
      isRematch?: boolean;
      isRematchAnswered?: boolean;
      isRematchResult?: boolean;
    };

type MatchComplete = {
  topic: string;
  answerDeadline: string;
};

type TopicChangeRequest = {
  isHopeChangeTopic: boolean;
};

type TopicChangeResultUser = {
  userId: number;
  position: string;
  turn: 'FIRST' | 'SECOND';
};

type DebateStartUser = {
  userId: number;
  position: string;
};

type TopicChangeResult = {
  isChangeTopic: boolean;
  topic: string;
  answerDeadline: string;
  users: [TopicChangeResultUser, TopicChangeResultUser];
};

type DebateStart = {
  topic: string;
  users: [DebateStartUser, DebateStartUser];
  turn: TurnInfo;
  chatSubmitDeadline: string;
  chatHistory: ChatHistoryItem[];
};

// debate:chatSend でクライアントが送ってくる内容
type DebateChatSend = {
  chatMsg: string;
};

// thanks:send でクライアントが送ってくる内容
type ThanksSend = {
  thanksMsg: string;
};

// thanks:receive でサーバーが返す内容。両者のお礼がまとまっている。
type ThanksReceive = {
  thanksHistory: ThanksHistoryItem[];
};

// rematch:anyRequest でクライアントが送ってくる内容
type RematchRequest = {
  isHopeRematch: boolean;
};

// rematch:anyResult でサーバーが返す内容。
// 成立した場合のみ、再対戦の仮のお題と回答期限が付く。
type RematchResult =
  | { isRematchResult: true; topic: string; answerDeadline: string }
  | { isRematchResult: false };

// debate:chatReceive でサーバーが返す内容。
// チャット表示・タイマーリセット・ターン数更新に必要な情報がまとまっている。
type DebateChatReceive = {
  topic: string;
  users: [DebateStartUser, DebateStartUser];
  turn: TurnInfo;
  chatSubmitDeadline: string;
  chatHistory: ChatHistoryItem[];
};

// ---------------------------------------------------------------------------
// REST モック(mocks/rest/*)
// ---------------------------------------------------------------------------

// エンドポイント1つ分のモック定義。mocks/rest/ の各ファイルがこの形を1つ export する。
//
// 処理は書かず、返したい内容をそのまま書くだけ。
type RestMock = {
  // 'GET' / 'POST' など
  method: string;
  // '/api/v1/users/me' のようなパス
  path: string;
  // 返す HTTP ステータス
  status: number;
  // 返す JSON。204 など本文を持たない応答では書かない
  body?: unknown;
  // このエンドポイントだけ遅らせたいときのミリ秒。
  // 未指定なら mocks/rest/settings.tsx の delayMs が使われる。
  delayMs?: number;
};

// ---------------------------------------------------------------------------
// socket モック(mocks/socket/*)
// ---------------------------------------------------------------------------

// socket のハンドラが受け取る「サーバー役」。
// server.emit(...) でサーバーからクライアントへイベントを送る。
type MockServer = {
  // 第3引数に遅延(ミリ秒)を指定すると、その時間だけ待ってから送る。
  // 例: server.emit('match:isFound', undefined, 800)
  emit: (event: string, payload?: unknown, delayMs?: number) => void;
};

// クライアントから届いたイベント1つ分の処理。
// mocks/socket/ の各ファイルがこの形を1つ export する。
//
// payload の型は各ファイルで指定できる。
// 例: const handler: ScenarioHandler = (server, payload: TopicChangeRequest) => {...}
type ScenarioHandler = (server: MockServer, payload: never) => void;

export type {
  Phase,
  JoinUser,
  TurnInfo,
  ChatHistoryItem,
  ThanksHistoryItem,
  FixedThanks,
  JudgeUserResult,
  Judge,
  Violation,
  SyncResult,
  MatchComplete,
  TopicChangeRequest,
  TopicChangeResult,
  TopicChangeResultUser,
  DebateStart,
  DebateChatSend,
  DebateChatReceive,
  ThanksSend,
  ThanksReceive,
  RematchRequest,
  RematchResult,
  RestMock,
  MockServer,
  ScenarioHandler,
};
