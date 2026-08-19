import type { SyncResult } from './types/phase.js';

export type DebateUser = {
  userId: number;
  isAnswered: boolean;
};

/**
 * ディベートインスタンスのフェーズ
 * 
 * 'MATCHING'はインスタンスがない為除外
 */
export type DebatePhase = Exclude<SyncResult['phase'], 'MATCHING'>;

export type PhaseState =
  | { phase: 'TOPIC_CHANGE'; answerDeadline: Date }
  | { phase: 'DEBATE_READY'; answerDeadline: Date; isChangeTopic: boolean }
  | { phase: 'DEBATE'; chatSubmitDeadline: Date }
  | { phase: 'JUDGE_WAITING' }
  | { phase: 'JUDGE' };

/**
 * サーバーが保持するディベートインスタンス
 * 
 * フェーズ全てで保持する値はフィールドに持たせる
 */
export class DebateInstance {
  readonly id: number;
  readonly users: [DebateUser, DebateUser];

  topic: string;
  state: PhaseState;

  constructor(
    id: number,
    userIds: [number, number],
    topic: string,
    answerDeadline: Date,
  ) {
    this.id = id;
    this.topic = topic;
    this.state = { phase: 'TOPIC_CHANGE', answerDeadline };

    this.users = [
      { userId: userIds[0], isAnswered: false },
      { userId: userIds[1], isAnswered: false },
    ];
  }
  // 現在のフェーズ
  get phase(): DebatePhase {
    return this.state.phase;
  }
  // 回答状態リセット
  private resetAnswered(): void {
    for (const user of this.users) {
      user.isAnswered = false;
    }
  }
  /**
   * DEBATEへ変更
   * 
   * 上記のresetAnswered()を呼び回答状態をリセットする
   */
  toDebateReady(answerDeadline: Date, isChangeTopic: boolean): void {
    this.state = { phase: 'DEBATE_READY', answerDeadline, isChangeTopic };
    this.resetAnswered();
  }
  
}
