/**
 * 英语阅读 七～九年级（V5.4，本项目原创短文，未摘录教材课文）：每个年级 3 篇阅读理解（记叙、应用文、说明 / 议论）+ 1 篇完形填空。
 * 题目指令用英文，中文只放在 hintZh 小提示里。说明文只写公认的常识。
 * 完形填空每空 4 个选项，干扰项都是确定错误的形式（不会出现“也说得通”的选项）。
 */
import type { Exercise, Lesson, LessonStep } from '@/lesson/types';

type Q =
  | { q: string; ans: string; others: string[]; hintZh: string }
  | { tf: true; q: string; answer: boolean; hintZh: string };

interface Reading {
  n: number;
  title: string;
  emoji: string;
  paras: string[];
  questions: Q[];
}
interface Cloze {
  n: number;
  title: string;
  emoji: string;
  /** 用 {1}～{5} 标出空格 */
  text: string;
  blanks: { ans: string; others: string[]; hintZh: string }[];
}

const READING: Record<number, Reading[]> = {
  7: [
    {
      n: 1,
      title: 'A New Friend',
      emoji: '🤝',
      paras: [
        'Li Ming is a new student at Green Hill Middle School. On his first day, he felt shy and did not know anyone in his class.',
        'At lunch time, a boy named Tom sat next to him. "Hi, I\'m Tom. Do you like football?" he asked with a smile.',
        'Li Ming nodded. They talked about their favourite players and found that they both liked the same team.',
        'After school, Tom showed Li Ming the school library and the sports field. Now they play football together every Friday afternoon.',
      ],
      questions: [
        { q: 'How did Li Ming feel on his first day?', ans: 'Shy', others: ['Excited', 'Angry'], hintZh: '李明第一天感觉怎么样？' },
        { q: 'When did Li Ming and Tom first talk?', ans: 'At lunch time', others: ['After school', 'On Friday afternoon'], hintZh: '他们第一次说话是什么时候？' },
        { tf: true, q: 'Li Ming and Tom play football together every Friday afternoon.', answer: true, hintZh: '判断：他们每周五下午一起踢足球。' },
      ],
    },
    {
      n: 2,
      title: 'School Art Festival',
      emoji: '🎨',
      paras: [
        'School Art Festival',
        'Date: Friday, May 20th. Time: 2:00 p.m. to 5:00 p.m. Place: the School Hall.',
        'Students can show their paintings, photos and handmade crafts. Each class should bring at least three works.',
        'Please give your works to Ms Wang in Room 302 before Wednesday. Parents are welcome to visit.',
      ],
      questions: [
        { q: 'When is the art festival?', ans: 'On Friday afternoon', others: ['On Wednesday morning', 'On Friday morning'], hintZh: '艺术节在什么时候？' },
        { q: 'Who should students give their works to?', ans: 'Ms Wang in Room 302', others: ['The headmaster', 'Their parents'], hintZh: '作品交给谁？' },
        { tf: true, q: 'Parents cannot visit the festival.', answer: false, hintZh: '判断：家长不能来参观。' },
      ],
    },
    {
      n: 3,
      title: 'Why Do We Need Sleep?',
      emoji: '😴',
      paras: [
        'Sleep is very important for our health. Children and teenagers need more sleep than adults, usually eight to ten hours a night.',
        'When we sleep, our body grows and repairs itself. Our brain also sorts out what we learned during the day, so sleep helps us remember things better.',
        'If we do not get enough sleep, we may feel tired and find it hard to pay attention in class.',
        'To sleep well, try to go to bed at the same time every day, and stop using phones or computers an hour before bed.',
      ],
      questions: [
        { q: 'What is the passage mainly about?', ans: 'Why sleep is important and how to sleep well', others: ['How to use computers', 'Why adults need less sleep'], hintZh: '这篇短文主要讲什么？' },
        { q: 'According to the passage, what helps us remember things better?', ans: 'Sleep', others: ['Using phones', 'Going to bed late'], hintZh: '根据短文，什么帮助我们记得更牢？' },
        { q: 'What should we do an hour before bed?', ans: 'Stop using phones or computers', others: ['Do more homework', 'Eat a big meal'], hintZh: '睡前一小时应该做什么？' },
      ],
    },
  ],
  8: [
    {
      n: 1,
      title: 'The Kind Bus Driver',
      emoji: '🚌',
      paras: [
        'It was raining heavily one evening. An old woman with two heavy bags was waiting at the bus stop.',
        'When the bus came, she tried to get on, but her bags were too heavy. The driver, Mr Zhang, got off the bus and helped her carry the bags.',
        'Some passengers looked unhappy because they were in a hurry. But Mr Zhang said, "It only takes one minute to help someone. One day we will all be old."',
        'After hearing this, a young man stood up and gave his seat to the old woman. The whole bus became warm and quiet.',
      ],
      questions: [
        { q: 'Why did the old woman have trouble getting on the bus?', ans: 'Her bags were too heavy', others: ['She had no money', 'The driver did not stop'], hintZh: '老奶奶为什么上车困难？' },
        { q: 'How did some passengers feel at first?', ans: 'Unhappy', others: ['Excited', 'Thankful'], hintZh: '一开始有些乘客感觉怎样？' },
        { q: 'What do Mr Zhang\'s words tell us?', ans: 'We should be willing to help others, especially old people', others: ['Passengers should never be in a hurry', 'Old people should not take buses'], hintZh: '张师傅的话告诉我们什么？' },
      ],
    },
    {
      n: 2,
      title: 'Say No to Plastic Bags',
      emoji: '🛍️',
      paras: [
        'Plastic bags are cheap and easy to use, so people use millions of them every day. However, they cause serious problems.',
        'Most plastic bags are used for only a few minutes, but they can take hundreds of years to break down. Many of them end up in rivers and seas, where animals may eat them by mistake.',
        'Some cities have started to charge money for plastic bags in shops. As a result, more people now bring their own cloth bags when they go shopping.',
        'Each of us can help. Say no to plastic bags whenever you can, and reuse the bags you already have.',
      ],
      questions: [
        { q: 'What is the main idea of the passage?', ans: 'Plastic bags harm the environment, so we should use fewer of them', others: ['Plastic bags are cheap and useful', 'Shops should give free bags to everyone'], hintZh: '短文的主要观点是什么？' },
        { q: 'What may happen to animals in rivers and seas?', ans: 'They may eat plastic bags by mistake', others: ['They may use the bags as homes', 'They may stop eating fish'], hintZh: '河里和海里的动物可能会怎样？' },
        { tf: true, q: 'Plastic bags break down in a few weeks.', answer: false, hintZh: '判断：塑料袋几个星期就能分解。' },
      ],
    },
    {
      n: 3,
      title: 'An Email to Jenny',
      emoji: '✉️',
      paras: [
        'Dear Jenny,',
        'Thank you for inviting me to your birthday party next Sunday. I\'m sorry, but I can\'t come. My cousin is getting married that day, and my whole family is going to the wedding in Shanghai.',
        'I have bought you a small gift, a book about animals, because I know you love them. I will give it to you at school on Monday.',
        'I hope you have a wonderful party! Best wishes, Lucy',
      ],
      questions: [
        { q: 'Why can\'t Lucy go to the party?', ans: 'She is going to her cousin\'s wedding', others: ['She is ill', 'She has a test on Sunday'], hintZh: '露西为什么不能去聚会？' },
        { q: 'What gift did Lucy buy for Jenny?', ans: 'A book about animals', others: ['A toy animal', 'A birthday cake'], hintZh: '露西买了什么礼物？' },
        { q: 'When will Jenny get the gift?', ans: 'On Monday at school', others: ['On Sunday at the party', 'In Shanghai'], hintZh: '珍妮什么时候拿到礼物？' },
      ],
    },
  ],
  9: [
    {
      n: 1,
      title: 'A Lesson from the Science Fair',
      emoji: '🤖',
      paras: [
        'For weeks, Chen Yu worked on a small robot for the school science fair. He wanted it to pick up rubbish by itself.',
        'On the day of the fair, the robot suddenly stopped working in front of the judges. Chen Yu felt his face turn red. He wanted to run away.',
        'Instead, he took a deep breath and explained what he had planned and why he thought the robot had failed. He also told the judges how he would fix it.',
        'To his surprise, the judges gave him a prize for "Best Thinking". One judge said, "Real scientists learn from failure. You showed us how to think like a scientist."',
      ],
      questions: [
        { q: 'What was Chen Yu\'s robot designed to do?', ans: 'Pick up rubbish by itself', others: ['Answer the judges\' questions', 'Help students with homework'], hintZh: '陈宇的机器人是用来做什么的？' },
        { q: 'What did Chen Yu do after the robot stopped working?', ans: 'He explained his plan and how he would fix it', others: ['He ran away from the fair', 'He asked his teacher to fix it'], hintZh: '机器人坏了以后陈宇做了什么？' },
        { q: 'What can we learn from the story?', ans: 'Failure can be a chance to learn', others: ['Robots never work well', 'Judges only like perfect projects'], hintZh: '从故事中我们能学到什么？' },
      ],
    },
    {
      n: 2,
      title: 'Volunteers Wanted',
      emoji: '📚',
      paras: [
        'Volunteers Wanted! The City Library needs student volunteers for the summer holiday.',
        'What you will do: help younger children choose books, read stories to them, and keep the shelves tidy.',
        'Time: every Saturday morning, 9:00 to 11:30, from July 6th to August 24th.',
        'Who can apply: students aged 14 to 16 who are friendly, patient and good at speaking. Send an email to library@example.com before June 30th. Tell us about yourself and why you want to help.',
      ],
      questions: [
        { q: 'Who can apply to be a volunteer?', ans: 'Students aged 14 to 16', others: ['All children', 'Parents of young children'], hintZh: '谁可以报名当志愿者？' },
        { q: 'Which is NOT one of the volunteers\' jobs?', ans: 'Selling books', others: ['Reading stories to children', 'Keeping the shelves tidy'], hintZh: '哪一项不是志愿者的工作？' },
        { q: 'What is the last day to apply?', ans: 'June 30th', others: ['July 6th', 'August 24th'], hintZh: '报名截止是哪一天？' },
      ],
    },
    {
      n: 3,
      title: 'The Power of Habits',
      emoji: '🌱',
      paras: [
        'Many people think success comes from talent. In fact, good habits often matter more.',
        'A habit is something we do again and again until it becomes automatic. Reading for twenty minutes a day may not seem like much, but over a year it adds up to more than a hundred hours.',
        'Bad habits work in the same way. Staying up late once or twice may not hurt, but doing it every night can damage our health and our studies.',
        'Experts suggest starting small. If you want to exercise more, begin with ten minutes a day. Once it becomes part of your life, you can slowly do more.',
      ],
      questions: [
        { q: 'What is the writer\'s opinion?', ans: 'Good habits are often more important than talent', others: ['Talent is the only key to success', 'Habits are too hard to change'], hintZh: '作者的观点是什么？' },
        { q: 'Why does the writer mention reading twenty minutes a day?', ans: 'To show that small actions add up over time', others: ['To show that reading is boring', 'To explain why people stay up late'], hintZh: '作者为什么举“每天读二十分钟”的例子？' },
        { q: 'What do experts suggest?', ans: 'Start with small changes', others: ['Change all your habits at once', 'Exercise for two hours every day'], hintZh: '专家建议怎么做？' },
      ],
    },
  ],
};

const CLOZE: Record<number, Cloze> = {
  7: {
    n: 4,
    title: 'Cloze: My Weekend',
    emoji: '🎣',
    text: 'Last Saturday, I {1} my grandparents in the countryside. They live in a small house {2} a river. In the morning, my grandpa taught me {3} to fish. I caught two small fish! In the afternoon, we picked apples in the garden. The apples were very {4}. I had a great time, and I {5} to visit them again soon.',
    blanks: [
      { ans: 'visited', others: ['visit', 'visits', 'visiting'], hintZh: 'Last Saturday 是过去的时间，用一般过去时。' },
      { ans: 'near', others: ['under', 'in', 'between'], hintZh: '房子在河的旁边。' },
      { ans: 'how', others: ['what', 'why', 'who'], hintZh: 'teach sb. how to do sth. 教某人怎样做某事。' },
      { ans: 'sweet', others: ['sweetly', 'sweets', 'sweetness'], hintZh: 'be 动词后面用形容词。' },
      { ans: 'hope', others: ['hopes', 'hoping', 'to hope'], hintZh: '主语是 I，一般现在时用动词原形。' },
    ],
  },
  8: {
    n: 4,
    title: 'Cloze: Learning to Cook',
    emoji: '🍳',
    text: 'Last summer, I decided to learn {1} to cook. At first, it was not easy. The first time I made fried eggs, I {2} them! My mother said, "Don\'t give up. Practice makes perfect." So I kept going. I watched cooking videos and wrote down the steps {3}. Now I can cook several dishes, and my family says my tomato and egg soup is {4} than my dad\'s. Cooking has taught me that if you keep {5}, you will succeed.',
    blanks: [
      { ans: 'how', others: ['why', 'which', 'whose'], hintZh: 'learn how to do sth. 学习怎样做某事。' },
      { ans: 'burned', others: ['burn', 'burns', 'burning'], hintZh: '讲的是过去的事，用一般过去时。' },
      { ans: 'carefully', others: ['careful', 'care', 'carefulness'], hintZh: '修饰动词 wrote down 用副词。' },
      { ans: 'better', others: ['good', 'best', 'well'], hintZh: '后面有 than，用比较级。' },
      { ans: 'trying', others: ['try', 'tried', 'tries'], hintZh: 'keep doing sth. 坚持做某事。' },
    ],
  },
  9: {
    n: 4,
    title: 'Cloze: A Letter to My Future Self',
    emoji: '💌',
    text: 'Dear future me, when you read this letter, you {1} already be in senior high school. I wonder {2} you still remember how nervous you were before the final exams. This year, I learned that {3} matters most is not the score, but the effort you make. I also found that helping others makes me happy. I hope you {4} kind and curious, and never stop {5} new things. Love, me.',
    blanks: [
      { ans: 'will', others: ['are', 'have', 'do'], hintZh: '说将来的事：will + 动词原形。' },
      { ans: 'if', others: ['what', 'that', 'which'], hintZh: 'wonder if … 想知道是否……' },
      { ans: 'what', others: ['that', 'which', 'it'], hintZh: '“最重要的东西”：what matters most。' },
      { ans: 'stay', others: ['stays', 'staying', 'to stay'], hintZh: 'I hope you + 动词原形。' },
      { ans: 'learning', others: ['learn', 'learned', 'learns'], hintZh: 'stop doing sth. 停止做某事；never stop learning 永远不停止学习。' },
    ],
  },
};

const en = (text: string) => ({ text, lang: 'en-US' as const });
const rotate = <X>(a: X[], k: number) => a.map((_, i) => a[(i + k) % a.length]);
const HINT = { text: 'Read the passage again.', speak: en('Read the passage again.'), hintZh: '回到短文里找一找依据。' };

function readingLesson(grade: number, r: Reading): Lesson {
  const steps: LessonStep[] = [
    { kind: 'read-passage', id: 'p-read', title: { text: `Read: ${r.title}`, speak: en(r.title) }, visual: { emoji: r.emoji }, paragraphs: r.paras, speak: en(r.paras.join(' ')) },
    ...r.questions.map((q, i): LessonStep => {
      const id = `enread-g${grade}-${r.n}-q${i}`;
      let exercise: Exercise;
      if ('tf' in q)
        exercise = {
          kind: 'truefalse',
          id,
          skill: 'en.reading',
          prompt: { text: 'True or false?', speak: en('True or false?'), hintZh: q.hintZh },
          statement: { text: q.q, speak: en(q.q) },
          answer: q.answer,
          wrongHint: HINT,
        };
      else {
        const opts = rotate([q.ans, ...q.others], i + r.n);
        exercise = {
          kind: 'choice',
          id,
          skill: 'en.reading',
          prompt: { text: q.q, speak: en(q.q), hintZh: q.hintZh },
          options: opts.map((o, k) => ({ id: String(k), text: o, speak: en(o) })),
          answerId: String(opts.indexOf(q.ans)),
          wrongHint: HINT,
        };
      }
      return { kind: 'exercise', id: `p-q${i}`, exercise };
    }),
  ];
  return lessonOf(grade, r.n, r.title, r.emoji, `英语阅读（${grade}年级）：原创短文《${r.title}》，读完回答 ${r.questions.length} 道题。`, steps);
}

/** 完形填空：短文里的空格显示成 (1)____；每空一道选择题，题干是这一空所在的句子 */
export const blankText = (text: string, show?: number) => text.replace(/\{(\d)\}/g, (_, k) => (Number(k) === show ? `(${k}) ______` : `(${k}) ____`));
export function clozeSentence(text: string, k: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+["']?/g) ?? [text];
  const s = sentences.find((x) => x.includes(`{${k}}`)) ?? text;
  return blankText(s.trim(), k);
}

function clozeLesson(grade: number, c: Cloze): Lesson {
  const full = c.text.replace(/\{(\d)\}/g, (_, k) => c.blanks[Number(k) - 1].ans);
  const steps: LessonStep[] = [
    { kind: 'read-passage', id: 'p-read', title: { text: c.title, speak: en(c.title.replace('Cloze: ', '')) }, visual: { emoji: c.emoji }, paragraphs: [blankText(c.text)], speak: en(blankText(c.text).replace(/\(\d\) _+/g, 'blank')) },
    ...c.blanks.map((b, i): LessonStep => {
      const opts = rotate([b.ans, ...b.others], i + grade);
      const prompt = `Choose the best answer for blank (${i + 1}).`;
      return {
        kind: 'exercise',
        id: `p-q${i}`,
        exercise: {
          kind: 'choice',
          id: `enread-g${grade}-${c.n}-q${i}`,
          skill: 'en.reading',
          prompt: { text: prompt, speak: en(prompt), hintZh: b.hintZh },
          stem: { text: clozeSentence(c.text, i + 1) },
          options: opts.map((o, k) => ({ id: String(k), text: o, speak: en(o) })),
          answerId: String(opts.indexOf(b.ans)),
          explanation: `全文：${full}`,
          wrongHint: { text: 'Read the sentence again.', speak: en('Read the sentence again.'), hintZh: b.hintZh },
        },
      };
    }),
  ];
  return lessonOf(grade, c.n, c.title, c.emoji, `英语完形填空（${grade}年级）：原创短文，${c.blanks.length} 个空。`, steps);
}

function lessonOf(grade: number, n: number, title: string, emoji: string, summary: string, steps: LessonStep[]): Lesson {
  return {
    id: `en-read-g${grade}-${n}`,
    subject: 'english',
    order: 100 * grade + 50 + n,
    track: 'enread',
    grade,
    title,
    parentSummary: summary,
    emoji,
    estimatedMinutes: 6,
    source: 'original',
    sourceNote: '原创短文，未摘录教材课文。',
    steps,
  };
}

export const EN_READING_LESSONS: Lesson[] = [7, 8, 9].flatMap((g) => [...READING[g].map((r) => readingLesson(g, r)), clozeLesson(g, CLOZE[g])]);
/** 测试用：原始数据 */
export const EN_READING_DATA = { READING, CLOZE };
