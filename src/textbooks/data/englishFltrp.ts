/**
 * 第五批：外研社版小学英语（平台版本名“外研社版（主编：孙有中）”，三年级起点）——已核实目录（V4.0）。
 *
 * 来源：国家中小学智慧教育平台电子课本，教材详情页显示出版社“外语教学与研究出版社”。
 * 2026-11-08 由 Claude 在 APP 所有者已登录的浏览器里逐册打开 Contents 页逐条录入。
 * 平台在这一版本下列出 7 册，书名都带“（根据2022年版课程标准修订）”：三～五年级上下册、六年级上册；
 * 六年级下册平台尚未列出，不登记。
 * 平台另有“外研社版（主编：刘兆义）”“外研社版（主编：张祖春）”两套，是不同的书，这里不包括。
 * 只录单元名和页码；课文、插图、音频、习题版权归外语教学与研究出版社，不复制。
 * 现有题库按人教 PEP 旧版整理，与外研社版单元不对应，不关联。
 */
import type { LessonEntry, SourceRef, Term, Unit, Volume } from '../types';

const CN = ['', '一', '二', '三', '四', '五', '六'];
const CHECKED = '2026-11-08';

interface Plan {
  grade: number;
  term: Term;
  pages: number;
  tocPage: number;
  /** 每行“单元名 页码”；附录行写成“Appendices 页码 | 子项 页码; 子项 页码” */
  toc: string;
}

const PLANS: Plan[] = [
  {
    grade: 3, term: '上', pages: 100, tocPage: 7,
    toc: `
Welcome to school 2
Unit 1 Let's be friends! 6
Unit 2 My school things 18
Unit 3 It's a colourful world! 30
Unit 4 Fun with numbers 42
Unit 5 We're family 54
Unit 6 My sweet home 66
Appendices 79 | Plays 80; Words and expressions 86; Word list 89; Proper nouns 92; Words and expressions in plays 92`,
  },
  {
    grade: 3, term: '下', pages: 99, tocPage: 6,
    toc: `
Unit 1 Animal friends 2
Unit 2 Know your body 14
Unit 3 Yummy food 26
Unit 4 What's your hobby? 38
Unit 5 What time is it? 50
Unit 6 A great week 62
Appendices 75 | Plays 76; Words and expressions 82; Word list 86; Proper nouns 91; Words and expressions in plays 92`,
  },
  {
    grade: 4, term: '上', pages: 99, tocPage: 6,
    toc: `
Unit 1 I love sports 2
Unit 2 Helping at home 14
Unit 3 What's the weather like? 26
Unit 4 Wonderful seasons 38
Unit 5 Let's go! 50
Unit 6 Find your way 62
Appendices 75 | Plays 76; Words and expressions 82; Word list 86; Proper nouns 91; Words and expressions in plays 92`,
  },
  {
    grade: 4, term: '下', pages: 99, tocPage: 6,
    toc: `
Unit 1 People at work 2
Unit 2 How do you feel today? 14
Unit 3 Everyone's got talent! 26
Unit 4 Plant life 38
Unit 5 School activities 50
Unit 6 Cool clothes 62
Appendices 75 | Plays 76; Words and expressions 82; Word list 86; Proper nouns 91; Words and expressions in plays 92`,
  },
  {
    grade: 5, term: '上', pages: 108, tocPage: 7,
    toc: `
Unit 1 What's on your plate? 2
Unit 2 A green life 14
Unit 3 Happy together 26
Unit 4 A better me 38
Unit 5 Look into the future 50
Unit 6 Enjoy the festivals 62
Appendices 75 | More activities 76; Plays 88; Words and expressions 94; Word list 96; Proper nouns 99; Words and expressions in plays 100`,
  },
  {
    grade: 5, term: '下', pages: 107, tocPage: 6,
    toc: `
Unit 1 Growing up 2
Unit 2 You can make a difference 14
Unit 3 We love reading 26
Unit 4 Back in time 38
Unit 5 Work it out 50
Unit 6 Then and now 62
Appendices 75 | More activities 76; Plays 88; Words and expressions 94; Word list 96; Proper nouns 99; Words and expressions in plays 100`,
  },
  {
    grade: 6, term: '上', pages: 116, tocPage: 6,
    toc: `
Unit 1 What do you do with money? 2
Unit 2 What's your opinion? 14
Unit 3 Wonderful nature 26
Unit 4 We can do it! 38
Unit 5 Health matters 50
Unit 6 See the world 62
Appendices 75 | More activities 76; Plays 88; Words and expressions 96; Word list 99; Proper nouns 103; Words and expressions in plays 104`,
  },
];

const ROW = /^(.+) (\d+)$/;

/** 把逐行对照 Contents 页录入的目录转成单元（附录子项作为附录单元下的条目）；格式不对直接报错 */
export function parseFltrpToc(volId: string, toc: string): Unit[] {
  const lines = toc.split('\n').map((s) => s.trim()).filter(Boolean);
  return lines.map((line, i) => {
    const [head, rest] = line.split(' | ');
    const m = head.match(ROW);
    if (!m || !/^(Unit \d+ |Welcome|Appendices)/.test(m[1])) throw new Error(`外研社版目录行格式不对：${line}`);
    const uid = `${volId}.u${i}`;
    const lessons: LessonEntry[] = (rest ? rest.split('; ') : []).map((p, j) => {
      const s = p.match(ROW);
      if (!s) throw new Error(`外研社版附录条目格式不对：${p}`);
      return { id: `${uid}.l${j + 1}`, order: j + 1, title: s[1], kind: 'other', page: Number(s[2]), provenance: 'verified' };
    });
    return {
      id: uid,
      order: i,
      title: m[1],
      page: Number(m[2]),
      ...(m[1] === 'Appendices' ? { note: '附录' } : {}),
      provenance: 'verified' as const,
      lessons,
      kpIds: [],
      bankUnitIds: [],
    };
  });
}

function source(p: Plan): SourceRef {
  return {
    title: `国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·英语${CN[p.grade]}年级${p.term}册（外语教学与研究出版社）电子课本 Contents 页（共 ${p.pages} 页，目录在第 ${p.tocPage} 页）`,
    url: 'https://basic.smartedu.cn/tchMaterial',
    kind: 'official',
    checkedAt: CHECKED,
    note: '在平台“教材 → 小学 → 英语 → 外研社版（主编：孙有中）”下打开电子课本，逐条对照 Contents 页录入（APP 所有者的已登录浏览器，Claude 查看）。',
  };
}

export const ENGLISH_FLTRP_2024: Volume[] = PLANS.map((p) => {
  const id = `english.fltrp.2024.g${p.grade}${p.term === '上' ? 'a' : 'b'}`;
  return {
    id,
    editionId: 'english.fltrp',
    subject: 'english',
    grade: p.grade,
    term: p.term,
    officialName: `（根据2022年版课程标准修订）义务教育教科书·英语 ${CN[p.grade]}年级${p.term}册（外研社版，主编：孙有中）`,
    revision: 2024,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供这一册；修订版启用时间和使用地区待核实。',
    regions: [],
    tocProvenance: 'verified',
    sources: [source(p)],
    units: parseFltrpToc(id, p.toc),
    copyright: '目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归外语教学与研究出版社，不复制。',
  };
});
