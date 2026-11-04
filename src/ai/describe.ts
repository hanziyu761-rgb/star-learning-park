/** 把练习题整理成发给 AI 服务的文字（纯函数） */
import { plainText } from '@/content/zh';
import type { DisplayText, Exercise } from '@/lesson/types';

const txt = (t: DisplayText | undefined) => (t === undefined ? '' : plainText(t));

/** 把练习题整理成发给 AI 服务的文字 */
export function describeExercise(e: Exercise): { question: string; options?: string[]; answer?: string } {
  switch (e.kind) {
    case 'choice': {
      const opt = (o: (typeof e.options)[number]) => txt(o.text) || (o.visual ? o.visual.emoji.repeat(o.visual.count ?? 1) : '');
      const stem = e.stem ? `${e.stem.visual ? e.stem.visual.emoji.repeat(e.stem.visual.count ?? 1) : ''}${txt(e.stem.text)}` : '';
      const listen = e.listen ? `（听到的内容：${e.listen.text}）` : '';
      return {
        question: `${txt(e.prompt.text)}${stem ? ` ${stem}` : ''}${listen}`,
        options: e.options.map(opt),
        answer: opt(e.options.find((o) => o.id === e.answerId)!),
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
  }
}

