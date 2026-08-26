// thanks:send イベントのペイロード（お礼送信時にクライアントから送る）。
// 固定メッセージは改ざん防止のためID(fixedThanksId)を送り、自由入力のみ本文(freeThanksMsg)を送る
type ThanksSend = { fixedThanksId: number } | { freeThanksMsg: string };

export type { ThanksSend };
