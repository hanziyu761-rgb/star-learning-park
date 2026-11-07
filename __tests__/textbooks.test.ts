/**
 * V4.0 教材资源库底座：版本清单、第一批统编版语文登记、现有数据接入、完整度统计、数据校验、JSON 导入演示。
 */
import fs from 'fs';
import path from 'path';
import { BANK_INDEX } from '@/content/bank';
import { EDITIONS } from '@/textbooks/editions';
import { allVolumes, completeness, isComplete, summary, validateAll, validateVolume, volumesFor } from '@/textbooks/registry';
import type { Volume } from '@/textbooks/types';

const template = (): Volume => {
  const v = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs/textbooks/TEMPLATE.json'), 'utf8'));
  delete v._说明;
  return v;
};

describe('版本清单', () => {
  it('用户需求列出的全部候选版本都已登记（语文 6、数学 8、英语 7）', () => {
    const n = (s: string) => EDITIONS.filter((e) => e.subject === s).length;
    expect([n('chinese'), n('math'), n('english')]).toEqual([6, 8, 7]);
  });
  it('没有来源的版本不写现行 / 历史状态；部编版与统编版不重复登记', () => {
    for (const e of EDITIONS) if (e.status !== 'unknown') expect(e.sources.length).toBeGreaterThan(0);
    const tb = EDITIONS.find((e) => e.id === 'chinese.tongbian')!;
    expect(tb.aliases).toContain('部编版');
    expect(EDITIONS.filter((e) => e.subject === 'chinese' && (e.name === '部编版' || e.aliases.includes('部编版')))).toHaveLength(1);
  });
});

describe('第一批：统编版语文修订版 12 册登记', () => {
  const vols = volumesFor({ editionId: 'chinese.tongbian' }).filter((v) => v.revision === 2024);
  it('一至六年级上下册各一册，编号唯一', () => {
    expect(vols.map((v) => `${v.grade}${v.term}`)).toEqual(['1上', '1下', '2上', '2下', '3上', '3下', '4上', '4下', '5上', '5下', '6上', '6下']);
  });
  it('一年级上、下册目录已与官方电子课本核对：逐条录入，有官方来源和日期', () => {
    const [a, b] = vols;
    for (const v of [a, b]) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0]).toMatchObject({ kind: 'official', checkedAt: '2026-11-07' });
      expect(v.units.every((u) => u.provenance === 'verified' && u.lessons.every((l) => l.provenance === 'verified' && l.page! > 0))).toBe(true);
    }
    expect(completeness(a).lessons.verified).toBe(46);
    expect(completeness(b).lessons.verified).toBe(40);
    expect(a.units.map((u) => u.title)).toEqual([
      '我上学了', '第一单元·识字', '第二单元·汉语拼音', '第三单元·汉语拼音', '第四单元·汉语拼音',
      '第五单元·阅读', '第六单元·识字', '第七单元·阅读', '第八单元·阅读', '附录',
    ]);
    // 抽查：页码递增、课文编号
    const pages = a.units.flatMap((u) => u.lessons.map((l) => l.page!));
    expect(pages.every((p, i) => i === 0 || p > pages[i - 1])).toBe(true);
    expect(b.units[5].lessons[0]).toMatchObject({ no: 10, title: '古诗二首', parts: ['池上', '小池'], page: 61 });
    expect(b.units[7].lessons.map((l) => l.title)).toEqual(['棉花姑娘', '咕咚', '小壁虎借尾巴', '语文园地八']);
    // 关联了知识点和练习题，但还没有例题，所以仍不算完整
    const c = completeness(a);
    expect(c.kps).toBeGreaterThan(3);
    expect(c.exercises).toBeGreaterThan(100);
    expect(isComplete(c, a)).toBe(false);
  });
  it('二年级上、下册目录已核实：每册 9 个单元（含附录），课文编号连续', () => {
    const [a, b] = vols.slice(2, 4);
    expect([a.tocProvenance, b.tocProvenance]).toEqual(['verified', 'verified']);
    expect(completeness(a).lessons.verified).toBe(39);
    expect(completeness(b).lessons.verified).toBe(40);
    // 阅读课文编号 1～23 / 1～24 连续（识字课另起编号）
    const textNos = (v: Volume) => v.units.filter((u) => u.title.endsWith('阅读')).flatMap((u) => u.lessons.filter((l) => l.no).map((l) => l.no));
    expect(textNos(a)).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
    expect(textNos(b)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(b.units[4].lessons[0]).toMatchObject({ title: '寓言二则', parts: ['亡羊补牢', '揠苗助长'] });
    for (const v of [a, b]) for (const u of v.units.slice(0, 8)) expect(u.bankUnitIds).toHaveLength(1);
  });
  it('三年级上、下册目录已核实：略读课文、口语交际、习作、习作单元例文都录了；截图不全的地方有备注', () => {
    const [a, b] = vols.slice(4, 6);
    expect([a.tocProvenance, b.tocProvenance]).toEqual(['verified', 'verified']);
    expect(completeness(a).lessons.verified).toBe(50);
    expect(completeness(b).lessons.verified).toBe(51);
    const nos = (v: Volume) => v.units.flatMap((u) => u.lessons.filter((l) => l.no).map((l) => l.no));
    expect(nos(a)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
    expect(nos(b)).toEqual(Array.from({ length: 27 }, (_, i) => i + 1));
    const starred = (v: Volume) => v.units.flatMap((u) => u.lessons.filter((l) => l.starred).map((l) => l.no));
    expect(starred(a)).toEqual([3, 7, 9, 10, 13, 19, 26]);
    expect(starred(b)).toEqual([4, 8, 11, 15, 21, 27]);
    expect(a.units[2].note).toBe('阅读策略单元');
    expect(a.units[4].lessons.at(-1)).toMatchObject({ kind: 'example', parts: ['我家的小狗', '我爱故乡的杨梅'] });
    expect(a.units[6].lessons[0].parts).toEqual(['鹿柴', '望天门山', '饮湖上初晴后雨']);
    expect(b.units[3].lessons.map((l) => l.kind)).toEqual(['text', 'text', 'text', 'text', 'other', 'garden']);
  });
  it('四年级上册（修订版）目录已核实；第七单元开头由补充截图补齐', () => {
    const a = vols[6];
    expect(a.tocProvenance).toBe('verified');
    expect(completeness(a).lessons.verified).toBe(51);
    const nos = a.units.flatMap((u) => u.lessons.filter((l) => l.no).map((l) => l.no));
    expect(nos).toEqual(Array.from({ length: 27 }, (_, i) => i + 1));
    expect(a.units[6]).toMatchObject({ page: 87 });
    expect(a.units[6].lessons[0]).toMatchObject({ no: 20, title: '牛和鹅', page: 88 });
    expect(a.units[3].lessons[3]).toMatchObject({ no: 14, title: '女娲补天', starred: true });
  });
  it('四年级下册：平台目前是未修订版，单独登记为 legacy，不冒充修订版', () => {
    const old = volumesFor({ editionId: 'chinese.tongbian' }).find((v) => v.id === 'chinese.tongbian.legacy.g4b')!;
    expect(old.revision).toBeNull();
    expect(old.officialName).toMatch(/未修订版/);
    expect(old.tocProvenance).toBe('verified');
    expect(completeness(old).lessons.verified).toBe(52);
    expect(old.units[5].lessons.at(-1)).toMatchObject({ title: '语文园地', page: 99 });
    expect(old.units.flatMap((u) => u.lessons.filter((l) => l.no).map((l) => l.no))).toEqual(Array.from({ length: 28 }, (_, i) => i + 1));
    expect(old.units[2].lessons[4]).toMatchObject({ title: '综合性学习：轻叩诗歌大门', kind: 'other' });
    // 修订版四年级下册仍是“即将启用、目录未录入”
    expect(vols[7]).toMatchObject({ id: 'chinese.tongbian.2024.g4b', status: 'upcoming', tocProvenance: 'none' });
  });
  it('五年级：上册修订版、下册未修订版目录都已核实', () => {
    const a = vols[8];
    expect(a.id).toBe('chinese.tongbian.2024.g5a');
    expect(a.tocProvenance).toBe('verified');
    expect(completeness(a).lessons.verified).toBe(48);
    expect(a.units[1].note).toBe('阅读策略单元');
    expect(a.units.flatMap((u) => u.lessons.filter((l) => l.no).map((l) => l.no))).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    const old = allVolumes().find((v) => v.id === 'chinese.tongbian.legacy.g5b')!;
    expect(completeness(old).lessons.verified).toBe(48);
    expect(old.units.flatMap((u) => u.lessons.filter((l) => l.no).map((l) => l.no))).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
    expect(old.units[2].lessons.map((l) => l.title)).toEqual(['综合性学习：遨游汉字王国', '汉字真有趣', '我爱你，汉字']);
  });
  it('六年级：上册修订版、下册未修订版目录都已核实；下册的古诗词诵读 10 首单独成组', () => {
    const a = vols[10];
    expect(a.id).toBe('chinese.tongbian.2024.g6a');
    expect(completeness(a).lessons.verified).toBe(48);
    expect(a.units.flatMap((u) => u.lessons.filter((l) => l.no).map((l) => l.no))).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
    const old = allVolumes().find((v) => v.id === 'chinese.tongbian.legacy.g6b')!;
    expect(completeness(old).lessons.verified).toBe(46);
    expect(old.units.map((u) => u.title)).toEqual(['第一单元', '第二单元', '第三单元', '第四单元', '第五单元', '第六单元', '古诗词诵读', '附录']);
    expect(old.units[6].lessons.map((l) => l.no)).toEqual(Array.from({ length: 10 }, (_, i) => i + 1));
  });
  it('还没核实的只剩平台尚未提供的修订版下册（四、五、六年级）：不算已核实，也不算完整', () => {
    expect(vols.filter((v) => v.tocProvenance === 'none').map((v) => v.id)).toEqual([
      'chinese.tongbian.2024.g4b', 'chinese.tongbian.2024.g5b', 'chinese.tongbian.2024.g6b',
    ]);
    for (const v of vols.filter((x) => x.tocProvenance === 'none')) {
      expect(v.tocProvenance).toBe('none');
      const c = completeness(v);
      expect(c.lessons.verified).toBe(0);
      expect(isComplete(c, v)).toBe(false);
      expect(c.todo).toContain('单元目录未录入');
    }
  });
  it('四至六年级下册修订版标为“即将启用”', () => {
    expect(vols.filter((v) => v.status === 'upcoming').map((v) => `${v.grade}${v.term}`)).toEqual(['4下', '5下', '6下']);
  });
});

describe('现有数据接入（不改原数据）', () => {
  it('题库每一册都接入了，单元目录标为待核实', () => {
    const bank = allVolumes().filter((v) => v.id.startsWith('bank.'));
    expect(bank).toHaveLength(BANK_INDEX.length);
    for (const v of bank) {
      expect(v.tocProvenance).toBe('pending');
      expect(v.units.every((u) => u.provenance === 'pending')).toBe(true);
    }
  });
  it('完整度：题目数与题库一致；知识点来自知识图谱', () => {
    const v = allVolumes().find((x) => x.id === 'bank.math-g3a')!;
    const c = completeness(v);
    expect(c.exercises).toBe(421);
    expect(c.kps).toBeGreaterThan(5);
    expect(c.examples).toBe(0);
    expect(c.todo).toContain('单元目录待与官方来源核实');
  });
});

describe('数据校验', () => {
  it('整个资源库没有错误', () => {
    expect(validateAll().filter((p) => p.level === 'error')).toEqual([]);
  });
  it('JSON 模板格式正确（导入演示：模板加入资源库后整体仍通过检查）', () => {
    const t = template();
    expect(validateVolume(t)).toEqual([]);
    expect(validateAll([...allVolumes(), t]).filter((p) => p.level === 'error')).toEqual([]);
    const c = completeness(t);
    expect(c.lessons.verified).toBe(4);
    expect(c.kps).toBe(1);
  });
  it('能查出：已核实却没有官方来源、编号层级错、顺序乱、缺名称、重复登记', () => {
    const t = template();
    const noSrc = { ...t, sources: [] };
    expect(validateVolume(noSrc).map((p) => p.msg).join()).toMatch(/必须有官方来源/);
    const badId = { ...t, units: [{ ...t.units[0], id: 'x.u1' }] };
    expect(validateVolume(badId).map((p) => p.msg).join()).toMatch(/单元编号应以册编号/);
    const badOrder = { ...t, units: [{ ...t.units[0], lessons: [...t.units[0].lessons].reverse() }] };
    expect(validateVolume(badOrder).map((p) => p.msg).join()).toMatch(/顺序号/);
    const noTitle = { ...t, units: [{ ...t.units[0], title: ' ' }] };
    expect(validateVolume(noTitle).map((p) => p.msg).join()).toMatch(/缺少名称/);
    const dup = { ...t, id: 'chinese.tongbian.dup.g4a', revision: 2024, units: [] as Volume['units'], tocProvenance: 'none' as const, grade: 4, term: '上' as const };
    expect(validateAll([...allVolumes(), dup]).map((p) => p.msg).join()).toMatch(/重复登记/);
    const dupEdition = [...EDITIONS, { ...EDITIONS[0], id: 'chinese.bubian', name: '部编版', aliases: [] }];
    expect(validateAll(allVolumes(), dupEdition).map((p) => p.msg).join()).toMatch(/不能登记两次/);
  });
});

it('汇总数字（汇报用）', () => {
  const s = summary();
  expect(s.volumes).toBe(47);
  expect(s.bankVolumes).toBe(BANK_INDEX.length);
  expect(s.verifiedVolumes).toBe(41);
  expect(s.verifiedUnits).toBe(397);
  expect(s.lessons.verified).toBe(559);
  // 没有遗留的“待补”
  expect(allVolumes().flatMap((v) => v.units.flatMap((u) => [u.note ?? '', ...u.lessons.map((l) => l.note ?? '')])).filter((n) => n.includes('待补'))).toEqual([]);
});

describe('第四批：苏教版数学修订版', () => {
  const vols = volumesFor({ editionId: 'math.sujiao' });
  it('只登记已截图核对的册：一年级上下册、二年级下册、三年级上下册（二年级上册截图不全，未登记）；不关联人教版题库', () => {
    expect(vols.map((v) => v.id)).toEqual(['math.sujiao.2024.g1a', 'math.sujiao.2024.g1b', 'math.sujiao.2024.g2b', 'math.sujiao.2024.g3a', 'math.sujiao.2024.g3b']);
    for (const v of vols) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0].kind).toBe('official');
      expect(v.bankBookId).toBeUndefined();
      expect(v.units.every((u) => u.bankUnitIds.length === 0 && u.kpIds.length === 0)).toBe(true);
    }
    const [a, b, c, d, e] = vols;
    expect(d.units.map((u) => u.page)).toEqual([1, 11, 17, 31, 36, 47, 50, 59, 68, 86, 88, 95, 104]);
    expect(e.units.map((u) => u.page)).toEqual([1, 21, 31, 37, 58, 60, 71, 75, 91, 94, 112]);
    expect(e.units[8].title).toBe('寻找“宝藏”');
    expect(c.units.map((u) => u.page)).toEqual([1, 14, 18, 27, 33, 40, 48, 62, 66, 90, 99]);
    expect(c.units[10].title).toBe('一、二年级复习');
    expect(a.units.map((u) => u.title)).toEqual([
      '数学游戏分享', '一 0～5的认识和加减法', '生活中的位置', '二 6～9的认识和加减法', '三 图形的初步认识（一）',
      '四 10的认识和加减法', '好玩的“抢10”', '五 认识11～19', '期末复习',
    ]);
    expect(a.units.map((u) => u.page)).toEqual([1, 11, 32, 35, 53, 62, 75, 78, 88]);
    expect(b.units.map((u) => u.page)).toEqual([1, 22, 32, 36, 42, 53, 57, 71, 78, 85, 88]);
    expect(b.units[6].title).toBe('五 两位数加、减整十数和一位数');
  });
});

describe('第三批：北师大版数学修订版', () => {
  const vols = volumesFor({ editionId: 'math.bsd' });
  it('12 册全部核对：一～三年级上下册、四～六年级上册修订版，另有平台现有的四～六年级下册未修订版', () => {
    expect(vols.map((v) => v.id)).toEqual(['math.bsd.2024.g1a', 'math.bsd.2024.g1b', 'math.bsd.2024.g2a', 'math.bsd.2024.g2b', 'math.bsd.2024.g3a', 'math.bsd.2024.g3b', 'math.bsd.2024.g4a', 'math.bsd.2024.g5a', 'math.bsd.2024.g6a', 'math.bsd.legacy.g4b', 'math.bsd.legacy.g5b', 'math.bsd.legacy.g6b']);
    for (const v of vols) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0].kind).toBe('official');
      expect(v.bankBookId).toBeUndefined(); // 题库按人教版整理，不冒充北师大版练习
      expect(v.units.every((u) => u.bankUnitIds.length === 0 && u.kpIds.length === 0)).toBe(true);
    }
    const [g1a, g1b, g2a, g2b, g3a, g3b, g4a, g5a, g6a, g4bOld, g5bOld, g6bOld] = vols;
    expect(g1a.units.map((u) => u.title)).toEqual([
      '我上学啦', '第一单元 生活中的数', '第二单元 5以内数加与减', '综合实践 介绍我的教室', '第三单元 整理与分类',
      '第四单元 10以内数加与减', '数学好玩 一起做游戏', '第五单元 有趣的立体图形', '综合实践 记录我的一天', '总复习',
    ]);
    expect(g1a.units.map((u) => u.page)).toEqual([2, 12, 29, 40, 43, 48, 70, 72, 78, 81]);
    expect(g1b.units.map((u) => u.title)).toEqual([
      '第一单元 20以内数与加法', '第二单元 图形大变身（一）', '综合实践 设计教室装饰图', '第三单元 20以内数与减法', '第四单元 100以内数的认识',
      '数学好玩 填数游戏', '第五单元 100以内数加与减（一）', '第六单元 有趣的平面图形（一）', '综合实践 画数学连环画', '总复习',
    ]);
    expect(g1b.units.map((u) => u.page)).toEqual([2, 18, 24, 27, 44, 60, 62, 76, 87, 90]);
    expect(g2a.units).toHaveLength(12);
    expect(g2a.units.map((u) => u.page)).toEqual([2, 18, 20, 30, 43, 53, 56, 72, 77, 87, 94, 98]);
    expect(g2b.units).toHaveLength(11);
    expect(g2b.units.map((u) => u.page)).toEqual([2, 10, 16, 28, 32, 52, 60, 62, 79, 85, 88]);
    expect(g2b.units[2].title).toBe('第三单元 除法的应用');
    expect(g3a.units.map((u) => u.page)).toEqual([2, 13, 24, 28, 41, 49, 62, 64, 75, 90, 95, 99]);
    expect(g3b.units.map((u) => u.page)).toEqual([2, 20, 33, 43, 48, 67, 72, 74, 80, 86, 90]);
    expect(g3b.units[3].title).toBe('综合实践 制作动物体重“说明书”');
    expect(g4a.units.map((u) => u.page)).toEqual([2, 19, 23, 39, 58, 63, 77, 79, 85, 94, 99, 103]);
    expect(g5a.units.map((u) => u.page)).toEqual([2, 21, 31, 35, 50, 60, 80, 82, 89, 102, 109, 113]);
    expect(g6a.units.map((u) => u.page)).toEqual([2, 11, 33, 44, 49, 57, 67, 73, 75, 86, 91, 103, 108]);
    expect(g6bOld.units.map((u) => u.title)).toEqual(['一 圆柱与圆锥', '二 比例', '三 图形的运动', '四 正比例与反比例', '数学好玩', '整理与复习', '总复习']);
    expect(g6bOld.units.map((u) => u.page)).toEqual([2, 16, 28, 39, 51, 58, 63]);
    expect(vols.reduce((n, v) => n + v.units.length, 0)).toBe(130);
    expect(g5bOld.revision).toBeNull();
    expect(g5bOld.units.map((u) => u.page)).toEqual([2, 11, 22, 36, 50, 55, 65, 69, 75, 82, 92]);
    expect(g4bOld.revision).toBeNull();
    expect(g4bOld.units.map((u) => u.title)).toEqual([
      '一 小数的意义和加减法', '二 认识三角形和四边形', '三 小数乘法', '整理与复习', '四 观察物体', '五 认识方程', '数学好玩', '六 数据的表示和分析', '总复习',
    ]);
    expect(g4bOld.units.map((u) => u.page)).toEqual([2, 20, 33, 48, 53, 61, 76, 83, 96]);
    expect(completeness(g1b).todo.join()).toMatch(/课时/);
    expect(isComplete(completeness(g1b), g1b)).toBe(false);
  });
});

describe('第二批：人教版数学修订版', () => {
  const vols = volumesFor({ editionId: 'math.pep' }).filter((v) => v.revision === 2024);
  it('12 册登记；一年级上、下册单元目录已核实（数学目录只列单元）', () => {
    expect(vols).toHaveLength(12);
    const [a, b] = vols;
    expect(a.units.map((u) => u.title)).toEqual([
      '数学游戏', '一 5以内数的认识和加、减法', '二 6～10的认识和加、减法', '三 认识立体图形', '四 11～20的认识', '五 20以内的进位加法', '六 复习与关联',
    ]);
    expect(a.units.map((u) => u.page)).toEqual([1, 12, 34, 67, 73, 88, 103]);
    expect(b.units.map((u) => u.title)).toEqual([
      '一 认识平面图形', '二 20以内的退位减法', '三 100以内数的认识', '四 100以内的口算加、减法', '五 100以内的笔算加、减法', '六 数量间的加减关系', '欢乐购物街', '七 复习与关联',
    ]);
    expect(b.units.map((u) => u.page)).toEqual([1, 8, 23, 43, 56, 69, 77, 83]);
    for (const v of [a, b]) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0].kind).toBe('official');
      expect(completeness(v).todo.join()).toMatch(/只列单元/);
    }
    // 知识点：一年级原创知识点关联上了
    expect(a.units[1].kpIds).toEqual(expect.arrayContaining(['m1.count5', 'm1.add5']));
    expect(completeness(a).exercises).toBeGreaterThan(300);
    expect(vols.filter((v) => v.tocProvenance === 'none').map((v) => `${v.grade}${v.term}`)).toEqual(['4下', '5下', '6下']);
    expect(vols[10].units.map((u) => [u.title, u.page])).toEqual([
      ['一 确定位置', 1], ['二 分数乘法', 16], ['三 分数除法', 32], ['生活中的负数', 44], ['四 圆', 48],
      ['体育中的数学', 74], ['五 百分数', 79], ['水是生命之源', 101], ['六 复习与关联', 106],
    ]);
    const old6 = allVolumes().find((v) => v.id === 'math.pep.legacy.g6b')!;
    expect(old6.units.map((u) => u.page)).toEqual([2, 8, 15, 16, 38, 65, 67, 71]);
    expect(vols[8].units.map((u) => u.page)).toEqual([1, 7, 24, 39, 55, 72, 95, 98, 107]);
    expect(vols[8].units[6].title).toBe('有趣的密铺');
    const old5 = allVolumes().find((v) => v.id === 'math.pep.legacy.g5b')!;
    expect(old5.units.map((u) => u.title)).toEqual([
      '1 观察物体（三）', '2 因数和倍数', '3 长方体和正方体', '探索图形', '4 分数的意义和性质', '5 图形的运动（三）',
      '6 分数的加法和减法', '怎样通知最快', '7 折线统计图', '8 数学广角——找次品', '9 总复习',
    ]);
    expect(vols[6].units.map((u) => [u.title, u.page])).toEqual([
      ['一 万以上数的认识', 1], ['1亿有多大', 24], ['二 角的度量', 28], ['三 多位数乘两位数', 39], ['四 加法模型和乘法模型', 58],
      ['五 平行四边形和梯形', 70], ['六 条形统计图', 88], ['寻找宝藏', 102], ['七 复习与关联', 108],
    ]);
    const old = allVolumes().find((v) => v.id === 'math.pep.legacy.g4b')!;
    expect(old.revision).toBeNull();
    expect(old.units.map((u) => u.title)).toEqual([
      '1 四则运算', '2 观察物体（二）', '3 运算律', '4 小数的意义和性质', '5 三角形', '6 小数的加法和减法',
      '7 图形的运动（二）', '8 平均数与条形统计图', '营养午餐', '9 数学广角——鸡兔同笼', '10 总复习',
    ]);
    expect(completeness(old).exercises).toBe(432);
    expect(vols[4].units.map((u) => u.title)).toEqual([
      '一 观察物体', '二 混合运算', '三 毫米、分米和千米', '曹冲称象的故事', '四 多位数乘一位数', '数字编码', '五 线和角', '六 分数的初步认识', '七 复习与关联',
    ]);
    expect(vols[5].units.map((u) => u.page)).toEqual([1, 10, 39, 52, 65, 77, 86, 95]);
    expect(vols[5].units[5].title).toBe('年、月、日的秘密');
  });
  it('二年级上、下册单元目录已核实；没有序号的主题活动照目录原样录入', () => {
    const [a, b] = vols.slice(2, 4);
    expect(a.units.map((u) => [u.title, u.page])).toEqual([
      ['一 分类与整理', 1], ['二 1～6的表内乘法', 10], ['三 1～6的表内除法', 30], ['校园小导游', 49],
      ['四 厘米和米', 55], ['身体上的尺子', 68], ['五 7～9的表内乘、除法', 73], ['六 复习与关联', 91],
    ]);
    expect(b.units.map((u) => [u.title, u.page])).toEqual([
      ['时间在哪里', 1], ['一 有余数的除法', 10], ['二 数量间的乘除关系', 24], ['三 万以内数的认识', 40],
      ['四 万以内的加法和减法', 63], ['数学连环画', 83], ['五 复习与关联', 87],
    ]);
    expect(a.units[3].note).toMatch(/没有单元序号/);
  });
});
