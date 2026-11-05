/**
 * 知识点小讲解（V2.10 一年级数学；V2.13 扩展到二～六年级，本项目原创）：练习前先看两页，“先教后练”。
 * 每页一个图示（表情符号或算式）+ 一句话讲方法，可以点喇叭听。待教师审核。
 */
import { zh } from '@/content/zh';
import { LANG_TEACH } from './teachLang';
import { MATH_TEACH_UPPER } from './teachMath';
import type { TeachSlide } from './teachTypes';

export type { TeachSlide } from './teachTypes';

const S = (show: string, chars: string, py: string): TeachSlide => ({ show, text: zh(chars, py), speak: chars });

export const KP_TEACH_G1: Record<string, TeachSlide[]> = {
  'm1.count5': [
    S('🍎🍎🍎', '一个一个地数：1、2、3，一共有3个。', 'yí gè yí gè de shǔ yí gòng yǒu gè'),
    S('👆', '手指点一个，嘴里数一个，不漏也不重复。', 'shǒu zhǐ diǎn yí gè zuǐ lǐ shǔ yí gè bú lòu yě bù chóng fù'),
  ],
  'm1.zero': [
    S('🍽️', '盘子里一个苹果也没有，就用0表示。', 'pán zi lǐ yí gè píng guǒ yě méi yǒu jiù yòng biǎo shì'),
    S('🍎🍎 ➖ 🍎🍎', '2个苹果吃掉2个，还剩0个。', 'gè píng guǒ chī diào gè hái shèng gè'),
  ],
  'm1.compose5': [
    S('🍎🍎 | 🍎🍎🍎', '5可以分成2和3，2和3合起来是5。', 'kě yǐ fēn chéng hé hé hé qǐ lái shì'),
    S('🧩', '5还可以分成1和4、4和1、3和2。', 'hái kě yǐ fēn chéng hé hé hé'),
  ],
  'm1.add5': [
    S('🐟🐟 ➕ 🐟', '2条鱼，又游来1条，合起来用加法：2+1=3。', 'tiáo yú yòu yóu lái tiáo hé qǐ lái yòng jiā fǎ'),
    S('➕', '加法就是把两个数合起来。', 'jiā fǎ jiù shì bǎ liǎng gè shù hé qǐ lái'),
  ],
  'm1.sub5': [
    S(
      '🎈🎈🎈🎈',
      '4个气球飞走了1个，还剩几个？用减法：4-1=3。',
      'gè qì qiú fēi zǒu le gè hái shèng jǐ gè yòng jiǎn fǎ',
    ),
    S('➖', '减法就是拿走几个，看看还剩几个。', 'jiǎn fǎ jiù shì ná zǒu jǐ gè kàn kan hái shèng jǐ gè'),
  ],
  'm1.count10': [
    S('6 7 8 9 10', '6、7、8、9、10，后一个比前一个多1。', 'hòu yí gè bǐ qián yí gè duō'),
    S('✋✋', '两只手有10个手指，正好是10。', 'liǎng zhī shǒu yǒu gè shǒu zhǐ zhèng hǎo shì'),
  ],
  'm1.compare10': [
    S('🍎🍎🍎\n🍐🍐', '一个对一个地比，多出来的那边多。', 'yí gè duì yí gè de bǐ duō chū lái de nà biān duō'),
    S('5 > 3', '大于号的开口朝着大的数：5>3。', 'dà yú hào de kāi kǒu cháo zhe dà de shù'),
  ],
  'm1.compose10': [
    S('1+9 2+8 3+7\n4+6 5+5', '10可以分成1和9、2和8、3和7、4和6、5和5。', 'kě yǐ fēn chéng hé hé hé hé hé'),
    S(
      '🤝',
      '记住这些凑成10的好朋友，算得又快又准。',
      'jì zhù zhè xiē còu chéng de hǎo péng you suàn de yòu kuài yòu zhǔn',
    ),
  ],
  'm1.add10': [
    S('6 + 3', '算6+3，想：6和3合起来是9。', 'suàn xiǎng hé hé qǐ lái shì'),
    S('3+6 = 6+3', '交换两个加数的位置，得数不变。', 'jiāo huàn liǎng gè jiā shù de wèi zhì dé shù bú biàn'),
  ],
  'm1.sub10': [
    S('9 - 4', '算9-4，想：4加几等于9？4+5=9，所以9-4=5。', 'suàn xiǎng jiā jǐ děng yú suǒ yǐ'),
    S('🧩', '也可以想：9可以分成4和5。', 'yě kě yǐ xiǎng kě yǐ fēn chéng hé'),
  ],
  'm1.wordprob10': [
    S('📖', '先读题，找出知道什么、要求什么。', 'xiān dú tí zhǎo chū zhī dào shén me yāo qiú shén me'),
    S('🤔', '合起来用加法，求剩下的用减法。', 'hé qǐ lái yòng jiā fǎ qiú shèng xià de yòng jiǎn fǎ'),
  ],
  'm1.count20': [
    S('🔟 ➕ 3', '13就是1个十和3个一。', 'jiù shì gè shí hé gè yī'),
    S('11 … 20', '十几的数，十位上都是1；20是2个十。', 'shí jǐ de shù shí wèi shàng dōu shì shì gè shí'),
  ],
  'm1.make10': [
    S('9+1  8+2  7+3', '9和1凑成10，8和2凑成10，7和3凑成10。', 'hé còu chéng hé còu chéng hé còu chéng'),
    S('🔟', '先凑成10，再算剩下的，又快又准。', 'xiān còu chéng zài suàn shèng xià de yòu kuài yòu zhǔn'),
  ],
  'm1.carry20': [
    S('9 + 5\n9+1=10  10+4=14', '算9+5：把5分成1和4，9加1得10，10加4得14。', 'suàn bǎ fēn chéng hé jiā dé jiā dé'),
    S('🔟', '先凑十，再加剩下的数，这叫凑十法。', 'xiān còu shí zài jiā shèng xià de shù zhè jiào còu shí fǎ'),
  ],
  'm1.borrow20': [
    S('13 - 9\n10-9=1  1+3=4', '算13-9：把13分成10和3，10减9得1，1加3得4。', 'suàn bǎ fēn chéng hé jiǎn dé jiā dé'),
    S(
      '✂️',
      '先从10里减，再加上剩下的个位数，这叫破十法。',
      'xiān cóng lǐ jiǎn zài jiā shàng shèng xià de gè wèi shù zhè jiào pò shí fǎ',
    ),
  ],
  'm1.position': [
    S('🐦\n🌳\n🐶', '小鸟在树的上面，小狗在树的下面。', 'xiǎo niǎo zài shù de shàng miàn xiǎo gǒu zài shù de xià miàn'),
    S('✋', '举起你的右手，另一只就是左手。', 'jǔ qǐ nǐ de yòu shǒu lìng yì zhī jiù shì zuǒ shǒu'),
  ],
  'm1.shapes3d': [
    S('📦', '长方体有6个面，像牙膏盒。', 'cháng fāng tǐ yǒu gè miàn xiàng yá gāo hé'),
    S(
      '🥫 ⚽',
      '圆柱上下一样粗，可以滚；球各个方向都能滚。',
      'yuán zhù shàng xià yí yàng cū kě yǐ gǔn qiú gè gè fāng xiàng dōu néng gǔn',
    ),
  ],
  'm1.clock': [
    S('🕒', '短针是时针，长针是分针。', 'duǎn zhēn shì shí zhēn cháng zhēn shì fēn zhēn'),
    S('🕗', '分针指着12，时针指着8，就是8时。', 'fēn zhēn zhǐ zhe shí zhēn zhǐ zhe jiù shì shí'),
  ],
  'm1.shapes2d': [
    S(
      '🟥 🔺 ⚪',
      '正方形四条边一样长，三角形有三条边，圆没有角。',
      'zhèng fāng xíng sì tiáo biān yí yàng cháng sān jiǎo xíng yǒu sān tiáo biān yuán méi yǒu jiǎo',
    ),
    S(
      '📦 ➡️ ▭',
      '把长方体的一个面描下来，就是长方形。',
      'bǎ cháng fāng tǐ de yí gè miàn miáo xià lái jiù shì cháng fāng xíng',
    ),
  ],
  'm1.classify': [
    S(
      '🍎🍌 | 🚗🚌',
      '按一样的标准分：水果放一起，车放一起。',
      'àn yí yàng de biāo zhǔn fēn shuǐ guǒ fàng yì qǐ chē fàng yì qǐ',
    ),
    S('📊', '分好以后数一数，每一类有几个。', 'fēn hǎo yǐ hòu shǔ yi shǔ měi yí lèi yǒu jǐ gè'),
  ],
  'm1.count100': [S('💯', '10个十是100。', 'gè shí shì'), S('45', '45就是4个十和5个一。', 'jiù shì gè shí hé gè yī')],
  'm1.money': [
    S('💴', '1元等于10角，1角等于10分。', 'yuán děng yú jiǎo jiǎo děng yú fēn'),
    S('🛒', '付的钱减去价钱，就是找回的钱。', 'fù de qián jiǎn qù jià qián jiù shì zhǎo huí de qián'),
  ],
  'm1.addsub100': [
    S('30 + 20 = 50', '3个十加2个十是5个十，就是50。', 'gè shí jiā gè shí shì gè shí jiù shì'),
    S('25 + 3 = 28', '两位数加一位数：个位和个位相加。', 'liǎng wèi shù jiā yí wèi shù gè wèi hé gè wèi xiāng jiā'),
  ],
  'm1.pattern': [
    S(
      '🔴🔵🔴🔵',
      '找规律：先找出重复的一组，红、蓝是一组。',
      'zhǎo guī lǜ xiān zhǎo chū chóng fù de yì zǔ hóng lán shì yì zǔ',
    ),
    S(
      '🔴🔵 ❓',
      '照着这一组往下排，就知道下一个是什么。',
      'zhào zhe zhè yì zǔ wǎng xià pái jiù zhī dào xià yí gè shì shén me',
    ),
  ],
};

/** 全部知识点讲解：一年级数学（V2.10）+ 二～六年级数学、二～六年级语文、三～六年级英语（V2.13） */
export const KP_TEACH: Record<string, TeachSlide[]> = { ...KP_TEACH_G1, ...MATH_TEACH_UPPER, ...LANG_TEACH };
