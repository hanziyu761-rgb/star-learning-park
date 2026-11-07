/**
 * 第二批：人教版小学数学 一至六年级 上下册（根据 2022 年版课程标准修订）——版本登记 + 已核实目录（V4.0）。
 *
 * 数学教材目录页只列单元（不列课时），所以只录单元名和页码。
 * 已核实：一～三年级上下册、四～六年级上册；平台现有的四～六年级下册为未修订版，另行登记（国家中小学智慧教育平台电子课本目录页，APP 所有者 2026-11-07 截图提供）。
 * 截图的目录页上没有出版社名称，按 APP 所有者在平台上选择的“人教版”登记。
 * 单元与旧版题库单元的对应、知识点关联是本项目按内容做的（沿用 V2.4 一年级新版重排），不是教材内容。
 */
import { UNIT_TO_KP } from '@/knowledge/graph';
import { NEW_EDITION } from '@/content/bank/edition';
import { CHECKED, SRC_ROLLOUT } from '../editions';
import type { SourceRef, Term, Unit, Volume } from '../types';

const CN = ['', '一', '二', '三', '四', '五', '六'];

const src = (vol: string, pages: number, note = ''): SourceRef => ({
  title: `国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·数学 ${vol} 电子课本 目录页（共 ${pages} 页，目录在第 5 页）`,
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: '2026-11-07',
  note: `APP 所有者在平台“教材 → 小学 → 数学 → 人教版”下打开并截图提供；目录页上未显示出版社名称。${note}`,
});

/** [目录上的序号（数学游戏、主题活动没有序号写 null）, 单元名, 页码, 题库单元, 知识点] */
type U = [label: string | null, title: string, page: number, bank: string[], note?: string];

function units(volId: string, bookId: string, rows: U[]): Unit[] {
  // 知识点：题库单元归到的知识点 + V2.4 新版重排时为这一单元指定的原创知识点
  const edKps = new Map<string, string[]>();
  for (const eu of NEW_EDITION[bookId]?.units ?? []) for (const f of eu.from) edKps.set(f, [...(edKps.get(f) ?? []), ...(eu.kps ?? [])]);
  return rows.map(([label, title, page, bank, note], i) => ({
    id: `${volId}.u${i}`,
    order: i,
    title: label ? `${label} ${title}` : title,
    page,
    ...(note ? { note } : {}),
    provenance: 'verified' as const,
    lessons: [],
    kpIds: [...new Set(bank.flatMap((b) => [UNIT_TO_KP[b], ...(edKps.get(b) ?? [])]).filter(Boolean))],
    bankUnitIds: bank,
  }));
}

const VERIFIED: Record<string, { rows: U[]; src: SourceRef }> = {
  g1a: {
    src: src('一年级上册', 118),
    rows: [
      [null, '数学游戏', 1, ['math-g1a-u1', 'math-g1a-u2', 'math-g1a-u7']],
      ['一', '5以内数的认识和加、减法', 12, ['math-g1a-u3']],
      ['二', '6～10的认识和加、减法', 34, ['math-g1a-u5']],
      ['三', '认识立体图形', 67, ['math-g1a-u4']],
      ['四', '11～20的认识', 73, ['math-g1a-u6']],
      ['五', '20以内的进位加法', 88, ['math-g1a-u8'], '目录截图上这一行的序号图标被遮住，按前后顺序为“五”'],
      ['六', '复习与关联', 103, ['math-g1a-u9']],
    ],
  },
  g1b: {
    src: src('一年级下册', 98),
    rows: [
      ['一', '认识平面图形', 1, ['math-g1b-u1']],
      ['二', '20以内的退位减法', 8, ['math-g1b-u2']],
      ['三', '100以内数的认识', 23, ['math-g1b-u4']],
      ['四', '100以内的口算加、减法', 43, ['math-g1b-u6']],
      ['五', '100以内的笔算加、减法', 56, ['math-g2a-u2']],
      ['六', '数量间的加减关系', 69, []],
      [null, '欢乐购物街', 77, ['math-g1b-u5'], '目录中没有单元序号（用图标标出）'],
      ['七', '复习与关联', 83, ['math-g1b-u8']],
    ],
  },
  g2a: {
    src: src('二年级上册', 107),
    rows: [
      ['一', '分类与整理', 1, ['math-g1b-u3']],
      ['二', '1～6的表内乘法', 10, ['math-g2a-u4']],
      ['三', '1～6的表内除法', 30, ['math-g2b-u2']],
      [null, '校园小导游', 49, [], '目录中没有单元序号（序号圆圈是空的）'],
      ['四', '厘米和米', 55, ['math-g2a-u1']],
      [null, '身体上的尺子', 68, [], '目录中没有单元序号'],
      ['五', '7～9的表内乘、除法', 73, ['math-g2a-u6', 'math-g2b-u4']],
      ['六', '复习与关联', 91, ['math-g2a-u9']],
    ],
  },
  g2b: {
    src: src('二年级下册', 106),
    rows: [
      [null, '时间在哪里', 1, ['math-g2a-u7'], '目录中没有单元序号（用图标标出）'],
      ['一', '有余数的除法', 10, ['math-g2b-u6']],
      ['二', '数量间的乘除关系', 24, []],
      ['三', '万以内数的认识', 40, ['math-g2b-u7']],
      ['四', '万以内的加法和减法', 63, ['math-g3a-u2', 'math-g3a-u4']],
      [null, '数学连环画', 83, [], '目录中没有单元序号（用图标标出）'],
      ['五', '复习与关联', 87, ['math-g2b-u10']],
    ],
  },
  g3a: {
    src: src('三年级上册', 114),
    rows: [
      ['一', '观察物体', 1, ['math-g2a-u5']],
      ['二', '混合运算', 6, ['math-g2b-u5']],
      ['三', '毫米、分米和千米', 20, ['math-g3a-u3']],
      [null, '曹冲称象的故事', 31, [], '目录中没有单元序号'],
      ['四', '多位数乘一位数', 39, ['math-g3a-u6']],
      [null, '数字编码', 57, [], '目录中没有单元序号（序号圆圈是空的）'],
      ['五', '线和角', 61, ['math-g2a-u3']],
      ['六', '分数的初步认识', 73, ['math-g3a-u8']],
      ['七', '复习与关联', 92, ['math-g3a-u10']],
    ],
  },
  g3b: {
    src: src('三年级下册', 114),
    rows: [
      ['一', '生活中的运动现象', 1, ['math-g2b-u3']],
      ['二', '除数是一位数的除法', 10, ['math-g3b-u2']],
      ['三', '长方形和正方形', 39, ['math-g3a-u7']],
      ['四', '图形的面积', 52, ['math-g3b-u5']],
      ['五', '数据的收集与整理', 65, ['math-g3b-u3']],
      [null, '年、月、日的秘密', 77, ['math-g3b-u6'], '目录中没有单元序号（用图标标出）'],
      ['六', '小数的初步认识', 86, ['math-g3b-u7']],
      ['七', '复习与关联', 95, ['math-g3b-u9']],
    ],
  },
  g4a: {
    src: src('四年级上册', 127),
    rows: [
      ['一', '万以上数的认识', 1, ['math-g4a-u1']],
      [null, '1亿有多大', 24, [], '目录中没有单元序号'],
      ['二', '角的度量', 28, ['math-g4a-u3']],
      ['三', '多位数乘两位数', 39, ['math-g4a-u4']],
      ['四', '加法模型和乘法模型', 58, []],
      ['五', '平行四边形和梯形', 70, ['math-g4a-u5']],
      ['六', '条形统计图', 88, ['math-g4a-u7']],
      [null, '寻找宝藏', 102, [], '目录中没有单元序号（序号圆圈是空的）'],
      ['七', '复习与关联', 108, ['math-g4a-u9']],
    ],
  },
  g5a: {
    src: src('五年级上册', 126),
    rows: [
      ['一', '观察简单组合体', 1, ['math-g5b-u1']],
      ['二', '小数乘法', 7, ['math-g5a-u1']],
      ['三', '小数除法', 24, ['math-g5a-u3']],
      ['四', '图形的运动', 39, ['math-g4b-u7'], '目录截图上这一行的序号图标被遮住，按前后顺序为“四”'],
      ['五', '用字母表示数和数量关系', 55, ['math-g5a-u5']],
      ['六', '多边形的面积', 72, ['math-g5a-u6']],
      [null, '有趣的密铺', 95, [], '目录中没有单元序号（序号圆圈是空的）'],
      ['七', '可能性', 98, ['math-g5a-u4']],
      ['八', '复习与关联', 107, ['math-g5a-u8']],
    ],
  },
  g6a: {
    src: src('六年级上册', 126),
    rows: [
      ['一', '确定位置', 1, ['math-g6a-u2']],
      ['二', '分数乘法', 16, ['math-g6a-u1']],
      ['三', '分数除法', 32, ['math-g6a-u3']],
      [null, '生活中的负数', 44, ['math-g6b-u1'], '目录中没有单元序号'],
      ['四', '圆', 48, ['math-g6a-u5']],
      [null, '体育中的数学', 74, [], '目录中没有单元序号（序号圆圈是空的）'],
      ['五', '百分数', 79, ['math-g6a-u6']],
      [null, '水是生命之源', 101, [], '目录中没有单元序号'],
      ['六', '复习与关联', 106, ['math-g6a-u9']],
    ],
  },
};

interface Plan {
  grade: number;
  term: Term;
  firstUse?: string;
  status: Volume['status'];
  statusNote: string;
}
const PLANS: Plan[] = [1, 2, 3, 4, 5, 6].flatMap((g): Plan[] => {
  const first = g === 1 ? '2024秋' : g <= 3 ? '2025秋' : '2026秋';
  return [
    { grade: g, term: '上', firstUse: first, status: 'current', statusNote: `${first}起${CN[g]}年级使用修订教材（报道未分学科；数学四至六年级 2026 秋启用有明确报道）。` },
    g >= 4
      ? { grade: g, term: '下', status: 'upcoming', statusNote: '修订版推算 2027 春启用（待核实）。' }
      : { grade: g, term: '下', status: 'current', statusNote: '与上册同一轮修订，下一学期启用（推算，待核实）。' },
  ];
});

export const MATH_PEP_2024: Volume[] = PLANS.map((p) => {
  const t = p.term === '上' ? 'a' : 'b';
  const id = `math.pep.2024.g${p.grade}${t}`;
  const ver = VERIFIED[`g${p.grade}${t}`];
  return {
    id,
    editionId: 'math.pep',
    subject: 'math',
    grade: p.grade,
    term: p.term,
    officialName: `义务教育教科书·数学 ${CN[p.grade]}年级${p.term}册（根据2022年版课程标准修订）`,
    revision: 2024,
    firstUse: p.firstUse,
    status: p.status,
    statusNote: p.statusNote,
    regions: [],
    tocProvenance: ver ? 'verified' : 'none',
    sources: [...(ver ? [ver.src] : []), { ...SRC_ROLLOUT, checkedAt: CHECKED }],
    units: ver ? units(id, `math-g${p.grade}${t}`, ver.rows) : [],
    bankBookId: `math-g${p.grade}${t}`,
    copyright: '目录只录单元名；教材正文、插图、例题、习题和教师用书版权归出版社，不复制。',
  };
});

/**
 * 平台目前提供的未修订版（书名没有“根据2022年版课程标准修订”）：目录已核实，单独登记，不当作修订版。
 */
const LEGACY: { grade: number; term: Term; pages: number; rows: U[] }[] = [
  {
    grade: 4,
    term: '下',
    pages: 123,
    rows: [
      ['1', '四则运算', 2, ['math-g4b-u1']],
      ['2', '观察物体（二）', 13, ['math-g4b-u2']],
      ['3', '运算律', 17, ['math-g4b-u3']],
      ['4', '小数的意义和性质', 32, ['math-g4b-u4']],
      ['5', '三角形', 57, ['math-g4b-u5']],
      ['6', '小数的加法和减法', 69, ['math-g4b-u6']],
      ['7', '图形的运动（二）', 79, ['math-g4b-u7']],
      ['8', '平均数与条形统计图', 87, ['math-g4b-u8']],
      [null, '营养午餐', 97, [], '目录中没有单元序号（用图标标出）'],
      ['9', '数学广角——鸡兔同笼', 99, ['math-g4b-u9']],
      ['10', '总复习', 103, ['math-g4b-u10']],
    ],
  },
  {
    grade: 5,
    term: '下',
    pages: 131,
    rows: [
      ['1', '观察物体（三）', 2, ['math-g5b-u1']],
      ['2', '因数和倍数', 5, ['math-g5b-u2']],
      ['3', '长方体和正方体', 18, ['math-g5b-u3']],
      [null, '探索图形', 44, [], '目录中没有单元序号（用图标标出）'],
      ['4', '分数的意义和性质', 45, ['math-g5b-u4']],
      ['5', '图形的运动（三）', 83, ['math-g5b-u5']],
      ['6', '分数的加法和减法', 89, ['math-g5b-u6']],
      [null, '怎样通知最快', 102, [], '目录中没有单元序号（用图标标出）'],
      ['7', '折线统计图', 104, ['math-g5b-u7']],
      ['8', '数学广角——找次品', 112, ['math-g5b-u8']],
      ['9', '总复习', 115, ['math-g5b-u9']],
    ],
  },
  {
    grade: 6,
    term: '下',
    pages: 122,
    rows: [
      ['1', '负数', 2, ['math-g6b-u1']],
      ['2', '百分数（二）', 8, ['math-g6b-u2']],
      [null, '生活与百分数', 15, [], '目录中没有单元序号（用图标标出）'],
      ['3', '圆柱与圆锥', 16, ['math-g6b-u3']],
      ['4', '比例', 38, ['math-g6b-u4']],
      [null, '自行车里的数学', 65, [], '目录中没有单元序号（用图标标出）'],
      ['5', '数学广角——鸽巢问题', 67, ['math-g6b-u5']],
      ['6', '整理和复习', 71, ['math-g6b-u6']],
    ],
  },
];

export const MATH_PEP_LEGACY: Volume[] = LEGACY.map((p) => {
  const t = p.term === '上' ? 'a' : 'b';
  const id = `math.pep.legacy.g${p.grade}${t}`;
  return {
    id,
    editionId: 'math.pep',
    subject: 'math',
    grade: p.grade,
    term: p.term,
    officialName: `义务教育教科书·数学 ${CN[p.grade]}年级${p.term}册（未修订版）`,
    revision: null,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台目前提供的是这一版；修订版启用后会成为历史版本（启用时间待核实）。',
    regions: [],
    tocProvenance: 'verified',
    sources: [
      {
        title: `国家中小学智慧教育平台 义务教育教科书·数学 ${CN[p.grade]}年级${p.term}册 电子课本 目录页（共 ${p.pages} 页；书名未标注“根据2022年版课程标准修订”）`,
        url: 'https://basic.smartedu.cn/tchMaterial',
        kind: 'official',
        checkedAt: '2026-11-07',
        note: 'APP 所有者在平台“教材 → 小学 → 数学 → 人教版”下打开并截图提供；目录页上未显示出版社名称。',
      },
    ],
    units: units(id, `math-g${p.grade}${t}`, p.rows),
    bankBookId: `math-g${p.grade}${t}`,
    copyright: '目录只录单元名；教材正文、插图、例题、习题和教师用书版权归出版社，不复制。',
  };
});
