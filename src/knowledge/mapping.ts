/**
 * 课程映射：把每一条练习记录对应到知识点（一年级数学）。
 * 规则全部写在这里，结果可追溯：每条掌握度判断都能回到具体的练习记录。
 *
 * 来源：
 * 1. 精做课程《合起来是几》：逐题人工映射（下表）
 * 2. 口算闯关：按主题映射
 * 3. 知识点练习 / 前置诊断（kp:、diag:）：题目 id 自带知识点
 * 4. ChinaStudyFree 一年级数学题库：按原题“知识点”标签 + 题干关键词映射（较粗，见 RULES）
 */
import { findBankExercise } from '@/content/bank';
import { UNIT_TO_KP } from './graph';

/** 精做课程逐题映射：课程id/题目或环节id → 知识点 */
export const LESSON_MAP: Record<string, string> = {
  'math-add-within-5/count-strawberry': 'm1.count5',
  'math-add-within-5/compare-fish': 'm1.compare10',
  'math-add-within-5/match-number-quantity': 'm1.count5',
  'math-add-within-5/add-1-4': 'm1.add5',
  'math-add-within-5/tf-2-2': 'm1.add5',
  'math-add-within-5/sort-1-5': 'm1.count5',
  'math-add-within-5/s3-combine': 'm1.add5',
  'math-add-within-5/s10-open': 'm1.compose5',
};

/** 精做课程对应的知识点（课程完成后知识小地图点亮） */
export const LESSON_KPS: Record<string, string[]> = {
  'math-add-within-5': ['m1.count5', 'm1.compare10', 'm1.compose5', 'm1.add5'],
};

export const ORAL_MAP: Record<string, string> = {
  add10: 'm1.add10',
  sub10: 'm1.sub10',
  add20: 'm1.carry20',
  sub20: 'm1.borrow20',
  add100: 'm1.addsub100',
  sub100: 'm1.addsub100',
};

/** 题库知识点标签规则：[标签正则, 知识点 或 按题干判断的函数] */
type Rule = [RegExp, string | ((question: string) => string | null)];
const addOrSub = (add: string, sub: string) => (q: string) => (/[-−－]|减|还剩|少/.test(q) ? sub : add);

export const BANK_RULES: Rule[] = [
  [/1~5的基数与序数/, 'm1.count5'],
  [/1~10各数的数数与认读|6~10各数的认识/, 'm1.count10'],
  [/比多少|同样多|比较大小/, 'm1.compare10'],
  [/0的认识/, 'm1.zero'],
  [/5以内数的分与合/, 'm1.compose5'],
  [/加法的初步认识/, 'm1.add5'],
  [/减法的初步认识/, 'm1.sub5'],
  [/6~10的加减法运算/, addOrSub('m1.add10', 'm1.sub10')],
  [/解决问题（原来有多少）/, 'm1.wordprob10'],
  [/11~20|计数单位“十”/, 'm1.count20'],
  [/凑十法/, 'm1.make10'],
  [/加几/, 'm1.carry20'],
  [/十几减/, 'm1.borrow20'],
  [/立体图形|拼搭/, 'm1.shapes3d'],
  [/左、右|上、下、前、后|位置关系/, 'm1.position'],
  [/整时|钟面|作息时间/, 'm1.clock'],
  [/平面图形|七巧板/, 'm1.shapes2d'],
  [/分类|数据的简单分析/, 'm1.classify'],
  [/100以内数的/, 'm1.count100'],
  [/人民币|面值/, 'm1.money'],
  [/整十数加减|两位数加一位数|小括号/, 'm1.addsub100'],
  [/规律/, 'm1.pattern'],
  // 未映射（太综合）：连加连减、加减混合、总复习、求剩余求差 等
];

export function kpForBankLabel(label: string, question: string): string | null {
  for (const [re, target] of BANK_RULES) {
    if (re.test(label)) return typeof target === 'string' ? target : target(question);
  }
  return null;
}

/**
 * 一条练习记录属于哪个知识点；不属于知识图谱的返回 null。
 */
export function kpForRecord(lessonId: string, exerciseId: string, skill: string): string | null {
  // 今日一练（mix:，V5.2.3）的题目 id 也是 kp:知识点:签名
  if (lessonId.startsWith('kp:') || lessonId.startsWith('diag:') || lessonId.startsWith('mix:')) {
    const m = exerciseId.match(/^kp:([a-z]\d\.[\w]+):/);
    return m ? m[1] : null;
  }
  if (lessonId.startsWith('oral:')) return ORAL_MAP[lessonId.slice(5)] ?? null;
  // 游戏乐园（V2.19）：一年级凑数归到“10 以内分与合 / 20 以内进位加”，拼音钓鱼归到汉语拼音
  if (lessonId === 'game:kitchen') {
    const lv = Number(/^kitchen:(\d+):/.exec(exerciseId)?.[1]);
    // 初中平方凑平方（勾股数，V5.2.3）归到“勾股定理”
    return lv <= 2 ? 'm1.compose10' : lv === 3 ? 'm1.carry20' : lv >= 9 ? 'm8.b2' : null;
  }
  if (lessonId === 'game:fish') return /^fish:.:[^:]+$/u.test(exerciseId) ? 'c1.a4' : null;
  if (lessonId.startsWith('bank:math-g1')) {
    const label = skill.split(':').slice(2).join(':');
    const ex = findBankExercise(lessonId, exerciseId)?.exercise;
    const text = ex
      ? ex.kind === 'truefalse'
        ? JSON.stringify(ex.statement.text)
        : JSON.stringify(ex.prompt.text)
      : '';
    return kpForBankLabel(label, text);
  }
  // 二～六年级数学、语文、英语题库：按单元归到知识点（V2.2）
  if (lessonId.startsWith('bank:')) return UNIT_TO_KP[lessonId.slice(5)] ?? null;
  return LESSON_MAP[`${lessonId}/${exerciseId}`] ?? null;
}
