type TopicChangeResultUser = {
  userId: number;
  position: string;
  turn: 'FIRST' | 'SECOND';
};

type TopicChangeResult = {
  isChangeTopic: boolean;
  topic: string;
  answerDeadline: string;
  users: [TopicChangeResultUser, TopicChangeResultUser];
};

export type { TopicChangeResult, TopicChangeResultUser };
