import { z } from 'zod';
import { requestText } from './ai-client.js';
import { TOPIC_SELECTION_PROMPT } from './prompt/topicprompt.js';

const MODEL = 'claude-sonnet-4-6';
const TEMPERATURE = 1;
const MAX_TOKENS = 1000;
const DEFAULT_CATEGORY = 'おまかせ';

const topicSchema = z
  .object({
    topic: z.string().min(1),
    position_a: z.string().min(1),
    position_b: z.string().min(1),
    category: z.string().default(''),
  })
  .refine((d) => d.position_a !== d.position_b) // ポジションが同じにならないように確認
  .transform((d) => ({
    topic: d.topic,
    positionA: d.position_a,
    positionB: d.position_b,
    category: d.category,
  }));

export type TopicResult = z.infer<typeof topicSchema>;

/**
 * userメッセージを組み立てる
 *
 * @param category （未指定なら「おまかせ」）
 * @param excludeTopics 除外するお題（お題チェンジ時に現在のお題を渡す）
 */
const buildUserMessage = (category: string, excludeTopic?: string): string => {
  const exclude = excludeTopic ?? 'なし';

  return `<category>${category}</category>

<exclude_topics>
${exclude}
</exclude_topics>

「exclude_topics」は除外リストです。こちらに指定したお題と同じもの、あるいは本質的に同じものは完全に除外。
上記を踏まえ、新しいお題を1つ生成してください。`;
};

/** AIのトピックレスポンスをパースして検証する
 *
 * @throws JSONの形式不正、必須項目が欠けていた場合
 */
const parseTopicResponse = (text: string): TopicResult =>
  topicSchema.parse(JSON.parse(text.replace(/```json|```/g, '').trim()));

/**
 * お題選定処理
 *
 * @param category カテゴリ 指定がない場合「おまかせ」
 * @param excludeTopics 除外するお題
 *
 * 形式が不正だった場合、もう一度リクエストする
 */
export const requestTopic = async (
  category = DEFAULT_CATEGORY,
  excludeTopics?: string,
): Promise<TopicResult> => {
  const userMessage = buildUserMessage(category, excludeTopics);

  const call = (message: string): Promise<string> =>
    requestText({
      model: MODEL,
      system: TOPIC_SELECTION_PROMPT,
      userMessage: message,
      temperature: TEMPERATURE,
      maxTokens: MAX_TOKENS,
    });
  try {
    return parseTopicResponse(await call(userMessage));
  } catch {
    return parseTopicResponse(
      await call(`${userMessage}\n\nJSON のみを出力してください。`),
    );
  }
};
