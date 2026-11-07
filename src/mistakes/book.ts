/**
 * 三科错题本（V2.21，纯函数，可测试）：
 * - 按学科列出做错过的题：还没掌握（按最近答错排在前）/ 已经掌握
 * - 排成可打印的 A4 错题单：能印在纸上的题（选择、判断、排序、填数）原样印出，可选附答案页；
 *   拖动、拨钟、描红、听音等互动题印出题目要求，并注明“请在 APP 里重做”
 * 只来自真实的作答记录（state.mistakes），家长屏蔽的题不出现。
 */
import { toExamItem, type ExamItem } from '@/exam/build';
import { displayHtml, itemHtml, paperCss, visualHtml } from '@/exam/html';
import type { ExerciseResolver } from '@/content/resolve';
import type { DisplayText, Exercise, Subject } from '@/lesson/types';
import type { MistakeEntry, ProgressState } from '@/progress/model';

export const SUBJECT_CN: Record<Subject, string> = { math: '数学', chinese: '语文', english: '英语' };

export interface BookEntry {
  mistake: MistakeEntry;
  /** 找不到原题（题库更新等）时为 null，只显示名称 */
  exercise: Exercise | null;
  /** 来自哪里（课程名、题库单元、游戏……） */
  source: string;
}

export interface MistakeBook {
  open: BookEntry[];
  mastered: BookEntry[];
}

export function mistakeBook(state: ProgressState, subject: Subject, resolve: ExerciseResolver): MistakeBook {
  const hidden = new Set(state.hidden);
  const all = Object.values(state.mistakes)
    .filter((m) => m.subject === subject && !hidden.has(m.exerciseId))
    .sort((a, b) => b.lastWrongAt - a.lastWrongAt)
    .map((m): BookEntry => {
      const r = resolve(m.lessonId, m.exerciseId);
      return { mistake: m, exercise: r?.exercise ?? null, source: r?.source ?? '' };
    });
  return { open: all.filter((e) => !e.mistake.resolved), mastered: all.filter((e) => e.mistake.resolved) };
}

/** 每科错题数（还没掌握的） */
export function openCount(state: ProgressState, subject: Subject): number {
  const hidden = new Set(state.hidden);
  return Object.values(state.mistakes).filter((m) => m.subject === subject && !m.resolved && !hidden.has(m.exerciseId)).length;
}

const plain = (t: DisplayText) => (typeof t === 'string' ? t : t.map((x) => x.char).join(''));

/** 题目要求（互动题印在纸上时用） */
export function promptText(e: Exercise): DisplayText {
  return e.prompt.text;
}

/** 互动题的类型名称 */
const INTERACTIVE: Partial<Record<Exercise['kind'], string>> = {
  'drag-match': '拖动配对',
  'grid-place': '拖到方格',
  'grid-tap': '地图点选',
  'shape-pick': '点选图形',
  bins: '分类',
  rotate: '旋转图形',
  'clock-set': '拨钟',
  'pattern-fill': '找规律',
  trace: '描红写字',
};

/** 把一道错题排成纸上的题；印不出来的返回 null */
export function printable(e: Exercise): ExamItem | null {
  // 听音题印在纸上听不到声音，算互动题
  if (e.kind === 'choice' && e.listen) return null;
  const item = toExamItem(e, 'bank', '');
  if (item) {
    return item;
  }
  if (e.kind === 'input') {
    const stem: DisplayText[] = [e.prompt.text];
    if (e.stem?.text !== undefined) stem.push(e.stem.text);
    return { id: e.id, kind: 'calc', source: 'bank', group: '', stem, stemVisual: e.stem?.visual, answer: e.answer };
  }
  if (e.kind === 'multi') {
    const stem: DisplayText[] = [e.prompt.text];
    if (e.stem?.text !== undefined) stem.push(e.stem.text);
    const L = 'ABCDEF';
    return {
      id: e.id,
      kind: 'choice',
      source: 'bank',
      group: '',
      stem: [...stem, '（可以选不止一个）'],
      options: e.options.map((o) => ({ text: o.text, visual: o.visual })),
      answer: e.options
        .map((o, i) => (e.answerIds.includes(o.id) ? L[i] : ''))
        .filter(Boolean)
        .join('、'),
    };
  }
  return null;
}

export function kindName(e: Exercise): string {
  if (e.kind === 'choice' && e.listen) return '听音选择';
  return INTERACTIVE[e.kind] ?? '互动题';
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 错题单网页（A4） */
export function mistakeBookHtml(
  subject: Subject,
  entries: BookEntry[],
  opts: { grade: number; withAnswers: boolean; date: string },
): string {
  const low = opts.grade <= 2;
  const paper: { item: ExamItem; entry: BookEntry }[] = [];
  const app: BookEntry[] = [];
  for (const en of entries) {
    const it = en.exercise ? printable(en.exercise) : null;
    if (it) paper.push({ item: it, entry: en });
    else app.push(en);
  }
  const wrongNote = (m: MistakeEntry) => `<span class="wrong">（错过 ${m.wrongCount} 次）</span>`;
  const calc = paper.filter((p) => p.item.kind === 'calc' && !p.item.stemVisual && p.item.stem.length === 1);
  const rest = paper.filter((p) => !calc.includes(p));
  let no = 0;
  const calcHtml = calc.length
    ? `<section><h2>算一算</h2><div class="calc-grid">${calc
        .map((p) => itemHtml(p.item, ++no).replace('</div>', ` ${wrongNote(p.entry.mistake)}</div>`))
        .join('')}</div></section>`
    : '';
  const restHtml = rest.length
    ? `<section><h2>再做一遍</h2>${rest
        .map((p) => {
          let html = itemHtml(p.item, ++no);
          // 带图的填数题：把图印出来
          if (p.item.kind === 'calc' && p.item.stemVisual) html = html.replace(/<\/div>$/, `<div class="vis">${visualHtml(p.item.stemVisual)}</div></div>`);
          return html.replace(/<\/div>$/, `<div class="src">${wrongNote(p.entry.mistake)} 来自：${esc(p.entry.source)}</div></div>`);
        })
        .join('')}</section>`
    : '';
  const appHtml = app.length
    ? `<section><h2>请在 APP 里重做</h2><p class="ins">下面这些是拖动、拨钟、描红、听音等互动题，纸上做不了，请打开林亨学习乐园的“${SUBJECT_CN[subject]}错题本”重做。</p>${app
        .map(
          (en) =>
            `<div class="item"><span class="no">□</span> ${en.exercise ? `【${esc(kindName(en.exercise))}】${displayHtml(promptText(en.exercise))}` : '（这道题已经不在题库里）'} ${wrongNote(en.mistake)}<div class="src">来自：${esc(en.source || en.mistake.lessonId)}</div></div>`,
        )
        .join('')}</section>`
    : '';
  const answers =
    opts.withAnswers && paper.length
      ? `<div class="answers"><h1 class="ans-title">参考答案</h1><div class="ans-grid">${[...calc, ...rest]
          .map((p, i) => `<span>${i + 1}. ${esc(p.item.answer)}</span>`)
          .join('')}</div></div>`
      : '';
  const title = `${SUBJECT_CN[subject]}错题本`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title><style>
${paperCss(low)}
.wrong { font-size: 9pt; color: #B03030; white-space: nowrap; }
.src { font-size: 9pt; color: #666; padding-left: 6mm; line-height: 1.5; }
.calc .wrong { margin-left: 1mm; }
</style></head><body>
<h1>${title}</h1>
<p class="sub">还没掌握的 ${entries.length} 道题 · 纸上 ${paper.length} 道${app.length ? ` · 需在 APP 里重做 ${app.length} 道` : ''}</p>
<div class="info"><span>姓名：________</span><span>日期：${esc(opts.date)}</span><span>做对：______ 道</span></div>
${calcHtml}${restHtml}${appHtml}
<div class="foot">林亨学习乐园根据孩子的真实答题记录生成。做错的题会在“今日复习”里按 1 天、3 天的间隔再练，连续答对 2 次就算掌握。</div>
${answers}
</body></html>`;
}

/** 屏幕上显示的题目一句话 */
export function entryTitle(en: BookEntry, fallback: string): string {
  const e = en.exercise;
  if (!e) return fallback;
  if (e.kind === 'truefalse') return plain(e.statement.text);
  const p = plain(e.prompt.text);
  const stem = 'stem' in e && e.stem?.text !== undefined ? plain(e.stem.text) : '';
  return stem && !p.includes(stem) ? `${p} ${stem}` : p;
}
