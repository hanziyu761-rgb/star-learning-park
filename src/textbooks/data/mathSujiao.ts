/**
 * 第四批：苏教版小学数学（根据 2022 年版课程标准修订）——已核实目录（V4.0）。
 *
 * 只登记已经拿到官方目录截图的册。数学目录页只列单元（不列课时），所以只录单元名和页码。
 * 来源：国家中小学智慧教育平台电子课本全屏阅读页（目录页），APP 所有者 2026-11-07 截图提供。
 * 截图页头书名为“（根据2022年版课程标准修订）义务教育教科书·数学…”（被截断），页面上没有显示出版社名称，
 * 按 APP 所有者在平台上选择的“苏教版”登记。
 * 现有题库按人教版旧版单元整理，与苏教版单元不对应，所以这里不关联题库和知识点。
 */
import type { SourceRef, Term, Unit, Volume } from '../types';

const CN = ['', '一', '二', '三', '四', '五', '六'];
const ICON = '目录上用图标标出，没有单元序号';

const src = (vol: string, pages: number, note = ''): SourceRef => ({
  title: `国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·数学 ${vol}（苏教版）电子课本 目录页（全屏阅读页，共 ${pages} 页）`,
  url: 'https://basic.smartedu.cn/tchMaterial',
  kind: 'official',
  checkedAt: '2026-11-07',
  note: `APP 所有者在平台选择“苏教版”后打开并截图提供；页头书名被截断，页面上没有显示出版社名称。${note}`,
});

/** [目录上的序号（图标栏目、期末复习没有序号写 null）, 单元名, 页码, 备注] */
type U = [label: string | null, title: string, page: number, note?: string];

function units(volId: string, rows: U[]): Unit[] {
  return rows.map(([label, title, page, note], i) => ({
    id: `${volId}.u${i}`,
    order: i,
    title: label ? `${label} ${title}` : title,
    page,
    ...(note ? { note } : {}),
    provenance: 'verified' as const,
    lessons: [],
    kpIds: [],
    bankUnitIds: [],
  }));
}

const VERIFIED: { grade: number; term: Term; pages: number; rows: U[]; srcNote?: string }[] = [
  {
    grade: 1,
    term: '上',
    pages: 106,
    srcNote: '目录一屏截图，从第 1 页“数学游戏分享”到“期末复习 88”。',
    rows: [
      [null, '数学游戏分享', 1, ICON],
      ['一', '0～5的认识和加减法', 11],
      [null, '生活中的位置', 32, ICON],
      ['二', '6～9的认识和加减法', 35],
      ['三', '图形的初步认识（一）', 53],
      ['四', '10的认识和加减法', 62],
      [null, '好玩的“抢10”', 75, ICON],
      ['五', '认识11～19', 78],
      [null, '期末复习', 88],
    ],
  },
  {
    grade: 1,
    term: '下',
    pages: 110,
    srcNote: '目录一屏截图，从第 1 页“一 进位加法和退位减法”到“期末复习 88”。',
    rows: [
      ['一', '进位加法和退位减法', 1],
      ['二', '图形的初步认识（二）', 22],
      [null, '图形的拼组', 32, ICON],
      ['三', '数据分类（一）', 36],
      ['四', '认识20～99', 42],
      [null, '50有多大', 53, ICON],
      ['五', '两位数加、减整十数和一位数', 57],
      ['六', '简单的数量关系（一）', 71],
      ['七', '观察物体（一）', 78],
      [null, '数学连环画', 85, ICON],
      [null, '期末复习', 88],
    ],
  },
  {
    grade: 2,
    term: '下',
    pages: 118,
    srcNote: '目录两屏截图（全屏阅读第 6 页，上下滚动），从“一 厘米和米 1”到“一、二年级复习 99”，之后是空白。',
    rows: [
      ['一', '厘米和米', 1],
      [null, '我们的“身体尺”', 14, ICON],
      ['二', '简单的数量关系（二）', 18],
      [null, '时间有多长', 27, ICON],
      ['三', '两位数乘、除以一位数', 33],
      ['四', '数据分类（二）', 40],
      ['五', '认识四位数', 48],
      [null, '1200有多大', 62, ICON],
      ['六', '两、三位数的加法和减法', 66],
      ['七', '图形的初步认识（三）', 90],
      [null, '一、二年级复习', 99],
    ],
  },
];

export const MATH_SUJIAO_2024: Volume[] = VERIFIED.map((p) => {
  const t = p.term === '上' ? 'a' : 'b';
  const id = `math.sujiao.2024.g${p.grade}${t}`;
  return {
    id,
    editionId: 'math.sujiao',
    subject: 'math',
    grade: p.grade,
    term: p.term,
    officialName: `（根据2022年版课程标准修订）义务教育教科书·数学 ${CN[p.grade]}年级${p.term}册`,
    revision: 2024,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供这一册；修订版启用时间和使用地区待核实。',
    regions: [],
    tocProvenance: 'verified',
    sources: [src(`${CN[p.grade]}年级${p.term}册`, p.pages, p.srcNote)],
    units: units(id, p.rows),
    copyright: '目录只录单元名；教材正文、插图、例题、习题和教师用书版权归出版社，不复制。',
  };
});
