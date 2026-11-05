/**
 * English sample lesson: Fruits
 * Flow: listen → picture → repeat → first letters → dialogue → picture book → review.
 * 英语题目使用英文指令（配可选的中文小提示），内容原创。
 */
import type { Lesson } from '@/lesson/types';
import { enPrompt, enS } from './zh';

const fruits = [
  { id: 'apple', emoji: '🍎', word: 'apple' },
  { id: 'banana', emoji: '🍌', word: 'banana' },
  { id: 'orange', emoji: '🍊', word: 'orange' },
  { id: 'grapes', emoji: '🍇', word: 'grapes' },
];

const pictureOptions = fruits.map((f) => ({ id: f.id, visual: { emoji: f.emoji } }));

export const englishFruitsLesson: Lesson = {
  id: 'english-fruits',
  subject: 'english',
  order: 19,
  track: 'talk',
  title: '9. Fruits',
  parentSummary: '水果词汇 apple / banana / orange / grapes：听音辨图、跟读、首字母启蒙、简单对话和小绘本。',
  emoji: '🍎',
  estimatedMinutes: 15,
  source: 'original',
  sourceNote: '原创内容；词汇为常见启蒙词。',
  steps: [
    {
      kind: 'teach-cards',
      id: 'e1-words',
      title: enPrompt('Listen and tap.', '点一点卡片，听一听'),
      cards: fruits.map((f) => ({ id: f.id, visual: { emoji: f.emoji }, text: f.word, speak: enS(f.word) })),
    },
    {
      kind: 'exercise',
      id: 'e2',
      exercise: {
        kind: 'choice',
        id: 'listen-banana',
        skill: 'en.vocab-listen',
        prompt: enPrompt('Listen. Tap the picture.', '听一听，点出对应的图片'),
        listen: enS('banana'),
        options: pictureOptions,
        answerId: 'banana',
        wrongHint: enPrompt('Listen again: banana.'),
      },
    },
    {
      kind: 'exercise',
      id: 'e3',
      exercise: {
        kind: 'choice',
        id: 'listen-grapes',
        skill: 'en.vocab-listen',
        prompt: enPrompt('Listen. Tap the picture.', '听一听，点出对应的图片'),
        listen: enS('grapes'),
        options: [...pictureOptions].reverse(),
        answerId: 'grapes',
        wrongHint: enPrompt('Listen again: grapes.'),
      },
    },
    {
      kind: 'repeat',
      id: 'e4-repeat',
      title: enPrompt('Listen and say.', '听一听，然后大声跟着说'),
      items: fruits.map((f) => ({ id: f.id, visual: { emoji: f.emoji }, text: f.word, speak: enS(f.word) })),
    },
    {
      kind: 'teach-cards',
      id: 'e5-letters',
      title: enPrompt('First letters. Listen and tap.', '每个单词的第一个字母'),
      cards: [
        { id: 'a', visual: { emoji: '🍎' }, text: 'A a', sub: 'apple', speak: enS('A. Apple starts with A.') },
        { id: 'b', visual: { emoji: '🍌' }, text: 'B b', sub: 'banana', speak: enS('B. Banana starts with B.') },
        { id: 'o', visual: { emoji: '🍊' }, text: 'O o', sub: 'orange', speak: enS('O. Orange starts with O.') },
        { id: 'g', visual: { emoji: '🍇' }, text: 'G g', sub: 'grapes', speak: enS('G. Grapes starts with G.') },
      ],
    },
    {
      kind: 'exercise',
      id: 'e6',
      exercise: {
        kind: 'drag-match',
        id: 'letter-match',
        skill: 'en.phonics',
        prompt: enPrompt('Match the letter to the fruit.', '把字母拖到以它开头的水果上'),
        pairs: [
          { id: 'a', item: { text: 'A', speak: enS('A') }, target: { visual: { emoji: '🍎' }, speak: enS('apple') } },
          { id: 'b', item: { text: 'B', speak: enS('B') }, target: { visual: { emoji: '🍌' }, speak: enS('banana') } },
          { id: 'o', item: { text: 'O', speak: enS('O') }, target: { visual: { emoji: '🍊' }, speak: enS('orange') } },
          { id: 'g', item: { text: 'G', speak: enS('G') }, target: { visual: { emoji: '🍇' }, speak: enS('grapes') } },
        ],
        wrongHint: enPrompt('Tap the fruit and listen to the first sound.'),
      },
    },
    {
      kind: 'dialogue',
      id: 'e7-dialogue',
      title: enPrompt("Let's talk!", '点“Play”听对话，也可以点每一句'),
      lines: [
        { speaker: '👧', text: 'Hello! What do you like?', speak: enS('Hello! What do you like?') },
        { speaker: '👦', text: 'I like apples.', speak: enS('I like apples.') },
        { speaker: '👧', text: 'Me too! Here you are.', speak: enS('Me too! Here you are.') },
        { speaker: '👦', text: 'Thank you!', speak: enS('Thank you!') },
      ],
    },
    {
      kind: 'exercise',
      id: 'e8',
      exercise: {
        kind: 'choice',
        id: 'dialogue-bananas',
        skill: 'en.dialogue',
        prompt: enPrompt('Listen. What does she like?', '听一听，她喜欢什么？'),
        listen: enS('I like bananas.'),
        options: pictureOptions,
        answerId: 'banana',
        wrongHint: enPrompt('Listen again: I like bananas.'),
      },
    },
    {
      kind: 'picture-book',
      id: 'e9-book',
      title: enPrompt('Story time!', '看小绘本，点单词可以听'),
      pages: [
        { visual: { emoji: '🍎' }, text: 'I see an apple.', speak: enS('I see an apple.') },
        { visual: { emoji: '🍌' }, text: 'I see a banana.', speak: enS('I see a banana.') },
        { visual: { emoji: '🍊' }, text: 'I see an orange.', speak: enS('I see an orange.') },
        { visual: { emoji: '🍇' }, text: 'I see grapes.', speak: enS('I see grapes.') },
        { visual: { emoji: '😋' }, text: 'Yum, yum, yum!', speak: enS('Yum, yum, yum!') },
      ],
    },
    {
      kind: 'exercise',
      id: 'e10',
      exercise: {
        kind: 'truefalse',
        id: 'tf-grapes',
        skill: 'en.vocab-picture',
        prompt: enPrompt('Look and listen. Is it right?', '看图听句子，说得对吗？'),
        statement: { visual: { emoji: '🍇' }, text: 'This is a banana.', speak: enS('This is a banana.') },
        answer: false,
        wrongHint: enPrompt('Look again. These are grapes.'),
      },
    },
  ],
};

