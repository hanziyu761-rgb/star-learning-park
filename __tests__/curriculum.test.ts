/**
 * V2.2：一～六年级知识图谱（数学二～六年级、语文一～六年级、英语三～六年级）
 * 覆盖率、先修关系合理性、原创生成器答案（独立重算）、题库抽题、记录归属、按年级推荐、跨年级诊断。
 */
import { pinyin } from 'pinyin-pro';
import { BANK_INDEX, bookIdOfUnit, loadBook } from '@/content/bank';
import { resolveExercise } from '@/content/resolve';
import { answer, nextKp, startDiagnosis } from '@/knowledge/diagnose';
import { exerciseFromKpId, hasGenerator, hasOriginalGenerator, kpExercise, kpRound } from '@/knowledge/generators';
import { UPPER_GENERATORS, fmt, frac } from '@/knowledge/genUpper';
import { getKp, KNOWLEDGE_POINTS, kpsFor, topoOrder, UNIT_TO_KP } from '@/knowledge/graph';
import { kpForRecord } from '@/knowledge/mapping';
import { computeMastery } from '@/knowledge/mastery';
import { recommendKps } from '@/knowledge/recommend';
import type { ChoiceExercise, Exercise, ZhText } from '@/lesson/types';
import { createEmptyProgress, progressReducer, type ProgressAction } from '@/progress/model';

const T0 = new Date(2026, 10, 4, 9, 0, 0).getTime();
const seeded = (seed: number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
const REVIEW_UNIT = /总复习|整理和复习|期末|Recycle|综合复习|复习与关联/;
/** 选择题；“自己填数”题（V2.9）换回同一道题的选择题形式核对，并检查填数答案与它一致 */
function choice(e: Exercise): ChoiceExercise {
  if (e.kind === 'input') {
    const base = exerciseFromKpId(e.id.replace(/:in$/, ''));
    if (!base || base.kind !== 'choice') throw new Error(`填数题找不到原题：${e.id}`);
    const ans = base.options.find((o) => o.id === base.answerId)!.text;
    expect(typeof ans === 'string' ? ans : '').toBe(e.answer);
    return base;
  }
  if (e.kind !== 'choice') throw new Error(`期望选择题，实际是 ${e.kind}`);
  return e;
}
const text = (t: unknown) =>
  typeof t === 'string' ? t : Array.isArray(t) ? (t as ZhText).map((x) => x.char).join('') : '';
const nums = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).map(Number);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const run = (a: ProgressAction[], grade = 1) =>
  a.reduce(progressReducer, { ...createEmptyProgress(), settings: { ...createEmptyProgress().settings, grade } });
const res = (exerciseId: string, ok: boolean, at: number): ProgressAction => ({
  type: 'exercise/result',
  lessonId: `kp:${exerciseId.split(':')[1]}`,
  exerciseId,
  subject: 'math',
  skill: exerciseId.split(':')[1],
  firstTryCorrect: ok,
  attempts: ok ? 1 : 2,
  now: at,
});

describe('一～六年级知识图谱覆盖', () => {
  it('知识点数量：数学 1～6 年级、语文 1～6 年级、英语 3～6 年级都有', () => {
    for (let g = 1; g <= 6; g++) {
      expect(kpsFor('math', g).length).toBeGreaterThanOrEqual(10);
      expect(kpsFor('chinese', g).length).toBeGreaterThanOrEqual(12);
      if (g >= 3) expect(kpsFor('english', g).length).toBeGreaterThanOrEqual(10);
      else expect(kpsFor('english', g)).toHaveLength(0);
    }
    expect(KNOWLEDGE_POINTS.length).toBeGreaterThan(200);
  });

  it('题库中每个教学单元（不含复习单元、一年级数学按标签映射）都恰好对应一个知识点', () => {
    const missing: string[] = [];
    for (const b of BANK_INDEX) {
      if (b.id.startsWith('math-g1')) continue;
      for (const u of loadBook(b.id)!.units) {
        if (REVIEW_UNIT.test(u.title)) continue;
        // 初中语文题库《说明文与写作》在七年级上册课本里没有对应单元（V5.2，见 curriculum/junior.ts 说明），只这一个例外
        if (u.id === 'chinese-g7a-u2') continue;
        if (!UNIT_TO_KP[u.id]) missing.push(`${u.id} ${u.title}`);
      }
    }
    expect(missing).toEqual([]);
    // 知识点引用的单元都存在、且有足够的题
    for (const k of KNOWLEDGE_POINTS)
      for (const u of k.units ?? []) {
        const book = loadBook(bookIdOfUnit(u));
        const unit = book?.units.find((x) => x.id === u);
        expect(unit).toBeDefined();
        // 初中知识点（V5.2）练习用原创出题，题库单元只是补充，题少一些也够用
        if (k.grade <= 6) expect(unit!.questions.length).toBeGreaterThanOrEqual(15);
        else expect(hasOriginalGenerator(k.id) && unit!.questions.length >= 4).toBe(true);
        expect(REVIEW_UNIT.test(unit!.title)).toBe(false);
      }
    const all = KNOWLEDGE_POINTS.flatMap((k) => k.units ?? []);
    expect(new Set(all).size).toBe(all.length); // 一个单元只归一个知识点
  });

  it('先修关系：同学科、不晚于本知识点、无环；所有知识点都有题可练', () => {
    expect(() => topoOrder()).not.toThrow();
    const rank = (id: string) => {
      const k = getKp(id)!;
      return k.grade * 1000 + k.order; // order 已包含学期（下册 +50）
    };
    for (const k of KNOWLEDGE_POINTS) {
      // 一年级数学沿用 V2.0 的数据（人民币暂无题）；其余知识点都必须有题可练
      expect(hasGenerator(k.id)).toBe(k.practicable);
      if (k.grade > 1 || (k.subject ?? 'math') !== 'math') expect(k.practicable).toBe(true);
      for (const p of k.prerequisites) {
        const pk = getKp(p.id)!;
        expect(pk).toBeDefined();
        expect(pk.subject ?? 'math').toBe(k.subject ?? 'math');
        if (k.grade > 1 || (k.subject ?? 'math') !== 'math') expect(rank(p.id)).toBeLessThan(rank(k.id));
        expect(p.why.length).toBeGreaterThan(3);
      }
    }
    // 数学的 hard 先修链能跨年级回溯：六年级圆柱 → 圆 → 小数乘法 → 小数的意义 → 一位小数 → 分数初步认识 → 平均分
    const chain = ['m6.cylinder', 'm6.circle', 'm5.decmul', 'm4.decimal', 'm3.decimal1', 'm3.fraction1', 'm2.div1'];
    for (let i = 0; i < chain.length - 1; i++) {
      expect(getKp(chain[i])!.prerequisites.some((p) => p.id === chain[i + 1] && p.strength === 'hard')).toBe(true);
    }
  });
});

describe('二～六年级数学原创生成器（答案独立重算）', () => {
  const kps = Object.keys(UPPER_GENERATORS);

  it('至少 50 个知识点有原创生成器；每题答案在选项中、选项不重复、由 id 可还原', () => {
    expect(kps.length).toBeGreaterThanOrEqual(50);
    for (const kp of kps) {
      expect(getKp(kp)).toBeDefined();
      const rand = seeded(kp.length * 97 + 13);
      for (const e of kpRound(kp, 40, rand).map(choice)) {
        expect(e.options.length).toBeGreaterThanOrEqual(2);
        expect(e.options.map((o) => o.id)).toContain(e.answerId);
        expect(new Set(e.options.map((o) => o.id)).size).toBe(e.options.length);
        expect(exerciseFromKpId(e.id)).toEqual(e);
        expect(e.options.every((o) => !String(o.id).includes('NaN') && !String(o.id).includes('Infinity'))).toBe(true);
      }
    }
  });

  it('算式题：按题干独立计算（整数四则、带余除法、小数、分数）', () => {
    let checked = 0;
    for (const kp of kps) {
      const rand = seeded(kp.length * 31 + 7);
      for (const e of kpRound(kp, 60, rand).map(choice)) {
        const stem = text(e.stem?.text);
        let m = stem.match(/^(\d+) ([+−×÷]) (\d+) = \?$/);
        if (m) {
          const [a, b] = [Number(m[1]), Number(m[3])];
          if (e.answerId.includes('……')) {
            const [q, r] = e.answerId.split('……').map(Number);
            expect(q * b + r).toBe(a);
            expect(r).toBeLessThan(b);
            expect(r).toBeGreaterThan(0);
          } else {
            const v = { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[m[2] as '+'];
            expect(Number(e.answerId)).toBe(v);
          }
          checked++;
          continue;
        }
        m = stem.match(/^([\d.]+) ([+−×÷]) ([\d.]+) = \?$/);
        if (m) {
          // 小数：放大成整数再算
          const sc = 1000;
          const [a, b] = [Math.round(Number(m[1]) * sc), Math.round(Number(m[3]) * sc)];
          const v = { '+': (a + b) / sc, '−': (a - b) / sc, '×': (a * b) / sc / sc, '÷': a / b }[m[2] as '+'];
          expect(Number(e.answerId)).toBeCloseTo(v, 9);
          checked++;
          continue;
        }
        m = stem.match(/^(\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+) = \?$/);
        if (m) {
          const [a, b, c, d] = [m[1], m[2], m[4], m[5]].map(Number);
          const [n, dd] = {
            '+': [a * d + c * b, b * d],
            '−': [a * d - c * b, b * d],
            '×': [a * c, b * d],
            '÷': [a * d, b * c],
          }[m[3] as '+'];
          const g = gcd(n, dd);
          if (kp.startsWith('m3.')) {
            // 三年级还没学约分：结果保持同分母形式，只比较大小是否相等
            const [x, y] = e.answerId.split('/').map(Number);
            expect(x * dd).toBe(n * (y ?? 1));
          } else expect(e.answerId).toBe(dd / g === 1 ? String(n / g) : `${n / g}/${dd / g}`);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('应用题、公式题：按题目里的数独立验算', () => {
    const sample = (kp: string, n = 80) => kpRound(kp, n, seeded(kp.length * 7 + 3)).map(choice);
    let checked = 0;
    for (const e of sample('m4.chicken')) {
      const [h, l] = nums(text(e.prompt.text));
      const rabbit = Number(e.answerId);
      expect(rabbit * 4 + (h - rabbit) * 2).toBe(l);
      checked++;
    }
    for (const e of sample('m5.trees')) {
      const t = text(e.prompt.text);
      const [len, d] = nums(t);
      const k = len / d;
      expect(Number(e.answerId)).toBe(t.includes('两端都种') ? k + 1 : t.includes('两端都不种') ? k - 1 : k);
      checked++;
    }
    for (const e of sample('m3.perimeter')) {
      const t = text(e.prompt.text);
      const ns = nums(t);
      expect(Number(e.answerId)).toBe(t.startsWith('正方形') ? ns[0] * 4 : (ns[0] + ns[1]) * 2);
      checked++;
    }
    for (const e of sample('m5.equation')) {
      // 把 x 代回方程检验
      const st = text(e.stem?.text);
      const x = Number(e.answerId);
      const m = st.match(/^(?:(\d+)x|x) (?:\+ (\d+) )?= (\d+)$/)!;
      const a = m[1] ? Number(m[1]) : 1;
      expect(a * x + (m[2] ? Number(m[2]) : 0)).toBe(Number(m[3]));
      checked++;
    }
    for (const e of sample('m6.proportion')) {
      const [a, c, d] = nums(text(e.stem?.text));
      expect(Number(e.answerId) * d).toBe(a * c); // 内项积 = 外项积
      checked++;
    }
    for (const e of sample('m4.triangle')) {
      const t = text(e.prompt.text);
      const ns = nums(t);
      const ans = Number(e.answerId.replace('°', ''));
      if (t.includes('等腰')) expect(ns[0] + 2 * ans).toBe(180);
      else expect(ns[0] + ns[1] + ans).toBe(180);
      checked++;
    }
    for (const e of sample('m6.percent1')) {
      const t = text(e.prompt.text);
      const ns = nums(t);
      if (/的 \d+% 是/.test(t)) expect(Number(e.answerId)).toBe((ns[0] * ns[1]) / 100);
      else if (t.includes('百分之几')) expect(Number(e.answerId.replace('%', ''))).toBe((ns[0] * 100) / ns[1]);
      else expect(e.answerId).toBe(`${Math.round(ns[0] * 100)}%`);
      checked++;
    }
    for (const e of sample('m5.fraction')) {
      const t = text(e.prompt.text) + text(e.stem?.text);
      const ns = nums(t.replace(/\//g, ' '));
      if (t.includes('最简分数')) expect(e.answerId).toBe(frac(ns[0], ns[1]));
      else if (t.includes('最大公因数')) expect(Number(e.answerId)).toBe(gcd(ns[0], ns[1]));
      else if (t.includes('最小公倍数')) expect(Number(e.answerId)).toBe((ns[0] * ns[1]) / gcd(ns[0], ns[1]));
      else {
        const [a, b, c, d] = ns;
        expect(e.answerId).toBe(a * d > c * b ? '>' : a * d < c * b ? '<' : '=');
      }
      checked++;
    }
    for (const e of sample('m6.circle')) {
      const t = text(e.prompt.text);
      const n = nums(t)[0];
      const v = t.includes('面积') ? 3.14 * n * n : t.includes('半径') ? 2 * 3.14 * n : 3.14 * n;
      expect(Number(e.answerId)).toBeCloseTo(v, 6);
      checked++;
    }
    for (const e of sample('m2.time')) {
      const f = e.stem?.visual?.figure;
      if (f?.type !== 'clock') throw new Error('读钟题要有钟面');
      expect(e.answerId).toBe(`${f.hour}时${f.minute}分`);
      checked++;
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('定点小数与分数格式化', () => {
    expect(fmt(305, 2)).toBe('3.05');
    expect(fmt(320, 2)).toBe('3.2');
    expect(fmt(5, 2)).toBe('0.05');
    expect(fmt(1000, 2)).toBe('10');
    expect(frac(6, 8)).toBe('3/4');
    expect(frac(4, 2)).toBe('2');
  });

  it('二年级题目带拼音，且与词库一致（规范读法除外）', () => {
    // 规范读法：重叠词中间的“一”读轻声；动词“数”读 shǔ；计数单位“几个一”的“一”读本调；“多少”的“少”读轻声
    const OK = new Set(['一:yi:yī', '数:shǔ:shù', '一:yī:yì', '少:shao:shǎo']);
    const problems: string[] = [];
    for (const kp of kps.filter((k) => k.startsWith('m2.'))) {
      for (const e of kpRound(kp, 30, seeded(5)).map(choice)) {
        const texts: ZhText[] = [];
        const visit = (v: unknown) => {
          if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0] && 'char' in v[0])
            texts.push(v as ZhText);
          else if (Array.isArray(v)) v.forEach(visit);
          else if (v && typeof v === 'object') Object.values(v).forEach(visit);
        };
        visit(e);
        expect(texts.length).toBeGreaterThan(0);
        for (const t of texts) {
          const han = t.filter((x) => x.py);
          const ref = pinyin(han.map((x) => x.char).join(''), { type: 'array', toneType: 'symbol' });
          han.forEach((x, i) => {
            if (x.py !== ref[i] && !OK.has(`${x.char}:${x.py}:${ref[i]}`))
              problems.push(`${kp} ${x.char} ${x.py}/${ref[i]}`);
          });
        }
      }
    }
    expect([...new Set(problems)]).toEqual([]);
  });
});

describe('语文、英语和其它只有题库的知识点', () => {
  it('从对应单元抽题；题目 id 可还原；复习本能找到；作答记录归到知识点', () => {
    for (const kp of ['c1.a3', 'c3.a4', 'c6.b5', 'e3.a2', 'e6.b3', 'm4.parallel']) {
      expect(hasOriginalGenerator(kp)).toBe(false);
      const unit = getKp(kp)!.units![0];
      const round = kpRound(kp, 8, seeded(3));
      expect(round.length).toBe(8);
      expect(new Set(round.map((e) => e.id)).size).toBe(8);
      for (const e of round) {
        expect(e.id.startsWith(`kp:${kp}:b:${unit}:`)).toBe(true);
        expect(e.skill).toBe(kp);
        expect(exerciseFromKpId(e.id)).toEqual(e);
        const r = resolveExercise(`kp:${kp}`, e.id)!;
        expect(r.exercise).toEqual(e);
        expect(r.subject).toBe(getKp(kp)!.subject);
        expect(kpForRecord(`kp:${kp}`, e.id, kp)).toBe(kp);
      }
      // 直接在“题库闯关”里做的题也归到同一个知识点
      const q = loadBook(bookIdOfUnit(unit))!.units.find((u) => u.id === unit)!.questions[0];
      expect(kpForRecord(`bank:${unit}`, q.id, 'bank:x:y')).toBe(kp);
    }
    // 伪造的签名不能冒充别的单元
    expect(exerciseFromKpId('kp:c3.a4:b:chinese-g6b-u1:xxx')).toBeNull();
  });

  it('题库练习会更新语文知识点的掌握度', () => {
    const unit = getKp('c2.a2')!.units![0];
    const qs = loadBook('chinese-g2a')!
      .units.find((u) => u.id === unit)!
      .questions.slice(0, 5);
    const s = qs.reduce(
      (st, q, i) =>
        progressReducer(st, {
          type: 'exercise/result',
          lessonId: `bank:${unit}`,
          exerciseId: q.id,
          subject: 'chinese',
          skill: `bank:chinese:${q.kp}`,
          firstTryCorrect: true,
          attempts: 1,
          now: T0 + i * 60_000,
        }),
      createEmptyProgress(),
    );
    const m = computeMastery(s, T0 + 24 * 3600_000);
    expect(m['c2.a2'].state).not.toBe('not-started');
    expect(m['c2.a2'].attempts).toBe(5);
  });
});

describe('按年级推荐与跨年级诊断', () => {
  it('三年级新用户：只推荐三年级的新知识；低年级先修没练过时默认学过并说明理由', () => {
    const s = run([], 3);
    const recs = recommendKps(s, computeMastery(s, T0), T0, 200);
    expect(recs.length).toBeGreaterThan(10);
    expect(recs.every((r) => r.kind === 'new' && getKp(r.kpId)!.grade === 3)).toBe(true);
    const mul = recs.find((r) => r.kpId === 'm3.mul1d')!;
    expect(mul.reason).toContain('默认在学校学过');
    // 按学科筛选
    const zh = recommendKps(s, computeMastery(s, T0), T0, 200, { subject: 'chinese' });
    expect(zh.every((r) => getKp(r.kpId)!.subject === 'chinese')).toBe(true);
  });

  it('低年级先修练过但没掌握 → 不推荐依赖它的新知识，改为推荐找原因', () => {
    const s = run(
      [
        res('kp:m2.mul2:7×3', false, T0),
        res('kp:m2.mul2:8×4', false, T0 + 1),
        res('kp:m2.mul2:9×6', false, T0 + 2),
        res('kp:m2.mul2:7×7', true, T0 + 3),
      ],
      3,
    );
    const m = computeMastery(s, T0 + 10);
    const recs = recommendKps(s, m, T0 + 10, 200);
    expect(recs[0]).toMatchObject({ kind: 'diagnose', kpId: 'm2.mul2' });
    expect(recs.some((r) => r.kind === 'new' && r.kpId === 'm3.mul1d')).toBe(false);
    expect(recs.some((r) => r.kind === 'new' && r.kpId === 'm3.times')).toBe(false);
  });

  it('诊断：四年级“除数是两位数的除法”薄弱 → 回溯到三年级的除法和乘法', () => {
    let d = startDiagnosis('m4.div2d');
    let step = nextKp(d);
    expect(step.kpId).toBe('m4.div2d');
    d = answer(step.session, 'x1', false);
    d = answer(d, 'x2', false);
    step = nextKp(d);
    expect(['m3.div1d', 'm3.mul2d']).toContain(step.kpId);
    // 诊断题能出：用原创生成器
    expect(kpExercise('m3.div1d', '84÷4').kind).toBe('choice');
  });
});
