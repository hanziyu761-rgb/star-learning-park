/** V5.4 语文生字听写、古诗文默写 */
import { pinyin } from 'pinyin-pro';
import { resolveExercise } from '@/content/resolve';
import { dictationExercise, dictationId, dictationItems, dictationRound } from '@/content/zhDictation';
import { ZH_DATA } from '@/knowledge/juniorZhData';
import { mistakeGrade } from '@/mistakes/grade';
import { seeded } from '@/thinking/challenges';

const noTone = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ü/g, 'v');

describe('语文听写', () => {
  it('一～九年级都有题；要写的字在词语 / 名句里只出现一次；选项不重复、答案在里面', () => {
    for (let g = 1; g <= 9; g++) {
      const items = dictationItems(g);
      expect([g, items.length >= 10]).toEqual([g, true]);
      items.forEach((it, i) => {
        const src = it.line ?? it.say.split('的')[0];
        expect([src, src.split(it.char).length - 1]).toEqual([src, 1]);
        const e = dictationExercise(g, i)!;
        const ids = e.options.map((o) => o.id);
        expect(new Set(ids).size).toBe(4);
        expect(ids).toContain(it.char);
        expect(e.stem?.text).toContain('（　）');
      });
    }
  });

  it('小学词语的拼音和词库一致（不看声调，轻声词库也认）', () => {
    for (const g of [1, 3, 5])
      for (const it of dictationItems(g)) {
        const word = it.say.split('的')[0];
        expect([word, noTone(it.py!)]).toEqual([word, noTone(pinyin(word, { toneType: 'symbol' }))]);
        expect(it.py!.split(' ')).toHaveLength([...word].length);
      }
  });

  it('初中名句都在已核对的古诗文资料里（原句一字不差）', () => {
    const lines = new Set(
      Object.values(ZH_DATA).flatMap((u) =>
        (u.lines ?? '')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((l) => {
            const [a, b] = l.trim().split('|');
            return `${a}，${b}`;
          }),
      ),
    );
    for (const g of [7, 8, 9]) for (const it of dictationItems(g)) expect([it.line, lines.has(it.line!)]).toEqual([it.line, true]);
  });

  it('一轮 10 题先出没做过的；错题本能还原题目、认出年级', () => {
    const all = dictationItems(3).map((_, i) => `${dictationId(3)}:${i}`);
    const done = new Set(all.slice(0, all.length - 4));
    const round = dictationRound(3, done, seeded(1));
    expect(round).toHaveLength(10);
    expect(round.slice(0, 4).every((e) => !done.has(e.id))).toBe(true);
    const e = round[0];
    expect(resolveExercise(dictationId(3), e.id)?.exercise).toEqual(e);
    expect(resolveExercise(dictationId(3), e.id)?.subject).toBe('chinese');
    expect(mistakeGrade({ lessonId: dictationId(8), exerciseId: `${dictationId(8)}:0`, skill: 'zh.dictation' })).toBe(8);
  });
});
