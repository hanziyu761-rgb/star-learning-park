/**
 * 课程内容校验：拼音、答案、题目结构。
 * 拼音由人工填写，这里用 pinyin-pro 词库逐字交叉核对；
 * 两者不一致且属于规范读法的（轻声、“一/不”变调等），必须在 ACCEPTED 中写明理由。
 */
import { pinyin } from 'pinyin-pro';
import { LESSONS, SKILL_LABELS } from '@/content';
import { zh } from '@/content/zh';
import type { Exercise, Lesson, ZhText } from '@/lesson/types';

/**
 * 已人工确认的读法差异（词库对多音字、轻声、变调判断有误）。
 * 键为“汉字:我们的拼音:词库拼音”，只放行这个具体组合，其它错误仍会被发现。
 */
const ACCEPTED: Record<string, string> = {
  '数:shǔ:shù': '“数一数、数苹果”中“数”是动词，读 shǔ',
  '着:zhe:zhāo': '“接着”中“着”是助词，读轻声 zhe',
  '得:de:dé': '“说得对、算得对”中“得”是结构助词，读轻声 de',
  '亮:liang:liàng': '“月亮”中“亮”读轻声，按小学教材注音',
  '听:ting:tīng': '“听听”重叠时第二个字读轻声',
  '个:ge:gè': '“哪个”中“个”读轻声',
  '一:yí:yi': '“一个”中“一”在去声前变调读 yí',
  '友:you:yǒu': '“朋友”中“友”读轻声',
  '啦:la:lā': '语气词“啦”读轻声',
  '害:hai:hài': '“厉害”中“害”读轻声',
  '试:shi:shì': '“试试”重叠时第二个字读轻声',
  '星:xing:xīng': '“星星”第二个字读轻声',
  '问:wen:wèn': '“问问”重叠时第二个字读轻声',
  '识:shi:shí': '“知识”“认识”中“识”读轻声',
  '找:zhao:zhǎo': '“找找”重叠时第二个字读轻声',
  '一:yi:yī': '“练一练、分一分”等动词重叠中间的“一”读轻声',
};

function isZhText(v: unknown): v is ZhText {
  return Array.isArray(v) && v.length > 0 && v.every((s) => s && typeof s === 'object' && 'char' in s);
}

function collectZhTexts(node: unknown, out: ZhText[] = []): ZhText[] {
  if (isZhText(node)) {
    out.push(node);
    return out;
  }
  if (Array.isArray(node)) node.forEach((n) => collectZhTexts(n, out));
  else if (node && typeof node === 'object') Object.values(node).forEach((n) => collectZhTexts(n, out));
  return out;
}

function exercisesOf(lesson: Lesson): Exercise[] {
  return lesson.steps.flatMap((s) => (s.kind === 'exercise' ? [s.exercise] : []));
}

describe('zh() 拼音辅助函数', () => {
  it('汉字和拼音一一对应，标点不注音', () => {
    expect(zh('日月。', 'rì yuè')).toEqual([{ char: '日', py: 'rì' }, { char: '月', py: 'yuè' }, { char: '。' }]);
  });
  it('数量不一致时报错', () => {
    expect(() => zh('日月', 'rì')).toThrow();
    expect(() => zh('日', 'rì yuè')).toThrow();
  });
});

/** 用词库核对一段文字的拼音，返回问题列表 */
function checkPinyin(where: string, text: ZhText): string[] {
  const problems: string[] = [];
  const chars = text.map((s) => s.char).join('');
  const ref = pinyin(chars, { type: 'array', toneType: 'symbol', nonZh: 'removed' });
  const han = text.filter((s) => s.py);
  if (han.length !== ref.length) return [`${where}「${chars}」拼音数量不一致`];
  han.forEach((seg, i) => {
    if (seg.py !== ref[i] && !ACCEPTED[`${seg.char}:${seg.py}:${ref[i]}`]) {
      problems.push(`${where}「${chars}」第${i + 1}字「${seg.char}」：填写 ${seg.py}，词库 ${ref[i]}`);
    }
  });
  return problems;
}

describe('界面文字的拼音（src 下所有 zh() 调用）', () => {
  it('与词库一致（或已登记为规范读法）', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d)) {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(f)) files.push(full);
      }
    };
    walk(path.join(__dirname, '..', 'src'));
    const problems: string[] = [];
    let count = 0;
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      // 只检查字面量参数；模板字符串中的动态数字不注音，由 zh() 自身校验数量
      for (const m of src.matchAll(/zh\(\s*'([^'`$]+)'\s*,\s*'([^']*)'\s*\)/g)) {
        count++;
        problems.push(...checkPinyin(path.basename(file), zh(m[1], m[2])));
      }
    }
    expect(count).toBeGreaterThan(50);
    expect(problems).toEqual([]);
  });
});

describe('课程内容', () => {
  it('每个学科至少一节课，课程 id 唯一', () => {
    for (const s of ['math', 'chinese', 'english'] as const) {
      expect(LESSONS.filter((l) => l.subject === s).length).toBeGreaterThanOrEqual(1);
    }
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it('所有拼音与词库一致（或已登记为规范读法）', () => {
    const problems: string[] = [];
    for (const lesson of LESSONS) {
      for (const text of collectZhTexts(lesson)) {
        const chars = text.map((s) => s.char).join('');
        const ref = pinyin(chars, { type: 'array', toneType: 'symbol', nonZh: 'removed' });
        const ours = text.filter((s) => s.py).map((s) => s.py!);
        expect(ours.length).toBe(ref.length);
        ours.forEach((py, i) => {
          const han = text.filter((x) => x.py)[i].char;
          if (py !== ref[i] && !ACCEPTED[`${han}:${py}:${ref[i]}`]) {
            problems.push(`${lesson.id}「${chars}」第${i + 1}字：填写 ${py}，词库 ${ref[i]}`);
          }
        });
      }
    }
    expect(problems).toEqual([]);
  });

  it('每节课的步骤 id 唯一，练习 id 唯一，知识点都有名称', () => {
    for (const lesson of LESSONS) {
      expect(new Set(lesson.steps.map((s) => s.id)).size).toBe(lesson.steps.length);
      const ex = exercisesOf(lesson);
      expect(new Set(ex.map((e) => e.id)).size).toBe(ex.length);
      for (const e of ex) expect(SKILL_LABELS[e.skill]).toBeDefined();
      for (const s of lesson.steps) if ('skill' in s) expect(SKILL_LABELS[s.skill]).toBeDefined();
    }
  });

  it('每道题都有正确答案且答案在选项中', () => {
    for (const lesson of LESSONS) {
      for (const e of exercisesOf(lesson)) {
        if (e.kind === 'choice') {
          expect(e.options.map((o) => o.id)).toContain(e.answerId);
          expect(new Set(e.options.map((o) => o.id)).size).toBe(e.options.length);
        }
        if (e.kind === 'sort') {
          expect([...e.order].sort()).toEqual(e.items.map((i) => i.id).sort());
        }
        if (e.kind === 'drag-match') {
          expect(new Set(e.pairs.map((p) => p.id)).size).toBe(e.pairs.length);
        }
      }
    }
  });

  it('数学题的数量与答案一致', () => {
    const math = LESSONS.find((l) => l.subject === 'math')!;
    for (const s of math.steps) {
      if (s.kind === 'combine') expect(s.choices).toContain(s.left + s.right);
      if (s.kind === 'drag-basket') expect(s.target).toBeLessThanOrEqual(s.total);
      if (s.kind === 'count-demo') expect(s.numberWords).toHaveLength(s.count);
      if (s.kind === 'exercise' && s.exercise.kind === 'choice' && s.exercise.stem?.visual?.count) {
        expect(s.exercise.answerId).toBe(String(s.exercise.stem.visual.count));
      }
      if (s.kind === 'exercise' && s.exercise.kind === 'drag-match') {
        for (const p of s.exercise.pairs) expect(String(p.target.visual?.count)).toBe(p.item.text);
      }
    }
  });

  it('英语课的题目指令使用英文（中文只出现在可选提示中）', () => {
    const en = LESSONS.find((l) => l.subject === 'english')!;
    const texts: string[] = [];
    for (const s of en.steps) {
      if ('title' in s && typeof s.title === 'object' && 'text' in s.title) texts.push(String(s.title.text));
      if (s.kind === 'exercise') texts.push(String(s.exercise.prompt.text));
    }
    for (const t of texts) expect(t).not.toMatch(/\p{Script=Han}/u);
  });
});
