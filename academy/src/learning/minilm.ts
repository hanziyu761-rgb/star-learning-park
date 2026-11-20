// A mini language model (六年级·大语言模型原理). REAL computation, but tiny:
// it counts which word follows which in a small corpus (a "bigram" model) and
// turns the counts into probabilities. Large language models also predict the
// next word, but with huge neural networks trained on vast text — not by
// simple counting. The UI says so.

export const CORPUS = [
  '今天 天气 很 好 。',
  '今天 天气 很 冷 。',
  '今天 我们 去 公园 。',
  '我们 去 图书馆 看书 。',
  '我们 去 公园 放风筝 。',
  '小猫 在 睡觉 。',
  '小猫 在 晒太阳 。',
  '小狗 在 公园 跑步 。',
  '天气 很 好 ， 我们 去 公园 。',
  '我 很 喜欢 看书 。',
  '我 很 喜欢 小猫 。',
  '天气 很 冷 ， 我们 在 家 看书 。',
];

export const START = '<开始>';
export const END = '。';

export type Bigrams = Map<string, Map<string, number>>;

export function train(corpus: string[] = CORPUS): Bigrams {
  const m: Bigrams = new Map();
  for (const line of corpus) {
    const words = [START, ...line.trim().split(/\s+/)];
    for (let i = 0; i < words.length - 1; i++) {
      const next = m.get(words[i]) ?? new Map<string, number>();
      next.set(words[i + 1], (next.get(words[i + 1]) ?? 0) + 1);
      m.set(words[i], next);
    }
  }
  return m;
}

export interface Candidate { word: string; count: number; p: number }

/** Probabilities of the next word, highest first (ties keep corpus order). */
export function nextWords(model: Bigrams, word: string): Candidate[] {
  const next = model.get(word);
  if (!next) return [];
  const total = [...next.values()].reduce((a, b) => a + b, 0);
  return [...next.entries()].map(([w, c]) => ({ word: w, count: c, p: c / total })).sort((a, b) => b.count - a.count);
}

/** Always takes the most likely next word (greedy), up to maxLen words. */
export function generateGreedy(model: Bigrams, first = START, maxLen = 12): string[] {
  const out: string[] = [];
  let w = first;
  for (let i = 0; i < maxLen; i++) {
    const c = nextWords(model, w)[0];
    if (!c) break;
    out.push(c.word);
    if (c.word === END) break;
    w = c.word;
  }
  return out;
}
