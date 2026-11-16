/**
 * 阅读小屋（V2.10，本项目原创短文）：一、二年级带拼音的短文，读完回答问题。
 * 先听或自己读整篇，再做 2 道题（选择、判断或排序）。短文为原创，未摘录教材课文。已通过教师审核。
 */
import type { DisplayText, Exercise, Lesson, LessonStep } from '@/lesson/types';
import { PASSAGES_UPPER } from './chineseReadingUpper';
import { PASSAGES_JUNIOR } from './chineseReadingJunior';
import { zh } from './zh';

/** 一、二年级：[汉字, 拼音]；三年级起：普通文字（不注拼音） */
export type Txt = string | [string, string];
/** evidence：答案不是原文里的词语时（概括、推断类题目），写出短文中作为依据的原句片段 */
export type PassageQuestion =
  | { kind: 'choice'; q: Txt; ans: Txt; others: Txt[]; evidence?: string }
  | { kind: 'tf'; q: Txt; answer: boolean; evidence?: string }
  | { kind: 'order'; q: Txt; steps: Txt[] };
export interface Passage {
  n: number;
  title: Txt;
  emoji: string;
  paras: Txt[];
  questions: PassageQuestion[];
}

export const PASSAGES: Passage[] = [
  {
    n: 1,
    title: ['小雨点', 'xiǎo yǔ diǎn'],
    emoji: '🌧️',
    paras: [
      ['小雨点从天上落下来。', 'xiǎo yǔ diǎn cóng tiān shàng luò xià lái'],
      ['它落在花上，花笑了。', 'tā luò zài huā shang huā xiào le'],
      ['它落在草上，草绿了。', 'tā luò zài cǎo shang cǎo lǜ le'],
      ['它落在河里，小鱼游来游去。', 'tā luò zài hé lǐ xiǎo yú yóu lái yóu qù'],
    ],
    questions: [
      {
        kind: 'choice',
        q: ['小雨点落在花上，花怎么了？', 'xiǎo yǔ diǎn luò zài huā shang huā zěn me le'],
        ans: ['笑了', 'xiào le'],
        others: [
          ['哭了', 'kū le'],
          ['睡了', 'shuì le'],
        ],
      },
      {
        kind: 'tf',
        q: ['小雨点落在河里，小鸟游来游去。', 'xiǎo yǔ diǎn luò zài hé lǐ xiǎo niǎo yóu lái yóu qù'],
        answer: false,
      },
    ],
  },
  {
    n: 2,
    title: ['我的书包', 'wǒ de shū bāo'],
    emoji: '🎒',
    paras: [
      ['我有一个新书包。', 'wǒ yǒu yí gè xīn shū bāo'],
      ['书包里有语文书、数学书，还有一个铅笔盒。', 'shū bāo lǐ yǒu yǔ wén shū shù xué shū hái yǒu yí gè qiān bǐ hé'],
      ['每天放学，我都把书包整理好。', 'měi tiān fàng xué wǒ dōu bǎ shū bāo zhěng lǐ hǎo'],
    ],
    questions: [
      {
        kind: 'choice',
        q: ['书包里没有什么？', 'shū bāo lǐ méi yǒu shén me'],
        ans: ['小皮球', 'xiǎo pí qiú'],
        others: [
          ['铅笔盒', 'qiān bǐ hé'],
          ['语文书', 'yǔ wén shū'],
        ],
      },
      {
        kind: 'choice',
        q: ['每天放学，“我”把书包怎么样？', 'měi tiān fàng xué wǒ bǎ shū bāo zěn me yàng'],
        ans: ['整理好', 'zhěng lǐ hǎo'],
        others: [
          ['丢在地上', 'diū zài dì shang'],
          ['送给别人', 'sòng gěi bié rén'],
        ],
      },
    ],
  },
  {
    n: 3,
    title: ['秋天到了', 'qiū tiān dào le'],
    emoji: '🍂',
    paras: [
      ['秋天到了，天气凉了。', 'qiū tiān dào le tiān qì liáng le'],
      ['树叶黄了，一片一片落下来。', 'shù yè huáng le yí piàn yí piàn luò xià lái'],
      ['一群大雁往南飞。', 'yì qún dà yàn wǎng nán fēi'],
      ['田里的稻子熟了，农民笑了。', 'tián lǐ de dào zi shú le nóng mín xiào le'],
    ],
    questions: [
      {
        kind: 'choice',
        q: ['大雁往哪里飞？', 'dà yàn wǎng nǎ lǐ fēi'],
        ans: ['往南飞', 'wǎng nán fēi'],
        others: [
          ['往北飞', 'wǎng běi fēi'],
          ['往东飞', 'wǎng dōng fēi'],
        ],
      },
      { kind: 'tf', q: ['秋天到了，树叶绿了。', 'qiū tiān dào le shù yè lǜ le'], answer: false },
    ],
  },
  {
    n: 4,
    title: ['小狗找朋友', 'xiǎo gǒu zhǎo péng you'],
    emoji: '🐶',
    paras: [
      ['小狗想找一个朋友。', 'xiǎo gǒu xiǎng zhǎo yí gè péng you'],
      ['它看见小鸡，小鸡在吃米。', 'tā kàn jiàn xiǎo jī xiǎo jī zài chī mǐ'],
      ['它看见小鸭，小鸭在游泳。', 'tā kàn jiàn xiǎo yā xiǎo yā zài yóu yǒng'],
      [
        '最后，小狗和小猫一起玩皮球，它们成了好朋友。',
        'zuì hòu xiǎo gǒu hé xiǎo māo yì qǐ wán pí qiú tā men chéng le hǎo péng you',
      ],
    ],
    questions: [
      {
        kind: 'choice',
        q: ['谁和小狗成了好朋友？', 'shuí hé xiǎo gǒu chéng le hǎo péng you'],
        ans: ['小猫', 'xiǎo māo'],
        others: [
          ['小鸡', 'xiǎo jī'],
          ['小鸭', 'xiǎo yā'],
        ],
      },
      {
        kind: 'choice',
        q: ['小鸭在做什么？', 'xiǎo yā zài zuò shén me'],
        ans: ['游泳', 'yóu yǒng'],
        others: [
          ['吃米', 'chī mǐ'],
          ['玩皮球', 'wán pí qiú'],
        ],
      },
    ],
  },
  {
    n: 5,
    title: ['洗小手', 'xǐ xiǎo shǒu'],
    emoji: '🧼',
    paras: [
      ['吃饭以前要洗手。', 'chī fàn yǐ qián yào xǐ shǒu'],
      ['先把手打湿，再擦上肥皂。', 'xiān bǎ shǒu dǎ shī zài cā shàng féi zào'],
      ['搓一搓，冲一冲，小手干干净净。', 'cuō yi cuō chōng yi chōng xiǎo shǒu gān gān jìng jìng'],
    ],
    questions: [
      {
        kind: 'order',
        q: ['按短文里的顺序，把洗手的步骤排一排。', 'àn duǎn wén lǐ de shùn xù bǎ xǐ shǒu de bù zhòu pái yi pái'],
        steps: [
          ['把手打湿', 'bǎ shǒu dǎ shī'],
          ['擦上肥皂', 'cā shàng féi zào'],
          ['搓一搓', 'cuō yi cuō'],
          ['冲一冲', 'chōng yi chōng'],
        ],
      },
      {
        kind: 'choice',
        q: ['什么时候要洗手？', 'shén me shí hou yào xǐ shǒu'],
        ans: ['吃饭以前', 'chī fàn yǐ qián'],
        others: [
          ['看电视时', 'kàn diàn shì shí'],
          ['睡着以后', 'shuì zháo yǐ hòu'],
        ],
      },
    ],
  },
  {
    n: 6,
    title: ['月亮', 'yuè liang'],
    emoji: '🌙',
    paras: [
      ['晚上，月亮出来了。', 'wǎn shang yuè liang chū lái le'],
      ['有时候，月亮像一个圆圆的盘子。', 'yǒu shí hou yuè liang xiàng yí gè yuán yuán de pán zi'],
      ['有时候，月亮像一只弯弯的小船。', 'yǒu shí hou yuè liang xiàng yì zhī wān wān de xiǎo chuán'],
    ],
    questions: [
      {
        kind: 'choice',
        q: ['圆圆的月亮像什么？', 'yuán yuán de yuè liang xiàng shén me'],
        ans: ['盘子', 'pán zi'],
        others: [
          ['小船', 'xiǎo chuán'],
          ['香蕉', 'xiāng jiāo'],
        ],
      },
      {
        kind: 'choice',
        q: ['弯弯的月亮像什么？', 'wān wān de yuè liang xiàng shén me'],
        ans: ['小船', 'xiǎo chuán'],
        others: [
          ['盘子', 'pán zi'],
          ['皮球', 'pí qiú'],
        ],
      },
    ],
  },
];

export const plainOf = (t: Txt) => (typeof t === 'string' ? t : t[0]);
const Z = (t: Txt): DisplayText => (typeof t === 'string' ? t : zh(t[0], t[1]));
const say = (s: string) => ({ text: s, lang: 'zh-CN' as const });
const rotate = <X>(a: X[], k: number) => a.map((_, i) => a[(i + k) % a.length]);
const HINT = { text: zh('再读一读短文。', 'zài dú yi dú duǎn wén'), speak: say('再读一读短文。') };
const HINT_PLAIN = { text: '回到短文里找一找依据。', speak: say('回到短文里找一找依据。') };

export function passageLesson(p: Passage, grade = 1): Lesson {
  const plain = grade >= 3;
  const hint = plain ? HINT_PLAIN : HINT;
  const full = p.paras.map(plainOf).join('');
  const title = plainOf(p.title);
  const steps: LessonStep[] = [
    {
      kind: 'read-passage',
      id: 'p-read',
      title: {
        text: typeof p.title === 'string' ? `读一读：${title}` : zh(`读一读：${title}`, `dú yi dú ${p.title[1]}`),
        speak: say(`读一读，${title}`),
      },
      visual: { emoji: p.emoji },
      paragraphs: p.paras.map(Z),
      speak: say(full),
    },
    ...p.questions.map((q, i): LessonStep => {
      const id = grade === 1 ? `zhread${p.n}-q${i}` : `zhread-g${grade}-${p.n}-q${i}`;
      let exercise: Exercise;
      if (q.kind === 'tf') {
        exercise = {
          kind: 'truefalse',
          id,
          skill: 'zh.reading',
          prompt: {
            text: plain ? '根据短文判断，说得对吗？' : zh('读一读，说得对吗？', 'dú yi dú shuō de duì ma'),
            speak: say(plain ? '根据短文判断，说得对吗？' : '读一读，说得对吗？'),
          },
          statement: { text: Z(q.q), speak: say(plainOf(q.q)) },
          answer: q.answer,
          wrongHint: hint,
        };
      } else if (q.kind === 'order') {
        exercise = {
          kind: 'sort',
          id,
          skill: 'zh.reading',
          prompt: { text: Z(q.q), speak: say(plainOf(q.q)) },
          items: rotate(
            q.steps.map((s, k) => ({ id: String(k), text: Z(s) })),
            2,
          ),
          order: q.steps.map((_, k) => String(k)),
          wrongHint: hint,
        };
      } else {
        const opts = rotate([q.ans, ...q.others], i + p.n);
        exercise = {
          kind: 'choice',
          id,
          skill: 'zh.reading',
          prompt: { text: Z(q.q), speak: say(plainOf(q.q)) },
          options: opts.map((o, k) => ({ id: String(k), text: Z(o), speak: say(plainOf(o)) })),
          answerId: String(opts.indexOf(q.ans)),
          wrongHint: hint,
        };
      }
      return { kind: 'exercise', id: `p-q${i}`, exercise };
    }),
  ];
  return {
    id: grade === 1 ? `zh-read-${p.n}` : `zh-read-g${grade}-${p.n}`,
    subject: 'chinese',
    order: grade === 1 ? 20 + p.n : 100 * grade + p.n,
    track: 'zhread',
    grade,
    title: Z(p.title),
    parentSummary: `阅读小屋（${grade}年级）：原创短文《${title}》，${p.paras.length} 句${plain ? '，不注拼音' : '，全文注音'}。先听或自己读，再回答 ${p.questions.length} 道题。`,
    emoji: p.emoji,
    estimatedMinutes: 5,
    source: 'original',
    sourceNote: '原创短文，未摘录教材课文；已通过教师审核。',
    steps,
  };
}

export const READING_LESSONS: Lesson[] = [
  ...PASSAGES.map((p) => passageLesson(p, 1)),
  ...Object.entries(PASSAGES_UPPER).flatMap(([g, ps]) => ps.map((p) => passageLesson(p, Number(g)))),
  // 七～九年级（V5.2）
  ...Object.entries(PASSAGES_JUNIOR).flatMap(([g, ps]) => ps.map((p) => passageLesson(p, Number(g)))),
];
