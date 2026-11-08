/** 教材资源库简单视图（V4.1）：下拉选项、默认版本、选册、能否练习 */
import { createEmptyProgress, parseProgress } from '@/progress/model';
import { currentTerm, defaultEdition, editionOptions, gradesOf, hasVerifiedToc, pickVolume, unitPracticeId } from '@/textbooks/pick';

describe('教材资源库简单视图', () => {
  it('版本下拉：已核实的版本排在前面，没核对的标“目录还没核对”', () => {
    const o = editionOptions('chinese');
    expect(o[0]).toMatchObject({ value: 'chinese.tongbian', group: '可以查看目录' });
    const wait = o.filter((x) => x.label.includes('目录还没核对'));
    expect(wait.length).toBeGreaterThan(0);
    expect(o.findIndex((x) => x.label.includes('目录还没核对'))).toBeGreaterThan(o.findIndex((x) => x.value === 'chinese.tongbian'));
    for (const x of wait) expect(hasVerifiedToc(x.value)).toBe(false);
  });

  it('默认版本：语文统编、数学人教、英语人教 PEP；家长选过的优先，选错科目的忽略', () => {
    expect(defaultEdition('chinese')).toBe('chinese.tongbian');
    expect(defaultEdition('math')).toBe('math.pep');
    expect(defaultEdition('english')).toBe('english.pep');
    expect(defaultEdition('math', 'math.bsd')).toBe('math.bsd');
    expect(defaultEdition('math', 'english.pep')).toBe('math.pep');
  });

  it('选册：统编一年级上册是已核实目录；英语三年级起', () => {
    const v = pickVolume('chinese.tongbian', 1, '上')!;
    expect(v.id).toBe('chinese.tongbian.2024.g1a');
    expect(v.tocProvenance).toBe('verified');
    expect(gradesOf('english.pep')[0]).toBe(3);
    expect(pickVolume('english.pep', 1, '上')).toBeNull();
  });

  it('同年级同学期有修订版和未修订版时选修订版；只有未修订版时选未修订版', () => {
    expect(pickVolume('english.pep', 5, '上')!.revision).toBe(2024);
    expect(pickVolume('english.pep', 5, '下')!.revision).toBeNull();
  });

  it('学期：2～7 月下册，其余上册', () => {
    expect(currentTerm(new Date(2026, 10, 9))).toBe('上');
    expect(currentTerm(new Date(2027, 2, 1))).toBe('下');
    expect(currentTerm(new Date(2027, 0, 10))).toBe('上');
  });

  it('单元练习：有出题程序的知识点优先，其次题库单元，都没有不显示', () => {
    const u = { id: 'u', order: 0, title: 't', provenance: 'verified' as const, lessons: [], kpIds: ['a', 'b'], bankUnitIds: ['x'] };
    expect(unitPracticeId(u, (k) => k === 'b')).toBe('kp:b');
    expect(unitPracticeId(u, () => false)).toBe('bank:x');
    expect(unitPracticeId({ ...u, bankUnitIds: [] }, () => false)).toBeNull();
  });

  it('记住的版本：旧记录没有这一项时补默认值，有时保留', () => {
    const old = JSON.parse(JSON.stringify(createEmptyProgress()));
    delete old.settings.textbookEdition;
    expect(parseProgress(JSON.stringify(old))!.settings.textbookEdition).toEqual({ chinese: '', math: '', english: '' });
    old.settings.textbookEdition = { math: 'math.bsd' };
    expect(parseProgress(JSON.stringify(old))!.settings.textbookEdition).toEqual({ chinese: '', math: 'math.bsd', english: '' });
  });
});
