// rematch:anyResult イベントのペイロード（再対戦の成立有無をサーバーから受け取る）
// 成立した場合のみ、再対戦の仮のお題と回答期限が付く
type RematchResult =
  | { isRematchResult: true; topic: string; answerDeadline: string }
  | { isRematchResult: false };

export type { RematchResult };
