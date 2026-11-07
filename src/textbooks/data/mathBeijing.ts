/**
 * 第四批：北京版小学数学——已核实目录（V4.0）。
 *
 * 来源：国家中小学智慧教育平台电子课本（教材详情页显示出版社“北京出版社”，扉页“北京教育科学研究院 编”），
 * 2026-11-08 由 Claude 在 APP 所有者已登录的浏览器里逐册打开目录页查看、逐条录入（不是二手资料）。
 * - 一～三年级上下册、四～六年级上册：书名“（根据2022年版课程标准修订）义务教育教科书·数学…”，封面标“2024”
 * - 四～六年级下册：平台现有的是未修订版（书名没有“根据2022年版课程标准修订”，封面“教育部审定 2013”），单独登记
 * 北京版数学目录只列单元（不列课时），所以只录单元名和页码。
 * 只录单元名和页码；教材正文、插图、例题、习题版权归北京出版社，不复制。
 * 现有题库按人教版旧版单元整理，与北京版单元不对应，所以不关联题库和知识点。
 *
 * 目录写法（逐行对照课本目录）：“一 单元名 页码”；“◎栏目名 页码”（目录上用图标标出、没有序号）；“附页 页码”。
 * 行尾“ #备注”写核对时的说明。
 */
import type { SourceRef, Term, Unit, Volume } from '../types';

const CN = ['', '一', '二', '三', '四', '五', '六'];
const CHECKED = '2026-11-08';
const ICON = '目录上用图标标出，没有单元序号';

interface Plan {
  grade: number;
  term: Term;
  pages: number;
  tocPages: string;
  toc: string;
}

const REVISED: Plan[] = [
  {
    grade: 1, term: '上', pages: 108, tocPages: '4～5',
    toc: `
◎我是小学生 2
一 5以内数的认识和加、减法 14
二 认识立体图形 35
三 10以内数的认识和加、减法 38
四 20以内数的认识和进位加法 69
◎时间在哪里 85
五 数学百花园 90
六 总复习 92
附页 101`,
  },
  {
    grade: 1, term: '下', pages: 117, tocPages: '4～5',
    toc: `
一 20以内的退位减法 1
二 100以内数的认识 12
三 数据分类 32
◎天气预报员 38
四 100以内的加法和减法（一） 40
五 初步认识数量关系（一） 57
◎欢乐购物街 67
六 100以内的加法和减法（二） 74
七 认识平面图形 91
八 数学百花园 95
九 总复习 100
附页 109`,
  },
  {
    grade: 2, term: '上', pages: 107, tocPages: '4～5',
    toc: `
一 认识厘米和米 1
◎身体上的“尺子” 8
二 表内乘法（一） 11
三 调查与分类 37
四 表内乘法（二） 40
五 表内除法 58
六 倍的认识 79
◎数学连环画 91
七 数学百花园 94
八 总复习 96`,
  },
  {
    grade: 2, term: '下', pages: 109, tocPages: '4～5',
    toc: `
一 有余数的除法 1
二 初步认识数量关系（二） 11
三 混合运算 16
◎我们的学校 28
四 万以内数的认识 33
五 万以内的加法和减法 58
六 解决问题 76
◎做时间的主人 83
七 数学百花园 88
八 总复习 90
附页 99`,
  },
  {
    grade: 3, term: '上', pages: 103, tocPages: '4～5',
    toc: `
一 多位数乘一位数 1
二 观察物体（一） 18
三 认识千米、分米和毫米 20
四 多位数除以一位数 25
五 图形的运动（一） 48
◎做聪明的时间管理者 54
六 认识常见的数量关系（一） 61
七 角的初步认识 76
八 数据整理 81
九 数学百花园 84
十 总复习 86`,
  },
  {
    grade: 3, term: '下', pages: 107, tocPages: '4～5',
    toc: `
一 多位数乘两位数 1
二 线段、射线和直线 15
三 周长与面积 19
◎曹冲称象的故事 32
四 分数的初步认识 39
五 数量关系的应用（一） 52
六 长方形和正方形 66
◎年、月、日的秘密 84
七 数学百花园 90
八 总复习 92`,
  },
  {
    grade: 4, term: '上', pages: 114, tocPages: '4～5',
    toc: `
一 大数的认识 1
◎寻找“宝藏” 19
二 运算定律 25 #目录上这一行的序号被插图遮住，按前后顺序为“二”
三 角的度量 36
四 多位数除以两位数 45
五 认识常见的数量关系（二） 62
六 探索计算中的规律 76
◎土圭之法的故事 83
七 条形统计图 88
八 数学百花园 94
九 总复习 96
附页 106`,
  },
  {
    grade: 5, term: '上', pages: 125, tocPages: '4～5',
    toc: `
一 小数乘法 1
二 小数除法 23
◎节约用水 43
三 三角形、平行四边形和梯形（二） 46
◎认识公顷和千米² 73
四 统计 76
五 用字母表示数量关系 89
六 数学百花园 104
七 总复习 107
附页 115`,
  },
  {
    grade: 6, term: '上', pages: 115, tocPages: '4～5',
    toc: `
一 分数乘法 1
二 分数除法 14
三 百分数 28
◎制订1分钟跳绳标准 35
四 数量关系的应用（三） 39
◎制订家庭理财方案 55
五 圆 58
六 方向与位置 78
七 扇形统计图 86
◎营养午餐 90
八 数学百花园 93
九 总复习 95
附页 105`,
  },
];

const LEGACY: Plan[] = [
  {
    grade: 4, term: '下', pages: 100, tocPages: '4～5',
    toc: `
一 小数 1
二 小数加、减法 23
三 平行与相交 33
四 图形变换 39
◎设计和装饰《数学小报》 60
五 解决问题 61
◎“周末一日游”旅游计划 69
六 生活中的负数 72
七 统计表 79
八 数学百花园 83
九 总复习 85`,
  },
  {
    grade: 5, term: '下', pages: 118, tocPages: '4～5',
    toc: `
一 长方体和正方体 1
◎包装中的数学问题 26
二 折线统计图与可能性 28
◎家庭生活中的碳排放 39
三 因数和倍数 41
四 分数的意义和基本性质 58
五 分数的加法和减法 81
六 数学百花园 97
七 总复习 99
附页 107`,
  },
  {
    grade: 6, term: '下', pages: 109, tocPages: '5',
    toc: `
一 圆柱和圆锥 1
二 比和比例 21
◎绘制校园平面图 49
三 数学百花园 51
四 总复习 53
附页 99`,
  },
];

/** 把逐行对照课本录入的目录文本转成单元；格式不对直接报错（测试会发现） */
export function parseBeijingToc(volId: string, toc: string): Unit[] {
  const lines = toc.split('\n').map((s) => s.trim()).filter(Boolean);
  return lines.map((raw, i) => {
    const [line, remark] = raw.split(' #');
    let title: string;
    let note: string | undefined = remark;
    let m = line.match(/^([一二三四五六七八九十]) (.+) (\d+)$/);
    if (m) title = `${m[1]} ${m[2]}`;
    else if ((m = line.match(/^◎(.+) (\d+)$/))) {
      title = m[1];
      note = note ?? ICON;
    } else if ((m = line.match(/^(附页) (\d+)$/))) title = m[1];
    else throw new Error(`北京版目录行格式不对：${raw}`);
    return {
      id: `${volId}.u${i}`,
      order: i,
      title,
      page: Number(m[m.length - 1]),
      ...(note ? { note } : {}),
      provenance: 'verified' as const,
      lessons: [],
      kpIds: [],
      bankUnitIds: [],
    };
  });
}

const COPYRIGHT = '目录只录单元名和页码；教材正文、插图、例题、习题和教师用书版权归北京出版社，不复制。';

function source(p: Plan, revised: boolean): SourceRef {
  const vol = `${CN[p.grade]}年级${p.term}册`;
  return {
    title: revised
      ? `国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·数学${vol}（北京出版社）电子课本 目录页（共 ${p.pages} 页，目录在第 ${p.tocPages} 页）`
      : `国家中小学智慧教育平台 义务教育教科书·数学${vol}（北京出版社；书名未标注“根据2022年版课程标准修订”，封面“教育部审定 2013”）电子课本 目录页（共 ${p.pages} 页，目录在第 ${p.tocPages} 页）`,
    url: 'https://basic.smartedu.cn/tchMaterial',
    kind: 'official',
    checkedAt: CHECKED,
    note: '在平台“教材 → 小学 → 数学 → 北京版”下打开电子课本，逐条对照目录页录入（APP 所有者的已登录浏览器，Claude 查看）。',
  };
}

export const MATH_BEIJING_2024: Volume[] = REVISED.map((p) => {
  const id = `math.beijing.2024.g${p.grade}${p.term === '上' ? 'a' : 'b'}`;
  return {
    id,
    editionId: 'math.beijing',
    subject: 'math',
    grade: p.grade,
    term: p.term,
    officialName: `（根据2022年版课程标准修订）义务教育教科书·数学 ${CN[p.grade]}年级${p.term}册`,
    revision: 2024,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台提供这一册；修订版启用时间和使用地区待核实。',
    regions: [],
    tocProvenance: 'verified',
    sources: [source(p, true)],
    units: parseBeijingToc(id, p.toc),
    copyright: COPYRIGHT,
  };
});

export const MATH_BEIJING_LEGACY: Volume[] = LEGACY.map((p) => {
  const id = `math.beijing.legacy.g${p.grade}${p.term === '上' ? 'a' : 'b'}`;
  return {
    id,
    editionId: 'math.beijing',
    subject: 'math',
    grade: p.grade,
    term: p.term,
    officialName: `义务教育教科书·数学 ${CN[p.grade]}年级${p.term}册（未修订版）`,
    revision: null,
    status: 'unknown',
    statusNote: '国家中小学智慧教育平台目前提供的是这一版；修订版启用后会成为历史版本（启用时间待核实）。',
    regions: [],
    tocProvenance: 'verified',
    sources: [source(p, false)],
    units: parseBeijingToc(id, p.toc),
    copyright: COPYRIGHT,
  };
});
