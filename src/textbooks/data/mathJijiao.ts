/**
 * 第四批：冀教版小学数学——已核实目录（V4.0）。
 *
 * 来源：国家中小学智慧教育平台电子课本（教材详情页显示出版社“河北教育出版社”），
 * 2026-11-07 由 Claude 在 APP 所有者已登录的浏览器里逐册打开目录页查看、逐条录入（不是二手资料）。
 * - 一～三年级上下册、四～六年级上册：书名“（根据2022年版课程标准修订）义务教育教科书·数学…”，封面标“2024”
 * - 四～六年级下册：平台现有的是未修订版（书名没有“根据2022年版课程标准修订”，封面标“教育部审定 2013”），单独登记
 * 冀教版目录除单元外还列出小节（1. 2. 3.）和栏目，所以这里同时录入课时级条目。
 * 只录单元名、小节名和页码；教材正文、插图、例题、习题版权归河北教育出版社，不复制。
 * 现有题库按人教版旧版单元整理，与冀教版单元不对应，所以不关联题库和知识点。
 *
 * 目录写法（逐行对照课本目录）：
 *   单元行： [序号 ]单元名 页码 | 条目; 条目 …
 *   条目：   “1 小节名 页码”（有编号的小节）、“◎栏目名 页码”（目录上用小图标标出）、
 *            “●栏目名 页码”（目录上用红点标出）、“（一）名称 页码”、或“名称 页码”
 *   “附页 -” 表示目录上只有“附页”二字、没有页码
 */
import type { LessonEntry, SourceRef, Term, Unit, Volume } from '../types';

const CN = ['', '一', '二', '三', '四', '五', '六'];
const CHECKED = '2026-11-07';

interface Plan {
  grade: number;
  term: Term;
  pages: number;
  tocPages: string;
  toc: string;
}

const REVISED: Plan[] = [
  {
    grade: 1, term: '上', pages: 110, tocPages: '5～6',
    toc: `
我上学了 2 | 认识新朋友 2; 分享幼儿园生活 3; 熊猫请客 6; 玩跷跷板 8; 排座位 10
一 熟悉的数与加减法 12 | 1 认识1～9 12; 2 10以内的加减 30; 3 0的认识和加减 40; 4 10的认识和加减 43; ◎数字古诗两首 55
二 认识图形（一） 56 | ◎玩泥巴 60
三 认识11～20 62 | 1 数的认识 62; 2 10加几和相应的减法 69
四 20以内的加法 74 | ◎游动物园 86
五 探索乐园 88
六 期末复习 92 | 1 回顾整理 92; 2 学习评价 93
拓展学习 102 | ●数字的故事 102; ●假期实践活动 104`,
  },
  {
    grade: 1, term: '下', pages: 105, tocPages: '4～5',
    toc: `
快乐学习场景 2 | 我们的教室 2; 班里的图书角 5; 我的房间 7; 我们的学校 8
一 20以内的减法 10 | ◎玩扑克　做数学 26
二 分类（一） 27 | ◎投沙包 31
三 100以内的数与加减法 32 | 1 100以内的数 32; 2 两位数加减整十数 46; 3 两位数加一位数 53; 4 两位数减一位数 57
四 两位数加减 66 | 1 两位数加两位数 66; 2 两位数减两位数 72; ◎阳光课间活动 81
五 探索乐园 82
六 期末复习 87 | 1 回顾整理 87; 2 学习评价 88
拓展学习 99 | ●古代货币 99; ●假期实践活动 100`,
  },
  {
    grade: 2, term: '上', pages: 101, tocPages: '5～6',
    toc: `
快乐购物 2 | 分享购物快乐 2; 商品标价 4; 模拟购物 6; 人民币小讲堂 7; 分享购物经验 9
一 问题与运算（一） 10 | ◎套圈游戏 18
二 乘法和除法 20 | 1 认识乘法 20; 2 认识除法 24
三 乘法口诀 33 | 1 2～5的乘法口诀 33; 2 6～9的乘法口诀 39
四 认识图形（二） 50 | ◎七巧板拼图 58
五 用乘法口诀求商 60 | 1 用2～5的乘法口诀求商 60; 2 用6～9的乘法口诀求商 64; ◎数学连环画 77
六 探索乐园 78
七 期末复习 82 | 1 回顾整理 82; 2 学习评价 83
拓展学习 93 | ●神奇的七巧板 93; ●假期实践活动 94
附页 95`,
  },
  {
    grade: 2, term: '下', pages: 112, tocPages: '4～5',
    toc: `
时间在哪里 2 | 认识钟表 2; 生活中的时间 5; 一天的时间 7; 珍惜时间 9
一 有余数的除法 12
二 测量（一） 23 | ◎身体上的“尺子” 30
三 生活中的大数 33 | 1 1000以内的数 33; 2 10000以内的数 44; 3 口算加减 50; ◎掷点写数 57
四 分类（二） 58
五 三位数加减 64 | 1 加法和减法 64; 2 加减法验算 72; 3 用加减法解决问题 76; ◎参观爱国主义教育基地 87
六 探索乐园 89
七 学段复习 93 | 1 回顾整理 93; 2 学习评价 94
拓展学习 104 | ●我国的珠算 104; ●假期实践活动 107`,
  },
  {
    grade: 3, term: '上', pages: 121, tocPages: '5～6',
    toc: `
称量物体 2 | 分享调查结果 2; 称量物品 4; 计量较重物体 6; 曹冲称象的奥秘 8; 质量单位讲堂 10
一 倍的认识 12
二 多位数乘一位数 18 | 1 口算乘法 18; 2 笔算乘法 22; 3 估算 34; 4 连乘 36; ◎促销问题 41
三 线和角 43 | 1 点和线 43; 2 角和角的度量 49; 3 两条直线的关系 60; ◎升国旗仪式 71
四 多位数除以一位数 73 | 1 口算除法 73; 2 笔算除法 77; 3 连除 91; ◎运输方案 96
五 探索乐园 98
六 期末复习 102 | 1 回顾整理 102; 2 学习评价 103
拓展学习 113 | ●古代计时器 113; ●假期实践活动 115`,
  },
  {
    grade: 3, term: '下', pages: 120, tocPages: '4～5',
    toc: `
年、月、日的奥秘 2 | 24时记时法 2; 年、月、日 6; 平年和闰年 9; 二十四节气 12
一 问题与运算（二） 14 | ◎诗歌与数学 29
二 观察物体 31
三 多位数乘法 39 | 1 两位数乘两位数 39; 2 三位数乘两位数 47; ◎名山一日游 52
四 测量（二） 54 | 1 分米和毫米 54; 2 千米 58
五 数据收集和整理 64 | ◎阳光体育运动会 73
六 生活中的小数 75 | 1 元、角、分与小数 75; 2 小数加减 79
七 图形的运动（一） 88 | ◎大自然的对称美 97
八 探索乐园 99
九 期末复习 103 | 1 回顾整理 103; 2 学习评价 104
拓展学习 113 | ●十二时辰 113; ●假期实践活动 114
附页 115`,
  },
  {
    grade: 4, term: '上', pages: 126, tocPages: '5～6',
    toc: `
度量衡的故事 2 | 我了解的度量衡 2; 六尺巷传说 5; 诚信故事 8; 成语故事会 12
一 除数是两位数的除法 13 | 1 口算除法 13; 2 笔算除法 15; 3 商不变的规律 31; 4 用乘除法解决问题 35; ◎驾车旅游 42
二 多边形的认识 44 | 1 三角形 44; 2 四边形 54; 3 图形关系 62
三 认识更大的数 69 | 1 亿以内的数 69; 2 超过亿的数 76; 3 计算工具 82; ◎编学号 87
四 周长 89
五 平均数 96 | ◎读万卷书　行万里路 102
六 探索乐园 104
七 期末复习 108 | 1 回顾整理 108; 2 学习评价 109
拓展学习 119 | ●指南针的故事 119; ●假期实践活动 120`,
  },
  {
    grade: 5, term: '上', pages: 133, tocPages: '5～6',
    toc: `
激情奥运 2 | 中国人的奥运梦 2; 足球比赛问题 5; 体育研究报告会 7
一 小数的认识与加减法 9 | 1 小数的意义 10; 2 小数的近似数 23; 3 小数加减 25
二 图形的运动（二） 34
三 小数乘法和除法 48 | 1 小数点位置变化 48; 2 小数乘法 52; 3 小数除法 58
四 随机现象发生的可能性 72 | ◎可能性与规则的公平性 78
五 小数应用问题 80 | ◎繁荣的菜市场 90
六 多边形的面积 92 | 1 借助方格算面积 92; 2 多边形的面积 96; 3 组合图形面积 105; ◎铺甬路方案 110
七 探索乐园 112
八 期末复习 115 | 1 回顾整理 115; 2 学业评价 116
拓展学习 125 | ●刘徽与割补术 125; ●假期实践活动 126
附页 127`,
  },
  {
    grade: 6, term: '上', pages: 137, tocPages: '5～6',
    toc: `
节约水资源 2 | 水是生命之源 2; 水资源保护 4; 日常节水方案 6
一 含有字母的式子 8 | ◎餐桌摆放方案 20
二 分数乘法和除法 22 | 1 分数乘法 22; 2 倒数 30; 3 分数除法 32
三 用数对表示位置 40
四 分数应用问题 44
五 比和比例 54 | 1 比和比的应用 54; 2 比例和正比例 62; ◎测量旗杆高度 76
六 圆 78 | 1 圆和扇形 78; 2 圆的周长 85; 3 圆的面积 90
七 百分数 100 | 1 百分数与数据统计 100; 2 百分数与扇形统计图 106; ◎读图了解世界 112
八 探索乐园 114
九 期末复习 118 | 1 回顾整理 118; 2 学业评价 119
拓展学习 129 | ●祖冲之与圆周率 129; ●假期实践活动 130
附页 131`,
  },
];

const LEGACY: Plan[] = [
  {
    grade: 4, term: '下', pages: 120, tocPages: '4',
    toc: `
一 观察物体（二） 1
二 用字母表示数 6
三 三位数乘两位数 12 | ◎驾车旅游 30
四 多边形的认识 32 | ◎我的拼图 45
五 分数的意义和性质 46
六 小数的认识 68
七 复式条形统计图 80 | ◎测量身高 88
八 小数加法和减法 90
九 探索乐园 98
●整理与评价 102
附页 -`,
  },
  {
    grade: 5, term: '下', pages: 116, tocPages: '4',
    toc: `
一 图形的运动（二） 1
二 异分母分数加减法 13 | ◎公交车上的数学 32
三 长方体和正方体 34 | ◎包装扑克 42
四 分数乘法 44
五 长方体和正方体的体积 56 | ◎设计包装箱 70
六 分数除法 72
七 折线统计图 82
八 探索乐园 90
●整理与评价 94
附页 -`,
  },
  {
    grade: 6, term: '下', pages: 112, tocPages: '4',
    toc: `
一 生活中的负数 1 | ◎记录天气 12
二 位置 14
三 正比例　反比例 18
四 圆柱和圆锥 27 | ◎木材加工问题 47
五 探索乐园 49
六 回顾与整理 53 | （一）数与代数 53; （二）图形与几何 68; （三）统计与概率 84; （四）综合与实践 91; ◎节约水资源 91; ◎开发绿色资源 94; ◎生活小区 98
附页 -`,
  },
];

const ICON = '目录上用小图标标出';
const DOT = '目录上用红点标出';
const REVIEW = /复习|回顾与整理/;

function lesson(uid: string, i: number, raw: string, reviewUnit: boolean): LessonEntry {
  const base = { id: `${uid}.l${i + 1}`, order: i + 1, provenance: 'verified' as const };
  let m = raw.match(/^([◎●])(.+) (\d+)$/);
  if (m) return { ...base, title: m[2], kind: 'other', page: Number(m[3]), note: m[1] === '◎' ? ICON : DOT };
  m = raw.match(/^(\d+) (.+) (\d+)$/);
  if (m) return { ...base, no: Number(m[1]), title: m[2], kind: reviewUnit ? 'review' : 'lesson', page: Number(m[3]) };
  m = raw.match(/^(.+) (\d+)$/);
  if (m) return { ...base, title: m[1], kind: reviewUnit ? 'review' : 'lesson', page: Number(m[2]) };
  throw new Error(`冀教版目录条目格式不对：${raw}`);
}

/** 把逐行对照课本录入的目录文本转成单元和课时；格式不对直接报错（测试会发现） */
export function parseToc(volId: string, toc: string): Unit[] {
  const lines = toc.split('\n').map((s) => s.trim()).filter(Boolean);
  return lines.map((line, i) => {
    const [head, rest] = line.split(' | ');
    const uid = `${volId}.u${i}`;
    let title: string;
    let page: number | undefined;
    let note: string | undefined;
    let m = head.match(/^([一二三四五六七八九十]) (.+) (\d+)$/);
    if (m) {
      title = `${m[1]} ${m[2]}`;
      page = Number(m[3]);
    } else if ((m = head.match(/^●(.+) (\d+)$/))) {
      title = m[1];
      page = Number(m[2]);
      note = DOT;
    } else if ((m = head.match(/^(.+) -$/))) {
      title = m[1];
      note = '目录上没有页码';
    } else if ((m = head.match(/^(.+) (\d+)$/))) {
      title = m[1];
      page = Number(m[2]);
    } else throw new Error(`冀教版目录单元格式不对：${head}`);
    const reviewUnit = REVIEW.test(title);
    return {
      id: uid,
      order: i,
      title,
      ...(page ? { page } : {}),
      ...(note ? { note } : {}),
      provenance: 'verified' as const,
      lessons: rest ? rest.split('; ').map((r, j) => lesson(uid, j, r, reviewUnit)) : [],
      kpIds: [],
      bankUnitIds: [],
    };
  });
}

const COPYRIGHT = '目录只录单元名、小节名和页码；教材正文、插图、例题、习题和教师用书版权归河北教育出版社，不复制。';

function source(p: Plan, revised: boolean): SourceRef {
  const vol = `${CN[p.grade]}年级${p.term}册`;
  return {
    title: revised
      ? `国家中小学智慧教育平台 （根据2022年版课程标准修订）义务教育教科书·数学${vol}（河北教育出版社）电子课本 目录页（共 ${p.pages} 页，目录在第 ${p.tocPages} 页）`
      : `国家中小学智慧教育平台 义务教育教科书·数学${vol}（河北教育出版社；书名未标注“根据2022年版课程标准修订”，封面“教育部审定 2013”）电子课本 目录页（共 ${p.pages} 页，目录在第 ${p.tocPages} 页）`,
    url: 'https://basic.smartedu.cn/tchMaterial',
    kind: 'official',
    checkedAt: CHECKED,
    note: '在平台“教材 → 小学 → 数学 → 冀教版”下打开电子课本，逐条对照目录页录入（APP 所有者的已登录浏览器，Claude 查看）。',
  };
}

export const MATH_JIJIAO_2024: Volume[] = REVISED.map((p) => {
  const id = `math.jijiao.2024.g${p.grade}${p.term === '上' ? 'a' : 'b'}`;
  return {
    id,
    editionId: 'math.jijiao',
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
    units: parseToc(id, p.toc),
    copyright: COPYRIGHT,
  };
});

export const MATH_JIJIAO_LEGACY: Volume[] = LEGACY.map((p) => {
  const id = `math.jijiao.legacy.g${p.grade}${p.term === '上' ? 'a' : 'b'}`;
  return {
    id,
    editionId: 'math.jijiao',
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
    units: parseToc(id, p.toc),
    copyright: COPYRIGHT,
  };
});
