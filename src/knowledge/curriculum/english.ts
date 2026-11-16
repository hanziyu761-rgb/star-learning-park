/**
 * 三～六年级英语知识点（本项目原创编写）。
 *
 * 以人教版 PEP 小学英语（三年级起点）公开的单元目录为单位，即题库 ChinaStudyFree 中的单元划分；
 * 每个单元作为一个知识点（话题词汇 + 核心句型），“能做什么”和单元之间的联系由本项目编写。
 * 话题之间多为 soft（有帮助）关系；语法上有明确先后的（如一般过去时的陈述句 → 特殊疑问句）标为 hard。
 * 一、二年级：人教版 PEP 从三年级开始，题库中没有一、二年级英语；APP 内另有原创英语启蒙课。
 * 未核对教材原文；已通过一线教师审核（2026-11-16）。Recycle 复习单元不单独设知识点。
 */
import type { KnowledgePoint, Strength } from '../graph';

type P = [string, Strength, string];

function E(
  grade: number,
  term: '上' | '下',
  unit: number,
  title: string,
  emoji: string,
  canDo: string,
  prereqs: P[] = [],
): KnowledgePoint {
  const t = term === '上' ? 'a' : 'b';
  return {
    id: `e${grade}.${t}${unit}`,
    subject: 'english',
    name: `${grade}${term} Unit ${unit} ${title}`,
    kidName: title,
    emoji,
    grade,
    term,
    order: (term === '上' ? 0 : 50) + unit,
    canDo,
    prerequisites: prereqs.map(([id, strength, why]) => ({ id, strength, why })),
    practicable: false,
    units: [`english-g${grade}${t}-u${unit}`],
  };
}

export const ENGLISH: KnowledgePoint[] = [
  /* ── 三年级 ── */
  E(3, '上', 1, 'Hello!', '👋', '会用 Hello / Hi / I’m… 打招呼、介绍自己。'),
  E(3, '上', 2, 'Colours', '🎨', '认读常见颜色词，能说出物品的颜色。'),
  E(3, '上', 3, 'Look at me!', '🙋', '认读身体部位词，能听指令做动作。'),
  E(3, '上', 4, 'We love animals', '🐼', '认读常见动物词。'),
  E(3, '上', 5, "Let's eat!", '🍞', '认读常见食物饮料，会礼貌地请别人吃东西、表达想要什么。'),
  E(3, '上', 6, 'Happy birthday!', '🎂', '会数 1～10，会问答年龄 How old are you?'),
  E(3, '下', 1, 'Welcome back to school!', '🏫', '会介绍新朋友，会问答来自哪里 Where are you from?', [
    ['e3.a1', 'soft', '在打招呼、介绍自己的基础上'],
  ]),
  E(3, '下', 2, 'My family', '👨‍👩‍👧', '认读家庭成员称谓，会问 Who’s that…?'),
  E(3, '下', 3, 'At the zoo', '🦒', '会用 fat / thin / tall / short 等描述动物外形。', [
    ['e3.a4', 'soft', '先认识动物名称'],
  ]),
  E(3, '下', 4, 'Where is my car?', '🚗', '会用 in / on / under 问答物品位置。'),
  E(3, '下', 5, 'Do you like pears?', '🍐', '认读水果词，会问答喜好 Do you like…?', [
    ['e3.a5', 'soft', '食物话题的延续'],
  ]),
  E(3, '下', 6, 'How many?', '🔢', '会数 11～20，会问 How many…?', [['e3.a6', 'hard', '要先会 1～10']]),
  /* ── 四年级 ── */
  E(4, '上', 1, 'My classroom', '🪑', '认读教室物品，会描述教室里有什么、在哪里。', [['e3.b4', 'soft', '方位介词']]),
  E(4, '上', 2, 'My schoolbag', '🎒', '认读文具和书本，会问 What’s in your schoolbag?'),
  E(4, '上', 3, 'My friends', '🧑‍🤝‍🧑', '会描述朋友的外貌和性格。', [['e3.b3', 'soft', '描述外形的形容词']]),
  E(4, '上', 4, 'My home', '🏠', '认读房间名称，会问答人或物在哪个房间。', [['e4.a1', 'soft', '描述位置的句型']]),
  E(4, '上', 5, "Dinner's ready", '🍽️', '认读食物和餐具，会问 What would you like?', [
    ['e3.a5', 'soft', '食物话题的延续'],
  ]),
  E(4, '上', 6, 'Meet my family!', '👪', '会介绍家庭成员和人数 How many people are there in your family?', [
    ['e3.b2', 'soft', '家庭成员称谓'],
  ]),
  E(4, '下', 1, 'My school', '🏫', '认读学校场所，会问 Where’s the…? Is this the…?'),
  E(4, '下', 2, 'What time is it?', '⏰', '会问答时间，会说 It’s time for… / It’s time to…', [
    ['e3.b6', 'soft', '时间要用到数字'],
  ]),
  E(4, '下', 3, 'Weather', '🌦️', '会问答天气 What’s the weather like?'),
  E(4, '下', 4, 'At the farm', '🐄', '认读农场动物和蔬菜，会用名词复数 Are these…?', [
    ['e3.b3', 'soft', '动物话题的延续'],
  ]),
  E(4, '下', 5, 'My clothes', '👕', '认读衣物，会问 Whose is this?', [['e3.a2', 'soft', '描述衣服要用颜色']]),
  E(4, '下', 6, 'Shopping', '🛍️', '会询问价格 How much is…? 进行简单购物。', [['e3.b6', 'hard', '说价格要会数字']]),
  /* ── 五年级 ── */
  E(5, '上', 1, "What's he like?", '🧑‍🏫', '会问答人物的特征 What’s he like?', [['e4.a3', 'soft', '描述人物的形容词']]),
  E(5, '上', 2, 'My week', '📆', '认读星期和课程，会问 What do you have on Mondays?'),
  E(5, '上', 3, 'What would you like?', '🍔', '会问答想吃想喝什么 What would you like to eat?', [
    ['e4.a5', 'soft', '同一句型的延续'],
  ]),
  E(5, '上', 4, 'What can you do?', '🏊', '会用 can 问答能力 What can you do?'),
  E(5, '上', 5, 'There is a big bed', '🛏️', '会用 There is / There are 描述房间。', [
    ['e4.a4', 'soft', '房间和家具话题'],
  ]),
  E(5, '上', 6, 'In a nature park', '🏞️', '认读自然景物，会问 Is there a…? Are there any…?', [
    ['e5.a5', 'hard', '在 There is / are 陈述句基础上学疑问句'],
  ]),
  E(5, '下', 1, 'My day', '🌞', '会问答日常作息 When do you…?', [
    ['e4.b2', 'hard', '要会表达时间'],
    ['e5.a2', 'soft', '星期的说法'],
  ]),
  E(5, '下', 2, 'My favourite season', '🍂', '认读四季，会问 Which season do you like best?', [
    ['e4.b3', 'soft', '描述季节要用天气词'],
  ]),
  E(5, '下', 3, 'My school calendar', '🗓️', '认读月份，会问答节日、活动在几月。'),
  E(5, '下', 4, 'When is the art show?', '🎨', '会用序数词表达日期 It’s on May 1st.', [
    ['e5.b3', 'hard', '日期由月份和序数词组成'],
  ]),
  E(5, '下', 5, 'Whose dog is it?', '🐕', '会用名词性物主代词 mine / yours 等，初步接触现在进行时。', [
    ['e4.b5', 'soft', 'Whose 句型的延续'],
  ]),
  E(5, '下', 6, 'Work quietly!', '🤫', '会用现在进行时描述正在做的事，会说公共场所规则。', [
    ['e5.b5', 'soft', '现在进行时的延续'],
  ]),
  /* ── 六年级 ── */
  E(6, '上', 1, 'How can I get there?', '🗺️', '会问路、指路。', [['e4.b1', 'soft', '场所名称']]),
  E(6, '上', 2, 'Ways to go to school', '🚲', '会问答交通方式 How do you come to school?', [
    ['e6.a1', 'soft', '出行话题的延续'],
  ]),
  E(6, '上', 3, 'My weekend plan', '🎡', '会用 be going to 谈论计划。', [['e5.b1', 'soft', '日常活动短语']]),
  E(6, '上', 4, 'I have a pen pal', '✉️', '会谈论爱好，会用一般现在时第三人称单数。', [
    ['e5.b1', 'soft', '一般现在时的延续'],
  ]),
  E(6, '上', 5, 'What does he do?', '👩‍⚕️', '会问答职业和工作地点。', [
    ['e6.a4', 'hard', '要会第三人称单数 does'],
    ['e4.a6', 'soft', '家庭成员的职业'],
  ]),
  E(6, '上', 6, 'How do you feel?', '😊', '会表达情绪并给出建议。', [['e4.a3', 'soft', '描述人的形容词']]),
  E(6, '下', 1, 'How tall are you?', '📏', '会用形容词比较级比较人和物。', [['e5.a1', 'soft', '描述人物的形容词']]),
  E(6, '下', 2, 'Last weekend', '🧺', '会用一般过去时谈论过去做的事。', [['e6.a3', 'soft', '谈论周末活动']]),
  E(6, '下', 3, 'Where did you go?', '✈️', '会用一般过去时的特殊疑问句问答经历。', [
    ['e6.b2', 'hard', '在一般过去时陈述句的基础上学疑问句'],
  ]),
  E(6, '下', 4, 'Then and now', '🕰️', '会对比过去和现在的变化。', [['e6.b2', 'hard', '要会一般过去时']]),
];
