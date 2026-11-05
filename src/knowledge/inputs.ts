/**
 * 把答案是数的选择题换成“自己填数”（V2.9），避免靠猜。
 * 只换答案是整数、小数、分数或“商……余数”的题；选项带图的不换。
 */
import { plainText } from '@/content/zh';
import type { Exercise, InputExercise } from '@/lesson/types';

export const NUM_ANSWER = /^(-?\d+(\.\d+)?|\d+\/\d+|\d+……\d+)$/;

export function asInput(e: Exercise, id: string = `${e.id}:in`): InputExercise | null {
  if (e.kind !== 'choice') return null;
  const ans = e.options.find((o) => o.id === e.answerId);
  if (!ans || ans.text === undefined || ans.visual || e.listen) return null;
  const text = plainText(ans.text).trim();
  if (!NUM_ANSWER.test(text)) return null;
  return {
    kind: 'input',
    id,
    skill: e.skill,
    prompt: e.prompt,
    stem: e.stem,
    answer: text,
    wrongHint: e.wrongHint,
    explanation: e.explanation,
  };
}
