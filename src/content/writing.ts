/**
 * 描红写字（V2.9，本项目原创）：一年级上册常见的笔画简单的字。
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

/** 4 个字一组，共 4 组 */
export const WRITE_SETS = [0, 1, 2, 3].map((i) => WRITE_CHARS.slice(i * 4, i * 4 + 4));

export function traceExercise(char: string): TraceExercise {
  const c = WRITE_CHARS.find((x) => x.char === char);
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
