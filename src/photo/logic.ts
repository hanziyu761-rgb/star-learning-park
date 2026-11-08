/**
 * 拍照错题（V4.1）的纯函数部分：知识点候选、数学同类题、打印排版。
 * - 数学同类题只用 APP 的原创出题程序（答案由程序计算），不用 AI 出数学题。
 * - 语文、英语同类题由 AI 出，标注“AI 生成，未经人工审核”，只在家长中心显示。
 */
import { displayHtml, itemHtml, paperCss } from '@/exam/html';
import { toExamItem, type ExamItem } from '@/exam/build';
import { exerciseFromKpId, hasOriginalGenerator, kpRound } from '@/knowledge/generators';
import { getKp, kpsFor, kpSubject, type KpSubject } from '@/knowledge/graph';
import type { PhotoMistake } from '@/progress/model';

export const AI_LABEL = 'AI 生成，未经人工审核';
export const SUBJECT_NAME: Record<KpSubject, string> = { math: '数学', chinese: '语文', english: '英语' };
const GRADE_CN = ['', '一', '二', '三', '四', '五', '六'];

/** 交给 AI 的知识点候选：这一科这个年级的全部知识点（只发 id 和名称） */
export function candidatesFor(subject: KpSubject, grade: number): { id: string; name: string }[] {
  return kpsFor(subject, grade).map((k) => ({ id: k.id, name: k.name }));
}

/** 三科候选合在一起（家长没选科目时用） */
export function allCandidates(grade: number): { id: string; name: string }[] {
  return (['math', 'chinese', 'english'] as const).flatMap((s) => candidatesFor(s, grade));
}

/** 这个知识点能不能由原创程序出数学同类题 */
export function canMakeMath(kpId: string): boolean {
  const k = getKp(kpId);
  return !!k && kpSubject(k) === 'math' && hasOriginalGenerator(kpId);
}

/** 数学同类题：原创出题程序出 count 道，返回题目 id（可还原） */
export function mathSimilarIds(kpId: string, count = 5, rand: () => number = Math.random): string[] {
  if (!canMakeMath(kpId)) return [];
  // kpRound 会把隔一道题改成“自己填数”（:in）；拍照错题要能打印，统一用原来的选择题 / 算式形式
  return [...new Set(kpRound(kpId, count, rand).map((e) => (e.id.endsWith(':in') ? e.id.slice(0, -3) : e.id)))];
}

/** 题目 id → 可打印的题；互动题（拖动、点选等）返回 null */
export function mathItem(id: string): ExamItem | null {
  const e = exerciseFromKpId(id);
  return e ? toExamItem(e, 'original', 'photo') : null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LETTERS = 'ABCD';

const fmtDay = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

/** 一道拍照错题和它的同类题，排成 A4 练习单（可选附答案） */
export function photoHtml(m: PhotoMistake, withAnswers: boolean): string {
  const low = m.grade <= 2;
  const items: ExamItem[] =
    m.subject === 'math'
      ? m.exerciseIds.map(mathItem).filter((x): x is ExamItem => !!x)
      : m.aiItems.map((it, i) => ({
          id: `ai${i}`,
          kind: 'choice',
          source: 'bank',
          group: 'photo',
          stem: [it.question],
          options: it.options.map((o) => ({ text: o })),
          answer: `${LETTERS[it.options.indexOf(it.answer)] ?? ''}（${it.answer}）`,
        }));
  const skipped = m.subject === 'math' ? m.exerciseIds.length - items.length : 0;
  const body = items.map((it, i) => itemHtml(it, i + 1)).join('');
  const source =
    m.subject === 'math'
      ? '同类题由林亨学习乐园原创出题程序生成，答案由程序计算。'
      : `同类题${AI_LABEL}，请家长先看一遍再给孩子做。`;
  const answers = withAnswers
    ? `<div class="answers"><h1 class="ans-title">参考答案</h1><div class="ans-grid">${items
        .map((it, i) => `<span>${i + 1}. ${esc(it.answer)}</span>`)
        .join('')}</div></div>`
    : '';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>错题同类练习</title><style>
${paperCss(low)}
.orig { border: 1.5px solid #111; padding: 2mm 3mm; margin: 3mm 0; }
</style></head><body>
<h1>错题同类练习</h1>
<p class="sub">${GRADE_CN[m.grade] ?? ''}年级${SUBJECT_NAME[m.subject]}${m.kpName ? ` · ${esc(m.kpName)}` : ''} · ${fmtDay(m.at)}</p>
<div class="orig"><b>原题：</b>${displayHtml(m.question)}${m.reason ? `<br><b>可能错在：</b>${esc(m.reason)}` : ''}</div>
<h2>同类题<small>（共 ${items.length} 题）</small></h2>
${body}
${skipped > 0 ? `<p class="ins">另有 ${skipped} 道互动题不能打印，请在 APP 里做。</p>` : ''}
<div class="foot">林亨学习乐园 · 家长拍照错题。${esc(source)}照片没有保存。</div>
${answers}
</body></html>`;
}

export const newPhotoId = (now = Date.now()) => `ph-${now.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
