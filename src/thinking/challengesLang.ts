/**
 * 每日挑战：语文、英语思维题（V2.6，本项目原创）。
 *
 * 语文：拼字（部件组合）、排成小故事、读一读想一想、词语找规律（反义词 / 量词 / 分类）。
 * 英语：猜猜它是谁、找不同类、找规律接龙、连词成句。英语题目指令用英文，中文只放在可选的小提示里。
 * 短文、句子、谜面均为本项目编写，未摘录教材课文或第三方题库；内容难度按一年级。
 * 状态：待教师审核。
 */
import { enPrompt, enS, zh } from '@/content/zh';
import type { ChoiceOption } from '@/lesson/types';
import { hash, int, P, pick, say, seeded, shuffle, type ChallengeGen } from './challenges';

/** 选项顺序由签名决定 */
function ordered<T>(sig: string, answer: T, others: T[]): { list: T[]; answerIndex: number } {
  const list = shuffle([answer, ...others], seeded(hash(sig)));
  return { list, answerIndex: list.indexOf(answer) };
}
/** 打乱顺序，且保证不是本来的顺序 */
function scrambled(sig: string, n: number): number[] {
  const rand = seeded(hash(`${sig}#sort`));
  for (;;) {
    const order = shuffle([...Array(n).keys()], rand);
    if (order.some((v, i) => v !== i)) return order;
  }
}
const zhOpt = (id: string, chars: string, py: string): ChoiceOption => ({ id, text: zh(chars, py), speak: say(chars) });

/* ═════════════════ 语文 ═════════════════ */

/* 1. 拼字：两个（或三个）部件合成一个字 */
const RIDDLES: { parts: [string, string][]; ans: [string, string]; others: [string, string][] }[] = [
  {
    parts: [
      ['日', 'rì'],
      ['月', 'yuè'],
    ],
    ans: ['明', 'míng'],
    others: [
      ['朋', 'péng'],
      ['胆', 'dǎn'],
      ['旦', 'dàn'],
    ],
  },
  {
    parts: [
      ['木', 'mù'],
      ['木', 'mù'],
    ],
    ans: ['林', 'lín'],
    others: [
      ['森', 'sēn'],
      ['本', 'běn'],
      ['休', 'xiū'],
    ],
  },
  {
    parts: [
      ['木', 'mù'],
      ['木', 'mù'],
      ['木', 'mù'],
    ],
    ans: ['森', 'sēn'],
    others: [
      ['林', 'lín'],
      ['树', 'shù'],
      ['桥', 'qiáo'],
    ],
  },
  {
    parts: [
      ['人', 'rén'],
      ['木', 'mù'],
    ],
    ans: ['休', 'xiū'],
    others: [
      ['体', 'tǐ'],
      ['林', 'lín'],
      ['位', 'wèi'],
    ],
  },
  {
    parts: [
      ['小', 'xiǎo'],
      ['大', 'dà'],
    ],
    ans: ['尖', 'jiān'],
    others: [
      ['尘', 'chén'],
      ['太', 'tài'],
      ['天', 'tiān'],
    ],
  },
  {
    parts: [
      ['口', 'kǒu'],
      ['鸟', 'niǎo'],
    ],
    ans: ['鸣', 'míng'],
    others: [
      ['鸭', 'yā'],
      ['鸡', 'jī'],
      ['唱', 'chàng'],
    ],
  },
  {
    parts: [
      ['女', 'nǚ'],
      ['马', 'mǎ'],
    ],
    ans: ['妈', 'mā'],
    others: [
      ['码', 'mǎ'],
      ['姐', 'jiě'],
      ['好', 'hǎo'],
    ],
  },
  {
    parts: [
      ['不', 'bù'],
      ['正', 'zhèng'],
    ],
    ans: ['歪', 'wāi'],
    others: [
      ['步', 'bù'],
      ['武', 'wǔ'],
      ['正', 'zhèng'],
    ],
  },
  {
    parts: [
      ['田', 'tián'],
      ['力', 'lì'],
    ],
    ans: ['男', 'nán'],
    others: [
      ['留', 'liú'],
      ['加', 'jiā'],
      ['另', 'lìng'],
    ],
  },
  {
    parts: [
      ['日', 'rì'],
      ['生', 'shēng'],
    ],
    ans: ['星', 'xīng'],
    others: [
      ['胜', 'shèng'],
      ['姓', 'xìng'],
      ['是', 'shì'],
    ],
  },
  {
    parts: [
      ['禾', 'hé'],
      ['火', 'huǒ'],
    ],
    ans: ['秋', 'qiū'],
    others: [
      ['和', 'hé'],
      ['科', 'kē'],
      ['灯', 'dēng'],
    ],
  },
  {
    parts: [
      ['门', 'mén'],
      ['口', 'kǒu'],
    ],
    ans: ['问', 'wèn'],
    others: [
      ['闪', 'shǎn'],
      ['间', 'jiān'],
      ['们', 'men'],
    ],
  },
];

const NUM_CN: Record<number, [string, string]> = { 2: ['两', 'liǎng'], 3: ['三', 'sān'] };

const zhRiddle: ChallengeGen = {
  type: 'zhRiddle',
  subject: 'chinese',
  name: '拼字游戏',
  dims: ['observe', 'reason'],
  sig: (rand) => `zhRiddle:${int(rand, 0, RIDDLES.length - 1)}`,
  build: (sig) => {
    const r = RIDDLES[Number(sig.split(':')[1])];
    const same = r.parts.every((p) => p[0] === r.parts[0][0]);
    const prompt = same
      ? P(
          `${NUM_CN[r.parts.length][0]}个“${r.parts[0][0]}”字合在一起，是什么字？`,
          `${NUM_CN[r.parts.length][1]} gè ${r.parts[0][1]} zì hé zài yì qǐ shì shén me zì`,
        )
      : P(
          `“${r.parts[0][0]}”和“${r.parts[1][0]}”合在一起，是什么字？`,
          `${r.parts[0][1]} hé ${r.parts[1][1]} hé zài yì qǐ shì shén me zì`,
        );
    const { list, answerIndex } = ordered(sig, r.ans, r.others);
    return {
      kind: 'choice',
      prompt,
      options: list.map(([c, py], i) => zhOpt(String(i), c, py)),
      answerId: String(answerIndex),
      wrongHint: P('拼一拼，看一看每个字里有哪几部分。', 'pīn yi pīn kàn yi kàn měi gè zì lǐ yǒu nǎ jǐ bù fen'),
      explanation: `${r.parts.map((p) => p[0]).join(' + ')} = ${r.ans[0]}`,
    };
  },
};

/* 2. 排成小故事：按事情发生的先后排句子 */
const STORIES: [string, string][][] = [
  [
    ['天黑了。', 'tiān hēi le'],
    ['月亮出来了。', 'yuè liang chū lái le'],
    ['小明上床睡觉了。', 'xiǎo míng shàng chuáng shuì jiào le'],
  ],
  [
    ['我在土里放了一粒种子。', 'wǒ zài tǔ lǐ fàng le yí lì zhǒng zi'],
    ['种子发芽了。', 'zhǒng zi fā yá le'],
    ['小苗开出了花。', 'xiǎo miáo kāi chū le huā'],
  ],
  [
    ['下雨了。', 'xià yǔ le'],
    ['地上有很多水。', 'dì shang yǒu hěn duō shuǐ'],
    ['太阳出来了，水慢慢干了。', 'tài yáng chū lái le shuǐ màn màn gān le'],
  ],
  [
    ['小猫饿了。', 'xiǎo māo è le'],
    ['妈妈给小猫一条鱼。', 'mā ma gěi xiǎo māo yì tiáo yú'],
    ['小猫吃饱了，喵喵地叫。', 'xiǎo māo chī bǎo le miāo miāo de jiào'],
  ],
  [
    ['早上，我起床了。', 'zǎo shang wǒ qǐ chuáng le'],
    ['我洗脸刷牙。', 'wǒ xǐ liǎn shuā yá'],
    ['我背着书包去上学。', 'wǒ bēi zhe shū bāo qù shàng xué'],
  ],
  [
    ['鸟妈妈在树上做窝。', 'niǎo mā ma zài shù shang zuò wō'],
    ['鸟妈妈在窝里生了蛋。', 'niǎo mā ma zài wō lǐ shēng le dàn'],
    ['小鸟出生了。', 'xiǎo niǎo chū shēng le'],
  ],
  [
    ['冬天到了。', 'dōng tiān dào le'],
    ['天上下起了大雪。', 'tiān shàng xià qǐ le dà xuě'],
    ['我们一起堆雪人。', 'wǒ men yì qǐ duī xuě rén'],
  ],
  [
    ['小兔摔倒了。', 'xiǎo tù shuāi dǎo le'],
    ['小熊扶起了小兔。', 'xiǎo xióng fú qǐ le xiǎo tù'],
    ['小兔说：“谢谢你！”', 'xiǎo tù shuō xiè xie nǐ'],
  ],
];

const zhStory: ChallengeGen = {
  type: 'zhStory',
  subject: 'chinese',
  name: '排成小故事',
  dims: ['reason'],
  sig: (rand) => `zhStory:${int(rand, 0, STORIES.length - 1)}`,
  build: (sig) => {
    const story = STORIES[Number(sig.split(':')[1])];
    const show = scrambled(sig, story.length);
    return {
      kind: 'sort',
      prompt: P('按先后顺序，把句子排一排。', 'àn xiān hòu shùn xù bǎ jù zi pái yi pái'),
      items: show.map((k) => ({ id: String(k), text: zh(story[k][0], story[k][1]) })),
      order: story.map((_, k) => String(k)),
      wrongHint: P('想一想，哪件事先发生？', 'xiǎng yi xiǎng nǎ jiàn shì xiān fā shēng'),
      explanation: story.map((s) => s[0]).join(''),
    };
  },
};

/* 3. 读一读，想一想：从短文里找线索推断 */
const INFERS: { text: [string, string]; q: [string, string]; ans: [string, string]; others: [string, string][] }[] = [
  {
    text: ['小明进门时，雨伞是湿的，鞋上也有水。', 'xiǎo míng jìn mén shí yǔ sǎn shì shī de xié shang yě yǒu shuǐ'],
    q: ['外面可能怎么了？', 'wài miàn kě néng zěn me le'],
    ans: ['下雨了', 'xià yǔ le'],
    others: [
      ['出太阳了', 'chū tài yáng le'],
      ['刮大风了', 'guā dà fēng le'],
    ],
  },
  {
    text: [
      '小兰在太阳下堆了一个雪人，到了下午，雪人不见了。',
      'xiǎo lán zài tài yáng xià duī le yí gè xuě rén dào le xià wǔ xuě rén bú jiàn le',
    ],
    q: ['雪人怎么了？', 'xuě rén zěn me le'],
    ans: ['化成了水', 'huà chéng le shuǐ'],
    others: [
      ['自己走了', 'zì jǐ zǒu le'],
      ['飞上了天', 'fēi shàng le tiān'],
    ],
  },
  {
    text: ['小华的书包里有书、铅笔和尺子。', 'xiǎo huá de shū bāo lǐ yǒu shū qiān bǐ hé chǐ zi'],
    q: ['小华要去哪里？', 'xiǎo huá yào qù nǎ lǐ'],
    ans: ['学校', 'xué xiào'],
    others: [
      ['游泳池', 'yóu yǒng chí'],
      ['超市', 'chāo shì'],
    ],
  },
  {
    text: ['天上的乌云越来越多，燕子飞得很低。', 'tiān shàng de wū yún yuè lái yuè duō yàn zi fēi de hěn dī'],
    q: ['接下来可能会怎样？', 'jiē xià lái kě néng huì zěn yàng'],
    ans: ['要下雨了', 'yào xià yǔ le'],
    others: [
      ['要下雪了', 'yào xià xuě le'],
      ['天会更晴', 'tiān huì gèng qíng'],
    ],
  },
  {
    text: ['树叶变黄了，一片一片地落下来。', 'shù yè biàn huáng le yí piàn yí piàn de luò xià lái'],
    q: ['这是什么季节？', 'zhè shì shén me jì jié'],
    ans: ['秋天', 'qiū tiān'],
    others: [
      ['春天', 'chūn tiān'],
      ['夏天', 'xià tiān'],
    ],
  },
  {
    text: ['小明一边哭，一边到处找他的小狗。', 'xiǎo míng yì biān kū yì biān dào chù zhǎo tā de xiǎo gǒu'],
    q: ['小明心里怎么样？', 'xiǎo míng xīn lǐ zěn me yàng'],
    ans: ['很着急', 'hěn zháo jí'],
    others: [
      ['很高兴', 'hěn gāo xìng'],
      ['很想睡觉', 'hěn xiǎng shuì jiào'],
    ],
  },
  {
    text: [
      '东东每天给小花浇水，小花长得又高又美。',
      'dōng dōng měi tiān gěi xiǎo huā jiāo shuǐ xiǎo huā zhǎng de yòu gāo yòu měi',
    ],
    q: ['小花为什么长得好？', 'xiǎo huā wèi shén me zhǎng de hǎo'],
    ans: ['东东每天浇水', 'dōng dōng měi tiān jiāo shuǐ'],
    others: [
      ['小花会唱歌', 'xiǎo huā huì chàng gē'],
      ['天天下大雪', 'tiān tiān xià dà xuě'],
    ],
  },
  {
    text: ['跑步比赛时，小红第一个跑到终点。', 'pǎo bù bǐ sài shí xiǎo hóng dì yī gè pǎo dào zhōng diǎn'],
    q: ['小红跑得怎么样？', 'xiǎo hóng pǎo de zěn me yàng'],
    ans: ['跑得最快', 'pǎo de zuì kuài'],
    others: [
      ['跑得最慢', 'pǎo de zuì màn'],
      ['没有跑', 'méi yǒu pǎo'],
    ],
  },
];

const zhInfer: ChallengeGen = {
  type: 'zhInfer',
  subject: 'chinese',
  name: '读一读，想一想',
  dims: ['reason'],
  sig: (rand) => `zhInfer:${int(rand, 0, INFERS.length - 1)}`,
  build: (sig) => {
    const it = INFERS[Number(sig.split(':')[1])];
    const { list, answerIndex } = ordered(sig, it.ans, it.others);
    return {
      kind: 'choice',
      prompt: { text: zh(it.q[0], it.q[1]), speak: say(`${it.text[0]}${it.q[0]}`) },
      stem: { text: zh(it.text[0], it.text[1]) },
      options: list.map(([c, py], i) => zhOpt(String(i), c, py)),
      answerId: String(answerIndex),
      wrongHint: P('再读一读短文，找一找线索。', 'zài dú yi dú duǎn wén zhǎo yi zhǎo xiàn suǒ'),
      explanation: `从“${it.text[0].replace(/。$/, '')}”可以想到：${it.ans[0]}。`,
    };
  },
};

/* 4. 词语找规律：反义词、量词、分类 */
type WordItem = {
  stem?: [string, string];
  prompt: [string, string];
  ans: [string, string];
  others: [string, string][];
};
const ANTONYM_Q: [string, string] = ['找规律，括号里填什么？', 'zhǎo guī lǜ kuò hào lǐ tián shén me'];
const MEASURE_Q: [string, string] = ['括号里填哪个字最合适？', 'kuò hào lǐ tián nǎ ge zì zuì hé shì'];
const CLASS_Q: [string, string] = ['哪个词和其他三个不是一类？', 'nǎ ge cí hé qí tā sān gè bú shì yí lèi'];
const WORDS: WordItem[] = [
  {
    stem: ['大—小，多—少，上—（ ）', 'dà xiǎo duō shǎo shàng'],
    prompt: ANTONYM_Q,
    ans: ['下', 'xià'],
    others: [
      ['中', 'zhōng'],
      ['左', 'zuǒ'],
    ],
  },
  {
    stem: ['来—去，开—关，前—（ ）', 'lái qù kāi guān qián'],
    prompt: ANTONYM_Q,
    ans: ['后', 'hòu'],
    others: [
      ['左', 'zuǒ'],
      ['上', 'shàng'],
    ],
  },
  {
    stem: ['长—短，黑—白，高—（ ）', 'cháng duǎn hēi bái gāo'],
    prompt: ANTONYM_Q,
    ans: ['矮', 'ǎi'],
    others: [
      ['大', 'dà'],
      ['远', 'yuǎn'],
    ],
  },
  {
    stem: ['早—晚，大—小，冷—（ ）', 'zǎo wǎn dà xiǎo lěng'],
    prompt: ANTONYM_Q,
    ans: ['热', 'rè'],
    others: [
      ['冰', 'bīng'],
      ['雪', 'xuě'],
    ],
  },
  {
    stem: ['一（ ）小鱼', 'yī xiǎo yú'],
    prompt: MEASURE_Q,
    ans: ['条', 'tiáo'],
    others: [
      ['本', 'běn'],
      ['朵', 'duǒ'],
    ],
  },
  {
    stem: ['一（ ）小鸟', 'yī xiǎo niǎo'],
    prompt: MEASURE_Q,
    ans: ['只', 'zhī'],
    others: [
      ['棵', 'kē'],
      ['本', 'běn'],
    ],
  },
  {
    stem: ['一（ ）书', 'yī shū'],
    prompt: MEASURE_Q,
    ans: ['本', 'běn'],
    others: [
      ['条', 'tiáo'],
      ['头', 'tóu'],
    ],
  },
  {
    stem: ['一（ ）花', 'yī huā'],
    prompt: MEASURE_Q,
    ans: ['朵', 'duǒ'],
    others: [
      ['头', 'tóu'],
      ['条', 'tiáo'],
    ],
  },
  {
    stem: ['一（ ）大树', 'yī dà shù'],
    prompt: MEASURE_Q,
    ans: ['棵', 'kē'],
    others: [
      ['朵', 'duǒ'],
      ['本', 'běn'],
    ],
  },
  {
    stem: ['一（ ）牛', 'yī niú'],
    prompt: MEASURE_Q,
    ans: ['头', 'tóu'],
    others: [
      ['本', 'běn'],
      ['朵', 'duǒ'],
    ],
  },
  {
    prompt: CLASS_Q,
    ans: ['小狗', 'xiǎo gǒu'],
    others: [
      ['苹果', 'píng guǒ'],
      ['香蕉', 'xiāng jiāo'],
      ['西瓜', 'xī guā'],
    ],
  },
  {
    prompt: CLASS_Q,
    ans: ['桌子', 'zhuō zi'],
    others: [
      ['红色', 'hóng sè'],
      ['黄色', 'huáng sè'],
      ['蓝色', 'lán sè'],
    ],
  },
  {
    prompt: CLASS_Q,
    ans: ['早上', 'zǎo shang'],
    others: [
      ['春天', 'chūn tiān'],
      ['夏天', 'xià tiān'],
      ['秋天', 'qiū tiān'],
    ],
  },
  {
    prompt: CLASS_Q,
    ans: ['老师', 'lǎo shī'],
    others: [
      ['爸爸', 'bà ba'],
      ['妈妈', 'mā ma'],
      ['爷爷', 'yé ye'],
    ],
  },
  {
    prompt: CLASS_Q,
    ans: ['小船', 'xiǎo chuán'],
    others: [
      ['小鸡', 'xiǎo jī'],
      ['小鸭', 'xiǎo yā'],
      ['小鹅', 'xiǎo é'],
    ],
  },
];

const zhWords: ChallengeGen = {
  type: 'zhWords',
  subject: 'chinese',
  name: '词语找规律',
  dims: ['classify', 'observe'],
  sig: (rand) => `zhWords:${int(rand, 0, WORDS.length - 1)}`,
  build: (sig) => {
    const it = WORDS[Number(sig.split(':')[1])];
    const { list, answerIndex } = ordered(sig, it.ans, it.others);
    const kind = it.prompt === CLASS_Q ? 'class' : it.prompt === ANTONYM_Q ? 'antonym' : 'measure';
    return {
      kind: 'choice',
      prompt: P(it.prompt[0], it.prompt[1]),
      stem: it.stem ? { text: zh(it.stem[0], it.stem[1]) } : undefined,
      options: list.map(([c, py], i) => zhOpt(String(i), c, py)),
      answerId: String(answerIndex),
      wrongHint:
        kind === 'antonym'
          ? P('前面每一组的两个字，意思有什么关系？', 'qián miàn měi yì zǔ de liǎng gè zì yì si yǒu shén me guān xì')
          : kind === 'measure'
            ? P('把每个字放进去读一读，哪个最顺口？', 'bǎ měi gè zì fàng jìn qù dú yi dú nǎ ge zuì shùn kǒu')
            : P('想一想，其中三个都是什么？', 'xiǎng yi xiǎng qí zhōng sān gè dōu shì shén me'),
      explanation:
        kind === 'antonym'
          ? `每一组的两个字意思相反：${it.stem![0].replace('（ ）', it.ans[0])}。`
          : kind === 'measure'
            ? `${it.stem![0].replace('（ ）', it.ans[0])}`
            : `${it.ans[0]}和其他三个不是一类。`,
    };
  },
};

/* ═════════════════ 英语 ═════════════════ */

type W = { w: string; e: string };
const wordOpt = (id: string, x: W): ChoiceOption => ({ id, text: x.w, visual: { emoji: x.e }, speak: enS(x.w) });

/* 5. 猜猜它是谁 */
const GUESS: { clue: string; zh: string; ans: W; others: W[] }[] = [
  {
    clue: 'It is yellow. Monkeys like it.',
    zh: '它是黄色的，猴子喜欢它。',
    ans: { w: 'banana', e: '🍌' },
    others: [
      { w: 'apple', e: '🍎' },
      { w: 'grape', e: '🍇' },
    ],
  },
  {
    clue: 'It is red and round. You can eat it.',
    zh: '它是红色的、圆圆的，可以吃。',
    ans: { w: 'apple', e: '🍎' },
    others: [
      { w: 'ball', e: '⚽' },
      { w: 'car', e: '🚗' },
    ],
  },
  {
    clue: 'It says "meow".',
    zh: '它会“喵喵”叫。',
    ans: { w: 'cat', e: '🐱' },
    others: [
      { w: 'dog', e: '🐶' },
      { w: 'duck', e: '🦆' },
    ],
  },
  {
    clue: 'It says "woof".',
    zh: '它会“汪汪”叫。',
    ans: { w: 'dog', e: '🐶' },
    others: [
      { w: 'cat', e: '🐱' },
      { w: 'pig', e: '🐷' },
    ],
  },
  {
    clue: 'It can fly. It can sing.',
    zh: '它会飞，还会唱歌。',
    ans: { w: 'bird', e: '🐦' },
    others: [
      { w: 'fish', e: '🐟' },
      { w: 'pig', e: '🐷' },
    ],
  },
  {
    clue: 'It lives in water. It can swim.',
    zh: '它住在水里，会游泳。',
    ans: { w: 'fish', e: '🐟' },
    others: [
      { w: 'bird', e: '🐦' },
      { w: 'cat', e: '🐱' },
    ],
  },
  {
    clue: 'You can see it in the sky at night.',
    zh: '晚上能在天上看到它。',
    ans: { w: 'moon', e: '🌙' },
    others: [
      { w: 'sun', e: '☀️' },
      { w: 'tree', e: '🌳' },
    ],
  },
  {
    clue: 'It is hot. You can see it in the day.',
    zh: '它很热，白天能看到它。',
    ans: { w: 'sun', e: '☀️' },
    others: [
      { w: 'moon', e: '🌙' },
      { w: 'snow', e: '❄️' },
    ],
  },
  {
    clue: 'You can read it.',
    zh: '你可以读它。',
    ans: { w: 'book', e: '📚' },
    others: [
      { w: 'pen', e: '🖊️' },
      { w: 'bag', e: '🎒' },
    ],
  },
  {
    clue: 'You can write with it.',
    zh: '你可以用它写字。',
    ans: { w: 'pencil', e: '✏️' },
    others: [
      { w: 'book', e: '📚' },
      { w: 'ball', e: '⚽' },
    ],
  },
  {
    clue: 'It is big. It has a long nose.',
    zh: '它很大，有长长的鼻子。',
    ans: { w: 'elephant', e: '🐘' },
    others: [
      { w: 'mouse', e: '🐭' },
      { w: 'cat', e: '🐱' },
    ],
  },
  {
    clue: 'It is white and cold.',
    zh: '它是白色的，很冷。',
    ans: { w: 'snow', e: '❄️' },
    others: [
      { w: 'sun', e: '☀️' },
      { w: 'fire', e: '🔥' },
    ],
  },
];

const enGuess: ChallengeGen = {
  type: 'enGuess',
  subject: 'english',
  name: 'Guess what?',
  dims: ['reason'],
  sig: (rand) => `enGuess:${int(rand, 0, GUESS.length - 1)}`,
  build: (sig) => {
    const g = GUESS[Number(sig.split(':')[1])];
    const { list, answerIndex } = ordered(sig, g.ans, g.others);
    return {
      kind: 'choice',
      prompt: enPrompt(`${g.clue} What is it?`, `${g.zh}它是什么？`),
      options: list.map((x, i) => wordOpt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: enPrompt('Listen again. Think about the clues.', '再听一遍，想想每条线索。'),
      explanation: `${g.clue} → ${g.ans.w} ${g.ans.e}`,
    };
  },
};

/* 6. 找不同类 */
const EN_CATS: { zh: string; items: W[] }[] = [
  {
    zh: '水果',
    items: [
      { w: 'apple', e: '🍎' },
      { w: 'banana', e: '🍌' },
      { w: 'pear', e: '🍐' },
      { w: 'orange', e: '🍊' },
      { w: 'grape', e: '🍇' },
    ],
  },
  {
    zh: '动物',
    items: [
      { w: 'cat', e: '🐱' },
      { w: 'dog', e: '🐶' },
      { w: 'duck', e: '🦆' },
      { w: 'pig', e: '🐷' },
      { w: 'bird', e: '🐦' },
    ],
  },
  {
    zh: '文具',
    items: [
      { w: 'book', e: '📚' },
      { w: 'pen', e: '🖊️' },
      { w: 'bag', e: '🎒' },
      { w: 'ruler', e: '📏' },
      { w: 'pencil', e: '✏️' },
    ],
  },
  {
    zh: '交通工具',
    items: [
      { w: 'car', e: '🚗' },
      { w: 'bus', e: '🚌' },
      { w: 'bike', e: '🚲' },
      { w: 'ship', e: '🚢' },
      { w: 'plane', e: '✈️' },
    ],
  },
];

const enOdd: ChallengeGen = {
  type: 'enOdd',
  subject: 'english',
  name: 'Odd one out',
  dims: ['classify'],
  sig: (rand) => {
    const a = int(rand, 0, EN_CATS.length - 1);
    let b = int(rand, 0, EN_CATS.length - 2);
    if (b >= a) b++;
    const three = shuffle([...EN_CATS[a].items.keys()], rand).slice(0, 3);
    return `enOdd:${a}:${three.join(',')}:${b}:${int(rand, 0, EN_CATS[b].items.length - 1)}`;
  },
  build: (sig) => {
    const [, as, is, bs, js] = sig.split(':');
    const [A, B] = [EN_CATS[Number(as)], EN_CATS[Number(bs)]];
    const three = is.split(',').map((i) => A.items[Number(i)]);
    const ans = B.items[Number(js)];
    const { list, answerIndex } = ordered(sig, ans, three);
    return {
      kind: 'choice',
      prompt: enPrompt('Which one is different?', '哪一个和其他三个不是一类？'),
      options: list.map((x, i) => wordOpt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: enPrompt('Look again. What are the other three?', '再看看，其他三个都是什么？'),
      explanation: `${ans.w} ${ans.e} 是${B.zh}，其他三个都是${A.zh}。`,
    };
  },
};

/* 7. 找规律接龙 */
const COLORS: W[] = [
  { w: 'red', e: '🔴' },
  { w: 'blue', e: '🔵' },
  { w: 'green', e: '🟢' },
  { w: 'yellow', e: '🟡' },
];
const NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const PETS: W[] = [
  { w: 'cat', e: '🐱' },
  { w: 'dog', e: '🐶' },
  { w: 'duck', e: '🦆' },
];

/** 规律序列：返回显示的 7 个（数字为 4 个）和答案 */
export function enPatternSeq(kind: string, a: number): { shown: W[]; ans: W; choices: W[] } {
  if (kind === 'num') {
    const seq = NUMBERS.slice(a, a + 5).map((w, i) => ({ w, e: String(a + i + 1) }));
    const ans = seq[4];
    const near = [NUMBERS[a + 5], NUMBERS[a + 3]]
      .filter(Boolean)
      .map((w) => ({ w, e: String(NUMBERS.indexOf(w) + 1) }));
    return { shown: seq.slice(0, 4), ans, choices: near };
  }
  const pool = kind === 'pets' ? PETS : COLORS;
  const x = pool[a % pool.length];
  const y = pool[(a + 1) % pool.length];
  const z = pool[(a + 2) % pool.length];
  const unit = kind === 'colorAB' ? [x, y] : kind === 'colorABC' ? [x, y, z] : [x, x, y];
  const all = Array.from({ length: 8 }, (_, i) => unit[i % unit.length]);
  return { shown: all.slice(0, 7), ans: all[7], choices: [x, y, z].filter((c) => c !== all[7]) };
}

const enPattern: ChallengeGen = {
  type: 'enPattern',
  subject: 'english',
  name: 'What comes next?',
  dims: ['observe'],
  sig: (rand) => {
    const kind = pick(rand, ['colorAB', 'colorABC', 'pets', 'num']);
    return `enPattern:${kind}:${kind === 'num' ? int(rand, 0, 4) : int(rand, 0, 3)}`;
  },
  build: (sig) => {
    const [, kind, as] = sig.split(':');
    const { shown, ans, choices } = enPatternSeq(kind, Number(as));
    const isNum = kind === 'num';
    const { list, answerIndex } = ordered(sig, ans, choices);
    return {
      kind: 'choice',
      prompt: enPrompt('What comes next?', '找规律，接下来是什么？'),
      stem: { text: `${shown.map((s) => (isNum ? s.w : `${s.e} ${s.w}`)).join('  ')}  ❓` },
      options: list.map((x, i) => ({
        id: String(i),
        text: isNum ? `${x.w}` : x.w,
        visual: isNum ? undefined : { emoji: x.e },
        speak: enS(x.w),
      })),
      answerId: String(answerIndex),
      wrongHint: enPrompt(
        'Say them out loud. What repeats?',
        isNum ? '读一读，数字是怎么变的？' : '读一读，哪几个在重复？',
      ),
      explanation: isNum
        ? `${shown.map((s) => s.w).join(', ')}, ${ans.w}（${shown.map((s) => s.e).join('、')}、${ans.e}）`
        : `${shown.map((s) => s.w).join(', ')}, ${ans.w}`,
    };
  },
};

/* 8. 连词成句 */
const SENTENCES: { words: string[]; zh: string }[] = [
  { words: ['I', 'like', 'apples.'], zh: '我喜欢苹果。' },
  { words: ['I', 'have', 'a dog.'], zh: '我有一只狗。' },
  { words: ['This', 'is', 'my bag.'], zh: '这是我的书包。' },
  { words: ['It', 'is', 'red.'], zh: '它是红色的。' },
  { words: ['I', 'can', 'jump.'], zh: '我会跳。' },
  { words: ['Look', 'at', 'the cat.'], zh: '看那只猫。' },
  { words: ['I', 'see', 'a bird.'], zh: '我看见一只鸟。' },
  { words: ['The sun', 'is', 'hot.'], zh: '太阳很热。' },
  { words: ['I', 'am', 'six.'], zh: '我六岁。' },
  { words: ['Nice', 'to meet', 'you.'], zh: '很高兴见到你。' },
];

const enSentence: ChallengeGen = {
  type: 'enSentence',
  subject: 'english',
  name: 'Make a sentence',
  dims: ['reason'],
  sig: (rand) => `enSentence:${int(rand, 0, SENTENCES.length - 1)}`,
  build: (sig) => {
    const s = SENTENCES[Number(sig.split(':')[1])];
    const show = scrambled(sig, s.words.length);
    return {
      kind: 'sort',
      prompt: enPrompt('Put the words in order.', `把单词排成一句话：${s.zh}`),
      items: show.map((k) => ({ id: String(k), text: s.words[k] })),
      order: s.words.map((_, k) => String(k)),
      wrongHint: enPrompt('Which word comes first?', '哪个词放在最前面？'),
      explanation: `${s.words.join(' ')}（${s.zh}）`,
    };
  },
};

export const CHINESE_CHALLENGES: ChallengeGen[] = [zhRiddle, zhStory, zhInfer, zhWords];
export const ENGLISH_CHALLENGES: ChallengeGen[] = [enGuess, enOdd, enPattern, enSentence];

/** 供测试核对（独立数据访问） */
export const LANG_DATA = { RIDDLES, STORIES, INFERS, WORDS, GUESS, EN_CATS, SENTENCES };

export { zhRiddle, zhStory, zhInfer, zhWords, enGuess, enOdd, enPattern, enSentence };
