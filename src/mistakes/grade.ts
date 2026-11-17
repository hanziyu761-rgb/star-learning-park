/**
 * 错题属于几年级（V5.4，错题本按年级显示用）：
 * 按题目来源判断——知识点（kp:）看知识点年级；课程看课程年级；题库单元 id 里有 -g3a 这样的年级；
 * 口算看主题年级；今日一练 mix:学科:年级:日期。判断不出来（如游戏）时按知识点 skill 再试一次，仍不行返回 null（只在“全部”里显示）。
 */
import { getLesson } from '@/content';
import { ORAL_TOPICS } from '@/content/oral';
import { getKp } from '@/knowledge/graph';
import type { MistakeEntry } from '@/progress/model';

export function mistakeGrade(m: Pick<MistakeEntry, 'lessonId' | 'exerciseId' | 'skill'>): number | null {
  const kp = /^kp:([a-z]\d\.[\w]+):/.exec(m.exerciseId)?.[1];
  if (kp && getKp(kp)) return getKp(kp)!.grade;
  const mix = /^mix:\w+:(\d):/.exec(m.lessonId);
  if (mix) return Number(mix[1]);
  const dict = /^zdict:g(\d)$/.exec(m.lessonId);
  if (dict) return Number(dict[1]);
  const lesson = getLesson(m.lessonId);
  if (lesson) return lesson.grade ?? 1;
  const bank = /-g(\d)[ab]-/.exec(m.lessonId) ?? /-g(\d)[ab]-/.exec(m.exerciseId);
  if (bank) return Number(bank[1]);
  if (m.lessonId.startsWith('oral:')) {
    const t = ORAL_TOPICS.find((x) => `oral:${x.id}` === m.lessonId);
    if (t) return t.grade;
  }
  return getKp(m.skill)?.grade ?? null;
}

/** 只看某个年级时，这道错题算不算 */
export const inGrade = (m: Pick<MistakeEntry, 'lessonId' | 'exerciseId' | 'skill'>, grade: number | undefined) =>
  grade === undefined || mistakeGrade(m) === grade;
