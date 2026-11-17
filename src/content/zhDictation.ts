/**
 * 语文听写（V5.4，本项目整理）：
 * - 小学生字听写：听“晴天的晴”，从形近字、同音字里选出正确的字（一二 / 三四 / 五六年级各一组）
 * - 初中古诗文默写：听整句名句，选出括号里正确的字（易写错的字：同音、形近）
 * 干扰字都不能和这个词组成另一个常用词（例如不用“元”做“公园”的干扰字，因为有“公元”）。
 * 练习 id：zdict:g年级；题目 id：zdict:g年级:编号。
 */
import type { ChoiceExercise } from '@/lesson/types';
import { zh } from './zh';

/** 字|词语|词语拼音|干扰字 */
const PRIMARY: Record<1 | 2 | 3, string> = {
  1: `
晴|晴天|qíng tiān|睛/情/清
睛|眼睛|yǎn jing|晴/情/清
清|清水|qīng shuǐ|晴/请/情
请|请坐|qǐng zuò|情/清/晴
情|心情|xīn qíng|请/清/晴
己|自己|zì jǐ|已/巳/记
已|已经|yǐ jīng|己/巳/以
末|周末|zhōu mò|未/木/本
未|未来|wèi lái|末/米/木
土|土地|tǔ dì|士/去/王
入|进入|jìn rù|八/儿/大
人|大人|dà rén|入/八/从
目|题目|tí mù|日/自/月
天|天空|tiān kōng|夫/犬/夭
今|今天|jīn tiān|令/会/金
卖|叫卖|jiào mài|买/实/读
休|休息|xiū xi|体/林/伙
体|身体|shēn tǐ|休/本/林
从|从前|cóng qián|丛/众/认
坐|坐车|zuò chē|左/做/生
在|在家|zài jiā|再/存/左
再|再见|zài jiàn|在/写/两
做|做事|zuò shì|坐/估/昨
园|公园|gōng yuán|圆/远/困
圆|圆形|yuán xíng|园/员/远
近|附近|fù jìn|进/新/斤
进|进门|jìn mén|近/井/送
很|很好|hěn hǎo|狠/恨/跟
跟|跟着|gēn zhe|很/根/眼
河|小河|xiǎo hé|和/喝/合`,
  2: `
辨|辨别|biàn bié|辩/辫/瓣
辩|辩论|biàn lùn|辨/辫/瓣
辫|辫子|biàn zi|辨/辩/瓣
燥|干燥|gān zào|躁/澡/噪
躁|急躁|jí zào|燥/澡/噪
澡|洗澡|xǐ zǎo|燥/躁/噪
噪|噪音|zào yīn|燥/躁/澡
既|既然|jì rán|即/概/慨
即|立即|lì jí|既/及/急
历|历史|lì shǐ|厉/励/沥
厉|厉害|lì hai|历/励/沥
倍|加倍|jiā bèi|陪/赔/培
陪|陪伴|péi bàn|倍/赔/培
赔|赔偿|péi cháng|陪/倍/培
培|培养|péi yǎng|陪/赔/倍
暴|暴雨|bào yǔ|爆/瀑/抱
爆|爆炸|bào zhà|暴/瀑/抱
瀑|瀑布|pù bù|暴/爆/抱`,
  3: `
竟|竟然|jìng rán|竞/境/镜
竞|竞赛|jìng sài|竟/境/镜
境|环境|huán jìng|竟/竞/镜
慕|羡慕|xiàn mù|幕/墓/暮
幕|开幕|kāi mù|慕/墓/暮
暮|暮色|mù sè|慕/幕/墓
墓|墓碑|mù bēi|慕/幕/暮
迫|迫切|pò qiè|追/泊/魄
默|默读|mò dú|黑/墨/嘿
墨|墨水|mò shuǐ|默/漠/磨
蒸|蒸发|zhēng fā|拯/睁/挣
撤|撤退|chè tuì|撒/辙/澈
辙|车辙|chē zhé|撤/澈/徹
澈|清澈|qīng chè|撤/辙/撒
籍|书籍|shū jí|藉/借/级
誉|荣誉|róng yù|誊/举/喻
誊|誊写|téng xiě|誉/腾/藤
腾|奔腾|bēn téng|誊/藤/滕`,
};

/** 初中古诗文默写：年级|名句（上句，下句）|要写的字|干扰字 */
const POEMS = `
7|潮平两岸阔，风正一帆悬|悬|旋/玄/县
7|海日生残夜，江春入旧年|残|惨/浅/践
7|夕阳西下，断肠人在天涯|肠|场/畅/汤
7|学而不思则罔，思而不学则殆|罔|枉/网/惘
7|学而不思则罔，思而不学则殆|殆|怠/贻/始
7|非淡泊无以明志，非宁静无以致远|泊|薄/博/迫
7|非淡泊无以明志，非宁静无以致远|致|至/志/制
7|万里赴戎机，关山度若飞|戎|绒/戒/戍
7|万里赴戎机，关山度若飞|度|渡/肚/杜
7|会当凌绝顶，一览众山小|凌|临/陵/凛
7|不畏浮云遮望眼，自缘身在最高层|遮|蔗/庶/折
7|不畏浮云遮望眼，自缘身在最高层|缘|源/原/元
7|山重水复疑无路，柳暗花明又一村|复|覆/腹/馥
7|落红不是无情物，化作春泥更护花|护|户/沪/扩
8|大漠孤烟直，长河落日圆|漠|莫/寞/摸
8|征蓬出汉塞，归雁入胡天|蓬|篷/逢/缝
8|晴川历历汉阳树，芳草萋萋鹦鹉洲|洲|州/舟/周
8|日暮乡关何处是，烟波江上使人愁|暮|幕/慕/墓
8|乱花渐欲迷人眼，浅草才能没马蹄|渐|惭/暂/斩
8|几处早莺争暖树，谁家新燕啄春泥|莺|鹰/营/樱
8|烽火连三月，家书抵万金|烽|峰/锋/蜂
8|烽火连三月，家书抵万金|抵|底/低/砥
8|采菊东篱下，悠然见南山|篱|离/璃/漓
8|黑云压城城欲摧，甲光向日金鳞开|摧|催/崔/璀
8|关关雎鸠，在河之洲|雎|睢/锥/堆
8|蒹葭苍苍，白露为霜|葭|假/暇/遐
8|安得广厦千万间，大庇天下寒士俱欢颜|厦|夏/霞/暇
9|长风破浪会有时，直挂云帆济沧海|济|齐/挤/剂
9|沉舟侧畔千帆过，病树前头万木春|畔|伴/判/拌
9|但愿人长久，千里共婵娟|婵|蝉/禅/惮
9|人生自古谁无死，留取丹心照汗青|汗|汉/旱/干
9|山河破碎风飘絮，身世浮沉雨打萍|絮|序/叙/恕
9|忽如一夜春风来，千树万树梨花开|梨|犁/黎/利
9|醉翁之意不在酒，在乎山水之间也|翁|嗡/瓮/公
9|苟全性命于乱世，不求闻达于诸侯|苟|狗/荀/够
9|不以物喜，不以己悲|己|已/巳/记
9|受任于败军之际，奉命于危难之间|际|迹/计/济
9|了却君王天下事，赢得生前身后名|赢|嬴/羸/营`;

interface Item {
  char: string;
  /** 显示的句子或词语，要写的字换成（　） */
  shown: string;
  /** 词语拼音（小学） */
  py?: string;
  /** 读出来的话 */
  say: string;
  wrongs: string[];
  /** 初中：整句 */
  line?: string;
}

const rows = (block: string) =>
  block
    .trim()
    .split('\n')
    .map((l) => l.trim().split('|'));

const band = (grade: number): 1 | 2 | 3 => (grade <= 2 ? 1 : grade <= 4 ? 2 : 3);

/** 这个年级的听写题 */
export function dictationItems(grade: number): Item[] {
  if (grade >= 7)
    return rows(POEMS)
      .filter((r) => Number(r[0]) === grade)
      .map(([, line, char, w]) => ({ char, shown: line.replace(char, '（　）'), say: line, wrongs: w.split('/'), line }));
  return rows(PRIMARY[band(grade)]).map(([char, word, py, w]) => ({
    char,
    shown: word.replace(char, '（　）'),
    py,
    say: `${word}的${char}`,
    wrongs: w.split('/'),
  }));
}

export const dictationId = (grade: number) => `zdict:g${grade}`;
export const isDictationId = (id: string) => /^zdict:g\d$/.test(id);
export const dictationTitle = (grade: number) => (grade >= 7 ? '古诗文默写' : '生字听写');

const say = (text: string) => ({ text, lang: 'zh-CN' as const });

export function dictationExercise(grade: number, i: number): ChoiceExercise | null {
  const it = dictationItems(grade)[i];
  if (!it) return null;
  const all = [it.char, ...it.wrongs];
  const k = (i * 7 + grade) % all.length;
  const list = [...all.slice(k), ...all.slice(0, k)];
  const junior = grade >= 7;
  const prompt = junior ? '古诗文默写：听一听，选出括号里正确的字' : '听一听，选出括号里正确的字';
  return {
    kind: 'choice',
    id: `${dictationId(grade)}:${i}`,
    skill: 'zh.dictation',
    prompt: grade <= 2 ? { text: zh(prompt, 'tīng yi tīng xuǎn chū kuò hào lǐ zhèng què de zì'), speak: say(prompt) } : { text: prompt, speak: say(prompt) },
    listen: say(it.say),
    stem: { text: it.py ? `${it.shown}（${it.py}）` : it.shown },
    options: list.map((c) => ({ id: c, text: c, speak: say(c) })),
    answerId: it.char,
    explanation: junior ? `正确写法：${it.line}` : `“${it.say}”。注意和 ${it.wrongs.join('、')} 区分。`,
    wrongHint: { text: '再听一听，想想字的意思', speak: say('再听一听，想想字的意思') },
  };
}

/** 一轮听写：先出没做过的，按顺序打乱 */
export function dictationRound(grade: number, done: Set<string>, rand: () => number, n = 10) {
  const items = dictationItems(grade).map((_, i) => i);
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const id = (i: number) => `${dictationId(grade)}:${i}`;
  const order = [...items.filter((i) => !done.has(id(i))), ...items.filter((i) => done.has(id(i)))];
  return order.slice(0, n).map((i) => dictationExercise(grade, i)!);
}

/** 从记录还原题目（错题本、复习用） */
export function findDictation(lessonId: string, exerciseId: string): ChoiceExercise | null {
  const m = /^zdict:g(\d):(\d+)$/.exec(exerciseId);
  if (!m || !lessonId.startsWith('zdict:')) return null;
  return dictationExercise(Number(m[1]), Number(m[2]));
}
