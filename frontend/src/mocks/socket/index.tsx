import type { ScenarioHandler } from '../types';
import { debateChatSend } from './endpoint/debate_chatSend';
import { debateIsConfirm } from './endpoint/debate_isConfirm';
import { matchIsConfirm } from './endpoint/match_isConfirm';
import { matchStandby } from './endpoint/match_standby';
import { rematchAnyRequest } from './endpoint/rematch_anyRequest';
import { syncRequest } from './endpoint/sync_request';
import { thanksSend } from './endpoint/thanks_send';
import { timeSync } from './endpoint/time_sync';
import { topicAnyChangeRequest } from './endpoint/topic_anyChangeRequest';

/**
 * クライアントから届くイベントと、その応答の対応表
 *
 * レスポンス内容を変える場合は endpoint/ の各ファイルを書き換え
 *
 * ファイル名はイベント名の : を _ に置き換えたもの
 * match:standby  -> endpoint/match_standby.tsx
 *
 * イベントのエンドポイントを追加する場合は、
 * 上記のルールで endpoint/ にファイルを1つ作成し、下記に1行追加
 */
const socketScenario: Record<string, ScenarioHandler> = {
  'time:sync': timeSync,
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
