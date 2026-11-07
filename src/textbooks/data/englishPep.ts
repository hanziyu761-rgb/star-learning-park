/**
 * 第五批：人教版小学英语（PEP，三年级起点）——已核实目录（V4.0）。
 *
 * 来源：国家中小学智慧教育平台电子课本，平台版本名“人教版（主编：吴欣）”，出版社“人民教育出版社”，
 * 书名页印“英语（PEP）”。2026-11-08 由 Claude 在 APP 所有者已登录的浏览器里逐册打开 Contents 页逐条录入。
 * - 三～四年级上下册、五～六年级上册：书名“（根据2022年版课程标准修订）义务教育教科书·英语…”，封面标“2024”
 * - 五、六年级下册：平台现有的是未修订版“义务教育教科书·英语（三年级起点）…”，封面“教育部审定 2013”，单独登记
 * 只录单元名和页码；课文、插图、音频、习题版权归人民教育出版社，不复制。
 *
 * 题库对应：现有开源题库按 PEP 旧版（2012 版）单元整理。未修订版五、六年级下册与题库单元名逐字相同的才关联（见 BANK_MATCH），
 * 修订版单元与题库不同，不关联。
 */
import { UNIT_TO_KP } from '@/knowledge/graph';
import type { SourceRef, Term, Unit, Volume } from '../types';

const CN = ['', '一', '二', '三', '四', '五', '六'];
const CHECKED = '2026-11-08';

interface Plan {
  grade: number;
  term: Term;
  pages: number;
  toc: string;
}

/** 每行 “单元名 页码”；单元名按 Contents 页原样（Unit / Revision / Recycle / Appendix） */
const REVISED: Plan[] = [
  {
    grade: 3, term: '上', pages: 98,
    toc: `
Unit 1 Making friends 2
Unit 2 Different families 14
Unit 3 Our animal friends 26
Unit 4 Plants around us 38
Unit 5 The colourful world 50
Unit 6 Useful numbers 62
Revision Being a good guest 74
Appendix 1 Songs 78
Appendix 2 Chants in "Letters and sounds" 80
Appendix 3 Words in each unit 83
Appendix 4 Vocabulary 86
Appendix 5 Useful expressions 89
Appendix 6 The alphabet 91`,
  },
  {
    grade: 3, term: '下', pages: 98,
    toc: `
Unit 1 Meeting new people 2
Unit 2 My words and actions 14
Unit 3 Tools and senses for learning 26
Unit 4 Healthy food 38
Unit 5 Old things 50
Unit 6 Numbers in life 62
Revision Going to a school fair 74
Appendix 1 Songs 78
Appendix 2 Words in each unit 80
Appendix 3 Vocabulary 83
Appendix 4 Useful expressions 87
Appendix 5 Pronunciation 89`,
  },
  {
    grade: 4, term: '上', pages: 94,
    toc: `
Unit 1 Helping at home 2
Unit 2 My friends 14
Unit 3 Places we live in 26
Unit 4 Helping in the community 38
Unit 5 The weather and us 50
Unit 6 Changing for the seasons 62
Revision Let's help! 74
Appendix 1 Songs 78
Appendix 2 Words in each unit 80
Appendix 3 Vocabulary 83
Appendix 4 Useful expressions 86`,
  },
  {
    grade: 4, term: '下', pages: 98,
    toc: `
Unit 1 Class rules 2
Unit 2 Family rules 14
Unit 3 Time for school 26
Unit 4 Going shopping 38
Unit 5 Farms and us 50
Unit 6 From farm to table 62
Revision A great weekend plan 74
Appendix 1 Songs 78
Appendix 2 Words in each unit 80
Appendix 3 Vocabulary 83
Appendix 4 Useful expressions 86
Appendix 5 Pronunciation 88`,
  },
  {
    grade: 5, term: '上', pages: 95,
    toc: `
Unit 1 Different friends 2
Unit 2 My feelings 14
Unit 3 Work and play 26
Unit 4 Healthy habits 38
Unit 5 Food we eat 50
Unit 6 Nature and us 62
Revision New Year's party 74
Appendix 1 Songs 78
Appendix 2 Words in each unit 80
Appendix 3 Vocabulary 83
Appendix 4 Useful expressions 87`,
  },
  {
    grade: 6, term: '上', pages: 99,
    toc: `
Unit 1 Amazing places 2
Unit 2 Getting together 14
Unit 3 Healthy life 26
Unit 4 Managing money well 38
Unit 5 Exploring space 50
Unit 6 Energy, nature and us 62
Revision Learning in museums 74
Appendix 1 Songs 78
Appendix 2 Words in each unit 81
Appendix 3 Vocabulary 85
Appendix 4 Useful expressions 89
Appendix 5 Irregular verbs 92`,
  },
];

const LEGACY: Plan[] = [
  {
    grade: 5, term: '下', pages: 87,
    toc: `
Unit 1 My day 2
Unit 2 My favourite season 12
Unit 3 My school calendar 22
Recycle 1 32
Unit 4 When is the art show? 36
Unit 5 Whose dog is it? 46
Unit 6 Work quietly! 56
Recycle 2 66
Appendix 1: Songs in each unit 70
Appendix 2: Words in each unit 72
Appendix 3: Vocabulary 75
Appendix 4: Useful expressions 79
Appendix 5: Proverbs 80`,
  },
  {
    grade: 6, term: '下', pages: 78,
    toc: `
Unit 1 How tall are you? 2
Unit 2 Last weekend 12
Unit 3 Where did you go? 22
Unit 4 Then and now 32
Recycle Mike's happy days 42
Appendix 1: Songs in each unit 52
Appendix 2: Words in each unit 54
Appendix 3: Vocabulary 57
Appendix 4: Useful expressions 60
Appendix 5: Proverbs 61
Appendix 6: Short plays 62
Appendix 7: Irregular verbs 69
Appendix 8: English pronunciation patterns 70`,
  },
];

/** 未修订版单元 → 题库单元（单元名与题库逐字相同才关联；六下“Recycle”与题库“Recycle 2”名称不同，不关联） */
const BANK_MATCH: Record<string, string> = {
  'g5b:Unit 1 My day': 'english-g5b-u1',
  'g5b:Unit 2 My favourite season': 'english-g5b-u2',
  'g5b:Unit 3 My school calendar': 'english-g5b-u3',
  'g5b:Unit 4 When is the art show?': 'english-g5b-u4',
  'g5b:Unit 5 Whose dog is it?': 'english-g5b-u5',
  'g5b:Unit 6 Work quietly!': 'english-g5b-u6',
  'g6b:Unit 1 How tall are you?': 'english-g6b-u1',
  'g6b:Unit 2 Last weekend': 'english-g6b-u2',
  'g6b:Unit 3 Where did you go?': 'english-g6b-u3',
  'g6b:Unit 4 Then and now': 'english-g6b-u4',
};

/** 把逐行对照 Contents 页录入的目录转成单元；格式不对直接报错（测试会发现） */
export function parsePepToc(volId: string, toc: string, slot?: string): Unit[] {
  const lines = toc.split('\n').map((s) => s.trim()).filter(Boolean);
  return lines.map((line, i) => {
    const m = line.match(/^((?:Unit \d+|Revision|Recycle|Appendix \d+:?)(?: .+)?) (\d+)$/);
    if (!m) throw new Error(`PEP 目录行格式不对：${line}`);
    const bank = slot ? BANK_MATCH[`${slot}:${m[1]}`] : undefined;
    return {
      id: `${volId}.u${i}`,
      order: i,
      title: m[1],
      page: Number(m[2]),
      ...(m[1].startsWith('Appendix') ? { note: '附录' } : {}),
      provenance: 'verified' as const,
      lessons: [],
      kpIds: bank && UNIT_TO_KP[bank] ? [UNIT_TO_KP[bank]] : [],
      bankUnitIds: bank ? [bank] : [],
    };
  });
}

const COPYRIGHT = '目录只录单元名和页码；课文、插图、音频、习题和教师用书版权归人民教育出版社，不复制。';

function source(p: Plan, revised: boolean): SourceRef {
  const vol = `${CN[p.grade]}年级${p.term}册`;
  return {
    title: revised
      ? `国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·英语${vol}（人民教育出版社，PEP）电子课本 Contents 页（共 ${p.pages} 页，目录在第 5 页）`
      : `国家中小学智慧教育平台 义务教育教科书·英语（三年级起点）${vol}（人民教育出版社，PEP；书名未标注“根据2022年版课程标准修订”，封面“教育部审定 2013”）电子课本 Contents 页（共 ${p.pages} 页，目录在第 5 页）`,
    url: 'https://basic.smartedu.cn/tchMaterial',
    kind: 'official',
    checkedAt: CHECKED,
    note: '在平台“教材 → 小学 → 英语 → 人教版（主编：吴欣）”下打开电子课本，逐条对照 Contents 页录入（APP 所有者的已登录浏览器，Claude 查看）。',
  };
}

export const ENGLISH_PEP_2024: Volume[] = REVISED.map((p) => {
  const t = p.term === '上' ? 'a' : 'b';
  const id = `english.pep.2024.g${p.grade}${t}`;
  return {
    id,
    editionId: 'english.pep',
    subject: 'english',
    grade: p.grade,
    term: p.term,
    officialName: `（根据2022年版课程标准修订）义务教育教科书·英语 ${CN[p.grade]}年级${p.term}册`,
    revision: 2024,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供这一册；修订版启用时间和使用地区待核实。',
    regions: [],
    tocProvenance: 'verified',
    sources: [source(p, true)],
    units: parsePepToc(id, p.toc),
    copyright: COPYRIGHT,
  };
});

export const ENGLISH_PEP_LEGACY: Volume[] = LEGACY.map((p) => {
  const t = p.term === '上' ? 'a' : 'b';
  const id = `english.pep.legacy.g${p.grade}${t}`;
  return {
    id,
    editionId: 'english.pep',
    subject: 'english',
    grade: p.grade,
    term: p.term,
    officialName: `义务教育教科书·英语（三年级起点）${CN[p.grade]}年级${p.term}册（未修订版）`,
    revision: null,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台目前提供的是这一版；修订版启用后会成为历史版本（启用时间待核实）。',
    regions: [],
    tocProvenance: 'verified',
    sources: [source(p, false)],
    units: parsePepToc(id, p.toc, `g${p.grade}${t}`),
    bankBookId: `english-g${p.grade}${t}`,
    copyright: COPYRIGHT,
  };
});
