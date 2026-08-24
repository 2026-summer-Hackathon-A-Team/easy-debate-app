import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (apiKey === undefined) {
  throw new Error('APIキーが未設定');
}

const client = new Anthropic({ apiKey });

/** パラメータの型 */
export type RequestTextParams = {
  model: string;
  system: string;
  userMessage: string;
  temperature: number;
  maxTokens: number;
};

/**
 * AIにプロンプトを渡す
 *
 * @returns 応答テキスト
 */
export const requestText = async (
  params: RequestTextParams,
): Promise<string> => {
  const response = await client.messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  });

  // テキスト以外のブロックが含まれる場合がある為、テキストのみをとりだす
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  if (text === '') {
    throw new Error(
      `AIのレスポンスにテキストがありません: model=${params.model}`,
    );
  }
  return text;
};
