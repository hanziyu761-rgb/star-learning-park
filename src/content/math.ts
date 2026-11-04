/**
 * 数学样板课：合起来是几（10 以内加法启蒙）
 * 来源：根据《义务教育数学课程标准》一年级“数与运算”知识点原创，未对应任何教材原题。
 */
import type { Lesson } from '@/lesson/types';
import { zh, zhPrompt, zhS } from './zh';

export const mathAddLesson: Lesson = {
  id: 'math-add-within-5',
  subject: 'math',
  order: 1,
  title: zh('合起来是几', 'hé qǐ lái shì jǐ'),
  parentSummary: '数数、点数物品、比多少、5 以内加法的含义（合起来），以及一道答案不唯一的开放题。',
  emoji: '🍎',
  estimatedMinutes: 15,
  source: 'original',
  sourceNote: '根据课程标准“数与运算”知识点原创，未对应教材原题。',
  steps: [
    {
      kind: 'count-demo',
      id: 's1-count',
      title: zhPrompt('我们一起数苹果', 'wǒ men yì qǐ shǔ píng guǒ', '我们一起数苹果吧！'),
      emoji: '🍎',
      count: 5,
      numberWords: ['一', '二', '三', '四', '五'],
    },
    {
      kind: 'drag-basket',
      id: 's2-basket',
      title: zhPrompt('把3个苹果拖进篮子里', 'bǎ gè píng guǒ tuō jìn lán zi lǐ', '把三个苹果拖进篮子里'),
      emoji: '🍎',
      total: 6,
      target: 3,
      doneSpeak: zhS('篮子里有三个苹果，真棒！'),
    },
    {
      kind: 'combine',
      id: 's3-combine',
      skill: 'math.add',
      title: zhPrompt('把两盘苹果都放进篮子里', 'bǎ liǎng pán píng guǒ dōu fàng jìn lán zi lǐ'),
      emoji: '🍎',
      left: 2,
      right: 3,
      choices: [4, 5, 6],
      doneSpeak: zhS('两个苹果和三个苹果，合起来是五个苹果。'),
    },
    {
      kind: 'exercise',
      id: 's4',
      exercise: {
        kind: 'choice',
        id: 'count-strawberry',
        skill: 'math.count',
        prompt: zhPrompt('数一数，有几个草莓？', 'shǔ yi shǔ yǒu jǐ gè cǎo méi'),
        stem: { visual: { emoji: '🍓', count: 4 } },
        options: [
          { id: '3', text: '3' },
          { id: '4', text: '4' },
          { id: '5', text: '5' },
        ],
        answerId: '4',
        wrongHint: zhPrompt('用手指着，一个一个数', 'yòng shǒu zhǐ zhe yí gè yí gè shǔ'),
      },
    },
    {
      kind: 'exercise',
      id: 's5',
      exercise: {
        kind: 'choice',
        id: 'compare-fish',
        skill: 'math.compare',
        prompt: zhPrompt('哪一边的小鱼多？', 'nǎ yì biān de xiǎo yú duō'),
        options: [
          { id: 'three', visual: { emoji: '🐟', count: 3 } },
          { id: 'five', visual: { emoji: '🐟', count: 5 } },
        ],
        answerId: 'five',
        wrongHint: zhPrompt('数一数，再比一比', 'shǔ yi shǔ zài bǐ yi bǐ'),
      },
    },
    {
      kind: 'exercise',
      id: 's6',
      exercise: {
        kind: 'drag-match',
        id: 'match-number-quantity',
        skill: 'math.count',
        prompt: zhPrompt('把数字拖到数量一样的图上', 'bǎ shù zì tuō dào shù liàng yí yàng de tú shàng'),
        pairs: [
          { id: '2', item: { text: '2' }, target: { visual: { emoji: '🌟', count: 2 }, speak: zhS('两颗星星') } },
          { id: '3', item: { text: '3' }, target: { visual: { emoji: '🎈', count: 3 }, speak: zhS('三个气球') } },
          { id: '5', item: { text: '5' }, target: { visual: { emoji: '🐞', count: 5 }, speak: zhS('五只瓢虫') } },
        ],
        wrongHint: zhPrompt('先数一数图上有几个', 'xiān shǔ yi shǔ tú shàng yǒu jǐ gè'),
      },
    },
    {
      kind: 'exercise',
      id: 's7',
      exercise: {
        kind: 'choice',
        id: 'add-1-4',
        skill: 'math.add',
        prompt: zhPrompt('1加4等于几？', 'jiā děng yú jǐ', '一加四等于几？'),
        stem: { text: '1 + 4 = ?' },
        options: [
          { id: '4', text: '4' },
          { id: '5', text: '5' },
          { id: '6', text: '6' },
        ],
        answerId: '5',
        wrongHint: zhPrompt('先数1个，再接着数4个', 'xiān shǔ gè zài jiē zhe shǔ gè', '先数一个，再接着数四个'),
      },
    },
    {
      kind: 'exercise',
      id: 's8',
      exercise: {
        kind: 'truefalse',
        id: 'tf-2-2',
        skill: 'math.add',
        prompt: zhPrompt('这道题算得对吗？', 'zhè dào tí suàn de duì ma'),
        statement: { visual: { emoji: '🐥', count: 4 }, text: '2 + 2 = 5', speak: zhS('二加二等于五') },
        answer: false,
        wrongHint: zhPrompt('数一数小鸡，一共有4只', 'shǔ yi shǔ xiǎo jī yí gòng yǒu zhī', '数一数小鸡，一共有四只'),
      },
    },
    {
      kind: 'exercise',
      id: 's9',
      exercise: {
        kind: 'sort',
        id: 'sort-1-5',
        skill: 'math.order',
        prompt: zhPrompt('从小到大，依次点一点', 'cóng xiǎo dào dà yī cì diǎn yi diǎn'),
        items: [
          { id: '3', text: '3' },
          { id: '1', text: '1' },
          { id: '5', text: '5' },
          { id: '2', text: '2' },
          { id: '4', text: '4' },
        ],
        order: ['1', '2', '3', '4', '5'],
        wrongHint: zhPrompt('先找最小的数', 'xiān zhǎo zuì xiǎo de shù'),
      },
    },
    {
      kind: 'open-build',
      id: 's10-open',
      skill: 'math.compose',
      title: zhPrompt(
        '盘子里放5个水果，可以怎么放？',
        'pán zi lǐ fàng gè shuǐ guǒ kě yǐ zěn me fàng',
        '盘子里要放五个水果，可以放苹果，也可以放梨。想一想，可以怎么放？',
      ),
      itemA: { emoji: '🍎', name: zhS('苹果') },
      itemB: { emoji: '🍐', name: zhS('梨') },
      target: 5,
    },
  ],
};
