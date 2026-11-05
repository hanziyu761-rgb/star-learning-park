/**
 * 题库自动拼音的多音字纠正（V2.12）。
 * 一、二年级题库的拼音由 pinyin-pro 自动生成，自动核查发现下面这些词常被注错（例如“数数”注成 shuò shuò），
 * 显示时按词纠正。只收确定的读法；其它多音字仍按原样显示，并在教师审核表里标出“含多音字，请核对拼音”。
 */
export const BANK_PY_FIXES: Record<string, string> = {
  数数: 'shǔ shù',
  数一数: 'shǔ yi shǔ',
  数到: 'shǔ dào',
  数出: 'shǔ chū',
  数一下: 'shǔ yí xià',
  长高: 'zhǎng gāo',
  重新: 'chóng xīn',
  因为: 'yīn wèi',
  朋友: 'péng you',
};

const WORDS = Object.keys(BANK_PY_FIXES).sort((a, b) => b.length - a.length);

/**
 * text：题目原文（含标点、数字），pys：按顺序对应每个汉字的拼音。
 * 只在原文里连着出现的词才纠正（不会把“长 8 厘米，高 5 厘米”里的长、高当成“长高”）。
 */
export function fixBankPinyin(text: string, pys: string[]): { pys: string[]; fixed: number } {
  const out = [...pys];
  const chars = Array.from(text);
  // 每个字符对应第几个拼音（非汉字为 -1）
  let n = 0;
  const pyIndex = chars.map((c) => (/\p{Script=Han}/u.test(c) ? n++ : -1));
  let fixed = 0;
  let i = 0;
  while (i < chars.length) {
    const w = WORDS.find((x) => chars.slice(i, i + x.length).join('') === x);
    if (!w) {
      i += 1;
      continue;
    }
    const want = BANK_PY_FIXES[w].split(' ');
    const at = pyIndex[i];
    if (want.some((p, k) => out[at + k] !== p)) {
      want.forEach((p, k) => (out[at + k] = p));
      fixed += 1;
    }
    i += w.length;
  }
  return { pys: out, fixed };
}

/** 一、二年级容易注错的多音字：教师审核表单列出这些字和注的拼音，方便老师核对（的、了、和等读法稳定的不列） */
export const POLYPHONES = new Set(Array.from('数长着得地还行重好少只种为教便背发乐觉难空转调假处差朝相应当量将干'));

/** 题目里的多音字和注的拼音（纠正后），例如“数(shǔ)、长(zhǎng)” */
export function polyphonesOf(text: string, pys: string[]): string {
  const { pys: fixed } = fixBankPinyin(text, pys);
  const out: string[] = [];
  let n = 0;
  for (const c of Array.from(text)) {
    if (!/\p{Script=Han}/u.test(c)) continue;
    if (POLYPHONES.has(c)) out.push(`${c}(${fixed[n] ?? '?'})`);
    n += 1;
  }
  return [...new Set(out)].join('、');
}
