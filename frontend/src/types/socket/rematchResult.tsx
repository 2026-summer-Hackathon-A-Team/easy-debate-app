// rematch:anyResult イベントのペイロード
type RematchResult =
  | { isRematchResult: true; topic: string; answerDeadline: string }
  | { isRematchResult: false };

export type { RematchResult };
