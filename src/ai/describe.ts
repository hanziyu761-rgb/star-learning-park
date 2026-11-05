/** 把练习题整理成发给 AI 服务的文字（纯函数） */
import { plainText } from '@/content/zh';
import type { DisplayText, Exercise, Visual } from '@/lesson/types';

const SHAPE_ZH: Record<string, string> = {
  circle: '圆',
  triangle: '三角形',
  square: '正方形',
  rect: '长方形',
  rtri: '三角形',
  house: '小房子',
};
const vis = (v: Visual): string =>
  v.figure
    ? v.figure.type === 'clock'
      ? `钟面${v.figure.hour}时`
      : v.figure.type === 'puzzle'
        ? v.figure.alt
        : SHAPE_ZH[v.figure.shape]
    : v.emoji.repeat(v.count ?? 1);

const txt = (t: DisplayText | undefined) => (t === undefined ? '' : plainText(t));

/** 把练习题整理成发给 AI 服务的文字 */
export function describeExercise(e: Exercise): { question: string; options?: string[]; answer?: string } {
  switch (e.kind) {
    case 'input': {
      const stem = e.stem ? `${e.stem.visual ? vis(e.stem.visual) : ''}${txt(e.stem.text)}` : '';
      return { question: `${txt(e.prompt.text)}${stem ? ` ${stem}` : ''}（自己填答案）`, answer: e.answer };
    }
    case 'trace':
      return {
        question: `按笔顺描写汉字“${e.char}”`,
        answer: `笔顺：${e.strokes.map((s) => s.name).join('、')}`,
      };
    case 'choice': {
      const opt = (o: (typeof e.options)[number]) => txt(o.text) || (o.visual ? vis(o.visual) : '');
      const stem = e.stem ? `${e.stem.visual ? vis(e.stem.visual) : ''}${txt(e.stem.text)}` : '';
      const listen = e.listen ? `（听到的内容：${e.listen.text}）` : '';
      return {
        question: `${txt(e.prompt.text)}${stem ? ` ${stem}` : ''}${listen}`,
        options: e.options.map(opt),
        answer: opt(e.options.find((o) => o.id === e.answerId)!),
      };
    }
    case 'multi': {
      const opt = (o: (typeof e.options)[number]) => txt(o.text);
      return {
        question: `${txt(e.prompt.text)}（多选，答案不止一个）`,
        options: e.options.map(opt),
        answer: e.options
          .filter((o) => e.answerIds.includes(o.id))
          .map(opt)
          .join('、'),
      };
    }
    case 'truefalse':
      return { question: `判断对错：${txt(e.statement.text)}`, answer: e.answer ? '对' : '错' };
    case 'sort': {
      const byId = (id: string) => txt(e.items.find((i) => i.id === id)?.text);
      return {
        question: `${txt(e.prompt.text)}：${e.items.map((i) => txt(i.text)).join('、')}`,
        answer: e.order.map(byId).join(''),
      };
    }
    case 'drag-match':
      return {
        question: `${txt(e.prompt.text)}：${e.pairs.map((p) => txt(p.item.text) || p.item.visual?.emoji).join('、')}`,
      };
    case 'grid-place':
    case 'grid-tap':
      // 只描述题目，不把格子坐标作为“答案”发给 AI（提示模式本来也不透露答案）
      return { question: `${txt(e.prompt.text)}（方格图：${e.rows}行${e.cols}列）` };
    case 'shape-pick':
      return { question: txt(e.prompt.text), answer: `共${e.answerIds.length}个` };
    case 'bins':
      return {
        question: `${txt(e.prompt.text)}：分成「${e.bins.map((b) => txt(b.label)).join('」「')}」`,
        answer: e.bins
          .map(
            (b) =>
              `${txt(b.label)}：${e.items
                .filter((i) => i.bin === b.id)
                .map((i) => vis(i.visual))
                .join('')}`,
          )
          .join('；'),
      };
    case 'rotate':
      return { question: `${txt(e.prompt.text)}（点一下转90度）` };
    case 'clock-set':
      return { question: txt(e.prompt.text), answer: `${e.targetHour}时整：分针指着12，时针指着${e.targetHour}` };
    case 'pattern-fill': {
      const tok = (t: { visual?: Visual; text?: string } | null) =>
        t ? (t.text ?? (t.visual ? vis(t.visual) : '')) : '□';
      return {
        question: `${txt(e.prompt.text)}：${e.sequence.map(tok).join(' ')}`,
        answer: e.answers.map((id) => tok(e.palette.find((p) => p.id === id) ?? null)).join(' '),
      };
    }
  }
}
