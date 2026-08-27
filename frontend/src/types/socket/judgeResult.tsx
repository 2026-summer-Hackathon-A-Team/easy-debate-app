import type { FixedThanks, JudgeUserResult } from '../sync/common';

// judge:result の違反・不戦敗の状態
// common.tsxのViolationと異なり、isMoralViolationOfThanksは含まない(お礼送信後の別イベントで扱う)
type JudgeResultViolation = {
  isMoralViolationOfBattle: boolean;
  is2NoChat: boolean;
  isLeave: boolean;
  violationUserId?: number;
};

// judge:result イベントのペイロード（勝敗判定結果をサーバーから受け取る）
type JudgeResult = {
  judgeConfirmDeadline: string;
  judgeReason: string;
  users: [JudgeUserResult, JudgeUserResult];
  violation: JudgeResultViolation;
  // 対戦中の違反・不戦敗の場合は含まれない(お礼・再対戦の受付なし)
  isRematch?: boolean;
  thanks?: FixedThanks[];
};

export type { JudgeResult };
