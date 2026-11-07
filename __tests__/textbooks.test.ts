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
    expect(a.units[6].lessons[0].note).toMatch(/第三首待补/);
    expect(b.units[3].lessons.map((l) => l.kind)).toEqual(['text', 'text', 'text', 'text', 'other', 'garden']);
  });
  it('四年级上册（修订版）目录已核实；截图缺的第七单元开头有备注，不凭印象补', () => {
    const a = vols[6];
    expect(a.tocProvenance).toBe('verified');
    expect(completeness(a).lessons.verified).toBe(50);
    const nos = a.units.flatMap((u) => u.lessons.filter((l) => l.no).map((l) => l.no));
    expect(nos).toEqual([...Array.from({ length: 19 }, (_, i) => i + 1), ...Array.from({ length: 7 }, (_, i) => i + 21)]);
    expect(a.units[6].note).toMatch(/待补/);
    expect(a.units[6].page).toBeUndefined();
    expect(a.units[3].lessons[3]).toMatchObject({ no: 14, title: '女娲补天', starred: true });
  });
  it('四年级下册：平台目前是未修订版，单独登记为 legacy，不冒充修订版', () => {
    const old = volumesFor({ editionId: 'chinese.tongbian' }).find((v) => v.id === 'chinese.tongbian.legacy.g4b')!;
    expect(old.revision).toBeNull();
    expect(old.officialName).toMatch(/未修订版/);
    expect(old.tocProvenance).toBe('verified');
    expect(completeness(old).lessons.verified).toBe(51);
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
  it('还没核实的修订版（四、五年级下册，六年级上下册）：不算已核实，也不算完整', () => {
    expect(vols.filter((v) => v.tocProvenance === 'none').map((v) => v.id)).toEqual([
      'chinese.tongbian.2024.g4b', 'chinese.tongbian.2024.g5b', 'chinese.tongbian.2024.g6a', 'chinese.tongbian.2024.g6b',
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
  expect(s.volumes).toBe(14);
  expect(s.bankVolumes).toBe(BANK_INDEX.length);
  expect(s.verifiedVolumes).toBe(10);
  expect(s.verifiedUnits).toBe(91);
  expect(s.lessons.verified).toBe(463);
});
