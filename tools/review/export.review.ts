/**
 * 教师审核表导出（V2.12 一年级；V2.15 一～六年级各一份）：把 APP 里每个年级会出现的题目、讲解、短文整理成表格，交给一线老师逐条审核。
 * 运行：npm run review:export  （先用 Jest 运行环境导出 JSON，再由 tools/review/make_xlsx.py 生成 Excel）
 * 输出：review-out/grade{1-6}-review.json、review-out/{一～六}年级教师审核表.xlsx（构建产物，不提交）
 */
import fs from 'fs';
import path from 'path';
import { describeExercise } from '@/ai/describe';
import { LESSONS } from '@/content';
import { BANK_INDEX, loadBook } from '@/content/bank';
import { auditBook, auditCoverage } from '@/content/bank/audit';
import { fixBankPinyin, polyphonesOf } from '@/content/bank/pyfix';
import { ORAL_TOPICS, oralRound } from '@/content/oral';
import { WRITE_CHARS, WRITE_CHARS_G2 } from '@/content/writing';
import { plainText } from '@/content/zh';
import { hasOriginalGenerator, kpRound } from '@/knowledge/generators';
import { kpsFor } from '@/knowledge/graph';
import { KP_TEACH } from '@/knowledge/teach';
import type { DisplayText, Exercise } from '@/lesson/types';
import { levelOfGrade, seeded } from '@/thinking/challenges';
import { gensFor } from '@/thinking/registry';

interface Row {
  编号: string;
  分类: string;
  学科: string;
  位置: string;
  题型: string;
  题目: string;
  选项: string;
  答案: string;
  讲解: string;
  来源: string;
  自动核查: string;
  多音字核对?: string;
}

const SUBJ = { math: '数学', chinese: '语文', english: '英语' } as const;
const KIND: Record<string, string> = {
  choice: '选择',
  multi: '多选',
  truefalse: '判断',
  sort: '排序',
  input: '填数',
  trace: '描红',
  'drag-match': '拖动配对',
  'grid-place': '拖到方格',
  'grid-tap': '方格点选',
  'shape-pick': '点选图形',
  bins: '分类',
  rotate: '旋转',
  'clock-set': '拨钟',
  'pattern-fill': '找规律',
};
const t = (x: DisplayText | undefined) => (x === undefined ? '' : plainText(x));
const SOURCE = { original: '原创', 'verified-textbook': '已核实教材对应', unverified: '未核实' } as const;

function exRow(id: string, cat: string, subject: string, where: string, e: Exercise, source: string, check = ''): Row {
  const d = describeExercise(e);
  return {
    编号: id,
    分类: cat,
    学科: subject,
    位置: where,
    题型: KIND[e.kind] ?? e.kind,
    题目: d.question,
    选项: (d.options ?? []).join(' / '),
    答案: d.answer ?? '',
    讲解: e.explanation ?? '',
    来源: source,
    自动核查: check,
    多音字核对: '',
  };
}

const OUT = path.join(process.cwd(), 'review-out');

const CN = ['', '一', '二', '三', '四', '五', '六'];

function exportGrade(grade: number) {
  const rows: Row[] = [];
  const level = levelOfGrade(grade);

  // 1. 课程（含英语启蒙三条主线、语文阅读小屋）
  // 一年级：所有不分年级的课程（启蒙课、英语三条主线）和一年级阅读小屋；二年级起：本年级阅读小屋
  for (const l of LESSONS.filter((x) => (x.grade ?? 1) === grade)) {
    for (const s of l.steps) {
      if (s.kind === 'read-passage')
        rows.push({
          编号: `${l.id}/${s.id}`,
          分类: '课程',
          学科: SUBJ[l.subject],
          位置: t(l.title),
          题型: '短文',
          题目: s.paragraphs.map(t).join(''),
          选项: '',
          答案: '',
          讲解: '',
          来源: `${SOURCE[l.source]}；${l.sourceNote}`,
          自动核查: grade <= 2 ? '拼音已逐字核对词库' : '不注拼音',
        });
      if (s.kind === 'exercise')
        rows.push(
          exRow(
            `${l.id}/${s.exercise.id}`,
            '课程',
            SUBJ[l.subject],
            t(l.title),
            s.exercise,
            `${SOURCE[l.source]}；${l.sourceNote}`,
            grade <= 2 ? '拼音已逐字核对词库' : '不注拼音',
          ),
        );
    }
  }

  // 2. 知识点小讲解
  for (const subj of ['math', 'chinese', 'english'] as const)
    for (const k of kpsFor(subj, grade))
      (KP_TEACH[k.id] ?? []).forEach((sl, i) =>
        rows.push({
          编号: `teach/${k.id}/${i + 1}`,
          分类: '知识点小讲解',
          学科: SUBJ[subj],
          位置: k.name,
          题型: '讲解',
          题目: `${sl.show.replace(/\n/g, '  ')} —— ${t(sl.text)}`,
          选项: '',
          答案: '',
          讲解: '',
          来源: '原创',
          自动核查:
            typeof sl.text === 'string'
              ? sl.lang === 'en-US'
                ? '英语句型为自编通用表达'
                : '不注拼音'
              : '拼音已逐字核对词库',
        }),
      );

  // 3. 知识点练习（程序出题，答案由程序计算）：每个知识点抽 6 道
  for (const k of kpsFor('math', grade).filter((x) => hasOriginalGenerator(x.id))) {
    const rand = seeded(1000 + grade * 100 + k.order);
    for (const e of kpRound(k.id, 6, rand))
      rows.push(
        exRow(e.id, '知识点练习（程序出题）', '数学', k.name, e, '原创生成器', '答案由程序计算并有单元测试核对'),
      );
  }

  // 4. 口算闯关
  for (const topic of ORAL_TOPICS.filter((x) => x.grade === grade))
    rows.push({
      编号: `oral/${topic.id}`,
      分类: '口算闯关',
      学科: '数学',
      位置: topic.title,
      题型: '口算',
      题目: `例题：${oralRound(topic, 6, seeded(7)).join('，')}`,
      选项: '',
      答案: '',
      讲解: '',
      来源: '原创生成器',
      自动核查: '答案由程序计算',
    });

  // 5. 描红写字（一、二年级）
  for (const c of grade === 1 ? WRITE_CHARS : grade === 2 ? WRITE_CHARS_G2 : [])
    rows.push({
      编号: `write/${c.char}`,
      分类: '描红写字',
      学科: '语文',
      位置: c.char,
      题型: '描红',
      题目: `${c.char}（${c.py}）`,
      选项: '',
      答案: `笔顺：${c.strokes.map((s) => s[0]).join('、')}`,
      讲解: '',
      来源: '原创（笔画为简化折线）',
      自动核查: '笔画数与常考笔顺有单元测试',
    });

  // 6. 每日挑战（本年级难度）：每种题型抽 4 道
  const rand = seeded(20261105 + grade);
  for (const subj of ['math', 'chinese', 'english'] as const)
    for (const g of gensFor(subj, level))
      for (let k = 0; k < 4; k++) {
        const sig = g.sig(rand, level);
        const e = { ...g.build(sig), id: `ch:${sig}`, skill: `thinking:${g.type}` } as Exercise;
        rows.push(exRow(e.id, '每日挑战', SUBJ[subj], g.name, e, '原创生成器', '答案由程序计算并有单元测试核对'));
      }

  // 7. 题库（本年级上、下册；一年级按新版教材单元）
  const bankStats: Record<string, unknown>[] = [];
  for (const id of BANK_INDEX.filter((b) => b.grade === grade).map((b) => b.id)) {
    const book = loadBook(id)!;
    const issues = auditBook(book);
    const issueOf = new Map(issues.map((i) => [i.id, i.detail]));
    let fixedQ = 0;
    let polyQ = 0;
    for (const u of book.units)
      for (const q of u.questions) {
        const notes: string[] = [];
        if (issueOf.has(q.id)) notes.push(`⚠ ${issueOf.get(q.id)}`);
        if (q.qpy) {
          const { fixed } = fixBankPinyin(q.q, q.qpy.split(' '));
          if (fixed) {
            notes.push(`已纠正 ${fixed} 处多音字拼音`);
            fixedQ += 1;
          }
          if (polyphonesOf(q.q, q.qpy.split(' '))) polyQ += 1;
        }
        const opts = q.o ?? [];
        rows.push({
          编号: `bank/${q.id}`,
          分类: '题库（AI 生成）',
          学科: SUBJ[book.subject],
          位置: `${book.title} ${u.title}`,
          题型: q.t === 'tf' ? '判断' : q.t === 'order' ? '排序' : '选择',
          题目: q.q,
          选项: opts.join(' / '),
          答案:
            q.t === 'tf'
              ? q.a
                ? '对'
                : '错'
              : q.t === 'order'
                ? (q.a as number[]).map((i) => opts[i]).join(' ')
                : (opts[q.a as number] ?? ''),
          讲解: q.ex ?? '',
          来源: 'ChinaStudyFree 题库（MIT，AI 生成，未逐题人工审核）',
          多音字核对: q.qpy ? polyphonesOf(q.q, q.qpy.split(' ')) : '',
          自动核查: notes.join('；') || (book.subject === 'math' ? '结构、能验算的算式通过' : '结构通过'),
        });
      }
    bankStats.push({
      book: id,
      title: book.title,
      total: book.units.reduce((s, u) => s + u.questions.length, 0),
      issues: issues.length,
      pinyinFixedQuestions: fixedQ,
      polyphoneQuestions: polyQ,
      ...((c) => ({ withEquations: c.questions, equations: c.equations }))(auditCoverage(book)),
    });
  }

  // 同一道题出现多次（抽样重复、题库同题归入两个单元）只保留第一次
  const seen = new Map<string, number>();
  const dup: string[] = [];
  const unique = rows.filter((r) => {
    const n = seen.get(r.编号) ?? 0;
    seen.set(r.编号, n + 1);
    if (n) dup.push(r.编号);
    return n === 0;
  });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, `grade${grade}-review.json`),
    JSON.stringify(
      {
        grade,
        gradeName: `${CN[grade]}年级`,
        generatedAt: new Date().toISOString(),
        rows: unique,
        bankStats,
        duplicates: dup,
      },
      null,
      1,
    ),
  );
  return unique;
}

it('导出一～六年级教师审核表数据', () => {
  for (const g of [1, 2, 3, 4, 5, 6]) {
    const rows = exportGrade(g);
    expect(rows.length).toBeGreaterThan(1000);
    // 每个年级都有讲解、题库、每日挑战
    for (const cat of ['知识点小讲解', '题库（AI 生成）', '每日挑战'])
      expect(rows.some((r) => r.分类 === cat)).toBe(true);
  }
});
