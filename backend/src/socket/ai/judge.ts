import { z } from 'zod';
import { requestText } from './ai-client.js';
import { JUDGE_PROMPT } from './prompt/judgeprompt.js';

const MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 3000;

const judgeSchema = z
  .object({
    scores: z.object({
      a: z.number().int().min(0).max(10),
      b: z.number().int().min(0).max(10),
    }),
    winner: z.enum(['A', 'B']),
    win_loss_factors: z.string().min(1),
    foul: z.object({
      detected: z.boolean(),
      loser: z.enum(['A', 'B']).nullable(),
      utterances: z.array(z.string()),
      reason: z.string().nullable(),
    }),
  })
  .refine(
    // 反則ありの場合loserとutterancesが必須
    (d) =>
      !d.foul.detected ||
      (d.foul.loser !== null && d.foul.utterances.length > 0),
  );

export type JudgeResult = z.infer<typeof judgeSchema>;

/**
 * chatHistoryをAIのプロンプト用に組み立てる
 */
const buildTranscript = (
  chatHistory: { userId: number; chatMsg: string }[],
  firstUserId: number,
): string => {
  let aTurn = 0;
  let bTurn = 0;
  return chatHistory
    .map((c) => {
      if (c.userId === firstUserId) {
        aTurn += 1;
        return `[A-${aTurn}] ${c.chatMsg}`;
      }
      bTurn += 1;
      return `[B-${bTurn}] ${c.chatMsg}`;
    })
    .join('\n');
};

const buildUserMessage = (
  topic: string,
  positionA: string,
  positionB: string,
  transcript: string,
): string =>
  `<topic>${topic}</topic>

<position_a>A(先攻)の立場: ${positionA}</position_a>
<position_b>B(後攻)の立場: ${positionB}</position_b>

<transcript>
${transcript}
</transcript>

このディベートを判定し、指定の JSON を出力してください。`;

const parseJudgeResponse = (text: string): JudgeResult =>
  judgeSchema.parse(JSON.parse(text.replace(/```json|```/g, '').trim()));

/**
 * 勝敗判定
 *
 * AIに発言録を渡し、勝敗、スコア、反則の有無を判定させる
 * @param firstUserId 先行ユーザーID
 */
export const requestJudge = async (
  topic: string,
  positionA: string,
  positionB: string,
  chatHistory: { userId: number; chatMsg: string }[],
  firstUserId: number,
): Promise<JudgeResult> => {
  const transcript = buildTranscript(chatHistory, firstUserId);
  const userMessage = buildUserMessage(topic, positionA, positionB, transcript);

  const call = (message: string): Promise<string> =>
    requestText({
      model: MODEL,
      system: JUDGE_PROMPT,
      userMessage: message,
      maxTokens: MAX_TOKENS,
    });

  try {
    return parseJudgeResponse(await call(userMessage));
  } catch (e) {
    console.error('勝敗判定処理に失敗しました。再実行します。', e);
    return parseJudgeResponse(
      await call(`${userMessage}\n\nJSON のみを出力してください。`),
    );
  }
};
