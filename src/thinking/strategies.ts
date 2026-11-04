/**
 * 答对后“你是怎么想的？”（V2.5，本项目原创）。
 * 一年级加减法常见的几种思路，孩子自己选，没有对错之分；家长中心据此看孩子是靠数数，还是已经会凑十、破十。
 * level：1 = 数数（最基础），2 = 借助数的关系（分与合、想加算减、交换），3 = 较快的方法（凑十、破十、直接记住、先算整十）。
 */
import { zh } from '@/content/zh';
import type { ZhText } from '@/lesson/types';

export interface StrategyOption {
  id: string;
  emoji: string;
  text: ZhText;
  speak: string;
  level: 1 | 2 | 3;
}

const O = (id: string, emoji: string, chars: string, py: string, level: 1 | 2 | 3): StrategyOption => ({
  id,
  emoji,
  text: zh(chars, py),
  speak: chars,
  level,
});

export const STRATEGIES: Record<string, StrategyOption> = Object.fromEntries(
  [
    O('count', '🖐️', '一个一个地数', 'yí gè yí gè de shǔ', 1),
    O('countBack', '👈', '倒着数', 'dào zhe shǔ', 1),
    O('compose', '🧩', '想数的分与合', 'xiǎng shù de fēn yǔ hé', 2),
    O('thinkAdd', '🔁', '想加法算减法', 'xiǎng jiā fǎ suàn jiǎn fǎ', 2),
    O('swap', '↔️', '交换两个数再算', 'jiāo huàn liǎng gè shù zài suàn', 2),
    O('make10', '🔟', '先凑成十', 'xiān còu chéng shí', 3),
    O('break10', '✂️', '破十：从十里减', 'pò shí cóng shí lǐ jiǎn', 3),
    O('tens', '🧮', '先算整十，再算个位', 'xiān suàn zhěng shí zài suàn gè wèi', 3),
    O('recall', '💡', '我已经记住了', 'wǒ yǐ jīng jì zhù le', 3),
  ].map((o) => [o.id, o]),
);

/** 哪些知识点答对后问思路，以及给哪些选项 */
export const STRATEGY_SETS: Record<string, string[]> = {
  'm1.add5': ['count', 'compose', 'recall'],
  'm1.add10': ['count', 'compose', 'recall'],
  'm1.sub5': ['countBack', 'compose', 'thinkAdd', 'recall'],
  'm1.sub10': ['countBack', 'compose', 'thinkAdd', 'recall'],
  'm1.carry20': ['make10', 'swap', 'count', 'recall'],
  'm1.borrow20': ['break10', 'thinkAdd', 'countBack', 'recall'],
  'm1.addsub100': ['tens', 'count', 'recall'],
};

export const strategyOptions = (kp: string): StrategyOption[] => (STRATEGY_SETS[kp] ?? []).map((id) => STRATEGIES[id]);

/** 一轮练习里，第 1、4、7、10 道答对的题问一次思路，避免每题都问打断节奏 */
export const shouldAskStrategy = (kp: string | null, correctSoFar: number): boolean =>
  !!kp && kp in STRATEGY_SETS && correctSoFar % 3 === 1;
