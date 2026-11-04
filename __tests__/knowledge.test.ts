/**
 * 知识图谱、课程映射、题目生成器、掌握度、前置诊断、推荐 —— 全部使用原创测试数据。
 */
import { pinyin } from 'pinyin-pro';
import { LESSONS } from '@/content';
import { BANK_INDEX, bankLessonId, loadBook } from '@/content/bank';
import { resolveExercise } from '@/content/resolve';
import { answer, isStruggling, judge, nextKp, startDiagnosis, summarize } from '@/knowledge/diagnose';
import { exerciseFromKpId, hasGenerator, kpExercise, kpRound } from '@/knowledge/generators';
import { ancestors, getKp, KNOWLEDGE_POINTS, topoOrder } from '@/knowledge/graph';
import { kpForRecord, LESSON_MAP, ORAL_MAP } from '@/knowledge/mapping';
import { computeMastery, masteryOf, type Evidence } from '@/knowledge/mastery';
import { frequentMistakeTypes, recommendKps } from '@/knowledge/recommend';
import { createEmptyProgress, progressReducer, type ProgressAction } from '@/progress/model';

const T0 = new Date(2026, 10, 4, 9, 0, 0).getTime();
const DAY = 24 * 3600_000;
const seeded = (seed: number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
const run = (a: ProgressAction[]) => a.reduce(progressReducer, createEmptyProgress());
const res = (exerciseId: string, ok: boolean, at: number, lessonId = `kp:${exerciseId.split(':')[1]}`): ProgressAction => ({
  type: 'exercise/result', lessonId, exerciseId, subject: 'math', skill: exerciseId.split(':')[1], firstTryCorrect: ok, attempts: ok ? 1 : 2, now: at,
});
const ev = (pattern: string, startAt = T0, gap = 60_000): Evidence[] =>
  [...pattern].map((c, i) => ({ at: startAt + i * gap, correct: c === '1', lessonId: 'x', exerciseId: `e${i}`, source: 'lesson' }));

describe('知识图谱', () => {
  it('编号唯一、先修都存在、没有环、先修排在前面', () => {
    const ids = KNOWLEDGE_POINTS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const k of KNOWLEDGE_POINTS) for (const p of k.prerequisites) expect(getKp(p.id)).toBeDefined();
    const order = topoOrder();
    for (const k of KNOWLEDGE_POINTS) for (const p of k.prerequisites) expect(order.indexOf(p.id)).toBeLessThan(order.indexOf(k.id));
  });

  it('10 以内加法的前置知识包含：数字认读、数量对应（数数）、数的组成', () => {
    const a = ancestors('m1.add10', true);
    expect(a).toEqual(expect.arrayContaining(['m1.count5', 'm1.count10', 'm1.compose5', 'm1.compose10', 'm1.add5']));
  });

  it('孩子看到的知识点名称拼音正确', () => {
    // 允许的规范读法：重叠词中间的“一”读轻声（分一分）
    const ok = new Set(['yi:yī']);
    for (const k of KNOWLEDGE_POINTS) {
      const han = [...k.kidName].filter((c) => /\p{Script=Han}/u.test(c));
      const ours = k.kidPy.split(' ');
      expect(ours).toHaveLength(han.length);
      const ref = pinyin(han.join(''), { type: 'array', toneType: 'symbol' });
      ours.forEach((py, i) => {
        if (py !== ref[i]) expect(ok.has(`${py}:${ref[i]}`)).toBe(true);
      });
    }
  });
});

describe('题目生成器（原创测试数据）', () => {
  const practicable = KNOWLEDGE_POINTS.filter((k) => k.practicable);

  it('标为可练习的知识点都有生成器；每题正确答案在选项中且计算正确', () => {
    for (const k of practicable) {
      expect(hasGenerator(k.id)).toBe(true);
      for (const e of kpRound(k.id, 20, seeded(7))) {
        expect(e.options.map((o) => o.id)).toContain(e.answerId);
        expect(new Set(e.options.map((o) => o.id)).size).toBe(e.options.length);
        expect(exerciseFromKpId(e.id)).toEqual(e); // 由 id 可还原
        const stem = typeof e.stem?.text === 'string' ? e.stem.text : '';
        const m = stem.match(/^(\d+) ([+−]) (\d+) = \?$/);
        if (m) expect(Number(e.answerId)).toBe(m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3]);
      }
    }
  });

  it('题目难度符合知识点：进位加法一定进位、退位减法一定退位、10 以内结果不超过 10', () => {
    const rand = seeded(11);
    for (let i = 0; i < 200; i++) {
      const [a, b] = kpRound('m1.carry20', 1, rand)[0].id.split(':')[2].split('+').map(Number);
      expect(a < 10 && b < 10 && a + b > 10).toBe(true);
      const [c, d] = kpRound('m1.borrow20', 1, rand)[0].id.split(':')[2].split('-').map(Number);
      expect(c > 10 && c % 10 < d && c - d < 10).toBe(true);
      expect(Number(kpRound('m1.add10', 1, rand)[0].answerId)).toBeLessThanOrEqual(10);
      expect(Number(kpRound('m1.sub5', 1, rand)[0].answerId)).toBeGreaterThanOrEqual(0);
    }
  });

  it('应用题拼音与文字一致（zh() 会在数量不一致时报错）', () => {
    for (const sig of ['fly-in:3:4', 'fly-away:9:2', 'eat:5:1', 'join:2:6']) {
      expect(() => kpExercise('m1.wordprob10', sig)).not.toThrow();
    }
    expect(kpExercise('m1.wordprob10', 'eat:5:1').answerId).toBe('4');
  });
});

describe('课程与知识点映射', () => {
  it('精做数学课的每道练习都映射到知识点', () => {
    const math = LESSONS.find((l) => l.subject === 'math')!;
    for (const s of math.steps) {
      const id = s.kind === 'exercise' ? s.exercise.id : s.id;
      if (s.kind === 'exercise' || 'skill' in s) expect(LESSON_MAP[`${math.id}/${id}`]).toBeDefined();
    }
  });

  it('口算主题、知识点练习、诊断题都能映射', () => {
    expect(kpForRecord('oral:add20', '7+5', 'oral.add20')).toBe('m1.carry20');
    expect(Object.values(ORAL_MAP).every((k) => getKp(k))).toBe(true);
    expect(kpForRecord('diag:m1.add10', 'kp:m1.compose10:7:3', 'm1.compose10')).toBe('m1.compose10');
  });

  it('一年级数学题库按标签映射，覆盖率 ≥ 70%，且报告各知识点的题量（输出到控制台）', () => {
    const counts: Record<string, number> = {};
    let total = 0;
    let mapped = 0;
    for (const entry of BANK_INDEX.filter((b) => b.subject === 'math' && b.grade === 1)) {
      const book = loadBook(entry.id)!;
      for (const u of book.units) for (const q of u.questions) {
        total++;
        const kp = kpForRecord(bankLessonId(u.id), q.id, `bank:math:${q.kp}`);
        if (kp) {
          mapped++;
          counts[kp] = (counts[kp] ?? 0) + 1;
        }
      }
    }
    expect(mapped / total).toBeGreaterThan(0.7);
    const table = KNOWLEDGE_POINTS.map((k) => `${k.id}\t${k.name}\t题库 ${counts[k.id] ?? 0}\t生成器 ${hasGenerator(k.id) ? '有' : '无'}`);
    // eslint-disable-next-line no-console
    console.log(`题库映射 ${mapped}/${total}\n${table.join('\n')}`);
  });

  it('复习时可以还原知识点练习题', () => {
    expect(resolveExercise('kp:m1.add10', 'kp:m1.add10:3+4')?.exercise.kind).toBe('choice');
  });
});

describe('掌握度', () => {
  it('五种状态：尚未学习 / 正在学习 / 初步掌握 / 需要复习 / 较稳定掌握', () => {
    expect(masteryOf('k', [], T0).state).toBe('not-started');
    expect(masteryOf('k', ev('11'), T0).state).toBe('learning'); // 证据太少
    expect(masteryOf('k', ev('10010'), T0 + DAY).state).toBe('learning'); // 40%
    expect(masteryOf('k', ev('1101'), T0).state).toBe('emerging'); // 75%，只在 1 天
    const twoDays = [...ev('111', T0), ...ev('11', T0 + 2 * DAY)];
    expect(masteryOf('k', twoDays, T0 + 2 * DAY).state).toBe('stable');
    expect(masteryOf('k', twoDays, T0 + 30 * DAY).state).toBe('needs-review'); // 很久没练
    expect(masteryOf('k', ev('1101'), T0 + 10 * DAY).state).toBe('needs-review');
    expect(masteryOf('k', [...ev('11111', T0), ...ev('000', T0 + DAY)], T0 + DAY).state).toBe('needs-review'); // 以前好，最近错
  });

  it('一两道错题不会把稳定掌握判成不会', () => {
    const e = [...ev('1111', T0), ...ev('1101', T0 + DAY)];
    expect(masteryOf('k', e, T0 + DAY).state).toBe('stable');
  });

  it('判断依据可追溯：给出答对数、天数、最近练习时间和证据记录', () => {
    const m = masteryOf('k', ev('1101'), T0);
    expect(m.reasons[0]).toBe('最近 4 题第一次答对 3 题');
    expect(m.evidence).toHaveLength(4);
  });

  it('完成精做课后，相关知识点状态从“尚未学习”发生变化', () => {
    const lesson = LESSONS.find((l) => l.subject === 'math')!;
    const before = computeMastery(createEmptyProgress(), T0);
    expect(before['m1.add5'].state).toBe('not-started');
    const s = run([
      { type: 'lesson/start', lessonId: lesson.id, subject: 'math', now: T0, resume: false },
      { type: 'exercise/result', lessonId: lesson.id, exerciseId: 's3-combine', subject: 'math', skill: 'math.add', firstTryCorrect: true, attempts: 1, now: T0 + 1 },
      { type: 'exercise/result', lessonId: lesson.id, exerciseId: 'add-1-4', subject: 'math', skill: 'math.add', firstTryCorrect: true, attempts: 1, now: T0 + 2 },
      { type: 'exercise/result', lessonId: lesson.id, exerciseId: 'tf-2-2', subject: 'math', skill: 'math.add', firstTryCorrect: false, attempts: 2, now: T0 + 3 },
      { type: 'lesson/complete', lessonId: lesson.id, subject: 'math', now: T0 + 4 },
    ]);
    const after = computeMastery(s, T0 + 5);
    expect(after['m1.add5'].attempts).toBe(3);
    expect(after['m1.add5'].state).toBe('emerging');
    expect(after['m1.add10'].state).toBe('not-started');
  });

  it('有到期错题时降为需要复习', () => {
    const s = run([
      res('kp:m1.add10:1+2', true, T0), res('kp:m1.add10:2+2', true, T0 + 1), res('kp:m1.add10:3+2', true, T0 + 2),
      res('kp:m1.add10:4+2', false, T0 + 3), res('kp:m1.add10:5+2', true, T0 + 4),
    ]);
    expect(computeMastery(s, T0 + 5)['m1.add10'].state).toBe('emerging'); // 今天刚错的题不重复扣分
    const m = computeMastery(s, T0 + DAY)['m1.add10'];
    expect(m.state).toBe('needs-review');
    expect(m.reasons).toContain('有到期需要复习的错题');
  });
});

describe('前置知识诊断', () => {
  it('判定规则：两题都对=掌握，两题都错=薄弱，一对一错再出一题', () => {
    expect(judge([true, true])).toBe('mastered');
    expect(judge([false, false])).toBe('weak');
    expect(judge([true, false])).toBeNull();
    expect(judge([true, false, true])).toBe('shaky');
    expect(judge([false, true, false])).toBe('weak');
  });

  it('只有反复出错才触发（≥3 次且最近答对率 < 60%）', () => {
    expect(isStruggling({ attempts: 2, recentCorrect: 0, recentTotal: 2 })).toBe(false);
    expect(isStruggling({ attempts: 5, recentCorrect: 3, recentTotal: 5 })).toBe(false);
    expect(isStruggling({ attempts: 4, recentCorrect: 1, recentTotal: 4 })).toBe(true);
  });

  /** 模拟一个孩子：知道哪些知识点会、哪些不会 */
  function simulate(target: string, knows: (kp: string) => boolean | 'shaky', mastery = {}) {
    let s = startDiagnosis(target);
    let guard = 0;
    const asked: string[] = [];
    for (;;) {
      const n = nextKp(s, mastery);
      s = n.session;
      if (!n.kpId || guard++ > 50) break;
      const k = knows(n.kpId);
      const idx = s.currentAnswers.length;
      const correct = k === 'shaky' ? idx !== 1 : k;
      asked.push(n.kpId);
      s = answer(s, `q${guard}`, correct);
    }
    return { summary: summarize(s), asked };
  }

  it('10 以内加法不会，原因是 10 以内的分与合不会 → 找到根因并给出学习顺序', () => {
    const { summary } = simulate('m1.add10', (kp) => !['m1.add10', 'm1.compose10'].includes(kp));
    expect(summary.targetVerdict).toBe('weak');
    expect(summary.roots).toEqual(['m1.compose10']);
    expect(summary.path).toEqual(['m1.compose10', 'm1.add10']);
    expect(summary.mastered).toEqual(expect.arrayContaining(['m1.add5', 'm1.count10', 'm1.compose5']));
  });

  it('目标本身确认会做 → 不往前查（之前可能是粗心）', () => {
    const { summary, asked } = simulate('m1.add10', () => true);
    expect(summary.targetVerdict).toBe('mastered');
    expect(asked).toEqual(['m1.add10', 'm1.add10']);
    expect(summary.roots).toEqual([]);
  });

  it('一对一错判为“不稳”，不往前查', () => {
    const { summary, asked } = simulate('m1.carry20', (kp) => (kp === 'm1.carry20' ? 'shaky' : true));
    expect(summary.shaky).toEqual(['m1.carry20']);
    expect(new Set(asked)).toEqual(new Set(['m1.carry20']));
  });

  it('已经较稳定掌握的先修直接跳过，不再出题', () => {
    const { summary, asked } = simulate('m1.add10', (kp) => kp !== 'm1.add10' && kp !== 'm1.compose10', {
      'm1.add5': { state: 'stable' },
    });
    expect(asked).not.toContain('m1.add5');
    expect(summary.mastered).toContain('m1.add5');
  });

  it('题量上限：到上限即停止', () => {
    let s = startDiagnosis('m1.addsub100', 4);
    for (let i = 0; i < 10; i++) {
      const n = nextKp(s);
      s = n.session;
      if (!n.kpId) break;
      s = answer(s, `q${i}`, false);
    }
    expect(s.answers.length).toBeLessThanOrEqual(4);
    expect(s.done || nextKp(s).kpId === null).toBe(true);
  });
});

describe('推荐', () => {
  it('反复出错 → 推荐“找原因”；可学的新知识需要先修已掌握', () => {
    const s = run([
      res('kp:m1.add10:1+2', false, T0), res('kp:m1.add10:2+2', false, T0 + 1), res('kp:m1.add10:3+2', true, T0 + 2),
      res('kp:m1.add10:4+2', false, T0 + 3),
    ]);
    const m = computeMastery(s, T0 + 10);
    const recs = recommendKps(s, m, T0 + 10, 10);
    expect(recs[0]).toMatchObject({ kind: 'diagnose', kpId: 'm1.add10' });
    expect(recs[0].reason).toContain('最近 4 题只对了 1 题');
    // 起点知识可以学；先修没掌握的不推荐为新知识
    expect(recs.some((r) => r.kind === 'new' && r.kpId === 'm1.count5')).toBe(true);
    expect(recs.some((r) => r.kind === 'new' && r.kpId === 'm1.carry20')).toBe(false);
  });

  it('3 天内诊断过的知识点不重复推荐诊断；诊断出的根因推荐复习', () => {
    let s = run([
      res('kp:m1.add10:1+2', false, T0), res('kp:m1.add10:2+2', false, T0 + 1), res('kp:m1.add10:3+2', false, T0 + 2),
    ]);
    s = progressReducer(s, {
      type: 'diagnosis/complete',
      record: { at: T0 + 3, target: 'm1.add10', verdicts: { 'm1.add10': 'weak', 'm1.compose10': 'weak' }, roots: ['m1.compose10'], questionCount: 6 },
    });
    expect(s.totalStars).toBe(1);
    const recs = recommendKps(s, computeMastery(s, T0 + 10), T0 + 10, 10);
    expect(recs.some((r) => r.kind === 'diagnose' && r.kpId === 'm1.add10')).toBe(false);
    expect(recs.find((r) => r.kpId === 'm1.compose10')).toMatchObject({ kind: 'review' });
  });

  it('经常做错的题型来自真实记录', () => {
    const s = run([
      res('kp:m1.wordprob10:fly-in:3:4', false, T0),
      res('kp:m1.wordprob10:eat:5:1', false, T0 + 1),
      res('kp:m1.wordprob10:join:2:2', true, T0 + 2),
    ]);
    expect(frequentMistakeTypes(s)[0]).toEqual({ label: '用加减法解决简单问题 · 看图解决问题', wrong: 2, total: 3 });
  });
});

describe('诊断结论与掌握度、推荐的联动', () => {
  it('找原因时判为掌握的知识点记为初步掌握；它的先修不再作为“新知识”推荐', () => {
    let s = run([res('kp:m1.add5:1+2', true, T0), res('kp:m1.add5:2+2', true, T0 + 1)]);
    s = progressReducer(s, {
      type: 'diagnosis/complete',
      record: { at: T0 + 2, target: 'm1.add10', verdicts: { 'm1.add5': 'mastered' }, roots: [], questionCount: 2 },
    });
    const m = computeMastery(s, T0 + 3);
    expect(m['m1.add5'].state).toBe('emerging');
    expect(m['m1.add5'].reasons).toContain('找原因时连续答对，判为初步掌握');
    const recs = recommendKps(s, m, T0 + 3, 20);
    expect(recs.some((r) => r.kind === 'new' && r.kpId === 'm1.count5')).toBe(false);
  });
});

describe('补好根因后回到目标知识点', () => {
  it('根因已掌握 → 推荐回到原知识点复习', () => {
    let s = run([res('kp:m1.add10:1+2', false, T0), res('kp:m1.add10:2+2', false, T0 + 1), res('kp:m1.add10:3+2', false, T0 + 2)]);
    s = progressReducer(s, {
      type: 'diagnosis/complete',
      record: { at: T0 + 3, target: 'm1.add10', verdicts: { 'm1.add10': 'weak', 'm1.compose10': 'weak' }, roots: ['m1.compose10'], questionCount: 6 },
    });
    for (let i = 0; i < 4; i++) s = progressReducer(s, res(`kp:m1.compose10:7:${i + 1}`, true, T0 + 10 + i) as never);
    const recs = recommendKps(s, computeMastery(s, T0 + 20), T0 + 20, 10);
    expect(recs.find((r) => r.kpId === 'm1.add10')).toMatchObject({ kind: 'review' });
    expect(recs.find((r) => r.kpId === 'm1.add10')!.reason).toContain('已经练好');
  });
});
