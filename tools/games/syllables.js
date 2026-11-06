/**
 * 生成拼音钓鱼用的“真实存在的带调音节”表（V2.19）：用 pinyin-pro（MIT）枚举常用汉字区的全部读音，不含轻声。
 * 用法：node tools/games/syllables.js
 */
const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');
const set = new Set();
for (let c = 0x4e00; c <= 0x9fa5; c++) {
  for (const p of pinyin(String.fromCharCode(c), { multiple: true, type: 'array', toneType: 'symbol' }))
    if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p) && /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/.test(p)) set.add(p);
}
const list = [...set].sort();
fs.writeFileSync(
  path.join(__dirname, '../../src/games/data/syllables.gen.ts'),
  `// 自动生成：tools/games/syllables.js（pinyin-pro，MIT），请勿手改。真实存在的带调音节 ${list.length} 个（不含轻声）。\nexport const SYLLABLES = new Set('${list.join(' ')}'.split(' '));\n`,
);
console.log(list.length);
