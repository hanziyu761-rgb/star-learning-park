/**
 * 拍照错题（V4.1）：学习记录 v9 迁移、保存与删除、知识点候选、数学同类题、打印排版。
 */
import { exerciseFromKpId } from '@/knowledge/generators';
import { kpsFor } from '@/knowledge/graph';
import { AI_LABEL, allCandidates, candidatesFor, canMakeMath, mathItem, mathSimilarIds, photoHtml } from '@/photo/logic';
import { createEmptyProgress, MAX_PHOTO_MISTAKES, parseProgress, progressReducer, type PhotoMistake, type ProgressState } from '@/progress/model';

const entry = (over: Partial<PhotoMistake> = {}): PhotoMistake => ({
  id: 'ph-1',
  at: new Date(2026, 10, 8).getTime(),
  subject: 'math',
  grade: 1,
  kpId: 'm1.add10',
  kpName: '10 以内加法',
  question: '3 + 4 = ',
  childAnswer: '8',
  correctAnswer: '7',
  reason: '数数时多数了一个',
  exerciseIds: [],
  aiItems: [],
  ...over,
});

describe('学习记录 v9：拍照错题', () => {
  it('v8 旧数据升级：原有记录不变，新增空的拍照错题', () => {
    const v8 = { ...createEmptyProgress(), version: 8, totalStars: 12 } as Partial<ProgressState>;
    delete v8.photoMistakes;
    const s = parseProgress(JSON.stringify(v8))!;
    expect(s.version).toBe(9);
    expect(s.totalStars).toBe(12);
    expect(s.photoMistakes).toEqual([]);
  });

  it('损坏的拍照错题条目被丢弃，缺字段的补成空数组', () => {
    const raw = { ...createEmptyProgress(), photoMistakes: [null, { id: 'x' }, { ...entry(), exerciseIds: undefined, aiItems: 'bad' }] };
    const s = parseProgress(JSON.stringify(raw))!;
    expect(s.photoMistakes).toHaveLength(1);
    expect(s.photoMistakes[0].exerciseIds).toEqual([]);
    expect(s.photoMistakes[0].aiItems).toEqual([]);
  });

  it('保存、同 id 覆盖、删除；最多保留 200 道', () => {
    let s = progressReducer(createEmptyProgress(), { type: 'photo/add', entry: entry() });
    s = progressReducer(s, { type: 'photo/add', entry: entry({ question: '改过的题' }) });
    expect(s.photoMistakes).toHaveLength(1);
    expect(s.photoMistakes[0].question).toBe('改过的题');
    s = progressReducer(s, { type: 'photo/remove', id: 'ph-1' });
    expect(s.photoMistakes).toEqual([]);
    for (let i = 0; i < MAX_PHOTO_MISTAKES + 5; i++) s = progressReducer(s, { type: 'photo/add', entry: entry({ id: `p${i}` }) });
    expect(s.photoMistakes).toHaveLength(MAX_PHOTO_MISTAKES);
    expect(s.photoMistakes[0].id).toBe('p5');
  });

  it('拍照错题不进入孩子的答题记录和错题统计（不造假数据）', () => {
    const s = progressReducer(createEmptyProgress(), { type: 'photo/add', entry: entry() });
    expect(s.results).toEqual([]);
    expect(s.mistakes).toEqual({});
    expect(s.totalStars).toBe(0);
  });
});

describe('拍照错题：知识点候选与同类题', () => {
  it('候选就是这一科这个年级的知识点（只有 id 和名称）', () => {
    const c = candidatesFor('math', 1);
    expect(c.length).toBe(kpsFor('math', 1).length);
    expect(c.length).toBeGreaterThan(5);
    expect(Object.keys(c[0]).sort()).toEqual(['id', 'name']);
    expect(allCandidates(3).length).toBe(candidatesFor('math', 3).length + candidatesFor('chinese', 3).length + candidatesFor('english', 3).length);
  });

  it('数学同类题：原创程序出 5 道不重复的题，都能还原，答案由程序给出', () => {
    expect(canMakeMath('m1.add10')).toBe(true);
    const ids = mathSimilarIds('m1.add10', 5, () => 0.37);
    expect(ids.length).toBeGreaterThanOrEqual(1);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.startsWith('kp:m1.add10:')).toBe(true);
      expect(exerciseFromKpId(id)).not.toBeNull();
    }
    const printable = ids.map(mathItem).filter(Boolean);
    expect(printable.length).toBeGreaterThan(0);
    for (const it of printable) expect(it!.answer).toBeTruthy();
  });

  it('语文、英语知识点和不存在的知识点不能用数学出题程序', () => {
    const zh = kpsFor('chinese', 1)[0];
    expect(canMakeMath(zh.id)).toBe(false);
    expect(canMakeMath('')).toBe(false);
    expect(canMakeMath('m9.nothing')).toBe(false);
    expect(mathSimilarIds('m9.nothing')).toEqual([]);
  });
});

describe('拍照错题：打印', () => {
  it('数学练习单：原题、同类题、答案页，注明原创程序出题、照片未保存', () => {
    const m = entry({ exerciseIds: mathSimilarIds('m1.add10', 5, () => 0.61) });
    const html = photoHtml(m, true);
    expect(html).toContain('错题同类练习');
    expect(html).toContain('3 + 4 =');
    expect(html).toContain('参考答案');
    expect(html).toContain('原创出题程序');
    expect(html).toContain('照片没有保存');
    expect(photoHtml(m, false)).not.toContain('参考答案');
  });

  it('语文、英语练习单标注“AI 生成，未经人工审核”，答案字母对应正确选项；文字会转义', () => {
    const m = entry({
      subject: 'english',
      grade: 3,
      kpId: '',
      kpName: '',
      question: 'What <b>colour</b>?',
      aiItems: [{ question: 'The sky is ___.', options: ['red', 'blue', 'green'], answer: 'blue', explain: '' }],
    });
    const html = photoHtml(m, true);
    expect(html).toContain(AI_LABEL);
    expect(html).toContain('B（blue）');
    expect(html).not.toContain('<b>colour</b>');
  });
});
