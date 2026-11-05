/**
 * V2.10 先教后练：知识点小讲解覆盖、讲解面板翻页/跳过；阅读小屋短文课的数据与题目答案。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { LESSONS } from '@/content';
import { PASSAGES, READING_LESSONS } from '@/content/chineseReading';
import { TeachPanel } from '@/components/TeachPanel';
import { kpsFor } from '@/knowledge/graph';
import { KP_TEACH } from '@/knowledge/teach';

describe('知识点小讲解', () => {
  it('一年级每个数学知识点都有 2 页讲解，每页有图示和一句话', () => {
    const ids = kpsFor('math', 1).map((k) => k.id);
    for (const id of ids) {
      expect(KP_TEACH[id]?.length).toBe(2);
      for (const s of KP_TEACH[id]) {
        expect(s.show.length).toBeGreaterThan(0);
        expect(s.text.length).toBeGreaterThan(4);
        expect(s.speak).toBe(s.text.map((x) => x.char).join(''));
      }
    }
    for (const id of Object.keys(KP_TEACH)) expect(ids).toContain(id);
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
  it('6 篇原创短文已加入课程目录，标注原创、待审核', () => {
    expect(READING_LESSONS).toHaveLength(6);
    for (const l of READING_LESSONS) {
      expect(LESSONS).toContain(l);
      expect(l).toMatchObject({ subject: 'chinese', track: 'zhread', source: 'original' });
      expect(l.sourceNote).toContain('待教师审核');
      expect(l.steps[0].kind).toBe('read-passage');
    }
  });

  it('每篇读完后 2 道题，答案都能在短文里找到依据', () => {
    for (const p of PASSAGES) {
      const text = p.paras.map((x) => x[0]).join('');
      expect(p.questions).toHaveLength(2);
      for (const q of p.questions) {
        if (q.kind === 'choice') {
          // 问“没有什么”的题，正确答案不在文中、干扰项在文中；其余题正确答案在文中
          const negative = q.q[0].includes('没有');
          expect(text.includes(q.ans[0])).toBe(!negative);
          if (negative) for (const o of q.others) expect(text).toContain(o[0]);
        } else if (q.kind === 'order') {
          const pos = q.steps.map((s) => text.indexOf(s[0]));
          expect(pos.every((x) => x >= 0)).toBe(true);
          expect([...pos].sort((a, b) => a - b)).toEqual(pos);
        } else {
          expect(text.includes(q.q[0].replace(/[。，]/g, ''))).toBe(q.answer);
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
