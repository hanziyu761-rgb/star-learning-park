/**
 * V2.8 一、二年级英语三条主线：课程数量、拼读顺序、单词可拼读、小书可拼读、答案正确、不含原书人物。
 */
import { lessonsFor } from '@/content';
import {
  BOOKS,
  graphemesUpTo,
  PHONICS_GROUPS,
  PHONICS_WORDS,
  STARTER_LESSONS,
  TALK_UNITS,
  TRICKY_WORDS,
} from '@/content/englishStarter';
import type { Exercise } from '@/lesson/types';

/** 能否把单词完全拆成学过的字母音 */
function decodable(word: string, allowed: Set<string>): boolean {
  const w = word.toLowerCase();
  const ok: boolean[] = [true, ...Array(w.length).fill(false)];
  for (let i = 0; i < w.length; i++) {
    if (!ok[i]) continue;
    for (const g of allowed) if (w.startsWith(g, i)) ok[i + g.length] = true;
  }
  return ok[w.length];
}

const exercisesOf = (id: string): Exercise[] =>
  STARTER_LESSONS.find((l) => l.id === id)!.steps.flatMap((s) => (s.kind === 'exercise' ? [s.exercise] : []));

describe('课程', () => {
  it('交流 9 课（含原有 Fruits）、拼读 7 组、分级阅读 7 本，按主线排好', () => {
    const en = lessonsFor('english');
    expect(en.filter((l) => l.track === 'talk')).toHaveLength(9);
    expect(en.filter((l) => l.track === 'phonics')).toHaveLength(7);
    expect(en.filter((l) => l.track === 'reading')).toHaveLength(7);
    expect(en[0].id).toBe('en-talk-1');
    expect(en.every((l) => l.source === 'original')).toBe(true);
    for (const l of STARTER_LESSONS) expect(l.sourceNote).toContain('未收录原书');
  });

  it('不含原书人物和书名之外的原书内容（Biff、Chip、Kipper、Floppy 等）', () => {
    const json = JSON.stringify(STARTER_LESSONS);
    for (const name of ['Biff', 'Chip', 'Kipper', 'Floppy', 'Wilma', 'Wilf', 'Snake Song']) expect(json).not.toContain(name);
  });
});

describe('拼读', () => {
  it('7 组字母音按 Jolly Phonics 的顺序', () => {
    expect(PHONICS_GROUPS.map((g) => [...new Set(g.sounds.map((s) => s.g))].join(' '))).toEqual([
      's a t i p n',
      'c k ck e h r m d',
      'g o u l f b',
      'ai j oa ie ee or',
      'z w ng v oo',
      'y x ch sh th',
      'qu ou oi ue er ar',
    ]);
  });

  it('每组练习词：拆分正确，只用本组及之前学过的字母音', () => {
    for (const grp of PHONICS_GROUPS) {
      const allowed = graphemesUpTo(grp.n);
      for (const w of PHONICS_WORDS[grp.n]) {
        expect(w.g.join('')).toBe(w.w);
        for (const g of w.g) expect(allowed.has(g)).toBe(true);
      }
      // 每组至少有一个词用到本组的新字母音
      const own = new Set(grp.sounds.map((s) => s.g));
      expect(PHONICS_WORDS[grp.n].some((w) => w.g.some((g) => own.has(g) || own.has(g[0])))).toBe(true);
    }
  });

  it('拼读课的题目答案正确：首音是单词的第一个字母音；拼词顺序就是拆分顺序', () => {
    for (const grp of PHONICS_GROUPS) {
      for (const e of exercisesOf(`en-phonics-${grp.n}`)) {
        const word = PHONICS_WORDS[grp.n].find((w) => e.id.endsWith(`-${w.w}`));
        if (e.kind === 'choice' && e.id.includes('-first-')) {
          expect(e.answerId).toBe(word!.g[0]);
          expect(e.options.map((o) => o.id)).toContain(word!.g[0]);
        }
        if (e.kind === 'choice' && e.id.includes('-read-')) expect(e.answerId).toBe(word!.w);
        if (e.kind === 'sort') {
          const byId = Object.fromEntries(e.items.map((it) => [it.id, it.text]));
          expect(e.order.map((id) => byId[id]).join('')).toBe(word!.w);
          expect(e.items.map((it) => it.id)).not.toEqual(e.order);
        }
      }
    }
  });
});

describe('分级阅读', () => {
  it('无字书没有文字；其他小书每个单词都能用学过的字母音拼出来（少数常见词除外）', () => {
    for (const b of BOOKS) {
      if (b.level === '1') {
        expect(b.pages.every((p) => p.text === '' && p.guide)).toBe(true);
        continue;
      }
      const allowed = graphemesUpTo(b.group);
      const words = b.pages.flatMap((p) => p.text.split(/\s+/)).map((w) => w.replace(/[^A-Za-z]/g, ''));
      const bad = words.filter((w) => w && !TRICKY_WORDS.includes(w.toLowerCase()) && !decodable(w, allowed));
      expect(bad).toEqual([]);
    }
  });

  it('题目答案正确、排图题被打乱', () => {
    for (const b of BOOKS) {
      for (const [i, e] of exercisesOf(`en-read-${b.n}`).entries()) {
        const q = b.questions[i];
        if (e.kind === 'choice' && q.kind === 'choice') {
          const ans = e.options.find((o) => o.id === e.answerId)!;
          expect(ans.text ?? ans.visual?.emoji).toBe(q.answer);
        }
        if (e.kind === 'sort' && q.kind === 'order') {
          const byId = Object.fromEntries(e.items.map((it) => [it.id, it.visual?.emoji]));
          expect(e.order.map((id) => byId[id])).toEqual(q.pictures);
          expect(e.items.map((it) => it.id)).not.toEqual(e.order);
        }
        if (e.kind === 'truefalse' && q.kind === 'tf') expect(e.answer).toBe(q.answer);
      }
    }
  });
});

describe('交流', () => {
  it('8 个单元：问答题的正确选项就是合适的回答；指令是英文', () => {
    expect(TALK_UNITS).toHaveLength(8);
    for (const u of TALK_UNITS) {
      const qa = exercisesOf(`en-talk-${u.n}`).filter((e) => e.id.includes('-qa-'));
      expect(qa).toHaveLength(u.qa.length);
      qa.forEach((e, i) => {
        if (e.kind !== 'choice') throw new Error();
        expect(e.options.find((o) => o.id === e.answerId)!.text).toBe(u.qa[i].a);
        expect(new Set(e.options.map((o) => o.text)).size).toBe(3);
      });
      for (const s of STARTER_LESSONS.find((l) => l.id === `en-talk-${u.n}`)!.steps) {
        const p = 'title' in s ? s.title : s.kind === 'exercise' ? s.exercise.prompt : undefined;
        if (p) expect(/\p{Script=Han}/u.test(String(p.text))).toBe(false);
      }
    }
  });
});
