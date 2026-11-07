/**
 * 把试卷排成可打印的 A4 网页（纯函数）：
 * 一、二年级汉字上方注音（<ruby>）；图形和钟面画成 SVG；可选附“参考答案”页（另起一页）。
 */
import type { DisplayText, Figure, ShapeKind, Visual } from '@/lesson/types';
import type { Exam, ExamItem } from './build';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function displayHtml(t: DisplayText): string {
  if (typeof t === 'string') return esc(t).replace(/\n/g, '<br>');
  return t.map((s) => (s.py ? `<ruby>${esc(s.char)}<rt>${esc(s.py)}</rt></ruby>` : esc(s.char))).join('');
}

function shapeSvg(shape: ShapeKind, color: string, rotation = 0, size = 56): string {
  const st = 'stroke="#333" stroke-width="4" stroke-linejoin="round"';
  const el = {
    circle: `<circle cx="50" cy="50" r="38" fill="${color}" ${st}/>`,
    triangle: `<polygon points="50,12 90,84 10,84" fill="${color}" ${st}/>`,
    square: `<rect x="16" y="16" width="68" height="68" fill="${color}" ${st}/>`,
    rect: `<rect x="6" y="28" width="88" height="44" fill="${color}" ${st}/>`,
    rtri: `<polygon points="14,14 14,86 86,86" fill="${color}" ${st}/>`,
    house: `<polygon points="50,8 88,44 88,90 12,90 12,44" fill="${color}" ${st}/>`,
  }[shape];
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><g transform="rotate(${rotation} 50 50)">${el}</g></svg>`;
}

function clockSvg(hour: number, minute = 0, size = 110): string {
  const ha = (((hour % 12) + minute / 60) * 30 * Math.PI) / 180;
  const ma = (minute * 6 * Math.PI) / 180;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i * 6 * Math.PI) / 180;
    const r1 = i % 5 === 0 ? 78 : 84;
    return `<line x1="${(100 + r1 * Math.sin(a)).toFixed(1)}" y1="${(100 - r1 * Math.cos(a)).toFixed(1)}" x2="${(100 + 90 * Math.sin(a)).toFixed(1)}" y2="${(100 - 90 * Math.cos(a)).toFixed(1)}" stroke="#333" stroke-width="${i % 5 === 0 ? 3 : 1}"/>`;
  }).join('');
  const nums = Array.from({ length: 12 }, (_, i) => {
    const a = ((i + 1) * 30 * Math.PI) / 180;
    return `<text x="${(100 + 64 * Math.sin(a)).toFixed(1)}" y="${(100 - 64 * Math.cos(a) + 7).toFixed(1)}" font-size="20" font-weight="bold" text-anchor="middle">${i + 1}</text>`;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200"><circle cx="100" cy="100" r="94" fill="#fff" stroke="#333" stroke-width="6"/>${ticks}${nums}<line x1="100" y1="100" x2="${(100 + 42 * Math.sin(ha)).toFixed(1)}" y2="${(100 - 42 * Math.cos(ha)).toFixed(1)}" stroke="#333" stroke-width="9" stroke-linecap="round"/><line x1="100" y1="100" x2="${(100 + 70 * Math.sin(ma)).toFixed(1)}" y2="${(100 - 70 * Math.cos(ma)).toFixed(1)}" stroke="#333" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#333"/></svg>`;
}

function figureSvg(f: Figure, small = false): string {
  if (f.type === 'puzzle') return esc(f.alt);
  return f.type === 'clock'
    ? clockSvg(f.hour, f.minute, small ? 84 : 110)
    : shapeSvg(f.shape, f.color, f.rotation, small ? 44 : 60);
}

export function visualHtml(v: Visual, small = false): string {
  const n = v.count ?? 1;
  if (v.figure)
    return `<span class="fig">${Array.from({ length: n }, () => figureSvg(v.figure!, small)).join('')}</span>`;
  return `<span class="emoji">${esc(v.emoji.repeat(n))}</span>`;
}

const LETTERS = 'ABCD';
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩';
const CN_NUM = ['一', '二', '三', '四', '五', '六'];
const BLANK = '<span class="paren">（　　）</span>';

/** 题干里已经有填空括号时，不再在末尾加括号（避免出现两个括号） */
const HAS_BLANK = /（\s*[？?]?\s*）|\(\s*[？?]?\s*\)|_{2,}/;

export function itemHtml(it: ExamItem, no: number): string {
  const stem = it.stem.map(displayHtml).join(' ');
  const plain = it.stem.map((t) => (typeof t === 'string' ? t : t.map((x) => x.char).join(''))).join(' ');
  const blank = HAS_BLANK.test(plain) ? '' : BLANK;
  const vis = it.stemVisual ? `<div class="vis">${visualHtml(it.stemVisual)}</div>` : '';
  if (it.kind === 'calc')
    return `<div class="calc"><span class="no">${no}.</span> ${stem} <span class="line"></span></div>`;
  if (it.kind === 'tf') return `<div class="item"><span class="no">${no}.</span> ${stem} ${BLANK}${vis}</div>`; // 判断题的括号用来写 √ ×
  if (it.kind === 'order') {
    const opts = (it.options ?? [])
      .map((o, i) => `<span class="opt">${CIRCLED[i]} ${o.text !== undefined ? displayHtml(o.text) : ''}</span>`)
      .join('');
    return `<div class="item"><span class="no">${no}.</span> ${stem}<div class="opts">${opts}</div><div class="answer-line">顺序：<span class="line long"></span></div></div>`;
  }
  const opts = (it.options ?? [])
    .map(
      (o, i) =>
        `<span class="opt">${LETTERS[i]}. ${o.visual ? visualHtml(o.visual, true) : ''}${o.text !== undefined ? displayHtml(o.text) : ''}</span>`,
    )
    .join('');
  return `<div class="item"><span class="no">${no}.</span> ${stem} ${blank}${vis}<div class="opts">${opts}</div></div>`;
}

/** 试卷和错题本共用的 A4 排版样式（V2.21 抽出） */
export function paperCss(low: boolean): string {
  return `@page { size: A4; margin: 14mm 14mm 16mm; }
* { box-sizing: border-box; }
body { font-family: "PingFang SC","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif; color: #111; font-size: ${low ? '15pt' : '12pt'}; line-height: ${low ? 2.1 : 1.7}; margin: 0; }
ruby rt { font-size: 0.5em; color: #333; }
h1 { text-align: center; font-size: ${low ? '20pt' : '18pt'}; margin: 0 0 2mm; }
.sub { text-align: center; font-size: 10pt; color: #444; margin: 0; }
.info { display: flex; justify-content: space-between; border-top: 1.5px solid #111; border-bottom: 1.5px solid #111; padding: 2mm 0; margin: 3mm 0 4mm; font-size: 11pt; }
.info span { white-space: nowrap; }
.meta { font-size: 9pt; color: #555; text-align: center; margin: 0; }
h2 { font-size: ${low ? '14pt' : '13pt'}; margin: 5mm 0 1mm; }
h2 small { font-size: 10pt; font-weight: normal; margin-left: 2mm; }
.ins { margin: 0 0 2mm; font-size: 10.5pt; color: #333; }
.item { margin: 0 0 ${low ? '3mm' : '2mm'}; break-inside: avoid; page-break-inside: avoid; }
.no { font-weight: bold; margin-right: 1mm; }
.paren { white-space: nowrap; }
.opts { display: flex; flex-wrap: wrap; gap: 2mm 8mm; padding-left: 6mm; }
.opt { white-space: nowrap; display: inline-flex; align-items: center; gap: 1mm; }
.vis { padding-left: 6mm; }
.fig svg { vertical-align: middle; margin-right: 2mm; }
.emoji { font-size: 1.4em; letter-spacing: 2px; }
.calc-grid { display: grid; grid-template-columns: repeat(${low ? 2 : 3}, 1fr); gap: 2mm 6mm; }
.calc { break-inside: avoid; white-space: nowrap; }
.line { display: inline-block; width: 22mm; border-bottom: 1px solid #111; }
.line.long { width: 60mm; }
.answer-line { padding-left: 6mm; }
.foot { margin-top: 6mm; font-size: 8.5pt; color: #666; border-top: 1px dashed #999; padding-top: 2mm; }
.answers { page-break-before: always; break-before: page; }
.ans-title { font-size: 16pt; }
.answers h3 { font-size: 12pt; margin: 4mm 0 1mm; }
.ans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1mm 4mm; font-size: 10.5pt; }
`;
}

export function examHtml(exam: Exam, opts: { withAnswers: boolean; date?: string }): string {
  const low = exam.config.grade <= 2;
  const pts = (n: number) => `${Math.round(n * exam.perPoint * 10) / 10}`;
  const sections = exam.sections
    .map((s, si) => {
      const items =
        s.kind === 'calc'
          ? `<div class="calc-grid">${s.items.map((it, i) => itemHtml(it, i + 1)).join('')}</div>`
          : s.items.map((it, i) => itemHtml(it, i + 1)).join('');
      return `<section data-kind="${s.kind}"><h2>${CN_NUM[si]}、${displayHtml(s.title)}<small>（每题 ${exam.perPoint} 分，共 ${pts(s.items.length)} 分）</small></h2><p class="ins">${displayHtml(s.instruction)}</p>${items}</section>`;
    })
    .join('');
  const answers = opts.withAnswers
    ? `<div class="answers"><h1 class="ans-title">参考答案</h1><p class="meta">${esc(exam.code)}</p>${exam.sections
        .map(
          (s, si) =>
            `<h3>${CN_NUM[si]}、${displayHtml(s.title)}</h3><div class="ans-grid">${s.items
              .map((it, i) => `<span>${i + 1}. ${esc(it.answer)}</span>`)
              .join('')}</div>`,
        )
        .join('')}</div>`
    : '';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(typeof exam.title === 'string' ? exam.title : exam.title.map((x) => x.char).join(''))}</title><style>
${paperCss(low)}</style></head><body>
<h1>${displayHtml(exam.title)}</h1>
<p class="sub">${esc(exam.subtitle)} · ${esc(exam.scopeText)} · 满分 ${exam.total} 分</p>
<div class="info"><span>学校：________</span><span>班级：______</span><span>姓名：________</span><span>得分：______</span></div>
${sections}
<div class="foot">试卷编号 ${esc(exam.code)}${opts.date ? ` · 生成于 ${esc(opts.date)}` : ''} · 林亨学习乐园自动生成。${esc(exam.sourceNote)}</div>
${answers}
</body></html>`;
}
