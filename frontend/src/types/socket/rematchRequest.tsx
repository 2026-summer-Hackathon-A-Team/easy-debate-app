// rematch:anyRequest イベントのペイロード（再対戦希望の有無をクライアントから送る）
type RematchRequest = {
  isHopeRematch: boolean;
};

export type { RematchRequest };
