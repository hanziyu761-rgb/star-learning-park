/**
 * 一、二年级英语启蒙：三条主线（V2.8，本项目原创的配套练习）。
 *
 * - 交流 Talk：配合《Let's Go》第 5 版入门级（Let's Begin）使用——对话、问答、儿歌、角色扮演练日常表达；
 * - 拼读 Phonics：按 Jolly Phonics 的 42 个字母音、7 组的教学顺序——字母音、拼读、拼词；
 * - 分级阅读 Reading：参照牛津阅读树（Oxford Reading Tree）的分级思路——无字故事 → 首批词 → 短句。
 *
 * 本文件的单词、对话、儿歌、小书、人物（Sam、Meg、小狗 Pip）全部为本项目原创；
 * 未收录上述教材的对话、歌曲、故事、人物或插图（需出版社授权）；APP 单元与原书单元未逐一核对。
 * 拼读和小书的每个单词都由测试检查“只用已学过的字母音拼得出”（少数常见例外词单独列出）。
 */
import type { Lesson, LessonStep, Prompt, Speakable } from '@/lesson/types';
import { enPrompt, enS } from './zh';

export type EnglishTrack = 'talk' | 'phonics' | 'reading';

export const TRACK_INFO: Record<EnglishTrack, { name: string; en: string; emoji: string; book: string; role: string }> =
  {
    talk: {
      name: '交流',
      en: 'Talk',
      emoji: '💬',
      book: '《Let’s Go》第 5 版入门级（Let’s Begin）',
      role: '对话、问答、儿歌、角色扮演，练日常表达（听说主线）',
    },
    phonics: {
      name: '拼读',
      en: 'Phonics',
      emoji: '🔤',
      book: '《Jolly Phonics》Pupil Book 1',
      role: '按 42 个字母音、7 组的顺序，练字母音、拼读和拼词',
    },
    reading: {
      name: '分级阅读',
      en: 'Reading',
      emoji: '📚',
      book: '《Oxford Reading Tree》Stage 1 起',
      role: '从无字故事、首批词到短句，把听说连接到阅读',
    },
  };

export const STARTER_NOTE =
  'APP 内为原创配套练习，未收录原书对话、歌曲、故事、人物和插图；APP 单元与原书单元未逐一核对，建议与纸质书配合使用。';

const say = (s: string): Speakable => enS(s);

function rotate<T>(a: T[], k: number): T[] {
  const n = a.length;
  return a.map((_, i) => a[(i + k) % n]);
}

/* ═════════════════ 交流 Talk ═════════════════ */

type W = { w: string; e: string };
interface TalkUnit {
  n: number;
  title: string;
  emoji: string;
  zh: string;
  words: W[];
  dialogue: [string, string][];
  qa: { q: string; zh: string; visual?: string; count?: number; a: string; wrong: string[] }[];
  chant: string[];
  tf: { e: string; count?: number; text: string; answer: boolean };
}

export const TALK_UNITS: TalkUnit[] = [
  {
    n: 1,
    title: 'Hello!',
    emoji: '👋',
    zh: '打招呼、介绍自己',
    words: [
      { w: 'boy', e: '👦' },
      { w: 'girl', e: '👧' },
      { w: 'teacher', e: '🧑‍🏫' },
      { w: 'friend', e: '🧑‍🤝‍🧑' },
    ],
    dialogue: [
      ['👧', "Hello! I'm Meg."],
      ['👦', "Hi! I'm Sam."],
      ['👧', 'Nice to meet you.'],
      ['👦', 'Nice to meet you, too.'],
    ],
    qa: [
      { q: "What's your name?", zh: '你叫什么名字？', a: "I'm Sam.", wrong: ["I'm fine.", 'Goodbye!'] },
      { q: 'How are you?', zh: '你好吗？', a: "I'm fine, thank you.", wrong: ["I'm Sam.", 'Yes, I do.'] },
    ],
    chant: ['Hello, hello, how are you?', "I'm fine, I'm fine, and you?"],
    tf: { e: '👧', text: 'This is a boy.', answer: false },
  },
  {
    n: 2,
    title: 'My Classroom',
    emoji: '🏫',
    zh: '教室里的东西',
    words: [
      { w: 'book', e: '📚' },
      { w: 'pen', e: '🖊️' },
      { w: 'pencil', e: '✏️' },
      { w: 'bag', e: '🎒' },
      { w: 'ruler', e: '📏' },
    ],
    dialogue: [
      ['👦', "What's this?"],
      ['👧', "It's a pencil."],
      ['👦', "What's that?"],
      ['👧', "It's a ruler."],
    ],
    qa: [
      { q: "What's this?", zh: '这是什么？', visual: '📚', a: "It's a book.", wrong: ["It's a pen.", "It's a bag."] },
      { q: "What's this?", zh: '这是什么？', visual: '🎒', a: "It's a bag.", wrong: ["It's a ruler.", "It's a book."] },
    ],
    chant: ['Book, book, open your book.', 'Pen, pen, look, look, look!'],
    tf: { e: '🎒', text: "It's a bag.", answer: true },
  },
  {
    n: 3,
    title: 'Colors',
    emoji: '🎨',
    zh: '颜色',
    words: [
      { w: 'red', e: '🔴' },
      { w: 'blue', e: '🔵' },
      { w: 'yellow', e: '🟡' },
      { w: 'green', e: '🟢' },
      { w: 'purple', e: '🟣' },
    ],
    dialogue: [
      ['👧', 'What color is it?'],
      ['👦', "It's red."],
      ['👧', 'Is it blue?'],
      ['👦', "No, it isn't. It's green."],
    ],
    qa: [
      {
        q: 'What color is it?',
        zh: '它是什么颜色？',
        visual: '🍎',
        a: "It's red.",
        wrong: ["It's blue.", "It's green."],
      },
      {
        q: 'What color is it?',
        zh: '它是什么颜色？',
        visual: '🍌',
        a: "It's yellow.",
        wrong: ["It's purple.", "It's red."],
      },
    ],
    chant: ['Red and yellow, blue and green,', 'Colors, colors, can be seen!'],
    tf: { e: '🔵', text: "It's yellow.", answer: false },
  },
  {
    n: 4,
    title: 'Numbers',
    emoji: '🔢',
    zh: '数字 1～5、问年龄',
    words: [
      { w: 'one', e: '1️⃣' },
      { w: 'two', e: '2️⃣' },
      { w: 'three', e: '3️⃣' },
      { w: 'four', e: '4️⃣' },
      { w: 'five', e: '5️⃣' },
    ],
    dialogue: [
      ['👧', 'How many apples?'],
      ['👦', 'Three apples.'],
      ['👧', 'How old are you?'],
      ['👦', "I'm six."],
    ],
    qa: [
      {
        q: 'How many apples?',
        zh: '有几个苹果？',
        visual: '🍎',
        count: 4,
        a: 'Four apples.',
        wrong: ['Two apples.', 'Five apples.'],
      },
      { q: 'How old are you?', zh: '你几岁了？', a: "I'm seven.", wrong: ["I'm fine.", "It's red."] },
    ],
    chant: ['One, two, three, four, five,', 'Clap your hands and count with me!'],
    tf: { e: '🐱', count: 2, text: 'Three cats.', answer: false },
  },
  {
    n: 5,
    title: 'My Family',
    emoji: '👪',
    zh: '家人',
    words: [
      { w: 'mom', e: '👩' },
      { w: 'dad', e: '👨' },
      { w: 'sister', e: '👧' },
      { w: 'brother', e: '👦' },
      { w: 'grandma', e: '👵' },
    ],
    dialogue: [
      ['👦', "Who's she?"],
      ['👧', "She's my mom."],
      ['👦', "Who's he?"],
      ['👧', "He's my dad."],
    ],
    qa: [
      {
        q: "Who's she?",
        zh: '她是谁？',
        visual: '👵',
        a: "She's my grandma.",
        wrong: ["He's my dad.", "He's my brother."],
      },
      { q: "Who's he?", zh: '他是谁？', visual: '👨', a: "He's my dad.", wrong: ["She's my mom.", "She's my sister."] },
    ],
    chant: ['Mom and Dad, I love you,', 'Sister, brother, Grandma, too!'],
    tf: { e: '👦', text: "He's my brother.", answer: true },
  },
  {
    n: 6,
    title: 'My Toys',
    emoji: '🧸',
    zh: '玩具',
    words: [
      { w: 'ball', e: '⚽' },
      { w: 'teddy bear', e: '🧸' },
      { w: 'car', e: '🚗' },
      { w: 'kite', e: '🪁' },
      { w: 'robot', e: '🤖' },
    ],
    dialogue: [
      ['👦', 'I have a ball.'],
      ['👧', 'I have a kite.'],
      ['👦', "Let's play!"],
      ['👧', 'OK!'],
    ],
    qa: [
      {
        q: 'What do you have?',
        zh: '你有什么？',
        visual: '🚗',
        a: 'I have a car.',
        wrong: ['I have a kite.', 'I have a ball.'],
      },
      { q: "Let's play!", zh: '我们一起玩吧！', a: 'OK!', wrong: ["I'm six.", "It's blue."] },
    ],
    chant: ['Ball and car and teddy bear,', 'Toys, toys, everywhere!'],
    tf: { e: '🤖', text: 'I have a robot.', answer: true },
  },
  {
    n: 7,
    title: 'Animals',
    emoji: '🐾',
    zh: '动物、喜欢不喜欢',
    words: [
      { w: 'cat', e: '🐱' },
      { w: 'dog', e: '🐶' },
      { w: 'bird', e: '🐦' },
      { w: 'fish', e: '🐟' },
      { w: 'rabbit', e: '🐰' },
    ],
    dialogue: [
      ['👧', 'Do you like cats?'],
      ['👦', 'Yes, I do.'],
      ['👧', 'Do you like dogs?'],
      ['👦', "No, I don't. I like birds."],
    ],
    qa: [
      { q: 'Do you like rabbits?', zh: '你喜欢兔子吗？', a: 'Yes, I do.', wrong: ['Yes, it is.', "I'm fine."] },
      { q: "What's this?", zh: '这是什么？', visual: '🐟', a: "It's a fish.", wrong: ["It's a bird.", "It's a cat."] },
    ],
    chant: ['Cat says meow, dog says woof,', 'Bird says tweet up on the roof!'],
    tf: { e: '🐶', text: "It's a cat.", answer: false },
  },
  {
    n: 8,
    title: 'Food',
    emoji: '🍽️',
    zh: '食物、表达想要',
    words: [
      { w: 'rice', e: '🍚' },
      { w: 'bread', e: '🍞' },
      { w: 'milk', e: '🥛' },
      { w: 'egg', e: '🥚' },
      { w: 'cake', e: '🍰' },
    ],
    dialogue: [
      ['👦', "I'm hungry."],
      ['👩', "Here's some bread."],
      ['👦', 'Thank you! Can I have some milk?'],
      ['👩', 'Sure. Here you are.'],
    ],
    qa: [
      { q: "I'm hungry.", zh: '我饿了。', a: "Here's some bread.", wrong: ['Goodbye!', "I'm six."] },
      {
        q: 'What do you want?',
        zh: '你想要什么？',
        visual: '🥛',
        a: 'I want milk.',
        wrong: ['I want rice.', 'I want cake.'],
      },
    ],
    chant: ['Rice and eggs and bread and cake,', 'Yummy food for us to make!'],
    tf: { e: '🥚', text: "It's an egg.", answer: true },
  },
];

function talkLesson(u: TalkUnit): Lesson {
  const pics = u.words.map((x) => ({ id: x.w.replace(/\s/g, '-'), visual: { emoji: x.e } }));
  const listen = [u.words[1], u.words[u.words.length - 1]];
  const steps: LessonStep[] = [
    {
      kind: 'teach-cards',
      id: 't-words',
      title: enPrompt('Listen and tap.', '点一点卡片，听一听'),
      cards: u.words.map((x) => ({ id: x.w.replace(/\s/g, '-'), visual: { emoji: x.e }, text: x.w, speak: say(x.w) })),
    },
    ...listen.map((x, i): LessonStep => ({
      kind: 'exercise',
      id: `t-listen-${i}`,
      exercise: {
        kind: 'choice',
        id: `talk${u.n}-listen-${i}`,
        skill: 'en.talk-words',
        prompt: enPrompt('Listen. Tap the picture.', '听一听，点出对应的图片'),
        listen: say(x.w),
        options: i ? [...pics].reverse() : pics,
        answerId: x.w.replace(/\s/g, '-'),
        wrongHint: enPrompt(`Listen again: ${x.w}.`),
      },
    })),
    {
      kind: 'repeat',
      id: 't-repeat',
      title: enPrompt('Listen and say.', '听一听，然后大声跟着说'),
      items: u.words.map((x) => ({ id: x.w.replace(/\s/g, '-'), visual: { emoji: x.e }, text: x.w, speak: say(x.w) })),
    },
    {
      kind: 'dialogue',
      id: 't-dialogue',
      title: enPrompt("Let's talk!", '听对话，也可以点每一句。和家长一人一句演一演'),
      lines: u.dialogue.map(([speaker, text]) => ({ speaker, text, speak: say(text) })),
    },
    ...u.qa.map((q, i): LessonStep => {
      const opts = rotate([q.a, ...q.wrong], i + 1);
      return {
        kind: 'exercise',
        id: `t-qa-${i}`,
        exercise: {
          kind: 'choice',
          id: `talk${u.n}-qa-${i}`,
          skill: 'en.talk-qa',
          prompt: enPrompt(q.q, `${q.zh}选出合适的回答`),
          stem: q.visual ? { visual: { emoji: q.visual, count: q.count } } : undefined,
          listen: say(q.q),
          options: opts.map((t, k) => ({ id: String(k), text: t, speak: say(t) })),
          answerId: String(opts.indexOf(q.a)),
          wrongHint: enPrompt('Listen to the question again.', '再听一遍问题'),
        },
      };
    }),
    {
      kind: 'repeat',
      id: 't-chant',
      title: enPrompt("Let's chant!", '跟着节奏拍手念儿歌'),
      items: u.chant.map((line, k) => ({ id: `c${k}`, visual: { emoji: u.emoji }, text: line, speak: say(line) })),
    },
    {
      kind: 'exercise',
      id: 't-tf',
      exercise: {
        kind: 'truefalse',
        id: `talk${u.n}-tf`,
        skill: 'en.talk-words',
        prompt: enPrompt('Look and listen. Is it right?', '看图听句子，说得对吗？'),
        statement: { visual: { emoji: u.tf.e, count: u.tf.count }, text: u.tf.text, speak: say(u.tf.text) },
        answer: u.tf.answer,
        wrongHint: enPrompt('Look at the picture again.'),
      },
    },
  ];
  return {
    id: `en-talk-${u.n}`,
    subject: 'english',
    order: 10 + u.n,
    track: 'talk',
    title: `${u.n}. ${u.title}`,
    parentSummary: `交流第 ${u.n} 单元：${u.zh}（${u.words.map((x) => x.w).join(' / ')}）。认词、听音、跟读、对话、问答、儿歌。配合${TRACK_INFO.talk.book}的同主题内容使用。`,
    emoji: u.emoji,
    estimatedMinutes: 12,
    source: 'original',
    sourceNote: `原创配套练习。${STARTER_NOTE}`,
    steps,
  };
}

/* ═════════════════ 拼读 Phonics ═════════════════ */

/** Jolly Phonics 的 7 组字母音（教学顺序为公开的教学法信息） */
export const PHONICS_GROUPS: { n: number; sounds: { g: string; ex: W }[] }[] = [
  {
    n: 1,
    sounds: [
      { g: 's', ex: { w: 'snake', e: '🐍' } },
      { g: 'a', ex: { w: 'ant', e: '🐜' } },
      { g: 't', ex: { w: 'tiger', e: '🐯' } },
      { g: 'i', ex: { w: 'insect', e: '🐛' } },
      { g: 'p', ex: { w: 'pig', e: '🐷' } },
      { g: 'n', ex: { w: 'net', e: '🥅' } },
    ],
  },
  {
    n: 2,
    sounds: [
      { g: 'c', ex: { w: 'cat', e: '🐱' } },
      { g: 'k', ex: { w: 'kite', e: '🪁' } },
      { g: 'ck', ex: { w: 'duck', e: '🦆' } },
      { g: 'e', ex: { w: 'egg', e: '🥚' } },
      { g: 'h', ex: { w: 'hat', e: '🎩' } },
      { g: 'r', ex: { w: 'rabbit', e: '🐰' } },
      { g: 'm', ex: { w: 'moon', e: '🌙' } },
      { g: 'd', ex: { w: 'dog', e: '🐶' } },
    ],
  },
  {
    n: 3,
    sounds: [
      { g: 'g', ex: { w: 'goat', e: '🐐' } },
      { g: 'o', ex: { w: 'octopus', e: '🐙' } },
      { g: 'u', ex: { w: 'umbrella', e: '☂️' } },
      { g: 'l', ex: { w: 'lion', e: '🦁' } },
      { g: 'f', ex: { w: 'fish', e: '🐟' } },
      { g: 'b', ex: { w: 'bus', e: '🚌' } },
    ],
  },
  {
    n: 4,
    sounds: [
      { g: 'ai', ex: { w: 'rain', e: '🌧️' } },
      { g: 'j', ex: { w: 'jam', e: '🍯' } },
      { g: 'oa', ex: { w: 'boat', e: '⛵' } },
      { g: 'ie', ex: { w: 'pie', e: '🥧' } },
      { g: 'ee', ex: { w: 'bee', e: '🐝' } },
      { g: 'or', ex: { w: 'fork', e: '🍴' } },
    ],
  },
  {
    n: 5,
    sounds: [
      { g: 'z', ex: { w: 'zebra', e: '🦓' } },
      { g: 'w', ex: { w: 'web', e: '🕸️' } },
      { g: 'ng', ex: { w: 'ring', e: '💍' } },
      { g: 'v', ex: { w: 'van', e: '🚐' } },
      { g: 'oo', ex: { w: 'book', e: '📖' } },
      { g: 'oo', ex: { w: 'moon', e: '🌙' } },
    ],
  },
  {
    n: 6,
    sounds: [
      { g: 'y', ex: { w: 'yo-yo', e: '🪀' } },
      { g: 'x', ex: { w: 'fox', e: '🦊' } },
      { g: 'ch', ex: { w: 'chick', e: '🐤' } },
      { g: 'sh', ex: { w: 'ship', e: '🚢' } },
      { g: 'th', ex: { w: 'this', e: '👉' } },
      { g: 'th', ex: { w: 'three', e: '3️⃣' } },
    ],
  },
  {
    n: 7,
    sounds: [
      { g: 'qu', ex: { w: 'queen', e: '👸' } },
      { g: 'ou', ex: { w: 'cloud', e: '☁️' } },
      { g: 'oi', ex: { w: 'coin', e: '🪙' } },
      { g: 'ue', ex: { w: 'glue', e: '🧴' } },
      { g: 'er', ex: { w: 'hammer', e: '🔨' } },
      { g: 'ar', ex: { w: 'car', e: '🚗' } },
    ],
  },
];

/** 每组的练习词：只用到本组及之前学过的字母音（g 为拆分） */
export const PHONICS_WORDS: Record<number, { w: string; g: string[]; e: string }[]> = {
  1: [
    { w: 'ant', g: ['a', 'n', 't'], e: '🐜' },
    { w: 'pan', g: ['p', 'a', 'n'], e: '🍳' },
    { w: 'pin', g: ['p', 'i', 'n'], e: '📌' },
    { w: 'tap', g: ['t', 'a', 'p'], e: '🚰' },
    { w: 'tin', g: ['t', 'i', 'n'], e: '🥫' },
  ],
  2: [
    { w: 'cat', g: ['c', 'a', 't'], e: '🐱' },
    { w: 'hat', g: ['h', 'a', 't'], e: '🎩' },
    { w: 'pen', g: ['p', 'e', 'n'], e: '🖊️' },
    { w: 'ten', g: ['t', 'e', 'n'], e: '🔟' },
    { w: 'map', g: ['m', 'a', 'p'], e: '🗺️' },
    { w: 'hen', g: ['h', 'e', 'n'], e: '🐔' },
    { w: 'red', g: ['r', 'e', 'd'], e: '🔴' },
  ],
  3: [
    { w: 'dog', g: ['d', 'o', 'g'], e: '🐶' },
    { w: 'pig', g: ['p', 'i', 'g'], e: '🐷' },
    { w: 'sun', g: ['s', 'u', 'n'], e: '☀️' },
    { w: 'bus', g: ['b', 'u', 's'], e: '🚌' },
    { w: 'cup', g: ['c', 'u', 'p'], e: '☕' },
    { w: 'bed', g: ['b', 'e', 'd'], e: '🛏️' },
    { w: 'frog', g: ['f', 'r', 'o', 'g'], e: '🐸' },
  ],
  4: [
    { w: 'rain', g: ['r', 'ai', 'n'], e: '🌧️' },
    { w: 'boat', g: ['b', 'oa', 't'], e: '⛵' },
    { w: 'goat', g: ['g', 'oa', 't'], e: '🐐' },
    { w: 'pie', g: ['p', 'ie'], e: '🥧' },
    { w: 'bee', g: ['b', 'ee'], e: '🐝' },
    { w: 'tree', g: ['t', 'r', 'ee'], e: '🌳' },
    { w: 'fork', g: ['f', 'or', 'k'], e: '🍴' },
    { w: 'corn', g: ['c', 'or', 'n'], e: '🌽' },
  ],
  5: [
    { w: 'zip', g: ['z', 'i', 'p'], e: '🤐' },
    { w: 'web', g: ['w', 'e', 'b'], e: '🕸️' },
    { w: 'ring', g: ['r', 'i', 'ng'], e: '💍' },
    { w: 'king', g: ['k', 'i', 'ng'], e: '👑' },
    { w: 'van', g: ['v', 'a', 'n'], e: '🚐' },
    { w: 'book', g: ['b', 'oo', 'k'], e: '📖' },
    { w: 'moon', g: ['m', 'oo', 'n'], e: '🌙' },
    { w: 'spoon', g: ['s', 'p', 'oo', 'n'], e: '🥄' },
  ],
  6: [
    { w: 'fox', g: ['f', 'o', 'x'], e: '🦊' },
    { w: 'box', g: ['b', 'o', 'x'], e: '📦' },
    { w: 'six', g: ['s', 'i', 'x'], e: '6️⃣' },
    { w: 'chick', g: ['ch', 'i', 'ck'], e: '🐤' },
    { w: 'ship', g: ['sh', 'i', 'p'], e: '🚢' },
    { w: 'fish', g: ['f', 'i', 'sh'], e: '🐟' },
    { w: 'bath', g: ['b', 'a', 'th'], e: '🛁' },
    { w: 'yes', g: ['y', 'e', 's'], e: '✅' },
  ],
  7: [
    { w: 'queen', g: ['qu', 'ee', 'n'], e: '👸' },
    { w: 'cloud', g: ['c', 'l', 'ou', 'd'], e: '☁️' },
    { w: 'mouth', g: ['m', 'ou', 'th'], e: '👄' },
    { w: 'coin', g: ['c', 'oi', 'n'], e: '🪙' },
    { w: 'star', g: ['s', 't', 'ar'], e: '⭐' },
    { w: 'car', g: ['c', 'ar'], e: '🚗' },
    { w: 'farm', g: ['f', 'ar', 'm'], e: '🚜' },
    { w: 'hammer', g: ['h', 'a', 'mm', 'er'], e: '🔨' },
  ],
};

/** 到第 n 组为止学过的字母音（含双写字母 ll、ss、ff、mm、tt 等） */
export function graphemesUpTo(n: number): Set<string> {
  const s = new Set<string>();
  for (const grp of PHONICS_GROUPS) if (grp.n <= n) for (const x of grp.sounds) s.add(x.g);
  for (const ch of [...s]) if (ch.length === 1) s.add(ch + ch);
  return s;
}

function phonicsLesson(grp: (typeof PHONICS_GROUPS)[number]): Lesson {
  const words = PHONICS_WORDS[grp.n];
  const own = [...new Set(grp.sounds.map((s) => s.g))];
  // 首音题：选首个字母音属于本组的词
  const firstSound = words.filter((w) => own.includes(w.g[0])).slice(0, 2);
  const steps: LessonStep[] = [
    {
      kind: 'teach-cards',
      id: 'p-sounds',
      title: enPrompt('Letter sounds. Listen and tap.', '点一点，听例词，体会这个字母音（字母音请对照书本音频）'),
      cards: grp.sounds.map((s, i) => ({
        id: `${s.g}-${i}`,
        visual: { emoji: s.ex.e },
        text: s.g,
        sub: s.ex.w,
        speak: say(s.ex.w),
      })),
    },
    ...firstSound.map((w, i): LessonStep => {
      const others = own.filter((g) => g !== w.g[0]).slice(i, i + 2);
      const opts = rotate([w.g[0], ...others], i + 1);
      return {
        kind: 'exercise',
        id: `p-first-${i}`,
        exercise: {
          kind: 'choice',
          id: `ph${grp.n}-first-${w.w}`,
          skill: 'en.phonics-sound',
          prompt: enPrompt('Listen. What is the first sound?', '听单词，它的第一个音是哪个字母？'),
          listen: say(w.w),
          stem: { visual: { emoji: w.e } },
          options: opts.map((g) => ({ id: g, text: g, speak: say(g) })),
          answerId: w.g[0],
          wrongHint: enPrompt(`Listen again: ${w.w}.`),
        },
      };
    }),
    ...[0, 1].map((i): LessonStep => {
      const w = words[(i * 3 + 1) % words.length];
      const others = words.filter((x) => x.w !== w.w).slice(i, i + 2);
      return {
        kind: 'exercise',
        id: `p-read-${i}`,
        exercise: {
          kind: 'choice',
          id: `ph${grp.n}-read-${w.w}`,
          skill: 'en.phonics-read',
          prompt: enPrompt('Look. Which word is it?', '看图，拼一拼，哪个单词是它？'),
          stem: { visual: { emoji: w.e } },
          options: rotate([w, ...others], i + 2).map((x) => ({ id: x.w, text: x.w, speak: say(x.w) })),
          answerId: w.w,
          wrongHint: enPrompt('Say each sound, then blend them.', '一个音一个音地读，再连起来'),
        },
      };
    }),
    (() => {
      const w = words[words.length - 1];
      const shown = rotate(
        w.g.map((g, k) => ({ id: String(k), text: g })),
        1,
      );
      return {
        kind: 'exercise',
        id: 'p-build',
        exercise: {
          kind: 'sort',
          id: `ph${grp.n}-build-${w.w}`,
          skill: 'en.phonics-build',
          prompt: {
            ...enPrompt(`Make the word ${w.e}`, `按顺序点字母，拼出单词 ${w.w}`),
            speak: say(`Make the word: ${w.w}`),
          } as Prompt,
          items: shown,
          order: w.g.map((_, k) => String(k)),
          wrongHint: enPrompt(`Listen: ${w.w}. What is the first sound?`),
          explanation: `${w.g.join(' - ')} → ${w.w}`,
        },
      } as LessonStep;
    })(),
    (() => {
      const w = words[2];
      const wrong = words[3];
      return {
        kind: 'exercise',
        id: 'p-tf',
        exercise: {
          kind: 'truefalse',
          id: `ph${grp.n}-tf`,
          skill: 'en.phonics-read',
          prompt: enPrompt('Read the word. Is it right?', '读一读单词，和图片一样吗？'),
          statement: { visual: { emoji: w.e }, text: wrong.w, speak: say(wrong.w) },
          answer: false,
          wrongHint: enPrompt(`Look again. It is a ${w.w}.`),
        },
      } as LessonStep;
    })(),
  ];
  const label = own.join(' ');
  return {
    id: `en-phonics-${grp.n}`,
    subject: 'english',
    order: 30 + grp.n,
    track: 'phonics',
    title: `Group ${grp.n} · ${label}`,
    parentSummary: `拼读第 ${grp.n} 组：${label}。听例词体会字母音、找首音、拼读单词、按顺序拼词。练习词只用到已学过的字母音。注意：手机系统语音读单个字母时读的是字母名，字母音请对照${TRACK_INFO.phonics.book}的音频。`,
    emoji: '🔤',
    estimatedMinutes: 10,
    source: 'original',
    sourceNote: `原创配套练习，教学顺序参照 Jolly Phonics 的 7 组字母音。${STARTER_NOTE}`,
    steps,
  };
}

/* ═════════════════ 分级阅读 Reading ═════════════════ */

/** 小书里允许的常见例外词（还拼不出来，但要整体认读） */
export const TRICKY_WORDS = [
  'i',
  'the',
  'a',
  'is',
  'has',
  'to',
  'they',
  'he',
  'she',
  'we',
  'me',
  'my',
  'you',
  'go',
  'no',
  'was',
  'of',
  'do',
];

export interface Book {
  n: number;
  level: '1' | '1+' | '2';
  title: string;
  /** 可拼读的范围：用到第几组字母音（无字书为 0） */
  group: number;
  pages: { e: string; text: string; guide?: string }[];
  questions: (
    | { kind: 'order'; prompt: string; zh: string; pictures: string[] }
    | {
        kind: 'choice';
        prompt: string;
        zh: string;
        stem?: string;
        answer: string;
        others: string[];
        pictures?: boolean;
      }
    | { kind: 'tf'; prompt: string; zh: string; e: string; text: string; answer: boolean }
  )[];
}

export const BOOKS: Book[] = [
  {
    n: 1,
    level: '1',
    title: 'A Rainy Day',
    group: 0,
    pages: [
      { e: '☀️👦⚽', text: '', guide: 'What can you see?' },
      { e: '🌧️👦😮', text: '', guide: 'Oh no! What happens?' },
      { e: '☂️👦🐶', text: '', guide: 'What does Sam do?' },
      { e: '🌈👦😊', text: '', guide: 'How does Sam feel?' },
    ],
    questions: [
      {
        kind: 'order',
        prompt: 'Put the pictures in order.',
        zh: '按故事的顺序排一排图片',
        pictures: ['☀️', '🌧️', '☂️', '🌈'],
      },
      {
        kind: 'choice',
        prompt: 'How does Sam feel at the end?',
        zh: '故事最后，Sam 心情怎么样？',
        answer: '😊',
        others: ['😢', '😠'],
        pictures: true,
      },
    ],
  },
  {
    n: 2,
    level: '1',
    title: 'Where Is the Ball?',
    group: 0,
    pages: [
      { e: '👦⚽🐶', text: '', guide: 'Who can you see?' },
      { e: '⚽🌳', text: '', guide: 'Where is the ball?' },
      { e: '🔍👦🐶', text: '', guide: 'What are they doing?' },
      { e: '🐶⚽😊', text: '', guide: 'Who finds the ball?' },
    ],
    questions: [
      {
        kind: 'choice',
        prompt: 'Who finds the ball?',
        zh: '谁找到了球？',
        answer: '🐶',
        others: ['👦', '🐱'],
        pictures: true,
      },
      {
        kind: 'order',
        prompt: 'Put the pictures in order.',
        zh: '按故事的顺序排一排图片',
        pictures: ['⚽', '🌳', '🔍', '😊'],
      },
    ],
  },
  {
    n: 3,
    level: '1+',
    title: 'Pip Can',
    group: 3,
    pages: [
      { e: '🐶🪑', text: 'Pip can sit.' },
      { e: '🐶😴', text: 'Pip can nap.' },
      { e: '🐶🕳️', text: 'Pip can dig.' },
      { e: '🐶💨', text: 'Pip can run.' },
      { e: '🐶❤️', text: 'Pip is a big dog!' },
    ],
    questions: [
      {
        kind: 'choice',
        prompt: 'Pip can ___.',
        zh: '看图，Pip 会做什么？',
        stem: '🐶💨',
        answer: 'run',
        others: ['sit', 'nap'],
      },
      {
        kind: 'tf',
        prompt: 'Read. Is it right?',
        zh: '读一读，说得对吗？',
        e: '🐶😴',
        text: 'Pip can nap.',
        answer: true,
      },
    ],
  },
  {
    n: 4,
    level: '1+',
    title: 'What Is It?',
    group: 3,
    pages: [
      { e: '🐱', text: 'It is a cat.' },
      { e: '🐔', text: 'It is a hen.' },
      { e: '🐷', text: 'It is a pig.' },
      { e: '🚌', text: 'It is a red bus.' },
      { e: '👧', text: 'It is Meg!' },
    ],
    questions: [
      { kind: 'choice', prompt: 'It is a ___.', zh: '看图选单词', stem: '🐔', answer: 'hen', others: ['pig', 'cat'] },
      {
        kind: 'tf',
        prompt: 'Read. Is it right?',
        zh: '读一读，说得对吗？',
        e: '🐷',
        text: 'It is a cat.',
        answer: false,
      },
    ],
  },
  {
    n: 5,
    level: '1+',
    title: 'Sam and the Bus',
    group: 3,
    pages: [
      { e: '👦🚌', text: 'Sam is on the bus.' },
      { e: '🚌', text: 'The bus is red.' },
      { e: '👦🎩', text: 'Sam has a hat.' },
      { e: '🎩', text: 'The hat is big.' },
      { e: '👦🐶', text: 'Sam and Pip get off the bus.' },
    ],
    questions: [
      {
        kind: 'choice',
        prompt: 'What does Sam have?',
        zh: 'Sam 有什么？',
        answer: '🎩',
        others: ['⚽', '🎒'],
        pictures: true,
      },
      { kind: 'choice', prompt: 'The bus is ___.', zh: '公共汽车是什么颜色？', answer: 'red', others: ['big', 'hot'] },
    ],
  },
  {
    n: 6,
    level: '2',
    title: 'A Fish for Pip',
    group: 6,
    pages: [
      { e: '🐶🐟', text: 'Pip sees a fish.' },
      { e: '🐶💦', text: 'Pip jumps in!' },
      { e: '🐟', text: 'The fish swims off.' },
      { e: '🐶💧', text: 'Pip is wet.' },
      { e: '👧🐶', text: 'Meg rubs Pip with a rug.' },
    ],
    questions: [
      {
        kind: 'choice',
        prompt: 'Why is Pip wet?',
        zh: 'Pip 为什么湿了？',
        answer: 'Pip jumps in.',
        others: ['It rains.', 'Pip has a bath.'],
      },
      {
        kind: 'order',
        prompt: 'Put the pictures in order.',
        zh: '按故事的顺序排一排图片',
        pictures: ['🐟', '💦', '💧', '👧'],
      },
    ],
  },
  {
    n: 7,
    level: '2',
    title: 'The Boat',
    group: 6,
    pages: [
      { e: '👦👧⛵', text: 'Sam and Meg sail a boat.' },
      { e: '🌬️', text: 'The wind is strong.' },
      { e: '🌧️', text: 'Rain! Rain!' },
      { e: '🏠', text: 'Sam and Meg run to the shed.' },
      { e: '👀🌧️', text: 'They sit and look at the rain.' },
    ],
    questions: [
      {
        kind: 'choice',
        prompt: 'Where do Sam and Meg go?',
        zh: '下雨了，Sam 和 Meg 去了哪里？',
        answer: 'to the shed',
        others: ['to the bus', 'to the farm'],
      },
      {
        kind: 'tf',
        prompt: 'Read. Is it right?',
        zh: '读一读，说得对吗？',
        e: '🌬️',
        text: 'The wind is strong.',
        answer: true,
      },
    ],
  },
];

const LEVEL_TEXT: Record<Book['level'], string> = {
  '1': 'Level 1 · 无字故事',
  '1+': 'Level 1+ · 首批词',
  '2': 'Level 2 · 短句',
};

function readingLesson(b: Book): Lesson {
  const wordless = b.pages.every((p) => p.text === '');
  const steps: LessonStep[] = [
    {
      kind: 'picture-book',
      id: 'r-book',
      title: wordless
        ? enPrompt(b.title, '无字故事：看图，和家长一起说一说每一页发生了什么')
        : enPrompt(b.title, '先听，再指着单词跟读；点单词可以听'),
      pages: b.pages.map((p) => ({ visual: { emoji: p.e }, text: p.text, speak: say(p.text || p.guide || '') })),
    },
    ...b.questions.map((q, i): LessonStep => {
      const id = `read${b.n}-q${i}`;
      if (q.kind === 'order')
        return {
          kind: 'exercise',
          id: `r-q${i}`,
          exercise: {
            kind: 'sort',
            id,
            skill: 'en.reading',
            prompt: enPrompt(q.prompt, q.zh),
            items: rotate(
              q.pictures.map((e, k) => ({ id: String(k), text: '', visual: { emoji: e } })),
              2,
            ),
            order: q.pictures.map((_, k) => String(k)),
            wrongHint: enPrompt('What happens first?', '先发生了什么？'),
          },
        };
      if (q.kind === 'tf')
        return {
          kind: 'exercise',
          id: `r-q${i}`,
          exercise: {
            kind: 'truefalse',
            id,
            skill: 'en.reading',
            prompt: enPrompt(q.prompt, q.zh),
            statement: { visual: { emoji: q.e }, text: q.text, speak: say(q.text) },
            answer: q.answer,
            wrongHint: enPrompt('Look at the picture again.'),
          },
        };
      const opts = rotate([q.answer, ...q.others], i + 1);
      return {
        kind: 'exercise',
        id: `r-q${i}`,
        exercise: {
          kind: 'choice',
          id,
          skill: 'en.reading',
          prompt: enPrompt(q.prompt, q.zh),
          stem: q.stem ? { visual: { emoji: q.stem } } : undefined,
          options: opts.map((t, k) =>
            q.pictures ? { id: String(k), visual: { emoji: t } } : { id: String(k), text: t, speak: say(t) },
          ),
          answerId: String(opts.indexOf(q.answer)),
          wrongHint: enPrompt('Read the story again.', '再读一读小书'),
        },
      };
    }),
  ];
  return {
    id: `en-read-${b.n}`,
    subject: 'english',
    order: 50 + b.n,
    track: 'reading',
    title: `${b.title}`,
    parentSummary: `${LEVEL_TEXT[b.level]}：本 APP 自编小书（人物 Sam、Meg 和小狗 Pip 为原创）。${
      wordless ? '没有文字，请家长引导孩子看图说话。' : `单词只用拼读第 1～${b.group} 组学过的字母音和少数常见词。`
    }阅读水平参照${TRACK_INFO.reading.book}的分级。`,
    emoji: '📚',
    estimatedMinutes: 8,
    source: 'original',
    sourceNote: `原创小书。${STARTER_NOTE}`,
    steps,
  };
}

export const BOOK_LEVEL_TEXT = LEVEL_TEXT;

export const STARTER_LESSONS: Lesson[] = [
  ...TALK_UNITS.map(talkLesson),
  ...PHONICS_GROUPS.map(phonicsLesson),
  ...BOOKS.map(readingLesson),
];
