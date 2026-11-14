/**
 * 把答案是数的选择题换成“自己填数”（V2.9），避免靠猜。
 * 只换答案是整数、小数、分数或“商……余数”的题；选项带图的不换。
 */
import { plainText } from '@/content/zh';
import type { Exercise, InputExercise } from '@/lesson/types';

/** 七～九年级数学知识点、初中口算 */
const SIGNED_SKILL = /^(m[789]\.|oral\.(rat|roots))/;

export const NUM_ANSWER = /^(-?\d+(\.\d+)?|\d+\/\d+|\d+……\d+)$/;

export function asInput(e: Exercise, id: string = `${e.id}:in`): InputExercise | null {
  if (e.kind !== 'choice') return null;
  const ans = e.options.find((o) => o.id === e.answerId);
  if (!ans || ans.text === undefined || ans.visual || e.listen) return null;
  const shown = plainText(ans.text).trim();
  // 初中的题选项里负号显示成“−”，填数时按普通减号比较（小学的题保持原样）
  const text = SIGNED_SKILL.test(e.skill) ? shown.replace(/^−/, '-') : shown;
  if (!NUM_ANSWER.test(text)) return null;
  return {
    kind: 'input',
    id,
    skill: e.skill,
    prompt: e.prompt,
    stem: e.stem,
    answer: text,
    // 初中的题（V5.2）总是显示负号键，免得键盘提前“告诉”答案是负数
    ...(SIGNED_SKILL.test(e.skill) ? { signed: true } : {}),
    wrongHint: e.wrongHint,
    explanation: e.explanation,
  };
}
