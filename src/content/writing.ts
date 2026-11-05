/**
 * 描红写字（V2.9，本项目原创）：一年级上册常见的笔画简单的字；V2.14 增加二年级 16 个字。
 * 笔画按《通用规范汉字笔顺规范》的笔顺规则排列；坐标是本项目画的简化折线（0～100 田字格），只用来检查笔顺和方向。
 * 待教师审核。
 */
import type { TraceExercise } from '@/lesson/types';
import { zh } from './zh';

type S = [string, [number, number][]];
const H = (y: number, x1 = 15, x2 = 85): S => [
  '横',
  [
    [x1, y],
    [x2, y],
  ],
];
const V = (x: number, y1 = 15, y2 = 85): S => [
  '竖',
  [
    [x, y1],
    [x, y2],
  ],
];

export const WRITE_CHARS: { char: string; py: string; strokes: S[] }[] = [
  { char: '一', py: 'yī', strokes: [H(50)] },
  { char: '二', py: 'èr', strokes: [H(35, 25, 75), H(68)] },
  { char: '三', py: 'sān', strokes: [H(25, 25, 75), H(50, 30, 70), H(78)] },
  { char: '十', py: 'shí', strokes: [H(50), V(50, 12, 88)] },
  { char: '土', py: 'tǔ', strokes: [H(40, 25, 75), V(50, 15, 82), H(82)] },
  { char: '王', py: 'wáng', strokes: [H(22, 20, 80), H(50, 25, 75), V(50, 22, 80), H(80)] },
  { char: '上', py: 'shàng', strokes: [V(45, 15, 82), H(48, 45, 75), H(82)] },
  {
    char: '下',
    py: 'xià',
    strokes: [
      H(22),
      V(48, 22, 88),
      [
        '点',
        [
          [54, 42],
          [68, 56],
        ],
      ],
    ],
  },
  {
    char: '口',
    py: 'kǒu',
    strokes: [
      V(25, 25, 78),
      [
        '横折',
        [
          [25, 25],
          [75, 25],
          [75, 78],
        ],
      ],
      H(78, 25, 75),
    ],
  },
  {
    char: '日',
    py: 'rì',
    strokes: [
      V(28),
      [
        '横折',
        [
          [28, 15],
          [72, 15],
          [72, 85],
        ],
      ],
      H(50, 28, 72),
      H(85, 28, 72),
    ],
  },
  {
    char: '田',
    py: 'tián',
    strokes: [
      V(20, 20, 82),
      [
        '横折',
        [
          [20, 20],
          [80, 20],
          [80, 82],
        ],
      ],
      H(51, 20, 80),
      V(50, 20, 82),
      H(82, 20, 80),
    ],
  },
  {
    char: '中',
    py: 'zhōng',
    strokes: [
      V(25, 30, 68),
      [
        '横折',
        [
          [25, 30],
          [75, 30],
          [75, 68],
        ],
      ],
      H(68, 25, 75),
      V(50, 10, 92),
    ],
  },
  {
    char: '人',
    py: 'rén',
    strokes: [
      [
        '撇',
        [
          [52, 15],
          [45, 45],
          [20, 85],
        ],
      ],
      [
        '捺',
        [
          [50, 42],
          [65, 65],
          [85, 85],
        ],
      ],
    ],
  },
  {
    char: '大',
    py: 'dà',
    strokes: [
      H(40),
      [
        '撇',
        [
          [52, 12],
          [48, 45],
          [18, 88],
        ],
      ],
      [
        '捺',
        [
          [52, 48],
          [68, 68],
          [86, 88],
        ],
      ],
    ],
  },
  {
    char: '木',
    py: 'mù',
    strokes: [
      H(35),
      V(50, 12, 90),
      [
        '撇',
        [
          [48, 38],
          [18, 75],
        ],
      ],
      [
        '点',
        [
          [52, 38],
          [82, 75],
        ],
      ],
    ],
  },
  {
    char: '山',
    py: 'shān',
    strokes: [
      V(50, 15, 82),
      [
        '竖折',
        [
          [20, 38],
          [20, 82],
          [80, 82],
        ],
      ],
      V(80, 38, 82),
    ],
  },
];

/* ───── 二年级（V2.14）：笔画稍多的常用字，选字未逐一核对教材写字表 ───── */
const L = (name: string, ...pts: [number, number][]): S => [name, pts];
export const WRITE_CHARS_G2: { char: string; py: string; strokes: S[] }[] = [
  { char: '工', py: 'gōng', strokes: [H(22, 25, 75), V(50, 22, 80), H(80)] },
  { char: '士', py: 'shì', strokes: [H(40), V(50, 15, 80), H(80, 30, 70)] },
  { char: '千', py: 'qiān', strokes: [L('撇', [68, 12], [35, 28]), H(50), V(50, 28, 90)] },
  { char: '午', py: 'wǔ', strokes: [L('撇', [40, 12], [25, 40]), H(35, 30, 75), H(62), V(50, 35, 92)] },
  { char: '正', py: 'zhèng', strokes: [H(15, 25, 75), V(50, 15, 85), H(50, 50, 72), V(30, 45, 85), H(85, 12, 88)] },
  {
    char: '古',
    py: 'gǔ',
    strokes: [H(30), V(50, 12, 52), V(30, 52, 88), L('横折', [30, 52], [70, 52], [70, 88]), H(88, 30, 70)],
  },
  {
    char: '门',
    py: 'mén',
    strokes: [L('点', [25, 8], [33, 20]), V(25, 25, 90), L('横折钩', [25, 22], [78, 22], [78, 88], [68, 80])],
  },
  {
    char: '广',
    py: 'guǎng',
    strokes: [L('点', [50, 6], [56, 18]), H(25, 25, 85), L('撇', [30, 25], [28, 60], [12, 90])],
  },
  {
    char: '文',
    py: 'wén',
    strokes: [
      L('点', [50, 6], [56, 18]),
      H(30),
      L('撇', [70, 30], [50, 65], [18, 90]),
      L('捺', [30, 30], [55, 65], [85, 90]),
    ],
  },
  {
    char: '方',
    py: 'fāng',
    strokes: [
      L('点', [50, 6], [56, 18]),
      H(28),
      L('横折钩', [40, 48], [72, 48], [70, 85], [60, 80]),
      L('撇', [42, 28], [38, 65], [15, 90]),
    ],
  },
  {
    char: '万',
    py: 'wàn',
    strokes: [H(20), L('横折钩', [38, 45], [75, 45], [72, 85], [62, 80]), L('撇', [42, 20], [38, 60], [15, 90])],
  },
  {
    char: '力',
    py: 'lì',
    strokes: [L('横折钩', [25, 35], [75, 35], [72, 85], [62, 80]), L('撇', [50, 12], [45, 60], [18, 90])],
  },
  { char: '川', py: 'chuān', strokes: [L('撇', [25, 15], [25, 60], [12, 88]), V(50, 20, 75), V(78, 12, 90)] },
  {
    char: '斤',
    py: 'jīn',
    strokes: [L('撇', [70, 10], [30, 25]), L('撇', [30, 25], [28, 60], [15, 90]), H(50, 30, 85), V(62, 50, 92)],
  },
  {
    char: '片',
    py: 'piàn',
    strokes: [
      L('撇', [35, 12], [35, 55], [15, 90]),
      V(62, 10, 45),
      H(45, 35, 80),
      L('横折', [35, 65], [70, 65], [70, 92]),
    ],
  },
  {
    char: '用',
    py: 'yòng',
    strokes: [
      L('撇', [25, 15], [25, 60], [12, 90]),
      L('横折钩', [25, 15], [75, 15], [75, 85], [65, 80]),
      H(40, 25, 75),
      H(62, 25, 75),
      V(50, 15, 88),
    ],
  },
];

/** 4 个字一组：第 1～4 组一年级，第 5～8 组二年级 */
export const WRITE_SETS = [0, 1, 2, 3].map((i) => WRITE_CHARS.slice(i * 4, i * 4 + 4));
export const WRITE_SETS_G2 = [0, 1, 2, 3].map((i) => WRITE_CHARS_G2.slice(i * 4, i * 4 + 4));
export const ALL_WRITE_SETS = [...WRITE_SETS, ...WRITE_SETS_G2];
/** 第几组属于几年级 */
export const writeSetGrade = (set: number) => (set <= WRITE_SETS.length ? 1 : 2);

export function traceExercise(char: string): TraceExercise {
  const c = [...WRITE_CHARS, ...WRITE_CHARS_G2].find((x) => x.char === char);
  if (!c) throw new Error(`没有这个字的笔画：${char}`);
  return {
    kind: 'trace',
    id: `write-${c.char}`,
    skill: 'zh.write',
    prompt: {
      text: zh(`按笔顺描一描：${c.char}`, `àn bǐ shùn miáo yi miáo ${c.py}`),
      speak: { text: `按笔顺描一描，${c.char}`, lang: 'zh-CN' },
    },
    char: c.char,
    strokes: c.strokes.map(([name, points]) => ({ name, points })),
    wrongHint: {
      text: zh('从红点开始，顺着笔画写到小圆圈。', 'cóng hóng diǎn kāi shǐ shùn zhe bǐ huà xiě dào xiǎo yuán quān'),
      speak: { text: '从红点开始，顺着笔画写到小圆圈。', lang: 'zh-CN' },
    },
    explanation: `${c.char}（${c.py}）的笔顺：${c.strokes.map((s) => s[0]).join(' → ')}，共 ${c.strokes.length} 笔。`,
  };
}

export const writeLessonId = (set: number) => `write:${set}`;
export const isWriteLessonId = (id: string) => id.startsWith('write:');
