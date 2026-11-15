/**
 * 三～六年级英语：用单词卡出题（V5.2.5，本项目原创）。
 * 每个知识点 eG.aN / eG.bN 对应同一个 PEP 单元的单词卡 pepGa-N / pepGb-N。
 *
 * 两种题，都只有一个对的：
 * - 拼写：听单词读音，选出拼写正确的单词（干扰项是程序造的错拼写，已用 CMU 词典排除真实单词）  签名 w:编号:0
 * - 填空：单词卡例句里把这个词挖空，选出拼写正确的词                                      签名 w:编号:1
 * 题目指令用英文，中文只放在 hintZh 小提示里。
 */
import type { Exercise } from '@/lesson/types';
import { WORD_UNITS, type WordCard } from '@/words/catalog';
import { MISSPELL } from '@/words/data/misspell.gen';

const enSay = (text: string) => ({ text, lang: 'en-US' as const });

function cardsOf(kpId: string): WordCard[] {
  const m = /^e([3-6])\.([ab])(\d)$/.exec(kpId);
  if (!m) return [];
  return WORD_UNITS.find((u) => u.id === `pep${m[1]}${m[2]}-${m[3]}`)?.cards ?? [];
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** 错拼写：tools/words/misspell.py 预先生成，已用 CMU 词典排除真实存在的单词 */
export const misspellings = (word: string): string[] => MISSPELL[word] ?? [];

/** 例句里这个词的位置（整词、不在句首） */
function blankOf(card: WordCard): string | null {
  const re = new RegExp(`(^|[^A-Za-z'])(${card.w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![A-Za-z'])`);
  const m = re.exec(card.ex);
  if (!m || m.index + m[1].length === 0) return null;
  const at = m.index + m[1].length;
  return `${card.ex.slice(0, at)}___${card.ex.slice(at + card.w.length)}`;
}

const usable = (c: WordCard) => misspellings(c.w).length === 3;

/** 这个知识点能出的单词题签名 */
export function wordSigs(kpId: string): string[] {
  const out: string[] = [];
  cardsOf(kpId).forEach((c, i) => {
    if (!usable(c)) return;
    out.push(`w:${i}:0`);
    if (blankOf(c)) out.push(`w:${i}:1`);
  });
  return out;
}

export function isWordSig(kpId: string, sig: string): boolean {
  return /^e[3-6]\./.test(kpId) && sig.startsWith('w:');
}

export function wordExercise(kpId: string, sig: string, id: string): Exercise {
  const [, i, f] = sig.split(':');
  const c = cardsOf(kpId)[Number(i)];
  if (!c || !usable(c) || !['0', '1'].includes(f)) throw new Error(`没有这道单词题：${kpId}:${sig}`);
  const wrongs = misspellings(c.w);
  const all = [c.w, ...wrongs];
  const k = hashStr(sig + kpId) % all.length;
  const list = [...all.slice(k), ...all.slice(0, k)];
  const options = list.map((t) => ({ id: t, text: t }));
  if (f === '0')
    return {
      kind: 'choice',
      id,
      skill: kpId,
      prompt: { text: 'Listen and choose the right spelling.', speak: enSay(c.w), hintZh: `听读音，选出拼写正确的单词（${c.zh}）` },
      options,
      answerId: c.w,
      explanation: `${c.w}：${c.zh}。例句：${c.ex}（${c.exZh}）`,
      wrongHint: { text: 'Listen again.', speak: enSay(c.w) },
    };
  const stem = blankOf(c);
  if (!stem) throw new Error(`例句里没有这个词：${c.w}`);
  return {
    kind: 'choice',
    id,
    skill: kpId,
    prompt: { text: 'Choose the right word for the blank.', speak: enSay(c.ex), hintZh: c.exZh },
    stem: { text: stem },
    options,
    answerId: c.w,
    explanation: `${c.ex}（${c.exZh}）`,
    wrongHint: { text: 'Try again.', speak: enSay(c.ex) },
  };
}
