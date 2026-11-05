/**
 * 课程目录。新增课程：在对应学科文件中写好 Lesson 数据，然后加入 LESSONS。
 */
import type { Lesson, Subject } from '@/lesson/types';
import { chineseRiYueLesson } from './chinese';
import { englishFruitsLesson } from './english';
import { STARTER_LESSONS } from './englishStarter';
import { mathAddLesson } from './math';

export const LESSONS: Lesson[] = [mathAddLesson, chineseRiYueLesson, englishFruitsLesson, ...STARTER_LESSONS];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonsFor(subject: Subject): Lesson[] {
  return LESSONS.filter((l) => l.subject === subject).sort((a, b) => a.order - b.order);
}

/** 知识点名称（家长中心显示用） */
export const SKILL_LABELS: Record<string, string> = {
  'math.count': '数数与数量对应',
  'math.compare': '比多少',
  'math.add': '5 以内加法',
  'math.order': '数的顺序',
  'math.compose': '数的组成（开放题）',
  'zh.char-picture': '图字对应',
  'zh.listen-char': '听音识字',
  'zh.char-read': '看图认字',
  'zh.words': '组词',
  'zh.sentence': '句子理解',
  'en.vocab-listen': '听音辨词',
  'en.vocab-picture': '看图认词',
  'en.phonics': '首字母启蒙',
  'en.dialogue': '对话听力',
  'en.talk-words': '交流：认词',
  'en.talk-qa': '交流：问答',
  'en.phonics-sound': '拼读：找首音',
  'en.phonics-read': '拼读：读单词',
  'en.phonics-build': '拼读：拼单词',
  'en.reading': '分级阅读：读懂小书',
  'zh.write': '描红写字（笔顺）',
};

const ORAL_LABELS: Record<string, string> = {
  add10: '口算：10以内加法',
  sub10: '口算：10以内减法',
  add20: '口算：20以内进位加法',
  sub20: '口算：20以内退位减法',
  add100: '口算：100以内加法',
  sub100: '口算：100以内减法',
  mul99: '口算：乘法口诀',
  div99: '口算：表内除法',
};

export function skillLabel(skill: string): string {
  if (skill.startsWith('bank:')) return skill.split(':').slice(2).join(':'); // 题库知识点名称
  if (skill.startsWith('oral.')) return ORAL_LABELS[skill.slice(5)] ?? skill;
  return SKILL_LABELS[skill] ?? skill;
}

/** 找到某道题的题目文字（家长中心错题列表用） */
export function exerciseLabel(lessonId: string, exerciseId: string): string {
  const lesson = getLesson(lessonId);
  if (!lesson) return exerciseId;
  for (const step of lesson.steps) {
    if (step.kind === 'exercise' && step.exercise.id === exerciseId) {
      const e = step.exercise;
      const t = e.prompt.text;
      const base = typeof t === 'string' ? t : t.map((s) => s.char).join('');
      if (e.kind === 'choice' && e.listen) return `${base}（听音：${e.listen.text}）`;
      if (e.kind === 'truefalse') {
        const st = e.statement.text;
        return `${base}「${typeof st === 'string' ? st : st.map((s) => s.char).join('')}」`;
      }
      return base;
    }
    if (step.id === exerciseId && 'title' in step) {
      const t = step.title.text;
      return typeof t === 'string' ? t : t.map((s) => s.char).join('');
    }
  }
  return exerciseId;
}
