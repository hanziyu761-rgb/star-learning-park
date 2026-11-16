/**
 * 每日挑战：初中难度（第 5 档，V5.2，本项目原创）。
 *
 * 数学：找规律求第 n 项、数线段 / 握手 / 对角线（组合计数）、列方程解应用题。答案全部由程序计算。
 * 语文：古诗文名句接下句（公有领域的古诗文原句）、修辞手法判断（原创例句）。
 * 英语：英文谜语（常见的传统谜语）、短文推理（原创短文）。
 * 状态：已通过教师审核。
 */
import { enPrompt, enS } from '@/content/zh';
import type { ChoiceOption, Prompt } from '@/lesson/types';
import { hash, int, numberChoice, pick, say, seeded, shuffle, type ChallengeGen } from './challenges';

const T = (text: string): Prompt => ({ text, speak: say(text) });
const opt = (id: string, text: string): ChoiceOption => ({ id, text, speak: say(text) });
function ordered<X>(sig: string, answer: X, others: X[]): { list: X[]; answerIndex: number } {
  const list = shuffle([answer, ...others], seeded(hash(sig)));
  return { list, answerIndex: list.indexOf(answer) };
}

/* ═════════════ 数学 ═════════════ */

/** 找规律：等差数列或“平方 + 常数”数列，求第 n 项 */
const jnSeq: ChallengeGen = {
  type: 'jnSeq',
  subject: 'math',
  name: '数列的第 n 项',
  dims: ['observe', 'reason'],
  levels: [5],
  sig: (rand) => `jnSeq:${int(rand, 0, 1)}:${int(rand, -5, 9)}:${int(rand, 2, 7)}:${int(rand, 10, 30)}`,
  build: (sig) => {
    const [, kind, a, d, n] = sig.split(':').map(Number);
    // kind 0：a + (k − 1)d；kind 1：k² + a
    const term = (k: number) => (kind === 0 ? a + (k - 1) * d : k * k + a);
    const first = [1, 2, 3, 4, 5].map(term).join('，');
    const ans = term(n);
    const wrong = kind === 0 ? [a + n * d, a + (n - 2) * d, n * d] : [n * n, (n - 1) * (n - 1) + a, 2 * n + a];
    const c = numberChoice(sig, ans, wrong);
    return {
      kind: 'choice',
      prompt: T(`一列数：${first}，……照这个规律，第 ${n} 个数是多少？`),
      options: c.options,
      answerId: c.answerId,
      wrongHint: T(kind === 0 ? '看看相邻两个数相差多少，第 n 个数 = 第 1 个数 + (n − 1) × 公差。' : '把每个数和它的序号比一比：和序号的平方有什么关系？'),
      explanation: kind === 0 ? `每次多 ${d}，第 ${n} 个数是 ${a} + ${n - 1} × ${d} = ${ans}。` : `第 k 个数是 k² ${a < 0 ? '−' : '+'} ${Math.abs(a)}，第 ${n} 个数是 ${n * n} ${a < 0 ? '−' : '+'} ${Math.abs(a)} = ${ans}。`,
    };
  },
};

/** 组合计数：直线上 n 个点有几条线段 / n 个人两两握手 / n 边形有几条对角线 */
const COUNT_KINDS = [
  { q: (n: number) => `一条直线上有 ${n} 个点，以这些点为端点的线段一共有多少条？`, f: (n: number) => (n * (n - 1)) / 2, why: '每两个点确定一条线段：n × (n − 1) ÷ 2。' },
  { q: (n: number) => `${n} 位同学见面，每两人都握一次手，一共握手多少次？`, f: (n: number) => (n * (n - 1)) / 2, why: '每人和另外 n − 1 人握手，每次握手算了两遍：n × (n − 1) ÷ 2。' },
  { q: (n: number) => `一个 ${n} 边形一共有多少条对角线？`, f: (n: number) => (n * (n - 3)) / 2, why: '每个顶点能和不相邻的 n − 3 个顶点连对角线，每条算了两遍：n × (n − 3) ÷ 2。' },
  { q: (n: number) => `${n} 支球队进行单循环比赛（每两队赛一场），一共要赛多少场？`, f: (n: number) => (n * (n - 1)) / 2, why: '每两队赛一场：n × (n − 1) ÷ 2。' },
];
const jnCount: ChallengeGen = {
  type: 'jnCount',
  subject: 'math',
  name: '数一数有几种',
  dims: ['reason', 'strategy'],
  levels: [5],
  sig: (rand) => `jnCount:${int(rand, 0, COUNT_KINDS.length - 1)}:${int(rand, 5, 12)}`,
  build: (sig) => {
    const [, k, n] = sig.split(':').map(Number);
    const it = COUNT_KINDS[k];
    const ans = it.f(n);
    const c = numberChoice(sig, ans, [n * (n - 1), n * n, ans + n]);
    return {
      kind: 'choice',
      prompt: T(it.q(n)),
      options: c.options,
      answerId: c.answerId,
      wrongHint: T('先从少一点的情况数起（3 个、4 个），找出规律，注意不要重复数。'),
      explanation: `${it.why} = ${ans}。`,
    };
  },
};

/** 工程问题的数据：合作天数是整数 */
const WORK_PAIRS = [
  [6, 3],
  [12, 4],
  [10, 15],
  [20, 5],
  [12, 6],
  [30, 20],
  [24, 12],
];
/** 列方程解应用题：门票（二元一次方程组）、工程问题 */
const jnEq: ChallengeGen = {
  type: 'jnEq',
  subject: 'math',
  name: '列方程解难题',
  dims: ['reason', 'strategy'],
  levels: [5],
  sig: (rand) => (rand() < 0.5 ? `jnEq:t:${int(rand, 3, 15)}:${int(rand, 3, 15)}:${pick(rand, [20, 30, 40, 50])}:${pick(rand, [10, 15, 25])}` : `jnEq:w:${pick(rand, WORK_PAIRS).join(':')}`),
  build: (sig) => {
    const p = sig.split(':');
    if (p[1] === 't') {
      const [adult, child, pa, pc] = p.slice(2).map(Number);
      const total = adult + child;
      const money = adult * pa + child * pc;
      const c = numberChoice(sig, adult, [child, total - Math.round(money / pa), Math.round(money / (pa + pc))]);
      return {
        kind: 'choice',
        prompt: T(`公园门票：成人票每张 ${pa} 元，儿童票每张 ${pc} 元。一个团队共买了 ${total} 张票，花了 ${money} 元。买了多少张成人票？`),
        options: c.options,
        answerId: c.answerId,
        wrongHint: T('设成人票 x 张，儿童票就是（总张数 − x）张，按钱数列方程。'),
        explanation: `${pa}x + ${pc}(${total} − x) = ${money}，x = ${adult}。`,
      };
    }
    // 工程问题：甲单独做 a 天，乙单独做 b 天，合作几天（数据都能整除）
    const [a, b] = p.slice(2).map(Number);
    const ans = String((a * b) / (a + b));
    const options = [...new Set([ans, String(a + b), String((a + b) / 2), String(Math.abs(a - b) || a)])].slice(0, 4);
    const { list, answerIndex } = ordered(sig, ans, options.filter((x) => x !== ans));
    return {
      kind: 'choice',
      prompt: T(`一项工程，甲单独做 ${a} 天完成，乙单独做 ${b} 天完成。两人合作，几天能完成？`),
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('把整个工程看成 1：甲每天做 1/甲的天数，乙每天做 1/乙的天数。'),
      explanation: `1 ÷ (1/${a} + 1/${b}) = ${ans} 天。`,
    };
  },
};

/* ═════════════ 语文 ═════════════ */

/** 古诗文名句：上句 → 下句，错误选项来自别的诗 */
const POEM_LINES: [string, string, string][] = [
  ['海内存知己', '天涯若比邻', '王勃《送杜少府之任蜀州》'],
  ['会当凌绝顶', '一览众山小', '杜甫《望岳》'],
  ['海日生残夜', '江春入旧年', '王湾《次北固山下》'],
  ['不畏浮云遮望眼', '自缘身在最高层', '王安石《登飞来峰》'],
  ['山重水复疑无路', '柳暗花明又一村', '陆游《游山西村》'],
  ['落红不是无情物', '化作春泥更护花', '龚自珍《己亥杂诗》'],
  ['大漠孤烟直', '长河落日圆', '王维《使至塞上》'],
  ['乡书何处达', '归雁洛阳边', '王湾《次北固山下》'],
  ['晴川历历汉阳树', '芳草萋萋鹦鹉洲', '崔颢《黄鹤楼》'],
  ['先天下之忧而忧', '后天下之乐而乐', '范仲淹《岳阳楼记》'],
  ['醉翁之意不在酒', '在乎山水之间也', '欧阳修《醉翁亭记》'],
  ['学而不思则罔', '思而不学则殆', '《论语》'],
  ['三人行', '必有我师焉', '《论语》'],
  ['非淡泊无以明志', '非宁静无以致远', '诸葛亮《诫子书》'],
  ['得道者多助', '失道者寡助', '《孟子》'],
  ['长风破浪会有时', '直挂云帆济沧海', '李白《行路难》'],
  ['沉舟侧畔千帆过', '病树前头万木春', '刘禹锡《酬乐天扬州初逢席上见赠》'],
  ['但愿人长久', '千里共婵娟', '苏轼《水调歌头》'],
  ['人生自古谁无死', '留取丹心照汗青', '文天祥《过零丁洋》'],
  ['安得广厦千万间', '大庇天下寒士俱欢颜', '杜甫《茅屋为秋风所破歌》'],
  ['蒹葭苍苍', '白露为霜', '《诗经·蒹葭》'],
  ['关关雎鸠', '在河之洲', '《诗经·关雎》'],
  ['万里赴戎机', '关山度若飞', '《木兰诗》'],
  ['枯藤老树昏鸦', '小桥流水人家', '马致远《天净沙·秋思》'],
];
const jnPoem: ChallengeGen = {
  type: 'jnPoem',
  subject: 'chinese',
  name: '名句接龙',
  dims: ['observe'],
  levels: [5],
  sig: (rand) => {
    const i = int(rand, 0, POEM_LINES.length - 1);
    const others = shuffle(
      POEM_LINES.map((_, k) => k).filter((k) => k !== i),
      rand,
    ).slice(0, 3);
    return `jnPoem:${i}:${others.join(',')}`;
  },
  build: (sig) => {
    const [, is, os] = sig.split(':');
    const [up, down, from] = POEM_LINES[Number(is)];
    const others = os.split(',').map((k) => POEM_LINES[Number(k)][1]);
    const { list, answerIndex } = ordered(sig, down, others);
    return {
      kind: 'choice',
      prompt: T(`“${up}”的下一句是？`),
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('想一想这句诗文出自哪里，再小声背一背。'),
      explanation: `${up}，${down}。——${from}`,
    };
  },
};

/** 修辞手法：原创例句 */
const RHETORIC: [string, string][] = [
  ['天上的白云像一团团棉花糖。', '比喻'],
  ['小河唱着欢快的歌，向远方流去。', '拟人'],
  ['他的嗓门大得能把屋顶掀翻。', '夸张'],
  ['春天来了，花儿开了，草儿绿了，鸟儿唱了。', '排比'],
  ['难道我们能眼看着时间白白溜走吗？', '反问'],
  ['什么是幸福？幸福就是和家人在一起。', '设问'],
  ['柳枝在风中轻轻地梳着自己的长发。', '拟人'],
  ['弯弯的月亮像一只小船。', '比喻'],
  ['这条路长得好像永远也走不到头。', '夸张'],
  ['我们怎能忘记老师的教导呢？', '反问'],
  ['读书使人明理，读书使人聪慧，读书使人进步。', '排比'],
  ['为什么树叶会变黄？因为天气冷了，叶绿素减少了。', '设问'],
];
const RHET_NAMES = ['比喻', '拟人', '夸张', '排比', '反问', '设问'];
const jnRhet: ChallengeGen = {
  type: 'jnRhet',
  subject: 'chinese',
  name: '修辞小侦探',
  dims: ['observe', 'classify'],
  levels: [5],
  sig: (rand) => `jnRhet:${int(rand, 0, RHETORIC.length - 1)}`,
  build: (sig) => {
    const [s, ans] = RHETORIC[Number(sig.split(':')[1])];
    const others = shuffle(
      RHET_NAMES.filter((x) => x !== ans),
      seeded(hash(sig)),
    ).slice(0, 3);
    const { list, answerIndex } = ordered(sig, ans, others);
    return {
      kind: 'choice',
      prompt: T('这句话用了什么修辞手法？'),
      stem: { text: s },
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('比喻有“像”的本体和喻体；拟人把物当人写；反问不需要回答；设问自问自答。'),
      explanation: `${s}——${ans}。`,
    };
  },
};

/* ═════════════ 英语 ═════════════ */

const RIDDLES: [string, string, string[]][] = [
  ['What has keys but cannot open any door?', 'A piano', ['A car', 'A house', 'A box']],
  ['What has hands but cannot clap?', 'A clock', ['A tree', 'A robot', 'A doll']],
  ['What gets wetter the more it dries?', 'A towel', ['The sun', 'A cup', 'A fish']],
  ['What has a neck but no head?', 'A bottle', ['A snake', 'A tree', 'A shirt']],
  ['What can you catch but not throw?', 'A cold', ['A ball', 'A fish', 'A bus']],
  ['What goes up but never comes down?', 'Your age', ['A kite', 'A plane', 'A balloon']],
  ['What has many teeth but cannot bite?', 'A comb', ['A dog', 'A shark', 'A baby']],
  ['What has one eye but cannot see?', 'A needle', ['A pirate', 'A camera', 'A potato']],
  ['What is full of holes but still holds water?', 'A sponge', ['A bucket', 'A net', 'A cup']],
  ['What has words but never speaks?', 'A book', ['A parrot', 'A phone', 'A teacher']],
];
const jnRiddle: ChallengeGen = {
  type: 'jnRiddle',
  subject: 'english',
  name: 'English riddles',
  dims: ['reason'],
  levels: [5],
  sig: (rand) => `jnRiddle:${int(rand, 0, RIDDLES.length - 1)}`,
  build: (sig) => {
    const [q, ans, others] = RIDDLES[Number(sig.split(':')[1])];
    const { list, answerIndex } = ordered(sig, ans, others);
    return {
      kind: 'choice',
      prompt: enPrompt('Guess the riddle.', '猜一猜谜语'),
      stem: { text: q },
      options: list.map((x, i) => ({ id: String(i), text: x, speak: enS(x) })),
      answerId: String(answerIndex),
      wrongHint: enPrompt('Think about another meaning of the key word.', '想一想关键词的另一个意思。'),
      explanation: `${q} — ${ans}.`,
    };
  },
};

const STORIES: { text: string; q: string; zh: string; ans: string; others: string[]; why: string }[] = [
  {
    text: 'Mike left home at 7:30. It takes him 20 minutes to walk to school. Classes begin at 8:00, but he got there 10 minutes late because he stopped to help an old man.',
    q: 'How long did Mike stop to help the old man?',
    zh: 'Mike 停下来帮老人用了多久？',
    ans: '20 minutes',
    others: ['10 minutes', '30 minutes', '50 minutes'],
    why: '7:30 出发，走路 20 分钟本该 7:50 到，实际 8:10 到，多用了 20 分钟。',
  },
  {
    text: 'Lucy has more books than Tom. Tom has more books than Ann. Jim has fewer books than Ann.',
    q: 'Who has the fewest books?',
    zh: '谁的书最少？',
    ans: 'Jim',
    others: ['Ann', 'Tom', 'Lucy'],
    why: 'Lucy > Tom > Ann > Jim。',
  },
  {
    text: 'It was raining hard this morning. Linda looked out of the window and smiled. "Good! Today’s sports meeting will be put off," she said. Linda doesn’t like running.',
    q: 'Why did Linda smile?',
    zh: 'Linda 为什么笑了？',
    ans: 'She didn’t want to run in the sports meeting.',
    others: ['She likes rainy days very much.', 'She won the sports meeting.', 'She saw her friend outside.'],
    why: '最后一句说她不喜欢跑步，下雨运动会推迟了。',
  },
  {
    text: 'A shop sells pens at 3 yuan each. If you buy 5, you only pay for 4. Peter bought 10 pens.',
    q: 'How much did Peter pay?',
    zh: 'Peter 付了多少钱？',
    ans: '24 yuan',
    others: ['30 yuan', '27 yuan', '12 yuan'],
    why: '每买 5 支只付 4 支的钱：10 支付 8 支，8 × 3 = 24 元。',
  },
  {
    text: 'Sam’s birthday is two days after Kate’s. Kate’s birthday is on the last day of May.',
    q: 'When is Sam’s birthday?',
    zh: 'Sam 的生日是哪天？',
    ans: 'June 2nd',
    others: ['May 29th', 'June 1st', 'May 31st'],
    why: '五月最后一天是 5 月 31 日，两天后是 6 月 2 日。',
  },
  {
    text: 'The library opens at 9:00 a.m. and closes at 5:00 p.m. It is closed on Mondays. Today is Sunday, and Bob wants to go there tomorrow morning.',
    q: 'Can Bob use the library tomorrow?',
    zh: 'Bob 明天能去图书馆吗？',
    ans: 'No, because it is closed on Mondays.',
    others: ['Yes, it opens at 9:00 a.m.', 'Yes, but only in the afternoon.', 'No, because it closes at noon.'],
    why: '今天星期日，明天星期一，图书馆星期一不开。',
  },
];
const jnRead: ChallengeGen = {
  type: 'jnRead',
  subject: 'english',
  name: 'Read and think',
  dims: ['reason'],
  levels: [5],
  sig: (rand) => `jnRead:${int(rand, 0, STORIES.length - 1)}`,
  build: (sig) => {
    const it = STORIES[Number(sig.split(':')[1])];
    const { list, answerIndex } = ordered(sig, it.ans, it.others);
    return {
      kind: 'choice',
      prompt: enPrompt(it.q, it.zh),
      stem: { text: it.text },
      options: list.map((x, i) => ({ id: String(i), text: x, speak: enS(x) })),
      answerId: String(answerIndex),
      wrongHint: enPrompt('Read again and think step by step.', '再读一遍，一步一步想。'),
      explanation: `${it.ans}（${it.why}）`,
    };
  },
};

export const MATH_JUNIOR_CH: ChallengeGen[] = [jnSeq, jnCount, jnEq];
export const CHINESE_JUNIOR_CH: ChallengeGen[] = [jnPoem, jnRhet];
export const ENGLISH_JUNIOR_CH: ChallengeGen[] = [jnRiddle, jnRead];
