import { requestText } from './ai-client.js';
import { TRANSLATE_PROMPT } from './prompt/translateprompt.js';

const MODEL = 'claude-haiku-4-5-20251001';
const TEMPERATURE = 0.2;
const MAX_TOKENS = 500;

/**
 * チャット内容を日本語へ翻訳
 */
export const translateToJapanese = async (text: string): Promise<string> => {
  const result = await requestText({
    model: MODEL,
    system: TRANSLATE_PROMPT,
    userMessage: `次の発言を日本語に翻訳してください。<source>〜</source> の中だけが翻訳対象です。

<source>${text}</source>`,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
  });
  return result.trim();
};
