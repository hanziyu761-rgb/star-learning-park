import type { BlocksLevel, Lesson } from './types';

// 四年级：AI 小小研究员 — 理解人工智能基本原理。8 lessons; project in lesson 8.
// Accuracy notes:
// - Machine learning = the computer finds patterns from data, instead of a
//   person writing every rule. A model is what was learned; a prediction is the
//   model's answer for new data, and it can be wrong.
// - The training lab is a labelled SIMULATION (nearest-example). The decision
//   tree game is a real algorithm.
// - AI-generated images may have flaws, but no visible flaw does not prove an image is real.

// A corridor maze: every cell except the given path is a wall.
function corridor(width: number, height: number, path: [number, number][]): { x: number; y: number }[] {
  const open = new Set(path.map(([x, y]) => `${x},${y}`));
  const walls: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (!open.has(`${x},${y}`)) walls.push({ x, y });
  return walls;
}
const line = (from: [number, number], to: [number, number]): [number, number][] => {
  const out: [number, number][] = [];
  const dx = Math.sign(to[0] - from[0]), dy = Math.sign(to[1] - from[1]);
  for (let [x, y] = from; ; x += dx, y += dy) { out.push([x, y]); if (x === to[0] && y === to[1]) break; }
  return out;
};

const LOOP_LEVELS: BlocksLevel[] = [
  { id: 'r1', width: 6, height: 3, start: { x: 0, y: 1, dir: 1 }, goal: { x: 5, y: 1 }, walls: [], maxBlocks: 4 },
  { id: 'r2', width: 5, height: 5, start: { x: 0, y: 4, dir: 0 }, goal: { x: 4, y: 0 }, walls: corridor(5, 5, [...line([0, 4], [0, 0]), ...line([0, 0], [4, 0])]), maxBlocks: 7 },
  { id: 'r3', width: 6, height: 6, start: { x: 0, y: 0, dir: 2 }, goal: { x: 5, y: 0 }, walls: corridor(6, 6, [...line([0, 0], [0, 5]), ...line([0, 5], [5, 5]), ...line([5, 5], [5, 0])]), maxBlocks: 14 },
];

export const GRADE4: Lesson[] = [
  {
    id: 'g4-l1', grade: 4, order: 1, module: 'principle', title: '机器学习', icon: '🧠', minutes: 30,
    goals: ['知道让电脑变聪明有两种办法：人写规则、从数据中学习', '能说出什么是机器学习', '知道机器学习需要大量、高质量的数据'],
    prerequisites: ['g2-l4'],
    knowledgePoints: [
      { id: 'g4-kp-ml', name: '机器学习是让电脑从数据中找规律', dimension: 'cognition', prerequisites: ['g2-kp-learn-features'] },
      { id: 'g4-kp-rules-vs-learning', name: '人写规则和机器学习的区别', dimension: 'cognition', prerequisites: ['g4-kp-ml', 'g2-kp-if-else'] },
      { id: 'g4-kp-ml-needs-data', name: '机器学习需要大量好数据', dimension: 'cognition', prerequisites: ['g2-kp-data-patterns'] },
    ],
    lifeExamples: [
      { icon: '📧', text: '邮箱能把垃圾邮件挑出来，是因为它从大量被标记过的邮件里学到了规律。' },
      { icon: '🧮', text: '计算器算 3 + 5，用的是人写好的规则，不需要学习。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '两种办法', text: '让电脑完成任务有两种办法：一种是人把规则一条条写好；另一种是让电脑从数据中自己找规律。', visual: '📜 人写规则  /  📊 ➜ 🧠 从数据学' },
      { kind: 'explain', id: 's2', title: '人写规则', text: '规则很清楚的事，适合人来写规则，比如计算器算加法、闹钟每天 7 点响。', visual: '🧮 ⏰ ✅' },
      { kind: 'explain', id: 's3', title: '机器学习', text: '"怎样认出一只猫"很难写成规则。于是人们给电脑看大量带标签的图片，让它自己找规律，这就是机器学习。', visual: '🐱🐱🐱🐱 + 🏷️ ➜ 🧠' },
      { kind: 'explain', id: 's4', title: '数据是关键', text: '机器学习学到的规律，全靠数据。数据太少、标签错了、不够多样，都会让它学不好。', visual: '📊✅ ➜ 🧠✅   📊❌ ➜ 🧠❌' },
      {
        kind: 'sort', id: 'a1', title: '分一分：人写规则，还是从数据中学习？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '人写好的规则', icon: '📜' }, b: { label: '从数据中学习', icon: '🧠' } },
        knowledgePoints: ['g4-kp-rules-vs-learning'],
        items: [
          { id: 'i1', label: '计算器算 3 + 5', icon: '🧮', bin: 'a', why: '加法规则很清楚，人直接写好了。' },
          { id: 'i2', label: '闹钟每天早上 7 点响', icon: '⏰', bin: 'a', why: '按设定的时间响，是固定规则。' },
          { id: 'i3', label: '洗衣机按"快洗"程序转 15 分钟', icon: '🧺', bin: 'a', why: '程序是人设定好的步骤。' },
          { id: 'i4', label: '识花软件认出花的名字', icon: '🌸', bin: 'b', why: '它从大量带标签的花的图片里学习。' },
          { id: 'i5', label: '邮箱自动挑出垃圾邮件', icon: '📧', bin: 'b', why: '它从大量被标记过的邮件里学到规律。' },
          { id: 'i6', label: '视频软件推荐你可能喜欢的动画', icon: '📺', bin: 'b', why: '它从很多人的观看数据里学习。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '"认出同学的笔迹"这件事，适合人写规则，还是适合机器学习？',
        choices: [{ id: 'c1', label: '机器学习，规则太难写' }, { id: 'c2', label: '人写规则就够了' }, { id: 'c3', label: '我不确定' }],
        discussion: '每个人的字都不一样，同一个人每次写的也不完全一样，很难写成规则。这种事更适合用大量例子让电脑学习。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q41-1', prompt: '什么是机器学习？', options: [{ id: 'a', label: '让电脑从数据中找规律', icon: '🧠' }, { id: 'b', label: '让机器人去上学', icon: '🏫' }], answer: 'a', explain: '机器学习是让电脑从数据中自己找规律。', knowledgePoints: ['g4-kp-ml'] },
          { id: 'q41-2', prompt: '哪件事更适合人直接写规则？', options: [{ id: 'a', label: '把摄氏度换算成华氏度', icon: '🌡️' }, { id: 'b', label: '认出照片里的人在笑还是在哭', icon: '😊' }], answer: 'a', explain: '换算有固定公式，规则很清楚。', knowledgePoints: ['g4-kp-rules-vs-learning'] },
          { id: 'q41-3', prompt: '训练数据里很多标签都贴错了，机器学习会怎样？', options: [{ id: 'a', label: '学到错的规律', icon: '❌' }, { id: 'b', label: '自动改正', icon: '✅' }], answer: 'a', explain: '机器学习的规律全靠数据，数据错了就学错。', knowledgePoints: ['g4-kp-ml-needs-data'] },
          { id: 'q41-4', prompt: '机器学习通常需要多少数据？', options: [{ id: 'a', label: '很多很多', icon: '📚' }, { id: 'b', label: '一两个就够', icon: '1️⃣' }], answer: 'a', explain: '数据越多、越多样，越容易找到可靠的规律。', knowledgePoints: ['g4-kp-ml-needs-data'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：规则还是学习？', instruction: '和家长一起找出家里 3 样"按规则工作"的东西和 2 样"可能用到机器学习"的东西，说说你是怎么判断的。' },
    ],
    rubric: [
      '在提示下能说出机器学习是从数据中学习',
      '能区分人写规则和机器学习',
      '能判断一件事更适合哪种办法，并说出理由',
      '能说明数据质量如何影响机器学习的结果',
    ],
    parentGuide: {
      summary: '这节课是四年级"AI 原理"的起点：理解"人写规则"和"机器学习"的区别，以及数据为什么是关键。',
      homeActivity: '在家里找找按固定规则工作的电器，和可能用到机器学习的手机功能，和孩子一起讨论。',
    },
    reviewed: true,
  },
  {
    id: 'g4-l2', grade: 4, order: 2, module: 'principle', title: '训练数据与测试数据', icon: '📝', minutes: 30,
    goals: ['知道训练数据用来学习，测试数据用来检验', '知道测试数据必须是模型没学过的', '知道"背答案"不等于学会'],
    prerequisites: ['g4-l1', 'g2-l7'],
    knowledgePoints: [
      { id: 'g4-kp-train-set', name: '训练数据用来学习', dimension: 'cognition', prerequisites: ['g2-kp-train-test', 'g4-kp-ml'] },
      { id: 'g4-kp-test-set', name: '测试数据必须是没学过的', dimension: 'critical', prerequisites: ['g2-kp-train-test'] },
      { id: 'g4-kp-memorize', name: '"背答案"不等于学会', dimension: 'critical', prerequisites: ['g4-kp-test-set'] },
    ],
    lifeExamples: [
      { icon: '📚', text: '平时做的练习题像训练数据；考试出新题，像测试数据。' },
      { icon: '🧑‍🍳', text: '学做菜的人只在家练习还不够，要做给别人尝一尝，才知道做得好不好。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '训练数据', text: '给模型学习用的数据，叫训练数据。模型从里面找规律。', visual: '📊 ➜ 🧠' },
      { kind: 'explain', id: 's2', title: '测试数据', text: '学完以后，要用模型没见过的数据检验它，这些数据叫测试数据。', visual: '🆕 ➜ 🧠 ➜ 📈' },
      { kind: 'explain', id: 's3', title: '不能用原题考', text: '如果用学过的数据考，模型可能只是"记住了答案"，分数很高，却不说明它真的学会了。', visual: '📝 原题 100 分 ≠ 学会' },
      {
        kind: 'trainlab', id: 'a1', title: '两次考试：哪个成绩更可信？', preset: 'exam',
        instruction: '模型已经学过 5 个水果。分别用"学过的水果"和"没见过的水果"考它，比一比。',
        knowledgePoints: ['g4-kp-test-set', 'g4-kp-memorize'],
        explain: '用学过的水果考，模型只要"记住"就能全对；用没见过的水果考，才能看出它是不是真的找到了规律。所以测试数据必须是模型没学过的。',
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '考试 B 里，模型把"黄苹果"认成了香蕉。你觉得是为什么？',
        choices: [{ id: 'c1', label: '它学过的苹果都是红的，黄色的只有香蕉' }, { id: 'c2', label: '黄苹果其实就是香蕉' }, { id: 'c3', label: '我不确定' }],
        discussion: '模型只见过红苹果，又比较看重颜色，所以看到黄色就想到香蕉。这说明训练数据不够多样，下一节"数据偏差"会继续研究。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q42-1', prompt: '给模型学习用的数据叫什么？', options: [{ id: 'a', label: '训练数据', icon: '📊' }, { id: 'b', label: '测试数据', icon: '📝' }], answer: 'a', explain: '用来学习的是训练数据。', knowledgePoints: ['g4-kp-train-set'] },
          { id: 'q42-2', prompt: '测试数据应该是什么样的？', options: [{ id: 'a', label: '模型没学过的', icon: '🆕' }, { id: 'b', label: '和训练数据一模一样', icon: '🟰' }], answer: 'a', explain: '用没学过的数据测试，才知道它是不是真的学会了。', knowledgePoints: ['g4-kp-test-set'] },
          { id: 'q42-3', prompt: '一个模型用学过的数据考了 100 分，用新数据只考了 50 分，说明什么？', options: [{ id: 'a', label: '它主要是记住了答案', icon: '🙈' }, { id: 'b', label: '它学得非常好', icon: '🏆' }], answer: 'a', explain: '只会背答案，遇到新数据就不行了。', knowledgePoints: ['g4-kp-memorize'] },
          { id: 'q42-4', prompt: '平时练习题和考试新题，哪个像测试数据？', options: [{ id: 'a', label: '考试新题', icon: '📝' }, { id: 'b', label: '平时练习题', icon: '📚' }], answer: 'a', explain: '考试用新题，就像用测试数据检验。', knowledgePoints: ['g4-kp-test-set'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：出一份"新题"', instruction: '请家长从你学过的课文里出 3 道没做过的新题考你。说说为什么新题比原题更能看出你学会了没有。' },
    ],
    rubric: [
      '在提示下能分清训练数据和测试数据',
      '能说出测试数据必须是没学过的',
      '能解释为什么用原题测试不可信',
      '能为一个任务设计合理的训练数据和测试数据',
    ],
    parentGuide: {
      summary: '这节课通过"两次考试"的模拟实验，理解训练数据和测试数据为什么要分开。模拟实验不是真正的 AI 模型，页面上有说明。',
      homeActivity: '考考孩子学过的知识时，试着出没做过的新题，和孩子聊聊"新题"和"原题"的区别。',
    },
    reviewed: true,
  },
  {
    id: 'g4-l3', grade: 4, order: 3, module: 'principle', title: '模型和预测', icon: '🔮', minutes: 25,
    goals: ['知道模型是从数据里学到的规律', '知道预测是用模型给新数据一个答案', '知道预测可能出错，"有 90% 把握"也不代表一定对'],
    prerequisites: ['g4-l2'],
    knowledgePoints: [
      { id: 'g4-kp-model', name: '模型是从数据中学到的规律', dimension: 'cognition', prerequisites: ['g4-kp-ml', 'g4-kp-train-set'] },
      { id: 'g4-kp-prediction', name: '预测是用模型回答新问题', dimension: 'cognition', prerequisites: ['g4-kp-model'] },
      { id: 'g4-kp-confidence', name: '预测可能出错，把握不等于正确', dimension: 'critical', prerequisites: ['g4-kp-prediction'] },
    ],
    lifeExamples: [
      { icon: '🌦️', text: '天气预报说"明天降水概率 70%"，意思是很可能下雨，但不一定下。' },
      { icon: '⌨️', text: '输入法会猜你下一个要打的字，猜对了很方便，猜错了要自己改。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是模型', text: '机器学习从训练数据里学到的规律，叫模型。就像你做了很多题以后，心里总结出的解题方法。', visual: '📊 ➜ 🧠 模型' },
      { kind: 'explain', id: 's2', title: '什么是预测', text: '用模型给新数据一个答案，叫预测。比如给它一张新照片，它说"这是猫"。', visual: '🆕📷 ➜ 🧠 ➜ "猫"' },
      { kind: 'explain', id: 's3', title: '把握不等于正确', text: '有的 AI 会说"有 90% 的可能是猫"。90% 是它的把握，不是保证，它仍然可能错。', visual: '🧠 90% 猫 ➜ 🐶？' },
      {
        kind: 'sort', id: 'a1', title: '分一分：训练阶段还是预测阶段？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '训练（学规律）', icon: '📊' }, b: { label: '预测（用规律）', icon: '🔮' } },
        knowledgePoints: ['g4-kp-model', 'g4-kp-prediction'],
        items: [
          { id: 'i1', label: '给模型看 1000 张带标签的猫狗照片', icon: '🖼️', bin: 'a', why: '用带标签的数据学习，是训练。' },
          { id: 'i2', label: '改正贴错的标签，让模型重新学', icon: '🏷️', bin: 'a', why: '重新学习也是训练。' },
          { id: 'i3', label: '模型从很多邮件里找出垃圾邮件的特点', icon: '📧', bin: 'a', why: '找规律是训练。' },
          { id: 'i4', label: '给模型一张新照片，它说"是猫"', icon: '🐱', bin: 'b', why: '用学到的规律回答新问题，是预测。' },
          { id: 'i5', label: '输入法猜你下一个要打的字', icon: '⌨️', bin: 'b', why: '根据规律猜新的结果，是预测。' },
          { id: 'i6', label: '邮箱判断一封新邮件是不是垃圾邮件', icon: '📥', bin: 'b', why: '对新邮件下判断，是预测。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: 'AI 说"有 99% 的可能是毒蘑菇"，另一个说"有 99% 的可能能吃"。你会直接吃吗？',
        choices: [{ id: 'c1', label: '不吃，要问专业的人' }, { id: 'c2', label: '99% 很高，可以吃' }, { id: 'c3', label: '我不确定' }],
        discussion: '野生蘑菇千万不要自己采来吃！预测再有把握，也可能出错。和安全、健康有关的事，一定要问专业的人，不能只信 AI。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q43-1', prompt: '从训练数据里学到的规律叫什么？', options: [{ id: 'a', label: '模型', icon: '🧠' }, { id: 'b', label: '标签', icon: '🏷️' }], answer: 'a', explain: '学到的规律叫模型。', knowledgePoints: ['g4-kp-model'] },
          { id: 'q43-2', prompt: '天气软件说"明天很可能下雨"，这是什么？', options: [{ id: 'a', label: '预测', icon: '🔮' }, { id: 'b', label: '训练', icon: '📊' }], answer: 'a', explain: '对还没发生的事给出答案，是预测。', knowledgePoints: ['g4-kp-prediction'] },
          { id: 'q43-3', prompt: 'AI 说"有 90% 的可能是猫"，一定是猫吗？', options: [{ id: 'a', label: '不一定', icon: '🤔' }, { id: 'b', label: '一定是', icon: '💯' }], answer: 'a', explain: '90% 是把握，不是保证。', knowledgePoints: ['g4-kp-confidence'] },
          { id: 'q43-4', prompt: '预测出错时，最可能的原因是？', options: [{ id: 'a', label: '模型学到的规律不完整', icon: '🧩' }, { id: 'b', label: '电脑生气了', icon: '😠' }], answer: 'a', explain: '模型的规律来自数据，数据不够好，规律就不完整。', knowledgePoints: ['g4-kp-model', 'g4-kp-confidence'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：天气预报观察员', instruction: '连续 5 天记下天气预报说的降水概率，再记下实际有没有下雨。和家长一起看看：概率高的日子都下雨了吗？' },
    ],
    rubric: [
      '在提示下能说出模型和预测的意思',
      '能分清训练和预测两个阶段',
      '能说明"把握"不等于"正确"',
      '能举例说明哪些预测必须由人来把关',
    ],
    parentGuide: {
      summary: '这节课认识"模型"和"预测"，并理解：AI 的预测有把握程度，但不是保证。涉及安全和健康的事，一定要问专业的人。',
      homeActivity: '和孩子一起记录几天的天气预报和实际天气，讨论"降水概率"是什么意思。',
    },
    reviewed: true,
  },
  {
    id: 'g4-l4', grade: 4, order: 4, module: 'safety', title: '数据偏差', icon: '⚖️', minutes: 30,
    goals: ['知道训练数据不够全面叫数据偏差', '会通过补充多样的数据来减少偏差', '知道数据偏差可能让 AI 对一些人不公平'],
    prerequisites: ['g4-l2'],
    knowledgePoints: [
      { id: 'g4-kp-bias', name: '数据偏差', dimension: 'critical', prerequisites: ['g2-kp-diverse-examples', 'g4-kp-train-set'] },
      { id: 'g4-kp-fix-bias', name: '补充多样的数据来减少偏差', dimension: 'application', prerequisites: ['g4-kp-bias'] },
      { id: 'g4-kp-fairness', name: '偏差可能造成不公平', dimension: 'critical', prerequisites: ['g4-kp-bias'] },
    ],
    lifeExamples: [
      { icon: '🎙️', text: '如果语音识别主要用大人的声音训练，它就可能不太听得懂小朋友说话。' },
      { icon: '🗺️', text: '如果一个地图软件只收集了大城市的路况，它在小县城就可能不太准。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是数据偏差', text: '训练数据只代表了一部分情况，不够全面，就叫数据偏差。模型会把这一部分当成全部。', visual: '🍎🍎🍎 ➜ "苹果都是红的"' },
      { kind: 'explain', id: 's2', title: '偏差带来错误', text: '只见过红苹果的模型，看到青苹果，可能就认不出来。', visual: '🍏 ➜ 🧠 ➜ "梨？" ❌' },
      { kind: 'explain', id: 's3', title: '偏差可能不公平', text: '如果 AI 用来帮人做事，数据偏差可能让它对某些人表现得差，这就不公平了。所以收集数据时要照顾到各种各样的人和情况。', visual: '👧🧓👦👩 都要有' },
      {
        kind: 'trainlab', id: 'a1', title: '修好有偏差的模型', preset: 'bias',
        instruction: '这个模型认错了一些苹果。看看训练数据有什么问题，选择合适的例子加进去，再重新训练。',
        knowledgePoints: ['g4-kp-bias', 'g4-kp-fix-bias'],
        explain: '原来的训练数据里，苹果全是红的，模型就以为"绿的、黄的是梨"。补充不同颜色的苹果后，偏差变小了。再加一个红苹果是没有帮助的——要补的是缺少的那部分。',
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '为什么再加一个"红苹果"对修好模型没有帮助？',
        choices: [{ id: 'c1', label: '缺的是其他颜色的苹果' }, { id: 'c2', label: '红苹果太多会坏' }, { id: 'c3', label: '我不确定' }],
        discussion: '数据偏差的问题是"缺了一部分"。补充已经很多的那一类帮不上忙，要补缺少的那一类。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q44-1', prompt: '训练数据里的狗全是白色的，这是什么问题？', options: [{ id: 'a', label: '数据偏差', icon: '⚖️' }, { id: 'b', label: '没有问题', icon: '✅' }], answer: 'a', explain: '只代表了一部分情况，就是数据偏差。', knowledgePoints: ['g4-kp-bias'] },
          { id: 'q44-2', prompt: '怎样减少数据偏差？', options: [{ id: 'a', label: '补充缺少的、多样的数据', icon: '🌈' }, { id: 'b', label: '把同一张图片复制很多遍', icon: '📑' }], answer: 'a', explain: '要补缺少的那部分。', knowledgePoints: ['g4-kp-fix-bias'] },
          { id: 'q44-3', prompt: '语音识别主要用大人的声音训练，可能对谁不公平？', options: [{ id: 'a', label: '小朋友', icon: '🧒' }, { id: 'b', label: '没有人', icon: '🙅' }], answer: 'a', explain: '它可能不太听得懂小朋友的声音。', knowledgePoints: ['g4-kp-fairness'] },
          { id: 'q44-4', prompt: '收集训练数据时，应该注意什么？', options: [{ id: 'a', label: '照顾到各种人和情况', icon: '👨‍👩‍👧‍👦' }, { id: 'b', label: '越整齐一样越好', icon: '🟦' }], answer: 'a', explain: '数据要全面多样，才能减少偏差。', knowledgePoints: ['g4-kp-fix-bias', 'g4-kp-fairness'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：调查的偏差', instruction: '如果只问班上爱踢球的同学"最喜欢什么运动"，结果会怎样？和家长讨论：怎样问才能更公平地知道全班的想法？' },
    ],
    rubric: [
      '在提示下能说出什么是数据偏差',
      '能找出一组数据缺少的部分',
      '能通过补充合适的数据修好有偏差的模型',
      '能举例说明数据偏差为什么会造成不公平，并提出改进办法',
    ],
    parentGuide: {
      summary: '数据偏差是 AI 伦理的重要话题。孩子会在模拟实验中亲手发现并修正偏差，也会理解偏差可能带来的不公平。',
      homeActivity: '和孩子聊聊"只问一部分人"的调查会有什么问题，引导他想到"要照顾到各种各样的人"。',
    },
    reviewed: true,
  },
  {
    id: 'g4-l5', grade: 4, order: 5, module: 'safety', title: 'AI 为什么会犯错？', icon: '🐞', minutes: 25,
    goals: ['能说出 AI 犯错的常见原因', '知道遇到没见过的情况，AI 更容易出错', '知道重要的决定要由人来把关'],
    prerequisites: ['g4-l3', 'g4-l4'],
    knowledgePoints: [
      { id: 'g4-kp-error-reasons', name: 'AI 犯错的常见原因', dimension: 'critical', prerequisites: ['g4-kp-bias', 'g2-kp-wrong-label'] },
      { id: 'g4-kp-new-situations', name: '没见过的情况更容易出错', dimension: 'critical', prerequisites: ['g4-kp-test-set'] },
      { id: 'g4-kp-human-check', name: '重要决定要人来把关', dimension: 'critical', prerequisites: ['g4-kp-confidence'] },
    ],
    lifeExamples: [
      { icon: '🚗', text: '有的汽车有辅助驾驶功能，但驾驶员仍然要看路、握好方向盘，因为系统可能判断错。' },
      { icon: '🩺', text: 'AI 可以帮医生看片子，但最后由医生来判断和负责。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '数据的问题', text: '标签贴错、数据太少、数据有偏差，都会让模型学到不完整或错误的规律。', visual: '🏷️❌ 📉 ⚖️' },
      { kind: 'explain', id: 's2', title: '输入的问题', text: '照片太模糊、周围太吵、问题说得不清楚，模型也容易出错。', visual: '🌫️ 📢 ❓' },
      { kind: 'explain', id: 's3', title: '没见过的情况', text: '模型只会用学过的规律。遇到训练时从没见过的情况，它可能"硬猜"一个答案。', visual: '🆕❓ ➜ 🧠 🎲' },
      { kind: 'explain', id: 's4', title: '人来把关', text: '所以和安全、健康、公平有关的重要决定，要由人来检查、来负责。', visual: '🧠 建议 ➜ 🧑 决定' },
      {
        kind: 'sort', id: 'a1', title: '分一分：数据的问题还是输入的问题？', instruction: '每张卡片都会让 AI 出错。想想原因，放进筐里。',
        bins: { a: { label: '数据的问题', icon: '📊' }, b: { label: '输入的问题', icon: '📥' } },
        knowledgePoints: ['g4-kp-error-reasons'],
        items: [
          { id: 'i1', label: '训练时很多标签贴错了', icon: '🏷️', bin: 'a', why: '训练数据有错。' },
          { id: 'i2', label: '训练图片里没有黑色的猫', icon: '🐈', bin: 'a', why: '训练数据不全面，有偏差。' },
          { id: 'i3', label: '训练数据只有十几张图片', icon: '📉', bin: 'a', why: '训练数据太少。' },
          { id: 'i4', label: '照片拍得很模糊', icon: '🌫️', bin: 'b', why: '输入的照片质量太差。' },
          { id: 'i5', label: '说话时周围特别吵', icon: '📢', bin: 'b', why: '输入的声音不清楚。' },
          { id: 'i6', label: '问题写得含含糊糊', icon: '❓', bin: 'b', why: '输入的问题不清楚。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '学校用 AI 给作文打分，有同学觉得分数不对。应该怎么办？',
        choices: [{ id: 'c1', label: '请老师再看一看' }, { id: 'c2', label: 'AI 打的分一定对' }, { id: 'c3', label: '我不确定' }],
        discussion: 'AI 打分可能出错，比如没见过某种写法。和每个人有关的重要判断，应该允许请人复查，由老师来把关。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q45-1', prompt: '下面哪个是"数据的问题"？', options: [{ id: 'a', label: '训练数据太少', icon: '📉' }, { id: 'b', label: '照片拍糊了', icon: '🌫️' }], answer: 'a', explain: '训练数据太少，是数据的问题。', knowledgePoints: ['g4-kp-error-reasons'] },
          { id: 'q45-2', prompt: '只在白天的照片上训练的模型，晚上可能会怎样？', options: [{ id: 'a', label: '更容易出错', icon: '🌙' }, { id: 'b', label: '表现更好', icon: '🌞' }], answer: 'a', explain: '没见过的情况更容易出错。', knowledgePoints: ['g4-kp-new-situations'] },
          { id: 'q45-3', prompt: '辅助驾驶开着时，驾驶员可以睡觉吗？', options: [{ id: 'a', label: '不可以，要看路', icon: '👀' }, { id: 'b', label: '可以', icon: '😴' }], answer: 'a', explain: '系统可能判断错，人要随时把关。', knowledgePoints: ['g4-kp-human-check'] },
          { id: 'q45-4', prompt: '和健康有关的重要决定，应该由谁负责？', options: [{ id: 'a', label: '医生等专业的人', icon: '👩‍⚕️' }, { id: 'b', label: '只听 AI 的', icon: '🤖' }], answer: 'a', explain: 'AI 可以帮忙，但要由人来把关和负责。', knowledgePoints: ['g4-kp-human-check'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：AI 出错记录', instruction: '在家长陪同下，留意一次 AI 出错的情况（比如语音输入打错字、拍照识物认错），说说可能是什么原因。' },
    ],
    rubric: [
      '在提示下能说出一个 AI 出错的原因',
      '能分清数据的问题和输入的问题',
      '能解释为什么没见过的情况更容易出错',
      '能判断哪些事情必须由人来把关，并说明理由',
    ],
    parentGuide: {
      summary: '这节课总结 AI 犯错的原因，建立"AI 给建议，人来把关"的观念。',
      homeActivity: '遇到语音输入、拍照识物出错时，和孩子一起分析原因：是数据的问题，还是输入的问题？',
    },
    reviewed: true,
  },
  {
    id: 'g4-l6', grade: 4, order: 6, module: 'safety', title: 'AI 信息验证', icon: '🕵️', minutes: 25,
    goals: ['会用多个可靠来源交叉核对', '会看信息的来源和时间', '知道 AI 能生成很像真的图片，要看来源'],
    prerequisites: ['g3-l8'],
    knowledgePoints: [
      { id: 'g4-kp-cross-check', name: '多个可靠来源交叉核对', dimension: 'critical', prerequisites: ['g3-kp-reliable-source'] },
      { id: 'g4-kp-check-source', name: '看来源：谁说的、什么时候说的', dimension: 'critical', prerequisites: ['g3-kp-reliable-source'] },
      { id: 'g4-kp-ai-images', name: 'AI 能生成很像真的图片', dimension: 'critical', prerequisites: ['g3-kp-hallucination'] },
    ],
    lifeExamples: [
      { icon: '📰', text: '同一件事，看正规新闻机构的报道，比看陌生人转发的消息更可靠。' },
      { icon: '🖼️', text: '网上有"鲸鱼在城市上空飞"的图片，看起来很真，其实是电脑做出来的。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '交叉核对', text: '一个说法，用两三个可靠的来源核对，说法一致才更可信。只问同一个 AI 再问一遍，不算核对。', visual: '📚 + 👩‍🏫 + 🏛️ = ✅' },
      { kind: 'explain', id: 's2', title: '看来源', text: '问自己：是谁说的？是专业的机构吗？是什么时候说的？过时的信息也可能不对了。', visual: '👤？ 🏛️？ 📅？' },
      { kind: 'explain', id: 's3', title: 'AI 生成的图片', text: 'AI 可以生成看起来很真的照片。有时会有破绽，比如手指数量不对、文字乱七八糟。但没有破绽不代表是真的，还是要看来源。', visual: '🖐️6？ 🔤乱？ ➜ 📍来源' },
      { kind: 'explain', id: 's4', title: '点赞多不等于真', text: '转发多、点赞多，只说明很多人看过，不说明它是真的。', visual: '👍999 ≠ ✅' },
      {
        kind: 'sort', id: 'a1', title: '分一分：靠谱的核对方法吗？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '靠谱的方法', icon: '✅' }, b: { label: '不靠谱的方法', icon: '❌' } },
        knowledgePoints: ['g4-kp-cross-check', 'g4-kp-check-source'],
        items: [
          { id: 'i1', label: '查课本和百科全书', icon: '📚', bin: 'a', why: '课本和工具书经过专业审核。' },
          { id: 'i2', label: '问老师或相关专业的人', icon: '👩‍🏫', bin: 'a', why: '专业的人更可靠。' },
          { id: 'i3', label: '看正规新闻机构或政府网站', icon: '🏛️', bin: 'a', why: '有明确来源，可以追查。' },
          { id: 'i4', label: '点赞数多的就是真的', icon: '👍', bin: 'b', why: '点赞多不代表是真的。' },
          { id: 'i5', label: '群里很多人转发就是真的', icon: '🔁', bin: 'b', why: '转发多不代表是真的。' },
          { id: 'i6', label: '把同一个问题再问同一个 AI 一遍', icon: '🔄', bin: 'b', why: '同一个来源再问一遍，不算交叉核对。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '你看到一张"熊猫在雪地里骑自行车"的照片，你会怎么判断它是真是假？',
        choices: [{ id: 'c1', label: '看来源，查有没有可靠报道' }, { id: 'c2', label: '看起来很真，就是真的' }, { id: 'c3', label: '我不确定' }],
        discussion: '这样的照片很可能是电脑生成或修改的。看看是谁发的、有没有可靠的新闻报道。找不到可靠来源，就不要相信，也不要转发。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q46-1', prompt: '什么叫交叉核对？', options: [{ id: 'a', label: '用几个不同的可靠来源对一对', icon: '🔀' }, { id: 'b', label: '把一句话读两遍', icon: '🔁' }], answer: 'a', explain: '用不同的可靠来源对比，才是交叉核对。', knowledgePoints: ['g4-kp-cross-check'] },
          { id: 'q46-2', prompt: '核对信息时，要看哪些？', options: [{ id: 'a', label: '谁说的、什么时候说的', icon: '📅' }, { id: 'b', label: '字体好不好看', icon: '🔤' }], answer: 'a', explain: '来源和时间很重要。', knowledgePoints: ['g4-kp-check-source'] },
          { id: 'q46-3', prompt: '一张照片里的人手上有 6 根手指，说明什么？', options: [{ id: 'a', label: '可能是电脑生成的，要小心', icon: '🖐️' }, { id: 'b', label: '一定是真的', icon: '✅' }], answer: 'a', explain: '这是常见的破绽，但还要看来源确认。', knowledgePoints: ['g4-kp-ai-images'] },
          { id: 'q46-4', prompt: '一张图片看起来没有任何破绽，就一定是真的吗？', options: [{ id: 'a', label: '不一定，要看来源', icon: '📍' }, { id: 'b', label: '一定是真的', icon: '💯' }], answer: 'a', explain: '没有破绽不代表是真的。', knowledgePoints: ['g4-kp-ai-images'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：消息侦探', instruction: '和家长一起找一条最近看到的"新鲜事"，用两个可靠来源核对它，说说结果。' },
    ],
    rubric: [
      '在提示下能说出一个可靠的核对来源',
      '能分清靠谱和不靠谱的核对方法',
      '能用两个以上来源交叉核对一条信息',
      '能判断图片和消息的可信度，并说明为什么不转发未经核实的内容',
    ],
    parentGuide: {
      summary: '这节课学习交叉核对、看来源，并知道 AI 能生成很像真的图片。孩子会知道"点赞多、转发多"不代表真实。',
      homeActivity: '看到家庭群里的消息或图片时，和孩子一起当"消息侦探"，查一查来源。',
    },
    reviewed: true,
  },
  {
    id: 'g4-l7', grade: 4, order: 7, module: 'coding', title: '图形化编程进阶', icon: '🔁', minutes: 30,
    goals: ['知道"循环"就是重复执行', '会用"重复"积木让程序更短', '能发现程序里重复的模式'],
    prerequisites: ['g3-l9'],
    knowledgePoints: [
      { id: 'g4-kp-loop', name: '循环：重复执行', dimension: 'computational', prerequisites: ['g3-kp-blocks'] },
      { id: 'g4-kp-shorter', name: '用循环让程序更短', dimension: 'computational', prerequisites: ['g4-kp-loop'] },
      { id: 'g4-kp-pattern', name: '发现重复的模式', dimension: 'computational', prerequisites: ['g4-kp-loop', 'g3-kp-debug'] },
    ],
    lifeExamples: [
      { icon: '🏃', text: '体育老师说"绕操场跑 3 圈"，不用说"跑一圈、再跑一圈、再跑一圈"。' },
      { icon: '🎵', text: '歌曲里的"重复"记号，表示这一段再唱一遍。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是循环', text: '把同样的事情重复做几次，叫循环。程序里用"重复"积木表示。', visual: '🔁 3 × ⬆️ = ⬆️⬆️⬆️' },
      { kind: 'explain', id: 's2', title: '"重复"积木怎么用', text: '"重复 3 次"会把紧跟在它后面的那一块积木执行 3 次。后面一定要接一块动作积木。', visual: '🔁3 ⬆️ ➜ 前进 3 格' },
      { kind: 'explain', id: 's3', title: '找重复的模式', text: '写程序前先看看：哪些动作一直在重复？把它们换成循环，程序就更短、更清楚。', visual: '⬆️⬆️⬆️⬆️⬆️ ➜ 🔁3⬆️ ⬆️⬆️' },
      {
        kind: 'blocks', id: 'a1', title: '循环闯关：积木不够用了！', allowRepeat: true,
        instruction: '这次积木数量有限制，只靠一块块"前进"不够用。用"重复"积木试试！',
        knowledgePoints: ['g4-kp-loop', 'g4-kp-shorter', 'g4-kp-pattern'],
        levels: LOOP_LEVELS,
        explain: '你用循环写出了更短的程序。程序员常说：发现重复，就用循环。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q47-1', prompt: '"重复 3 次"后面接"前进一格"，机器人会走几格？', options: [{ id: 'a', label: '3 格' }, { id: 'b', label: '1 格' }], answer: 'a', explain: '重复 3 次前进，就走 3 格。', knowledgePoints: ['g4-kp-loop'] },
          { id: 'q47-2', prompt: '要前进 6 格，最少用几块积木？', options: [{ id: 'a', label: '4 块：重复 3 次 前进，重复 3 次 前进' }, { id: 'b', label: '6 块：前进写 6 遍' }], answer: 'a', explain: '用两次"重复 3 次"，只要 4 块。', knowledgePoints: ['g4-kp-shorter'] },
          { id: 'q47-3', prompt: '"重复 2 次"后面什么都没接，会怎样？', options: [{ id: 'a', label: '程序会出错', icon: '⚠️' }, { id: 'b', label: '机器人前进 2 格', icon: '⬆️' }], answer: 'a', explain: '"重复"后面一定要接一块动作积木。', knowledgePoints: ['g4-kp-loop'] },
          { id: 'q47-4', prompt: '下面哪件事最适合用循环？', options: [{ id: 'a', label: '跳绳跳 100 下', icon: '🪢' }, { id: 'b', label: '只说一次"你好"', icon: '👋' }], answer: 'a', explain: '一直重复的事，最适合用循环。', knowledgePoints: ['g4-kp-pattern'] },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '为什么程序员喜欢用循环，而不是把同一块积木写很多遍？',
        choices: [{ id: 'c1', label: '更短、更不容易写错' }, { id: 'c2', label: '因为看起来更酷' }, { id: 'c3', label: '我不确定' }],
        discussion: '循环让程序更短、更清楚。要改次数时，只改一个数字就行，不用数一大堆积木，也更不容易写错。',
      },
      { kind: 'task', id: 'k1', title: '实践任务：生活中的循环', instruction: '找出 3 件生活中"重复做"的事（比如刷牙来回刷、跳绳），用"重复 ___ 次：___"的格式写下来，说给家长听。' },
    ],
    rubric: [
      '在提示下能说出循环是重复执行',
      '能用"重复"积木完成第一关',
      '能找出重复的模式，用循环完成全部关卡',
      '能用最少的积木完成关卡，并解释循环让程序更好的原因',
    ],
    parentGuide: {
      summary: '这节课学习"循环"：发现重复的模式，用"重复"积木让程序更短。这是编程中最重要的思想之一。',
      homeActivity: '和孩子一起找生活中的"循环"，比如按楼梯数台阶、跳绳计数。',
    },
    reviewed: true,
  },
  {
    id: 'g4-l8', grade: 4, order: 8, module: 'principle', title: '简单分类算法', icon: '🌳', minutes: 35,
    goals: ['知道可以用一连串问题来分类（决策树）', '知道好的问题能把不同类别分开', '会用正确率评价分类方法', '完成年级项目：制作智能分类游戏'],
    prerequisites: ['g4-l1', 'g2-l4'],
    knowledgePoints: [
      { id: 'g4-kp-decision-tree', name: '用一连串问题来分类（决策树）', dimension: 'computational', prerequisites: ['g2-kp-if-else', 'g2-kp-classify'] },
      { id: 'g4-kp-separating-question', name: '好问题能把类别分开', dimension: 'computational', prerequisites: ['g2-kp-feature', 'g4-kp-decision-tree'] },
      { id: 'g4-kp-evaluate', name: '用正确率评价分类方法', dimension: 'critical', prerequisites: ['g4-kp-test-set'] },
      { id: 'g4-kp-design-classifier', name: '设计自己的分类方法', dimension: 'creation', prerequisites: ['g4-kp-separating-question'] },
    ],
    lifeExamples: [
      { icon: '🩺', text: '医生问诊时会一个问题接一个问题地问："发烧吗？""咳嗽吗？"这就像一棵决策树。' },
      { icon: '🎲', text: '"猜猜我想的是什么动物"游戏，用"是不是""有没有"的问题一步步猜出答案。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '用问题来分类', text: '先问一个问题，按"是"和"不是"分成两边；还分不清，就再问一个问题。画出来像一棵倒着长的树，所以叫决策树。', visual: '❓ ➜ 是 / 不是 ➜ ❓ ➜ 🏷️' },
      { kind: 'explain', id: 's2', title: '好问题', text: '好问题能把不同类别分得干干净净。比如"有羽毛吗？"——只有鸟有羽毛。', visual: '🪶 ➜ 🐦 | 🐟🐕' },
      { kind: 'explain', id: 's3', title: '不够好的问题', text: '"会飞吗？"就不够好：蝙蝠会飞但不是鸟，企鹅是鸟却不会飞。', visual: '🦇 会飞 ≠ 鸟   🐧 不会飞 = 鸟' },
      { kind: 'explain', id: 's4', title: '用正确率评价', text: '设计好分类方法以后，用很多卡片测试，看看答对多少，就知道它好不好。', visual: '🃏🃏🃏 ➜ ✅9/11' },
      {
        kind: 'sort', id: 'a1', title: '分一分：能把鸟和其他动物分开吗？', instruction: '哪个问题能把所有的鸟和其他动物分开？',
        bins: { a: { label: '能分开', icon: '✂️' }, b: { label: '分不开', icon: '🔗' } },
        knowledgePoints: ['g4-kp-separating-question'],
        items: [
          { id: 'i1', label: '有羽毛吗？', icon: '🪶', bin: 'a', why: '只有鸟有羽毛，能分开。' },
          { id: 'i2', label: '会飞吗？', icon: '🦇', bin: 'b', why: '蝙蝠会飞但不是鸟，企鹅是鸟却不会飞。' },
          { id: 'i3', label: '有眼睛吗？', icon: '👀', bin: 'b', why: '几乎所有动物都有眼睛，分不开。' },
          { id: 'i4', label: '会下蛋吗？', icon: '🥚', bin: 'b', why: '鱼、乌龟也会下蛋，分不开。' },
          { id: 'i5', label: '有翅膀吗？', icon: '🦋', bin: 'b', why: '蝴蝶、蝙蝠也有翅膀，分不开。' },
        ],
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q48-1', prompt: '用一连串"是/不是"的问题来分类，这种方法叫什么？', options: [{ id: 'a', label: '决策树', icon: '🌳' }, { id: 'b', label: '循环', icon: '🔁' }], answer: 'a', explain: '一连串问题组成决策树。', knowledgePoints: ['g4-kp-decision-tree'] },
          { id: 'q48-2', prompt: '要把鱼和其他动物分开，哪个问题更好？', options: [{ id: 'a', label: '用鳃呼吸吗？', icon: '🐟' }, { id: 'b', label: '生活在水里吗？', icon: '🌊' }], answer: 'a', explain: '鲸鱼、海豚也生活在水里，但它们用肺呼吸，不是鱼。', knowledgePoints: ['g4-kp-separating-question'] },
          { id: 'q48-3', prompt: '一个分类方法测了 11 张卡片，答对 7 张。怎样知道另一个方法更好？', options: [{ id: 'a', label: '用同样的卡片测，比答对数', icon: '⚖️' }, { id: 'b', label: '看哪个问题更长', icon: '📏' }], answer: 'a', explain: '用同样的测试数据比正确率。', knowledgePoints: ['g4-kp-evaluate'] },
          { id: 'q48-4', prompt: '决策树里的每个问题，答案有几种？', options: [{ id: 'a', label: '两种：是、不是' }, { id: 'b', label: '很多种' }], answer: 'a', explain: '这里每个问题都只有"是"和"不是"。', knowledgePoints: ['g4-kp-decision-tree'] },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果再加一张"鸭嘴兽"卡片（哺乳动物，会下蛋，有像鸭子一样的嘴），你的分类方法还能分对吗？',
        choices: [{ id: 'c1', label: '要看我问的问题' }, { id: 'c2', label: '一定能分对' }, { id: 'c3', label: '我不确定' }],
        discussion: '鸭嘴兽是很特别的哺乳动物。如果你的问题是"会下蛋吗"，就会分错。遇到新情况，好的分类方法也可能要修改——这和 AI 遇到没见过的情况会出错是一个道理。',
      },
      { kind: 'project', id: 'p1', title: '年级项目：制作智能分类游戏', instruction: '设计一棵决策树：先选第一个问题，再决定每条路是直接分类还是再问一个问题。用 11 张动物卡片测试，看看能分对几张。', editor: 'tree-game', knowledgePoints: ['g4-kp-design-classifier', 'g4-kp-evaluate'] },
    ],
    rubric: [
      '在提示下能用一个问题把动物分成两组',
      '能设计两层的决策树，并完成测试',
      '能根据测试结果找出不好的问题，修改后提高正确率',
      '能设计出全部分对的决策树，并解释为什么选这些问题',
    ],
    parentGuide: {
      summary: '决策树是真正的分类算法。孩子会自己设计分类规则，用 11 张动物卡片测试正确率，并在测试后改进。',
      homeActivity: '和孩子玩"猜动物"：一人想一种动物，另一人只能问"是不是/有没有"的问题，看几个问题能猜中。',
    },
    reviewed: true,
  },
];
