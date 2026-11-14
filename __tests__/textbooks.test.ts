/**
 * V4.0 教材资源库底座：版本清单、第一批统编版语文登记、现有数据接入、完整度统计、数据校验、JSON 导入演示。
 */
import { KP_BY_ID } from '@/knowledge/graph';
import fs from 'fs';
import path from 'path';
import { BANK_INDEX } from '@/content/bank';
import { EDITIONS } from '@/textbooks/editions';
import { parseToc } from '@/textbooks/data/mathJijiao';
import { parseBeijingToc } from '@/textbooks/data/mathBeijing';
import { parsePlatformToc } from '@/textbooks/data/platformToc';
import { parsePepToc } from '@/textbooks/data/englishPep';
import { parseFltrpToc } from '@/textbooks/data/englishFltrp';
import { allVolumes, completeness, isComplete, summary, validateAll, validateVolume, volumesFor } from '@/textbooks/registry';
import type { Volume } from '@/textbooks/types';

const template = (): Volume => {
  const v = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs/textbooks/TEMPLATE.json'), 'utf8'));
  delete v._说明;
  return v;
};

describe('版本清单', () => {
  it('用户需求列出的全部候选版本都已登记（语文 6、数学 8、英语 7 + 平台上另外两套外研社版 = 9）；V4.3 初中三科各加 1 套', () => {
    const n = (s: string) => EDITIONS.filter((e) => e.subject === s).length;
    expect([n('chinese'), n('math'), n('english')]).toEqual([7, 9, 10]);
    expect(EDITIONS.filter((e) => e.id.endsWith('-jh')).map((e) => e.name)).toEqual(['统编版（初中）', '人教版（初中）', '冀教版（初中）']);
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
    expect(bank).toHaveLength(BANK_INDEX.filter((b) => b.grade <= 6).length);
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
  expect(s.volumes).toBe(187);
  expect(s.bankVolumes).toBe(BANK_INDEX.filter((b) => b.grade <= 6).length);
  expect(s.verifiedVolumes).toBe(181);
  expect(s.verifiedUnits).toBe(1988);
  expect(s.lessons.verified).toBe(782);
  // 没有遗留的“待补”
  expect(allVolumes().flatMap((v) => v.units.flatMap((u) => [u.note ?? '', ...u.lessons.map((l) => l.note ?? '')])).filter((n) => n.includes('待补'))).toEqual([]);
});

describe('第五批：外研社版英语（主编：孙有中）', () => {
  const vols = volumesFor({ editionId: 'english.fltrp' }).filter((v) => !v.id.startsWith('bank.'));
  it('平台列出的 7 册全部核对；六年级下册平台没有，不登记', () => {
    expect(vols.map((v) => `${v.grade}${v.term}`)).toEqual(['3上', '3下', '4上', '4下', '5上', '5下', '6上']);
    for (const v of vols) {
      expect(v.revision).toBe(2024);
      expect(v.sources[0].title).toMatch(/外语教学与研究出版社/);
      expect(v.bankBookId).toBeUndefined();
      expect(v.units.at(-1)!.title).toBe('Appendices');
    }
    expect(vols.reduce((n, v) => n + v.units.length, 0)).toBe(50);
    expect(vols[0].units.slice(0, 2).map((u) => `${u.title}@${u.page}`)).toEqual(['Welcome to school@2', "Unit 1 Let's be friends!@6"]);
    expect(vols[6].units[0].title).toBe('Unit 1 What do you do with money?');
    expect(vols[6].units.at(-1)!.lessons.map((l) => l.page)).toEqual([76, 88, 96, 99, 103, 104]);
    expect(() => parseFltrpToc('x', 'Module 1 Hello 2')).toThrow(/格式不对/);
  });
});

describe('第五批：人教版英语（PEP）', () => {
  const vols = volumesFor({ editionId: 'english.pep' }).filter((v) => !v.id.startsWith('bank.'));
  it('8 册：修订版三～四年级上下册、五～六年级上册 + 平台现有五、六年级下册未修订版', () => {
    expect(vols.map((v) => v.id)).toEqual([
      'english.pep.2024.g3a', 'english.pep.2024.g3b', 'english.pep.2024.g4a', 'english.pep.2024.g4b',
      'english.pep.2024.g5a', 'english.pep.2024.g6a', 'english.pep.legacy.g5b', 'english.pep.legacy.g6b',
    ]);
    for (const v of vols) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0].title).toMatch(/人民教育出版社/);
    }
    expect(vols.reduce((n, v) => n + v.units.length, 0)).toBe(97);
    expect(vols[0].units.slice(0, 7).map((u) => `${u.title}@${u.page}`)).toEqual([
      'Unit 1 Making friends@2', 'Unit 2 Different families@14', 'Unit 3 Our animal friends@26', 'Unit 4 Plants around us@38',
      'Unit 5 The colourful world@50', 'Unit 6 Useful numbers@62', 'Revision Being a good guest@74',
    ]);
  });
  it('修订版不关联旧版题库；未修订版只关联单元名逐字相同的题库单元', () => {
    for (const v of vols.filter((x) => x.revision === 2024)) {
      expect(v.bankBookId).toBeUndefined();
      expect(v.units.every((u) => u.bankUnitIds.length === 0)).toBe(true);
    }
    const g5b = vols.find((v) => v.id === 'english.pep.legacy.g5b')!;
    expect(g5b.units.filter((u) => u.bankUnitIds.length).map((u) => u.bankUnitIds[0])).toEqual([
      'english-g5b-u1', 'english-g5b-u2', 'english-g5b-u3', 'english-g5b-u4', 'english-g5b-u5', 'english-g5b-u6',
    ]);
    const g6b = vols.find((v) => v.id === 'english.pep.legacy.g6b')!;
    expect(g6b.units.find((u) => u.title.startsWith('Recycle'))!.bankUnitIds).toEqual([]);
    expect(completeness(g5b).exercises).toBeGreaterThan(0);
    expect(() => parsePepToc('x', 'Lesson 1 Hello 3')).toThrow(/格式不对/);
  });
});

describe('第四批：北京版数学', () => {
  const vols = volumesFor({ editionId: 'math.beijing' });
  it('12 册：修订版 9 册 + 平台现有四～六年级下册未修订版 3 册；不关联人教版题库', () => {
    expect(vols).toHaveLength(12);
    expect(vols.filter((v) => v.revision === null).map((v) => `${v.grade}${v.term}`)).toEqual(['4下', '5下', '6下']);
    for (const v of vols) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0].kind).toBe('official');
      expect(v.sources[0].title).toMatch(/北京出版社/);
      expect(v.bankBookId).toBeUndefined();
      expect(v.units.every((u) => u.lessons.length === 0 && u.bankUnitIds.length === 0 && u.kpIds.length === 0)).toBe(true);
    }
    expect(vols.reduce((n, v) => n + v.units.length, 0)).toBe(125);
  });
  it('一年级上册逐条对照；没有序号的栏目照实标注；遮挡的序号写明', () => {
    const g1a = vols[0];
    expect(g1a.units.map((u) => `${u.title}@${u.page}`)).toEqual([
      '我是小学生@2', '一 5以内数的认识和加、减法@14', '二 认识立体图形@35', '三 10以内数的认识和加、减法@38',
      '四 20以内数的认识和进位加法@69', '时间在哪里@85', '五 数学百花园@90', '六 总复习@92', '附页@101',
    ]);
    expect(g1a.units[0].note).toMatch(/图标/);
    const g4a = vols.find((v) => v.id === 'math.beijing.2024.g4a')!;
    expect(g4a.units[2]).toMatchObject({ title: '二 运算定律', page: 25 });
    expect(g4a.units[2].note).toMatch(/遮住/);
    expect(() => parseBeijingToc('x', '一 没有页码')).toThrow(/格式不对/);
  });
});

describe('第四批：冀教版数学（目录含小节）', () => {
  const vols = volumesFor({ editionId: 'math.jijiao' });
  it('12 册：修订版 9 册 + 平台现有四～六年级下册未修订版 3 册；不关联人教版题库', () => {
    expect(vols.map((v) => v.id)).toEqual([
      'math.jijiao.2024.g1a', 'math.jijiao.2024.g1b', 'math.jijiao.2024.g2a', 'math.jijiao.2024.g2b', 'math.jijiao.2024.g3a',
      'math.jijiao.2024.g3b', 'math.jijiao.2024.g4a', 'math.jijiao.2024.g5a', 'math.jijiao.2024.g6a',
      'math.jijiao.legacy.g4b', 'math.jijiao.legacy.g5b', 'math.jijiao.legacy.g6b',
    ]);
    for (const v of vols) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0].kind).toBe('official');
      expect(v.sources[0].title).toMatch(/河北教育出版社/);
      expect(v.bankBookId).toBeUndefined();
      expect(v.units.every((u) => u.bankUnitIds.length === 0 && u.kpIds.length === 0)).toBe(true);
    }
    expect(vols.reduce((n, v) => n + v.units.length, 0)).toBe(115);
    expect(vols.reduce((n, v) => n + v.units.reduce((m, u) => m + u.lessons.length, 0), 0)).toBe(185);
    expect(vols.filter((v) => v.revision === null).map((v) => v.grade)).toEqual([4, 5, 6]);
  });
  it('一年级上册逐条对照：单元、小节编号、栏目和页码', () => {
    const g1a = vols[0];
    expect(g1a.units.map((u) => `${u.title}@${u.page}`)).toEqual([
      '我上学了@2', '一 熟悉的数与加减法@12', '二 认识图形（一）@56', '三 认识11～20@62', '四 20以内的加法@74', '五 探索乐园@88', '六 期末复习@92', '拓展学习@102',
    ]);
    const u1 = g1a.units[1].lessons;
    expect(u1.map((l) => [l.no ?? null, l.title, l.page])).toEqual([
      [1, '认识1～9', 12], [2, '10以内的加减', 30], [3, '0的认识和加减', 40], [4, '10的认识和加减', 43], [null, '数字古诗两首', 55],
    ]);
    expect(u1[4].kind).toBe('other');
    expect(g1a.units[6].lessons.map((l) => l.kind)).toEqual(['review', 'review']);
    expect(completeness(g1a).lessons.verified).toBe(18);
  });
  it('“附页”没有页码的照实登记；格式不对的目录行会报错', () => {
    const g4b = vols[9];
    expect(g4b.units.at(-1)).toMatchObject({ title: '附页', note: '目录上没有页码' });
    expect(g4b.units.at(-1)?.page).toBeUndefined();
    expect(() => parseToc('x', '一 没有页码')).toThrow(/格式不对/);
    expect(() => parseToc('x', '一 单元 3 | 小节没页码')).toThrow(/格式不对/);
  });
});

describe('第四批：苏教版数学修订版', () => {
  const vols = volumesFor({ editionId: 'math.sujiao' });
  it('12 册全部核对：一～三年级上下册、四～六年级上册修订版，另有平台现有的四～六年级下册未修订版；不关联人教版题库', () => {
    expect(vols.map((v) => v.id)).toEqual(['math.sujiao.2024.g1a', 'math.sujiao.2024.g1b', 'math.sujiao.2024.g2a', 'math.sujiao.2024.g2b', 'math.sujiao.2024.g3a', 'math.sujiao.2024.g3b', 'math.sujiao.2024.g4a', 'math.sujiao.2024.g5a', 'math.sujiao.2024.g6a', 'math.sujiao.legacy.g4b', 'math.sujiao.legacy.g5b', 'math.sujiao.legacy.g6b']);
    for (const v of vols) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0].kind).toBe('official');
      expect(v.bankBookId).toBeUndefined();
      expect(v.units.every((u) => u.bankUnitIds.length === 0 && u.kpIds.length === 0)).toBe(true);
    }
    const [a, b, c2, c, d, e, f, f5, f6, g, g5, g6] = vols;
    expect(c2.units.map((u) => u.page)).toEqual([1, 19, 33, 39, 56, 61, 74, 86, 91, 98]);
    expect(f6.units.map((u) => u.page)).toEqual([1, 14, 26, 30, 42, 44, 64, 68, 88, 92, 103, 112]);
    expect(g6.units.map((u) => u.page)).toEqual([1, 9, 27, 33, 48, 50, 56, 66, 68, 107, 110]);
    expect(g6.units[8].note).toMatch(/数与代数 68.*图形与几何 86.*统计与可能性 101/);
    expect(vols.reduce((n, v) => n + v.units.length, 0)).toBe(134);
    expect(f5.units.map((u) => u.page)).toEqual([1, 14, 17, 26, 30, 51, 55, 65, 74, 96, 110, 112, 119]);
    expect(g5.revision).toBeNull();
    expect(g5.units.map((u) => u.page)).toEqual([1, 21, 28, 30, 50, 76, 81, 106, 108, 120]);
    expect(f.units.map((u) => u.page)).toEqual([1, 17, 42, 44, 57, 64, 67, 89, 94, 104, 108]);
    expect(g.revision).toBeNull();
    expect(g.units.map((u) => u.page)).toEqual([1, 18, 20, 33, 38, 40, 47, 67, 88, 90, 108, 115]);
    expect(g.units[7].title).toBe('六 三角形、平行四边形和梯形');
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

describe('第四批（补）：青岛版、西师版数学（平台电子课本目录页，2026-11-09）', () => {
  const qd = volumesFor({ editionId: 'math.qingdao' });
  const xs = volumesFor({ editionId: 'math.xishi' });
  it('各 12 册，全部目录已核实；四～六年级下册是未修订版', () => {
    for (const vs of [qd, xs]) {
      expect(vs).toHaveLength(12);
      expect(vs.every((v) => v.tocProvenance === 'verified' && v.units.length >= 8 && v.sources[0].kind === 'official')).toBe(true);
      expect(vs.filter((v) => v.revision === null).map((v) => `${v.grade}${v.term}`).sort()).toEqual(['4下', '5下', '6下']);
      expect(vs.every((v) => v.units.every((u, i, a) => i === 0 || (u.page ?? 0) >= (a[i - 1].page ?? 0)))).toBe(true);
    }
  });
  it('抽查：青岛版一年级上册、西师版二年级下册', () => {
    const g1a = qd.find((v) => v.id === 'math.qingdao.2024.g1a')!;
    expect(g1a.units.map((u) => [u.title, u.page])).toEqual([
      ['主题活动——我的幼儿园', 1], ['一 快乐的课堂——1～5数的认识和加减法', 7], ['二 走进花果山——6～10数的认识和加减法', 27],
      ['三 创意拼搭——认识立体图形', 66], ['智慧广场', 72], ['四 漂亮的粘贴画——11～20各数的认识', 74], ['主题活动——找找身边的数', 85],
      ['五 我爱读书——20以内的进位加法', 89], ['智慧广场', 102], ['六 我爱冰雪运动——总复习', 104],
    ]);
    expect(g1a.units[4].note).toMatch(/没有单元序号/);
    const g2b = xs.find((v) => v.id === 'math.xishi.2024.g2b')!;
    expect(g2b.units.map((u) => u.title)).toContain('数学游戏 抢数游戏');
    expect(g2b.units.at(-1)).toMatchObject({ title: '第五单元 总复习', page: 93 });
  });
  it('目录行格式不对时报错', () => {
    expect(() => parsePlatformToc('x', '第一单元 没有页码')).toThrow(/格式不对/);
    expect(() => parsePlatformToc('x', '')).toThrow(/为空/);
  });
});

describe('第五批（补）：译林、北师大、沪教、冀教、湘少、外研社（刘兆义、张祖春）英语（平台电子课本 Contents 页，2026-11-09）', () => {
  const ids = ['english.yilin', 'english.bsd', 'english.hujiao', 'english.jijiao', 'english.xiangshao', 'english.fltrp-liu'];
  it('六套各 8 册（五、六年级下册为未修订版）、张祖春主编 5 册，全部目录已核实、来源是官方电子课本', () => {
    for (const id of ids) {
      const vs = volumesFor({ editionId: id });
      expect(vs).toHaveLength(8);
      expect(vs.filter((v) => v.revision === null).map((v) => `${v.grade}${v.term}`).sort()).toEqual(['5下', '6下']);
    }
    const zh = volumesFor({ editionId: 'english.fltrp-zhang' });
    expect(zh.map((v) => `${v.grade}${v.term}`).sort()).toEqual(['3上', '3下', '4上', '4下', '5上']);
    for (const v of [...ids.flatMap((id) => volumesFor({ editionId: id })), ...zh]) {
      expect(v.tocProvenance).toBe('verified');
      expect(v.sources[0].kind).toBe('official');
      expect(v.units.filter((u) => u.title.startsWith('Unit ')).length).toBeGreaterThanOrEqual(4);
      expect(v.units.every((u, i, a) => i === 0 || (u.page ?? 0) >= (a[i - 1].page ?? 0))).toBe(true);
    }
  });
  it('抽查：译林三年级上册、北师大六年级下册（未修订版）', () => {
    const y = volumesFor({ editionId: 'english.yilin' }).find((v) => v.grade === 3 && v.term === '上')!;
    expect(y.units.slice(0, 5).map((u) => [u.title, u.page])).toEqual([
      ['Unit 1 Hello!', 9], ['Unit 2 What\'s your name?', 17], ['Unit 3 Are you Su Hai?', 25], ['Unit 4 This is my friend', 33], ['Project 1 Making friends', 40],
    ]);
    const b = volumesFor({ editionId: 'english.bsd' }).find((v) => v.grade === 6 && v.term === '下')!;
    expect(b.revision).toBeNull();
    expect(b.units[0]).toMatchObject({ title: 'Unit 7 Vacation', page: 3 });
  });
  it('不同主编的外研社版分开登记，不混在一起', () => {
    const names = EDITIONS.filter((e) => e.id.startsWith('english.fltrp')).map((e) => e.id).sort();
    expect(names).toEqual(['english.fltrp', 'english.fltrp-liu', 'english.fltrp-zhang']);
  });
});

describe('第七批：初中教材（V4.3）——统编版语文、人教版数学、冀教版英语', () => {
  const of = (id: string) => volumesFor({ editionId: id });
  it('语文 6 册、数学 6 册：九年级下册是平台现有的未修订版', () => {
    for (const id of ['chinese.tongbian-jh', 'math.pep-jh']) {
      const vs = of(id);
      expect(vs.map((v) => `${v.grade}${v.term}`)).toEqual(['7上', '7下', '8上', '8下', '9上', '9下']);
      expect(vs.filter((v) => v.revision === null).map((v) => `${v.grade}${v.term}`)).toEqual(['9下']);
      for (const v of vs) {
        expect(v.tocProvenance).toBe('verified');
        expect(v.sources[0].note).toMatch(/教材 → 初中 →/);
        expect(v.sources[0].title).toMatch(/人民教育出版社/);
        expect(v.bankBookId).toBeUndefined();
        expect(v.units.every((u) => u.lessons.length === 0 && u.bankUnitIds.length === 0)).toBe(true);
        // V5.2：每一章 / 每个单元连到一个初中原创知识点，综合与实践、专题学习活动等不连
        for (const u of v.units) {
          expect(u.kpIds.length).toBe(/^第[一二三四五六七八九十]+(章|单元)/.test(u.title) ? 1 : 0);
          for (const kp of u.kpIds) expect(KP_BY_ID[kp]?.grade).toBe(v.grade);
        }
      }
    }
    expect(of('chinese.tongbian-jh')[0].officialName).toBe('（根据2022年版课程标准修订）义务教育教科书·语文 七年级上册');
    expect(of('chinese.tongbian-jh').at(-1)!.officialName).toMatch(/九年级下册（未修订版）/);
  });
  it('英语 5 册修订版；平台没有九年级下册，不登记', () => {
    const vs = of('english.jijiao-jh');
    expect(vs.map((v) => `${v.grade}${v.term}`)).toEqual(['7上', '7下', '8上', '8下', '9上']);
    expect(vs.every((v) => v.revision === 2024)).toBe(true);
    expect(vs.map((v) => v.units.length)).toEqual([8, 8, 8, 8, 6]);
    expect(vs[0].units[0]).toMatchObject({ title: 'Unit 1 New school, new beginning!', page: 1 });
  });
  it('目录抽查', () => {
    const zh = of('chinese.tongbian-jh')[0];
    expect(zh.units[0]).toMatchObject({ title: '第一单元——春；济南的冬天；雨的四季；古代诗歌四首；写作：热爱写作，学会观察', page: 1 });
    expect(zh.units.filter((u) => u.note).map((u) => u.title)).toContain('整本书阅读：《西游记》');
    const m = of('math.pep-jh');
    expect(m[0].units.map((u) => `${u.title.split('——')[0]}@${u.page}`)).toEqual([
      '第一章 有理数@1', '第二章 有理数的运算@24', '综合与实践 进位制的认识与探究@63', '第三章 代数式@68',
      '第四章 整式的加减@88', '第五章 一元一次方程@110', '第六章 几何图形初步@149', '综合与实践 设计学校田径运动会比赛场地@189',
    ]);
    expect(m.at(-1)!.units.map((u) => u.title.split('——')[0])).toEqual(['第二十六章 反比例函数', '第二十七章 相似', '第二十八章 锐角三角函数', '第二十九章 投影与视图', '部分中英文词汇索引']);
  });
  it('初中版本单独登记，不改动小学版本的册次', () => {
    expect(of('chinese.tongbian').every((v) => v.grade <= 6)).toBe(true);
    expect(of('math.pep').every((v) => v.grade <= 6)).toBe(true);
    expect(of('english.jijiao').every((v) => v.grade <= 6)).toBe(true);
  });
});
