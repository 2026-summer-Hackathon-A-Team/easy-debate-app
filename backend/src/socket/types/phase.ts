export type Matching = {
  phase: 'MATCHING';
};

export type TopicChange = {
  phase: 'TOPIC_CHANGE';
  topic: string;
  answerDeadline: string;
  isAnswered: boolean;
};

export type DebateReady = {
  phase: 'DEBATE_READY';
  isChangeTopic: boolean;
  topic: string;
  users: [
    {
      userId: number;
      position: string;
      turn: 'FIRST' | 'SECOND';
    },
    {
      userId: number;
      position: string;
      turn: 'FIRST' | 'SECOND';
    },
  ];
  answerDeadline: string;
  isAnswered: boolean;
};

export type Debate = {
  phase: 'DEBATE';
  topic: string;
  users: [
    {
      userId: number;
      position: string;
    },
    {
      userId: number;
      position: string;
    },
  ];
  turn: {
    isCurrentTurnUserId: number;
    currentTurn: number;
    totalTurn: number;
  };
  chatSubmitDeadline: string;
  chatHistory: {
    userId: number;
    chatMsg: string;
  }[];
};

export type JudgeWaiting = {
  phase: 'JUDGE_WAITING';
  topic: string;
  users: [
    {
      userId: number;
      position: string;
    },
    {
      userId: number;
      position: string;
    },
  ];
  turn: {
    isCurrentTurnUserId: number;
    currentTurn: number;
    totalTurn: number;
  };
  chatHistory: {
    userId: number;
    chatMsg: string;
  }[];
  judge?: {
    judgeDisplayStartAt?: string;
    judgeConfirmDeadline: string;
    judgeReason: string;
    users: [
      {
        userId: number;
        isWinner: boolean;
        updatedRate: number;
        rateUpDown: number;
      },
      {
        userId: number;
        isWinner: boolean;
        updatedRate: number;
        rateUpDown: number;
      },
    ];
    thanks?: {
      fixedThanksId: number;
      fixedThanksMsg: string;
    }[];
  };
};

export type Judge = {
  phase: 'JUDGE';
  judge: {
    judgeDisplayStartAt?: string;
    judgeConfirmDeadline: string;
    judgeReason: string;
    users: [
      {
        userId: number;
        isWinner: boolean;
        updatedRate: number;
        rateUpDown: number;
      },
      {
        userId: number;
        isWinner: boolean;
        updatedRate: number;
        rateUpDown: number;
      },
    ];
    thanks?: {
      fixedThanksId: number;
      fixedThanksMsg: string;
    }[];
  };
  thanksHistory?: {
    userId: number;
    thanksMsg: string;
  }[];
  violation: {
    isMoralViolationOfBattle: boolean;
    is2NoChat: boolean;
    isLeave: boolean;
    isMoralViolationOfThanks: boolean;
    violationUserId?: number;
  };
  isThanksDone?: boolean;
  isRematch?: boolean;
  isRematchAnswered?: boolean;
  isRematchResult?: boolean;
};

export type SyncResult =
  Matching | TopicChange | DebateReady | Debate | JudgeWaiting | Judge;

/** match:complete用レスポンスの型 */
export type MatchComplete = Pick<TopicChange, 'topic' | 'answerDeadline'>;

/** topic:anyChangeResult用レスポンスの型 */
export type TopicAnyChangeResult = Pick<
  DebateReady,
  'isChangeTopic' | 'topic' | 'answerDeadline' | 'users'
>;
