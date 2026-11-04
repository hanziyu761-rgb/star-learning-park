/**
 * 语文样板课：日 月 水 火 山（象形字识字启蒙）
 * 来源：识字范围参考小学一年级上册常见识字内容（日、月、水、火、山均为一年级上册要求认读的常用字），
 * 练习题和句子均为原创，未对应任何教材的原题或课文。具体教材版本与课次尚未核实。
 */
import type { Lesson } from '@/lesson/types';
import { zh, zhPrompt, zhS } from './zh';

export const chineseRiYueLesson: Lesson = {
  id: 'chinese-ri-yue-shui-huo',
  subject: 'chinese',
  order: 1,
  title: zh('日月水火山', 'rì yuè shuǐ huǒ shān'),
  parentSummary: '认读 5 个象形字，图字对应、听音识字、简单组词和看图判断句子。',
  emoji: '☀️',
  estimatedMinutes: 12,
  source: 'original',
  sourceNote: '识字范围参考一年级上册常用字；题目原创；教材版本与课次未核实。',
  steps: [
    {
      kind: 'teach-cards',
      id: 'c1-chars',
      title: zhPrompt('点一点，听一听', 'diǎn yi diǎn tīng yi tīng', '点一点每个字，听一听它怎么读'),
      cards: [
        { id: 'ri', visual: { emoji: '☀️' }, text: zh('日', 'rì'), sub: zh('日出', 'rì chū'), speak: zhS('日，日出的日') },
        { id: 'yue', visual: { emoji: '🌙' }, text: zh('月', 'yuè'), sub: zh('月亮', 'yuè liang'), speak: zhS('月，月亮的月') },
        { id: 'shui', visual: { emoji: '💧' }, text: zh('水', 'shuǐ'), sub: zh('喝水', 'hē shuǐ'), speak: zhS('水，喝水的水') },
        { id: 'huo', visual: { emoji: '🔥' }, text: zh('火', 'huǒ'), sub: zh('大火', 'dà huǒ'), speak: zhS('火，大火的火') },
        { id: 'shan', visual: { emoji: '⛰️' }, text: zh('山', 'shān'), sub: zh('大山', 'dà shān'), speak: zhS('山，大山的山') },
      ],
    },
    {
      kind: 'exercise',
      id: 'c2',
      exercise: {
        kind: 'drag-match',
        id: 'char-picture-match',
        skill: 'zh.char-picture',
        prompt: zhPrompt('把字拖到对应的图上', 'bǎ zì tuō dào duì yìng de tú shàng'),
        pairs: [
          { id: 'ri', item: { text: zh('日', 'rì'), speak: zhS('日') }, target: { visual: { emoji: '☀️' } } },
          { id: 'yue', item: { text: zh('月', 'yuè'), speak: zhS('月') }, target: { visual: { emoji: '🌙' } } },
          { id: 'shui', item: { text: zh('水', 'shuǐ'), speak: zhS('水') }, target: { visual: { emoji: '💧' } } },
          { id: 'huo', item: { text: zh('火', 'huǒ'), speak: zhS('火') }, target: { visual: { emoji: '🔥' } } },
        ],
        wrongHint: zhPrompt('点一点字，听听它的读音', 'diǎn yi diǎn zì tīng ting tā de dú yīn'),
      },
    },
    {
      kind: 'exercise',
      id: 'c3',
      exercise: {
        kind: 'choice',
        id: 'listen-shui',
        skill: 'zh.listen-char',
        prompt: zhPrompt('听一听，是哪个字？', 'tīng yi tīng shì nǎ ge zì'),
        listen: zhS('水'),
        hidePinyin: true,
        options: [
          { id: 'ri', text: zh('日', 'rì') },
          { id: 'shui', text: zh('水', 'shuǐ') },
          { id: 'huo', text: zh('火', 'huǒ') },
          { id: 'yue', text: zh('月', 'yuè') },
        ],
        answerId: 'shui',
        wrongHint: zhPrompt('再听一遍，是喝水的水', 'zài tīng yí biàn shì hē shuǐ de shuǐ'),
      },
    },
    {
      kind: 'exercise',
      id: 'c4',
      exercise: {
        kind: 'choice',
        id: 'listen-shan',
        skill: 'zh.listen-char',
        prompt: zhPrompt('听一听，是哪个字？', 'tīng yi tīng shì nǎ ge zì'),
        listen: zhS('山'),
        hidePinyin: true,
        options: [
          { id: 'shan', text: zh('山', 'shān') },
          { id: 'huo', text: zh('火', 'huǒ') },
          { id: 'yue', text: zh('月', 'yuè') },
          { id: 'ri', text: zh('日', 'rì') },
        ],
        answerId: 'shan',
        wrongHint: zhPrompt('再听一遍，是大山的山', 'zài tīng yí biàn shì dà shān de shān'),
      },
    },
    {
      kind: 'exercise',
      id: 'c5',
      exercise: {
        kind: 'choice',
        id: 'picture-yue',
        skill: 'zh.char-read',
        prompt: zhPrompt('看图找字', 'kàn tú zhǎo zì', '看图，找出对应的字'),
        stem: { visual: { emoji: '🌙' } },
        hidePinyin: true,
        options: [
          { id: 'ri', text: zh('日', 'rì') },
          { id: 'yue', text: zh('月', 'yuè') },
          { id: 'shan', text: zh('山', 'shān') },
        ],
        answerId: 'yue',
        wrongHint: zhPrompt('图上是月亮', 'tú shàng shì yuè liang'),
      },
    },
    {
      kind: 'teach-cards',
      id: 'c6-words',
      title: zhPrompt('两个字，变成词', 'liǎng gè zì biàn chéng cí', '两个字合在一起，变成一个词。点一点，听一听'),
      cards: [
        { id: 'riyue', visual: { emoji: '☀️🌙' }, text: zh('日月', 'rì yuè'), speak: zhS('日月') },
        { id: 'shanshui', visual: { emoji: '⛰️💧' }, text: zh('山水', 'shān shuǐ'), speak: zhS('山水') },
        { id: 'huoshan', visual: { emoji: '🌋' }, text: zh('火山', 'huǒ shān'), speak: zhS('火山') },
      ],
    },
    {
      kind: 'exercise',
      id: 'c7',
      exercise: {
        kind: 'choice',
        id: 'word-huoshan',
        skill: 'zh.words',
        prompt: zhPrompt('火和山合起来，是哪个词？', 'huǒ hé shān hé qǐ lái shì nǎ ge cí'),
        stem: { visual: { emoji: '🌋' } },
        options: [
          { id: 'shanshui', text: zh('山水', 'shān shuǐ') },
          { id: 'huoshan', text: zh('火山', 'huǒ shān') },
          { id: 'riyue', text: zh('日月', 'rì yuè') },
        ],
        answerId: 'huoshan',
        wrongHint: zhPrompt('先找火字，再找山字', 'xiān zhǎo huǒ zì zài zhǎo shān zì'),
      },
    },
    {
      kind: 'exercise',
      id: 'c8',
      exercise: {
        kind: 'truefalse',
        id: 'sentence-fire',
        skill: 'zh.sentence',
        prompt: zhPrompt('看图听句子，说得对吗？', 'kàn tú tīng jù zi shuō de duì ma'),
        statement: { visual: { emoji: '🔥' }, text: zh('这是水。', 'zhè shì shuǐ'), speak: zhS('这是水。') },
        answer: false,
        wrongHint: zhPrompt('图上是火，不是水', 'tú shàng shì huǒ bú shì shuǐ'),
      },
    },
    {
      kind: 'exercise',
      id: 'c9',
      exercise: {
        kind: 'truefalse',
        id: 'sentence-moon',
        skill: 'zh.sentence',
        prompt: zhPrompt('看图听句子，说得对吗？', 'kàn tú tīng jù zi shuō de duì ma'),
        statement: {
          visual: { emoji: '🌙' },
          text: zh('天上有月亮。', 'tiān shàng yǒu yuè liang'),
          speak: zhS('天上有月亮。'),
        },
        answer: true,
        wrongHint: zhPrompt('图上就是月亮', 'tú shàng jiù shì yuè liang'),
      },
    },
  ],
};
