import type { Debate } from '../debate.js';

/**
 * ユーザーIDが今参加しているディベートIDの対応表
 */
export const userDebateIds = new Map<number, string>();

/**
 * ディベートIDとサーバーに保持しているディベートインスタンスの対応表
 */
export const debates = new Map<string, Debate>();
