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
  it('目录尚未与官方核对：不算已核实，也不算完整', () => {
    for (const v of vols) {
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
  expect(s.volumes).toBe(12);
  expect(s.bankVolumes).toBe(BANK_INDEX.length);
  expect(s.verifiedVolumes).toBe(0);
  expect(s.lessons.verified).toBe(0);
});
