/**
 * V2.10 先教后练：知识点小讲解覆盖、讲解面板翻页/跳过；阅读小屋短文课的数据与题目答案。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { LESSONS } from '@/content';
import { PASSAGES, plainOf, READING_LESSONS } from '@/content/chineseReading';
import { PASSAGES_UPPER } from '@/content/chineseReadingUpper';
import { PASSAGES_JUNIOR } from '@/content/chineseReadingJunior';
import { TeachPanel } from '@/components/TeachPanel';
import { plainText } from '@/content/zh';
import { kpsFor } from '@/knowledge/graph';
import { KP_TEACH, KP_TEACH_G1 } from '@/knowledge/teach';

describe('知识点小讲解', () => {
  it('一年级每个数学知识点都有 2 页讲解，每页有图示和一句话', () => {
    const ids = kpsFor('math', 1).map((k) => k.id);
    for (const id of ids) {
      expect(KP_TEACH[id]?.length).toBe(2);
      for (const s of KP_TEACH[id]) {
        expect(s.show.length).toBeGreaterThan(0);
        expect(typeof s.text).not.toBe('string');
        expect(s.speak).toBe(plainText(s.text));
      }
    }
    for (const id of Object.keys(KP_TEACH_G1)) expect(ids).toContain(id);
  });

  it('二～六年级：数学每个知识点 2 页，语文、英语每个单元 1 页；二年级注拼音，三年级起不注', () => {
    for (const g of [2, 3, 4, 5, 6]) {
      for (const k of kpsFor('math', g)) expect(KP_TEACH[k.id]).toHaveLength(2);
      for (const k of kpsFor('chinese', g)) expect(KP_TEACH[k.id]).toHaveLength(1);
      for (const k of kpsFor('english', g)) expect(KP_TEACH[k.id]).toHaveLength(1);
      for (const s of ['math', 'chinese'] as const)
        for (const k of kpsFor(s, g))
          for (const sl of KP_TEACH[k.id]) {
            expect(typeof sl.text === 'string').toBe(g >= 3);
            expect(sl.speak).toBe(plainText(sl.text));
          }
    }
    // 英语讲解：显示并朗读英语句子，中文写意思
    for (const g of [3, 4, 5, 6])
      for (const k of kpsFor('english', g)) {
        const [sl] = KP_TEACH[k.id];
        expect(sl.lang).toBe('en-US');
        expect(sl.show).toMatch(/^[A-Z]/);
        expect(sl.speak).not.toMatch(/[\u4e00-\u9fff]/);
        expect(String(sl.text)).toMatch(/[\u4e00-\u9fff]/);
      }
    // 没有对不上知识点的讲解
    const all = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((g) =>
        (['math', 'chinese', 'english'] as const).flatMap((s) => kpsFor(s, g).map((k) => k.id)),
      ),
    );
    for (const id of Object.keys(KP_TEACH)) expect(all.has(id)).toBe(true);
  });

  it('三年级起的讲解面板不注拼音（标题、按钮也是普通文字）', async () => {
    await render(<TeachPanel slides={KP_TEACH['m4.laws']} color="#f80" onDone={() => {}} />);
    expect(screen.getByText('先学一学')).toBeTruthy();
    expect(screen.getByText('我会了，直接练习')).toBeTruthy();
  });

  it('讲解面板：下一页 → 开始练习；也可以直接跳过', async () => {
    const done = jest.fn();
    await render(<TeachPanel slides={KP_TEACH['m1.carry20']} color="#f80" onDone={done} />);
    expect(screen.getByTestId('teach-slide-0')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('teach-next'));
    expect(screen.getByTestId('teach-slide-1')).toBeTruthy();
    expect(done).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('teach-start'));
    expect(done).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('teach-skip'));
    expect(done).toHaveBeenCalledTimes(2);
  });
});

describe('阅读小屋', () => {
  const all = [
    { grade: 1, ps: PASSAGES },
    ...Object.entries(PASSAGES_UPPER).map(([g, ps]) => ({ grade: Number(g), ps })),
    ...Object.entries(PASSAGES_JUNIOR).map(([g, ps]) => ({ grade: Number(g), ps })),
  ];

  it('一～九年级共 38 篇原创短文已加入课程目录，标注原创、待审核、年级', () => {
    expect(READING_LESSONS).toHaveLength(38);
    for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9])
      expect(READING_LESSONS.filter((l) => (l.grade ?? 1) === g)).toHaveLength(g === 1 ? 6 : 4);
    expect(new Set(READING_LESSONS.map((l) => l.id)).size).toBe(38);
    for (const l of READING_LESSONS) {
      expect(LESSONS).toContain(l);
      expect(l).toMatchObject({ subject: 'chinese', track: 'zhread', source: 'original' });
      expect(l.sourceNote).toContain('已通过教师审核');
      expect(l.steps[0].kind).toBe('read-passage');
    }
  });

  it('一、二年级全文注拼音；三年级起不注拼音、篇幅更长、每篇 3 道题', () => {
    for (const { grade, ps } of all)
      for (const p of ps) {
        const pinyin = p.paras.every((x) => typeof x !== 'string');
        expect(pinyin).toBe(grade <= 2);
        expect(p.questions).toHaveLength(grade <= 2 ? 2 : 3);
        if (grade >= 3) expect(p.paras.map(plainOf).join('').length).toBeGreaterThan(grade * 18);
      }
  });

  it('每道题的答案都能在短文里找到依据', () => {
    for (const { ps } of all)
      for (const p of ps) {
        const text = p.paras.map(plainOf).join('');
        for (const q of p.questions) {
          if (q.kind === 'order') {
            const pos = q.steps.map((s) => text.indexOf(plainOf(s)));
            expect(pos.every((x) => x >= 0)).toBe(true);
            expect([...pos].sort((a, b) => a - b)).toEqual(pos);
            continue;
          }
          // 概括、推断题：标出的原文依据必须真的在短文里
          if (q.evidence) {
            expect(text).toContain(q.evidence);
            continue;
          }
          if (q.kind === 'choice') {
            // 问“没有什么”的题，正确答案不在文中、干扰项在文中；其余题正确答案在文中
            const negative = plainOf(q.q).includes('没有');
            expect(text.includes(plainOf(q.ans))).toBe(!negative);
            if (negative) for (const o of q.others) expect(text).toContain(plainOf(o));
          } else {
            expect(text.includes(plainOf(q.q).replace(/[。，]/g, ''))).toBe(q.answer);
          }
        }
      }
  });

  it('选择题正确答案位置不总是第一个；排序题打乱了顺序', () => {
    const answerPos = new Set<string>();
    for (const l of READING_LESSONS)
      for (const s of l.steps) {
        if (s.kind !== 'exercise') continue;
        const e = s.exercise;
        if (e.kind === 'choice') answerPos.add(e.answerId === e.options[0].id ? 'first' : 'other');
        if (e.kind === 'sort') expect(e.items.map((x) => x.id)).not.toEqual(e.order);
      }
    expect(answerPos.size).toBe(2);
  });
});
