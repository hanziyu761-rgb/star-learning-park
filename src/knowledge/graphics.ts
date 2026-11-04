/**
 * 一年级数学「图形与几何 / 统计 / 规律」类互动题（本项目原创，V2.1）
 *
 * 覆盖知识点：m1.position 位置、m1.shapes2d 平面图形、m1.shapes3d 立体图形、
 * m1.clock 认识整时、m1.classify 分类与整理、m1.pattern 找规律。
 * 题目、图案、情境均为本项目独立编写，未复制 cn-math-taxonomy（CC BY-NC 4.0）或任何教材原题。
 * 状态：待教师审核（CONTENT_REVIEW）。
 *
 * 每道题由「签名」唯一确定（如 clock 的 set:7），复习/诊断时由题目 id 还原；答案全部由数据计算。
 */
import { zh } from '@/content/zh';
import type { Exercise, Figure, PatternToken, Prompt, ShapeKind, Visual } from '@/lesson/types';

type Rand = () => number;
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type ExerciseBody = DistOmit<Exercise, 'id' | 'skill'>;

export interface FullGen {
  /** 所有可用签名（固定题库 + 参数题） */
  sigs: string[];
  build: (sig: string) => ExerciseBody;
}

export const CONTENT_REVIEW = '待教师审核';
/** 本批互动题覆盖的知识点 */
export const GRAPHICS_KPS = ['m1.position', 'm1.shapes2d', 'm1.shapes3d', 'm1.clock', 'm1.classify', 'm1.pattern'];

const say = (text: string) => ({ text, lang: 'zh-CN' as const });
const p = (chars: string, py: string, speak?: string): Prompt => ({ text: zh(chars, py), speak: say(speak ?? chars) });
const shape = (s: ShapeKind, color: string, rotation = 0): Visual => ({
  emoji: '',
  figure: { type: 'shape', shape: s, color, rotation },
});
const clock = (hour: number, minute = 0): Visual => ({
  emoji: '🕐',
  figure: { type: 'clock', hour, minute } as Figure,
});
const em = (emoji: string, count?: number): Visual => ({ emoji, count });

const RED = '#F06A6A';
const BLUE = '#5AA9E6';
const YELLOW = '#FFD23F';
const GREEN = '#6BCB77';
const PURPLE = '#A78BFA';
const ORANGE = '#FFA45B';

const TRY_AGAIN = p('看一看，再试一次。', 'kàn yi kàn zài shì yí cì');

/* ───────────────────────── 位置与方向 ───────────────────────── */

const POSITION: Record<string, () => ExerciseBody> = {
  p1: () => ({
    kind: 'grid-place',
    prompt: p('把小猫放到小狗的上面。', 'bǎ xiǎo māo fàng dào xiǎo gǒu de shàng miàn'),
    wrongHint: p('上面是小狗头顶的那一格。', 'shàng miàn shì xiǎo gǒu tóu dǐng de nà yì gé'),
    rows: 3,
    cols: 3,
    fixed: [{ row: 1, col: 1, emoji: '🐶' }],
    mover: '🐱',
    target: { row: 0, col: 1 },
    explanation: '小猫在小狗的上面。',
  }),
  p2: () => ({
    kind: 'grid-place',
    prompt: p('把小猫放到小狗的右边。', 'bǎ xiǎo māo fàng dào xiǎo gǒu de yòu biān'),
    wrongHint: p('举起拿筷子的手，那边是右边。', 'jǔ qǐ ná kuài zi de shǒu nà biān shì yòu biān'),
    rows: 3,
    cols: 3,
    fixed: [{ row: 1, col: 1, emoji: '🐶' }],
    mover: '🐱',
    target: { row: 1, col: 2 },
    explanation: '小猫在小狗的右边。',
  }),
  p3: () => ({
    kind: 'grid-place',
    prompt: p('把小兔放到大树的下面。', 'bǎ xiǎo tù fàng dào dà shù de xià miàn'),
    wrongHint: p('下面是大树脚下的那一格。', 'xià miàn shì dà shù jiǎo xià de nà yì gé'),
    rows: 3,
    cols: 3,
    fixed: [
      { row: 1, col: 1, emoji: '🌳' },
      { row: 0, col: 0, emoji: '☁️' },
    ],
    mover: '🐰',
    target: { row: 2, col: 1 },
    explanation: '小兔在大树的下面。',
  }),
  p4: () => ({
    kind: 'grid-place',
    prompt: p('把小鸟放到小熊的左边。', 'bǎ xiǎo niǎo fàng dào xiǎo xióng de zuǒ biān'),
    wrongHint: p('左边和拿筷子的手方向相反。', 'zuǒ biān hé ná kuài zi de shǒu fāng xiàng xiāng fǎn'),
    rows: 3,
    cols: 3,
    fixed: [
      { row: 1, col: 1, emoji: '🐻' },
      { row: 2, col: 2, emoji: '🌷' },
    ],
    mover: '🐦',
    target: { row: 1, col: 0 },
    explanation: '小鸟在小熊的左边。',
  }),
  p5: () => ({
    kind: 'grid-tap',
    prompt: p('大树左边的房子是小兔的家，点一点。', 'dà shù zuǒ biān de fáng zi shì xiǎo tù de jiā diǎn yi diǎn'),
    wrongHint: p('先找到大树，再看它的左边。', 'xiān zhǎo dào dà shù zài kàn tā de zuǒ biān'),
    rows: 3,
    cols: 3,
    cells: [
      { row: 1, col: 1, emoji: '🌳' },
      { row: 1, col: 0, emoji: '🏠' },
      { row: 1, col: 2, emoji: '🏠' },
      { row: 0, col: 1, emoji: '🏠' },
      { row: 2, col: 1, emoji: '🏠' },
      { row: 0, col: 0, emoji: '🌼' },
      { row: 2, col: 2, emoji: '🌼' },
    ],
    target: { row: 1, col: 0 },
    explanation: '大树的左边是小兔的家。',
  }),
  p6: () => ({
    kind: 'grid-tap',
    prompt: p('大树下面的房子是小猪的家，点一点。', 'dà shù xià miàn de fáng zi shì xiǎo zhū de jiā diǎn yi diǎn'),
    wrongHint: p('先找到大树，再往下看。', 'xiān zhǎo dào dà shù zài wǎng xià kàn'),
    rows: 3,
    cols: 3,
    cells: [
      { row: 1, col: 1, emoji: '🌳' },
      { row: 1, col: 0, emoji: '🏠' },
      { row: 1, col: 2, emoji: '🏠' },
      { row: 0, col: 1, emoji: '🏠' },
      { row: 2, col: 1, emoji: '🏠' },
      { row: 0, col: 2, emoji: '🌼' },
      { row: 2, col: 0, emoji: '🌼' },
    ],
    target: { row: 2, col: 1 },
    explanation: '大树的下面是小猪的家。',
  }),
  p7: () => ({
    kind: 'grid-tap',
    prompt: p(
      '从学校向右走一格是公园，点一点公园。',
      'cóng xué xiào xiàng yòu zǒu yì gé shì gōng yuán diǎn yi diǎn gōng yuán',
    ),
    wrongHint: p('从学校出发，往右边走一格。', 'cóng xué xiào chū fā wǎng yòu biān zǒu yì gé'),
    rows: 3,
    cols: 4,
    cells: [
      { row: 1, col: 1, emoji: '🏫' },
      { row: 0, col: 3, emoji: '🏠' },
      { row: 2, col: 0, emoji: '🏪' },
    ],
    target: { row: 1, col: 2 },
    explanation: '学校的右边一格是公园。',
  }),
  p8: () => ({
    kind: 'choice',
    prompt: p('小猫在小狗的哪一边？', 'xiǎo māo zài xiǎo gǒu de nǎ yì biān'),
    wrongHint: TRY_AGAIN,
    stem: { text: '🐶  🐱' },
    options: [
      { id: 'left', text: zh('左边', 'zuǒ biān') },
      { id: 'right', text: zh('右边', 'yòu biān') },
    ],
    answerId: 'right',
    explanation: '小猫在小狗的右边。',
  }),
  p9: () => ({
    kind: 'choice',
    prompt: p('小鸟在乌龟的上面还是下面？', 'xiǎo niǎo zài wū guī de shàng miàn hái shì xià miàn'),
    wrongHint: TRY_AGAIN,
    stem: { text: '🐦\n🐢' },
    options: [
      { id: 'up', text: zh('上面', 'shàng miàn') },
      { id: 'down', text: zh('下面', 'xià miàn') },
    ],
    answerId: 'up',
    explanation: '小鸟在乌龟的上面。',
  }),
};

/* ───────────────────────── 平面图形 ───────────────────────── */

const SHAPE_OPTS = [
  { id: 'rect', text: zh('长方形', 'cháng fāng xíng') },
  { id: 'square', text: zh('正方形', 'zhèng fāng xíng') },
  { id: 'triangle', text: zh('三角形', 'sān jiǎo xíng') },
  { id: 'circle', text: zh('圆', 'yuán') },
];

const SHAPES2D: Record<string, () => ExerciseBody> = {
  s1: () => ({
    kind: 'shape-pick',
    prompt: p('点出所有的三角形。', 'diǎn chū suǒ yǒu de sān jiǎo xíng'),
    wrongHint: p('三角形有三条边、三个角。', 'sān jiǎo xíng yǒu sān tiáo biān sān gè jiǎo'),
    figures: [
      { id: 'a', visual: shape('triangle', RED) },
      { id: 'b', visual: shape('square', BLUE) },
      { id: 'c', visual: shape('rtri', GREEN) },
      { id: 'd', visual: shape('circle', YELLOW) },
      { id: 'e', visual: shape('triangle', PURPLE, 180) },
      { id: 'f', visual: shape('rect', ORANGE) },
    ],
    answerIds: ['a', 'c', 'e'],
    explanation: '倒过来、斜着放的三角形也是三角形。',
  }),
  s2: () => ({
    kind: 'shape-pick',
    prompt: p('点出所有的圆。', 'diǎn chū suǒ yǒu de yuán'),
    wrongHint: p('圆是圆圆的，没有角。', 'yuán shì yuán yuán de méi yǒu jiǎo'),
    figures: [
      { id: 'a', visual: shape('square', YELLOW) },
      { id: 'b', visual: shape('circle', RED) },
      { id: 'c', visual: shape('triangle', BLUE) },
      { id: 'd', visual: shape('circle', GREEN) },
      { id: 'e', visual: shape('rect', PURPLE, 90) },
    ],
    answerIds: ['b', 'd'],
    explanation: '圆没有角，也没有直直的边。',
  }),
  s3: () => ({
    kind: 'shape-pick',
    prompt: p('点出所有的长方形。', 'diǎn chū suǒ yǒu de cháng fāng xíng'),
    wrongHint: p('长方形有两条长边、两条短边。', 'cháng fāng xíng yǒu liǎng tiáo cháng biān liǎng tiáo duǎn biān'),
    figures: [
      { id: 'a', visual: shape('rect', BLUE) },
      { id: 'b', visual: shape('square', RED) },
      { id: 'c', visual: shape('rect', GREEN, 90) },
      { id: 'd', visual: shape('triangle', YELLOW) },
      { id: 'e', visual: shape('circle', ORANGE) },
    ],
    answerIds: ['a', 'c'],
    explanation: '竖着放的长方形还是长方形。正方形四条边一样长。',
  }),
  s4: () => ({
    kind: 'bins',
    prompt: p('把图形送回家。', 'bǎ tú xíng sòng huí jiā'),
    wrongHint: p('看看它有几条边，再送回家。', 'kàn kan tā yǒu jǐ tiáo biān zài sòng huí jiā'),
    bins: [
      { id: 'triangle', label: zh('三角形', 'sān jiǎo xíng'), visual: shape('triangle', '#EEE') },
      { id: 'circle', label: zh('圆', 'yuán'), visual: shape('circle', '#EEE') },
      { id: 'rect', label: zh('长方形', 'cháng fāng xíng'), visual: shape('rect', '#EEE') },
    ],
    items: [
      { id: 'i1', visual: shape('circle', RED), bin: 'circle' },
      { id: 'i2', visual: shape('triangle', BLUE), bin: 'triangle' },
      { id: 'i3', visual: shape('rect', GREEN), bin: 'rect' },
      { id: 'i4', visual: shape('rtri', YELLOW), bin: 'triangle' },
      { id: 'i5', visual: shape('circle', PURPLE), bin: 'circle' },
      { id: 'i6', visual: shape('rect', ORANGE, 90), bin: 'rect' },
    ],
    explanation: '按形状分，和颜色、大小、方向都没有关系。',
  }),
  s5: () => ({
    kind: 'bins',
    prompt: p('正方形和长方形，分一分。', 'zhèng fāng xíng hé cháng fāng xíng fēn yi fēn'),
    wrongHint: p('四条边一样长的是正方形。', 'sì tiáo biān yí yàng cháng de shì zhèng fāng xíng'),
    bins: [
      { id: 'square', label: zh('正方形', 'zhèng fāng xíng'), visual: shape('square', '#EEE') },
      { id: 'rect', label: zh('长方形', 'cháng fāng xíng'), visual: shape('rect', '#EEE') },
    ],
    items: [
      { id: 'i1', visual: shape('square', BLUE), bin: 'square' },
      { id: 'i2', visual: shape('rect', RED), bin: 'rect' },
      { id: 'i3', visual: shape('rect', YELLOW, 90), bin: 'rect' },
      { id: 'i4', visual: shape('square', GREEN), bin: 'square' },
    ],
    explanation: '正方形四条边一样长；长方形对边一样长。',
  }),
  s6: () => ({
    kind: 'rotate',
    prompt: p('点一点图形转一转，转到和影子一样。', 'diǎn yi diǎn tú xíng zhuàn yi zhuàn zhuàn dào hé yǐng zi yí yàng'),
    wrongHint: p('和影子还不一样，再转一转。', 'hé yǐng zi hái bù yí yàng zài zhuàn yi zhuàn'),
    shape: 'rtri',
    color: ORANGE,
    start: 0,
    target: 180,
  }),
  s7: () => ({
    kind: 'rotate',
    prompt: p(
      '点一点小房子转一转，转到和影子一样。',
      'diǎn yi diǎn xiǎo fáng zi zhuàn yi zhuàn zhuàn dào hé yǐng zi yí yàng',
    ),
    wrongHint: p('房顶要朝上，再转一转。', 'fáng dǐng yào cháo shàng zài zhuàn yi zhuàn'),
    shape: 'house',
    color: '#F4A6C0',
    start: 90,
    target: 0,
  }),
  s8: () => ({
    kind: 'choice',
    prompt: p('这是什么图形？', 'zhè shì shén me tú xíng'),
    wrongHint: p('数一数有几条边，比一比边的长短。', 'shǔ yi shǔ yǒu jǐ tiáo biān bǐ yi bǐ biān de cháng duǎn'),
    stem: { visual: shape('rect', GREEN) },
    options: SHAPE_OPTS,
    answerId: 'rect',
    explanation: '两条长边、两条短边，是长方形。',
  }),
  s9: () => ({
    kind: 'choice',
    prompt: p(
      '两个一样的三角形，可以拼成哪个图形？',
      'liǎng gè yí yàng de sān jiǎo xíng kě yǐ pīn chéng nǎ ge tú xíng',
    ),
    wrongHint: p(
      '把一个三角形转过来，和另一个拼在一起。',
      'bǎ yí gè sān jiǎo xíng zhuàn guò lái hé lìng yí gè pīn zài yì qǐ',
    ),
    stem: { visual: { ...shape('rtri', BLUE), count: 2 } },
    options: [
      { id: 'square', visual: shape('square', BLUE) },
      { id: 'circle', visual: shape('circle', BLUE) },
      { id: 'house', visual: shape('house', BLUE) },
    ],
    answerId: 'square',
    explanation: '两个一样的直角三角形可以拼成一个正方形。',
  }),
  s10: () => ({
    kind: 'choice',
    prompt: p('小房子是用哪两个图形拼成的？', 'xiǎo fáng zi shì yòng nǎ liǎng gè tú xíng pīn chéng de'),
    wrongHint: p('看看房顶和墙各是什么图形。', 'kàn kan fáng dǐng hé qiáng gè shì shén me tú xíng'),
    stem: { visual: shape('house', '#F4A6C0') },
    options: [
      { id: 'st', text: zh('正方形和三角形', 'zhèng fāng xíng hé sān jiǎo xíng') },
      { id: 'ct', text: zh('圆和三角形', 'yuán hé sān jiǎo xíng') },
      { id: 'cr', text: zh('圆和长方形', 'yuán hé cháng fāng xíng') },
    ],
    answerId: 'st',
    explanation: '房顶是三角形，墙是正方形。',
  }),
};

/* ───────────────────────── 立体图形 ───────────────────────── */

const SOLID_OPTS = [
  { id: 'ball', text: zh('球', 'qiú') },
  { id: 'cyl', text: zh('圆柱', 'yuán zhù') },
  { id: 'cuboid', text: zh('长方体', 'cháng fāng tǐ') },
  { id: 'cube', text: zh('正方体', 'zhèng fāng tǐ') },
];

const SHAPES3D: Record<string, () => ExerciseBody> = {
  d1: () => ({
    kind: 'bins',
    prompt: p('球和正方体，分一分。', 'qiú hé zhèng fāng tǐ fēn yi fēn'),
    wrongHint: p('球圆圆的，能往各个方向滚。', 'qiú yuán yuán de néng wǎng gè gè fāng xiàng gǔn'),
    bins: [
      { id: 'ball', label: zh('球', 'qiú'), visual: em('⚪') },
      { id: 'cube', label: zh('正方体', 'zhèng fāng tǐ'), visual: em('🎲') },
    ],
    items: [
      { id: 'i1', visual: em('⚽'), bin: 'ball' },
      { id: 'i2', visual: em('🎲'), bin: 'cube' },
      { id: 'i3', visual: em('🏀'), bin: 'ball' },
      { id: 'i4', visual: em('🧊'), bin: 'cube' },
    ],
    explanation: '球能滚来滚去；正方体六个面一样大。',
  }),
  d2: () => ({
    kind: 'bins',
    prompt: p('圆柱和长方体，分一分。', 'yuán zhù hé cháng fāng tǐ fēn yi fēn'),
    wrongHint: p('圆柱上下是两个圆。', 'yuán zhù shàng xià shì liǎng gè yuán'),
    bins: [
      { id: 'cyl', label: zh('圆柱', 'yuán zhù'), visual: em('🥫') },
      { id: 'cuboid', label: zh('长方体', 'cháng fāng tǐ'), visual: em('📦') },
    ],
    items: [
      { id: 'i1', visual: em('🥫'), bin: 'cyl' },
      { id: 'i2', visual: em('📦'), bin: 'cuboid' },
      { id: 'i3', visual: em('🧃'), bin: 'cuboid' },
      { id: 'i4', visual: em('🕯️'), bin: 'cyl' },
    ],
    explanation: '罐子、蜡烛是圆柱；盒子是长方体。',
  }),
  d3: () => ({
    kind: 'choice',
    prompt: p('哪个是球？', 'nǎ ge shì qiú'),
    wrongHint: p('球圆圆的，哪个方向都能滚。', 'qiú yuán yuán de nǎ ge fāng xiàng dōu néng gǔn'),
    options: [
      { id: 'box', visual: em('📦') },
      { id: 'ball', visual: em('⚽') },
      { id: 'can', visual: em('🥫') },
      { id: 'dice', visual: em('🎲') },
    ],
    answerId: 'ball',
  }),
  d4: () => ({
    kind: 'choice',
    prompt: p('这个是什么形状？', 'zhè ge shì shén me xíng zhuàng'),
    wrongHint: p('看看上面和下面是什么图形。', 'kàn kan shàng miàn hé xià miàn shì shén me tú xíng'),
    stem: { visual: em('🥫') },
    options: SOLID_OPTS,
    answerId: 'cyl',
    explanation: '上下两个面是一样大的圆，是圆柱。',
  }),
  d5: () => ({
    kind: 'choice',
    prompt: p('这个是什么形状？', 'zhè ge shì shén me xíng zhuàng'),
    wrongHint: p('数一数，每个面都一样大吗？', 'shǔ yi shǔ měi gè miàn dōu yí yàng dà ma'),
    stem: { visual: em('🎲') },
    options: SOLID_OPTS,
    answerId: 'cube',
    explanation: '六个面都是一样大的正方形，是正方体。',
  }),
};

/* ───────────────────────── 认识整时 ───────────────────────── */

const hourText = (h: number) => zh(`${h}时`, 'shí');
const SCENES = [
  { hour: 7, emoji: '🌅', text: '早上七时起床', py: 'zǎo shang qī shí qǐ chuáng' },
  { hour: 8, emoji: '🎒', text: '八时上学', py: 'bā shí shàng xué' },
  { hour: 12, emoji: '🍚', text: '中午十二时吃午饭', py: 'zhōng wǔ shí èr shí chī wǔ fàn' },
  { hour: 9, emoji: '🛏️', text: '晚上九时睡觉', py: 'wǎn shang jiǔ shí shuì jiào' },
];
const wrap12 = (h: number) => ((((h - 1) % 12) + 12) % 12) + 1;

function clockGen(sig: string): ExerciseBody {
  const [type, a] = sig.split(':');
  const n = Number(a);
  if (type === 'set') {
    return {
      kind: 'clock-set',
      prompt: { text: zh(`把钟拨到${n}时。`, 'bǎ zhōng bō dào shí'), speak: say(`把钟拨到${n}时。`) },
      wrongHint: TRY_AGAIN,
      targetHour: n,
      // 起点：离目标几小时、分针在 6（半点），孩子要同时调整两根针
      startMinutes: (wrap12(n + 3) % 12) * 60 + 30,
      explanation: `${n}时整：分针指着12，时针指着${n}。`,
    };
  }
  if (type === 'read') {
    const opts = new Set([n, wrap12(n + 1), wrap12(n - 1), n === 12 ? 6 : 12]);
    return {
      kind: 'choice',
      prompt: p('钟面上是几时？', 'zhōng miàn shàng shì jǐ shí'),
      wrongHint: p('看短短的时针指着几。', 'kàn duǎn duǎn de shí zhēn zhǐ zhe jǐ'),
      stem: { visual: clock(n) },
      options: [...opts].sort((x, y) => x - y).map((h) => ({ id: String(h), text: hourText(h) })),
      answerId: String(n),
      explanation: `分针指着12，时针指着${n}，就是${n}时。`,
    };
  }
  const s = SCENES[n] ?? SCENES[0];
  if (type === 'sset') {
    return {
      kind: 'clock-set',
      prompt: {
        text: zh(`${s.text}，把钟拨到${s.hour}时。`, `${s.py} bǎ zhōng bō dào shí`),
        speak: say(`${s.text}，把钟拨到${s.hour}时。`),
      },
      wrongHint: TRY_AGAIN,
      scene: em(s.emoji),
      targetHour: s.hour,
      startMinutes: (wrap12(s.hour + 5) % 12) * 60,
      explanation: `${s.hour}时整：分针指着12，时针指着${s.hour}。`,
    };
  }
  // scene：在几个钟面中选出正确的；含“时针分针看反了”的干扰钟面
  return {
    kind: 'choice',
    prompt: {
      text: zh(`${s.text}，哪个钟面是${s.hour}时？`, `${s.py} nǎ ge zhōng miàn shì shí`),
      speak: say(`${s.text}，哪个钟面是${s.hour}时？`),
    },
    wrongHint: p('长长的分针要指着十二。', 'cháng cháng de fēn zhēn yào zhǐ zhe shí èr'),
    stem: { visual: em(s.emoji) },
    options: [
      { id: 'right', visual: clock(s.hour) },
      { id: 'swap', visual: clock(12, (s.hour % 12) * 5) },
      { id: 'next', visual: clock(wrap12(s.hour + 1)) },
    ],
    answerId: 'right',
    explanation: `${s.hour}时：分针指着12，时针指着${s.hour}。`,
  };
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const CLOCK_SIGS = [
  ...HOURS.map((h) => `set:${h}`),
  ...HOURS.map((h) => `read:${h}`),
  ...SCENES.map((_, i) => `scene:${i}`),
  ...SCENES.map((_, i) => `sset:${i}`),
];

/* ───────────────────────── 分类与整理 ───────────────────────── */

const CLASSIFY: Record<string, () => ExerciseBody> = {
  k1: () => ({
    kind: 'bins',
    prompt: p('按颜色分一分。', 'àn yán sè fēn yi fēn'),
    wrongHint: p('只看颜色，不看形状。', 'zhǐ kàn yán sè bú kàn xíng zhuàng'),
    bins: [
      { id: 'red', label: zh('红色', 'hóng sè'), visual: shape('square', RED) },
      { id: 'blue', label: zh('蓝色', 'lán sè'), visual: shape('square', BLUE) },
    ],
    items: [
      { id: 'i1', visual: shape('circle', RED), bin: 'red' },
      { id: 'i2', visual: shape('triangle', BLUE), bin: 'blue' },
      { id: 'i3', visual: shape('square', BLUE), bin: 'blue' },
      { id: 'i4', visual: shape('triangle', RED), bin: 'red' },
      { id: 'i5', visual: shape('circle', BLUE), bin: 'blue' },
    ],
    explanation: '按颜色分：红色一类，蓝色一类。',
  }),
  k2: () => ({
    kind: 'bins',
    prompt: p('按形状分一分。', 'àn xíng zhuàng fēn yi fēn'),
    wrongHint: p('只看形状，不看颜色。', 'zhǐ kàn xíng zhuàng bú kàn yán sè'),
    bins: [
      { id: 'circle', label: zh('圆', 'yuán'), visual: shape('circle', '#EEE') },
      { id: 'triangle', label: zh('三角形', 'sān jiǎo xíng'), visual: shape('triangle', '#EEE') },
    ],
    items: [
      { id: 'i1', visual: shape('circle', RED), bin: 'circle' },
      { id: 'i2', visual: shape('triangle', BLUE), bin: 'triangle' },
      { id: 'i3', visual: shape('circle', BLUE), bin: 'circle' },
      { id: 'i4', visual: shape('triangle', RED), bin: 'triangle' },
      { id: 'i5', visual: shape('circle', YELLOW), bin: 'circle' },
    ],
    explanation: '同样的图形，换一个分法，结果就不一样。',
  }),
  k3: () => ({
    kind: 'bins',
    prompt: p('按用途分一分：吃的和学习用的。', 'àn yòng tú fēn yi fēn chī de hé xué xí yòng de'),
    wrongHint: p('想一想，它是拿来吃的，还是学习用的？', 'xiǎng yi xiǎng tā shì ná lái chī de hái shì xué xí yòng de'),
    bins: [
      { id: 'food', label: zh('吃的', 'chī de'), visual: em('🍽️') },
      { id: 'study', label: zh('学习用的', 'xué xí yòng de'), visual: em('🎒') },
    ],
    items: [
      { id: 'i1', visual: em('🍎'), bin: 'food' },
      { id: 'i2', visual: em('✏️'), bin: 'study' },
      { id: 'i3', visual: em('🍞'), bin: 'food' },
      { id: 'i4', visual: em('📏'), bin: 'study' },
      { id: 'i5', visual: em('📕'), bin: 'study' },
    ],
    explanation: '苹果、面包是吃的；铅笔、尺子、书是学习用的。',
  }),
  k4: () => ({
    kind: 'bins',
    prompt: p('按用途分一分：穿的和玩的。', 'àn yòng tú fēn yi fēn chuān de hé wán de'),
    wrongHint: p(
      '想一想，它是穿在身上的，还是拿来玩的？',
      'xiǎng yi xiǎng tā shì chuān zài shēn shang de hái shì ná lái wán de',
    ),
    bins: [
      { id: 'wear', label: zh('穿的', 'chuān de'), visual: em('👕') },
      { id: 'play', label: zh('玩的', 'wán de'), visual: em('🧸') },
    ],
    items: [
      { id: 'i1', visual: em('👟'), bin: 'wear' },
      { id: 'i2', visual: em('🪁'), bin: 'play' },
      { id: 'i3', visual: em('🧢'), bin: 'wear' },
      { id: 'i4', visual: em('⚽'), bin: 'play' },
    ],
    explanation: '鞋子、帽子是穿戴的；风筝、足球是玩的。',
  }),
  k5: () => ({
    kind: 'truefalse',
    prompt: p('看看这样分对不对。', 'kàn kan zhè yàng fēn duì bu duì'),
    wrongHint: p('看看每一堆里是不是同一类。', 'kàn kan měi yì duī lǐ shì bu shì tóng yí lèi'),
    statement: {
      visual: em('🍎🍌🍇  ｜  🚗🚌'),
      text: zh('水果放一堆，车放一堆。', 'shuǐ guǒ fàng yì duī chē fàng yì duī'),
      speak: say('水果放一堆，车放一堆。'),
    },
    answer: true,
    explanation: '每一堆都是同一类，分对了。',
  }),
  k6: () => ({
    kind: 'truefalse',
    prompt: p('看看这样分对不对。', 'kàn kan zhè yàng fēn duì bu duì'),
    wrongHint: p('左边一堆里有车吗？', 'zuǒ biān yì duī lǐ yǒu chē ma'),
    statement: {
      visual: em('🍎🚗🍌  ｜  🍇🚌'),
      text: zh('水果放一堆，车放一堆。', 'shuǐ guǒ fàng yì duī chē fàng yì duī'),
      speak: say('水果放一堆，车放一堆。'),
    },
    answer: false,
    explanation: '小汽车跑到水果里了，葡萄跑到车里了，没分对。',
  }),
  k7: () => ({
    kind: 'choice',
    prompt: p('哪一个和别的不是一类？', 'nǎ yí gè hé bié de bú shì yí lèi'),
    wrongHint: p('三个是水果，一个不是。', 'sān gè shì shuǐ guǒ yí gè bú shì'),
    options: [
      { id: 'apple', visual: em('🍎') },
      { id: 'banana', visual: em('🍌') },
      { id: 'car', visual: em('🚗') },
      { id: 'grape', visual: em('🍇') },
    ],
    answerId: 'car',
    explanation: '苹果、香蕉、葡萄是水果，小汽车不是。',
  }),
  k8: () => ({
    kind: 'choice',
    prompt: p('按颜色分，哪一个不是红色的？', 'àn yán sè fēn nǎ yí gè bú shì hóng sè de'),
    wrongHint: p('只看颜色，不看形状。', 'zhǐ kàn yán sè bú kàn xíng zhuàng'),
    options: [
      { id: 'a', visual: shape('circle', RED) },
      { id: 'b', visual: shape('square', RED) },
      { id: 'c', visual: shape('triangle', BLUE) },
      { id: 'd', visual: shape('triangle', RED) },
    ],
    answerId: 'c',
  }),
};

/* ───────────────────────── 找规律 ───────────────────────── */

const tk = (id: string, emoji: string): PatternToken => ({ id, visual: em(emoji) });
const sk = (id: string, s: ShapeKind, color: string): PatternToken => ({ id, visual: shape(s, color) });
const nk = (n: number): PatternToken => ({ id: String(n), text: String(n) });
const FILL = p('找规律，把空格填上。', 'zhǎo guī lǜ bǎ kòng gé tián shàng');
const NUM_FILL = p('找规律，填上合适的数。', 'zhǎo guī lǜ tián shàng hé shì de shù');
const PATTERN_HINT = p('看看前面是怎样重复的。', 'kàn kan qián miàn shì zěn yàng chóng fù de');

function numPattern(start: number, step: number, len: number, blank: number, extra: number[]): ExerciseBody {
  const seq = Array.from({ length: len }, (_, i) => start + step * i);
  const ans = seq[blank];
  const palette = [...new Set([ans, ...extra])].sort((a, b) => a - b).map(nk);
  return {
    kind: 'pattern-fill',
    prompt: NUM_FILL,
    wrongHint: p('比一比前后两个数，每次多几或少几。', 'bǐ yi bǐ qián hòu liǎng gè shù měi cì duō jǐ huò shǎo jǐ'),
    sequence: seq.map((n, i) => (i === blank ? null : nk(n))),
    palette,
    answers: [String(ans)],
    explanation: step > 0 ? `每次多${step}。` : `每次少${-step}。`,
  };
}

const PATTERN: Record<string, () => ExerciseBody> = {
  // 第 1 级：AB
  t1: () => {
    const r = tk('r', '🔴');
    const b = tk('b', '🔵');
    return {
      kind: 'pattern-fill',
      prompt: FILL,
      wrongHint: PATTERN_HINT,
      sequence: [r, b, r, b, r, null],
      palette: [r, b, tk('y', '🟡')],
      answers: ['b'],
      explanation: '红、蓝、红、蓝……两个一组重复。',
    };
  },
  t2: () => {
    const t = sk('tri', 'triangle', ORANGE);
    const c = sk('cir', 'circle', GREEN);
    return {
      kind: 'pattern-fill',
      prompt: FILL,
      wrongHint: PATTERN_HINT,
      sequence: [t, c, t, null, t, c],
      palette: [t, c, sk('sq', 'square', BLUE)],
      answers: ['cir'],
      explanation: '三角形、圆，两个一组重复。',
    };
  },
  // 第 2 级：AAB / ABB
  t3: () => {
    const c = tk('cat', '🐱');
    const d = tk('dog', '🐶');
    return {
      kind: 'pattern-fill',
      prompt: FILL,
      wrongHint: PATTERN_HINT,
      sequence: [c, c, d, c, c, null],
      palette: [c, d],
      answers: ['dog'],
      explanation: '两只小猫、一只小狗，三个一组重复。',
    };
  },
  t4: () => {
    const s = tk('star', '⭐');
    const m = tk('moon', '🌙');
    return {
      kind: 'pattern-fill',
      prompt: FILL,
      wrongHint: PATTERN_HINT,
      sequence: [s, m, m, s, m, null, null],
      palette: [s, m],
      answers: ['moon', 'star'],
      explanation: '一颗星星、两个月亮，三个一组重复。',
    };
  },
  // 第 3 级：ABC，两个空
  t5: () => {
    const a = tk('apple', '🍎');
    const b = tk('banana', '🍌');
    const c = tk('grape', '🍇');
    return {
      kind: 'pattern-fill',
      prompt: FILL,
      wrongHint: PATTERN_HINT,
      sequence: [a, b, c, a, b, null, null],
      palette: [a, b, c],
      answers: ['grape', 'apple'],
      explanation: '苹果、香蕉、葡萄，三个一组重复。',
    };
  },
  // 数字规律（一年级：按 1、2、5 递增，或每次少 1）
  t6: () => numPattern(3, 1, 5, 3, [5, 7, 8]),
  t7: () => numPattern(2, 2, 5, 3, [7, 9, 10]),
  t8: () => numPattern(5, 5, 5, 3, [16, 25, 30]),
  t9: () => numPattern(10, -1, 5, 3, [6, 8, 5]),
};

/* ───────────────────────── 汇总 ───────────────────────── */

function fromTable(table: Record<string, () => ExerciseBody>): FullGen {
  return {
    sigs: Object.keys(table),
    build: (sig) => {
      const f = table[sig];
      if (!f) throw new Error(`没有这道题：${sig}`);
      return f();
    },
  };
}

export const GRAPHICS_GENERATORS: Record<string, FullGen> = {
  'm1.position': fromTable(POSITION),
  'm1.shapes2d': fromTable(SHAPES2D),
  'm1.shapes3d': fromTable(SHAPES3D),
  'm1.clock': {
    sigs: CLOCK_SIGS,
    build: (sig) => {
      if (!CLOCK_SIGS.includes(sig)) throw new Error(`没有这道题：${sig}`);
      return clockGen(sig);
    },
  },
  'm1.classify': fromTable(CLASSIFY),
  'm1.pattern': fromTable(PATTERN),
};

/** 随机取一个签名（复习/练习时用） */
export function pickSig(g: FullGen, rand: Rand): string {
  return g.sigs[Math.floor(rand() * g.sigs.length)];
}
