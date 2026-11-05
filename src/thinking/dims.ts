/**
 * 思维训练的几个方面（V2.5）。
 * 参考《义务教育数学课程标准（2022年版）》小学阶段核心素养中的推理意识、空间观念等提法，由本项目归纳为孩子能懂的说法。
 * 家长中心按这些方面统计孩子做思维题的真实记录——是做题情况统计，不是心理或智力测评。
 */
import { zh } from '@/content/zh';
import type { ZhText } from '@/lesson/types';

export type ThinkDim = 'observe' | 'classify' | 'reason' | 'spatial' | 'strategy';

export const THINK_DIMS: { id: ThinkDim; name: string; kid: ZhText; emoji: string; desc: string }[] = [
  {
    id: 'observe',
    name: '观察发现',
    kid: zh('观察', 'guān chá'),
    emoji: '🔍',
    desc: '找规律、数图形、看字的部件，看出藏着的变化',
  },
  {
    id: 'classify',
    name: '比较分类',
    kid: zh('分类', 'fēn lèi'),
    emoji: '🧺',
    desc: '比较几样东西或几个词，找出和其他不是一类的那一个',
  },
  {
    id: 'reason',
    name: '推理',
    kid: zh('推理', 'tuī lǐ'),
    emoji: '🧠',
    desc: '天平、排队、填格子、逻辑推理、排故事、读短文找线索，由已知一步步推出答案',
  },
  { id: 'spatial', name: '空间想象', kid: zh('空间', 'kōng jiān'), emoji: '🧊', desc: '在图形里看出大大小小的图形' },
  {
    id: 'strategy',
    name: '计算方法',
    kid: zh('方法', 'fāng fǎ'),
    emoji: '🔟',
    desc: '答对后自己选“是怎么想的”：数数、凑十、破十、直接记住等',
  },
];

export const DIM_NAME: Record<ThinkDim, string> = Object.fromEntries(THINK_DIMS.map((d) => [d.id, d.name])) as Record<
  ThinkDim,
  string
>;
