import type { ScenarioHandler } from '../types';
import { debateChatSend } from './endpoint/debate:chatSend';
import { debateIsConfirm } from './endpoint/debate:isConfirm';
import { matchIsConfirm } from './endpoint/match:isConfirm';
import { matchStandby } from './endpoint/match:standby';
import { rematchAnyRequest } from './endpoint/rematch:anyRequest';
import { syncRequest } from './endpoint/sync:request';
import { thanksSend } from './endpoint/thanks:send';
import { topicAnyChangeRequest } from './endpoint/topic:anyChangeRequest';

/**
 * クライアントから届くイベントと、その応答の対応表
 *
 * レスポンス内容を変える場合は endpoint/ の各ファイルを書き換える
 *
 * ファイル名はイベント名そのもの
 * match:standby  -> endpoint/match:standby.tsx
 *
 * イベントのエンドポイントを増やす場合は、
 * 上記のルールで endpoint/ にファイルを1つ作り、下記に1行追加
 */
const socketScenario: Record<string, ScenarioHandler> = {
  'sync:request': syncRequest,
  'match:standby': matchStandby,
  'match:isConfirm': matchIsConfirm,
  'topic:anyChangeRequest': topicAnyChangeRequest,
  'debate:isConfirm': debateIsConfirm,
  'debate:chatSend': debateChatSend,
  'thanks:send': thanksSend,
  'rematch:anyRequest': rematchAnyRequest,
};

export { socketScenario };
