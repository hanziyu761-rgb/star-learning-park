import type { Lesson } from './types';

// 二年级：AI 小小训练师 — 理解 AI 学习的基本过程。7 lessons + grade project (lesson 7).
// Accuracy notes:
// - Data = information that is recorded (numbers, words, pictures, sounds).
// - AI "learns" by finding patterns (特征) in many labelled examples; we never
//   say it sees or understands like a person.
// - Speech recognition uses the surrounding words to pick between same-sounding characters.
// - The fruit project is a labelled SIMULATION, not a real model.

export const GRADE2: Lesson[] = [
  {
    id: 'g2-l1', grade: 2, order: 1, module: 'principle', title: '数据是什么？', icon: '📊', minutes: 20,
    goals: ['知道数据是记录下来的信息', '能说出数字、文字、图片、声音都可以是数据', '知道个人数据要保护'],
    prerequisites: ['g1-l1'],
    knowledgePoints: [
      { id: 'g2-kp-data', name: '数据是记录下来的信息', dimension: 'cognition', prerequisites: ['g1-kp-ai-program'] },
      { id: 'g2-kp-data-types', name: '数据有数字、文字、图片、声音', dimension: 'cognition', prerequisites: ['g2-kp-data'] },
      { id: 'g2-kp-data-patterns', name: '很多数据放在一起能发现规律', dimension: 'computational', prerequisites: ['g2-kp-data', 'g1-kp-ai-patterns'] },
      { id: 'g2-kp-personal-data', name: '个人数据要保护', dimension: 'critical', prerequisites: ['g1-kp-ai-safety'] },
    ],
    lifeExamples: [
      { icon: '🌡️', text: '天气预报记录了很多天的气温，这些气温就是数据。' },
      { icon: '📏', text: '体检时记下的身高和体重，也是数据。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是数据', text: '把看到的、听到的、量到的东西记录下来，就成了数据。', visual: '👀 👂 📏 ➜ 📝' },
      { kind: 'explain', id: 's2', title: '数据长什么样', text: '数据可以是数字，比如气温 25 度；也可以是文字、图片和声音。', visual: '🔢 🔤 🖼️ 🔊' },
      { kind: 'explain', id: 's3', title: '数据能发现规律', text: '记下一个月每天的气温，就能看出天气是越来越冷，还是越来越热。', visual: '📅 25° 23° 20° 18° ➜ 🥶' },
      { kind: 'explain', id: 's4', title: '数据是 AI 的"课本"', text: 'AI 就是从很多数据里找规律的。没有数据，AI 就学不会。', visual: '📚📚📚 ➜ 💡' },
      { kind: 'explain', id: 's5', title: '我的数据要保护', text: '你的名字、照片、声音、住址，都是关于你的数据，叫个人数据。不能随便给别人。', visual: '🧒 ➜ 🔒' },
      {
        kind: 'sort', id: 'a1', title: '分一分：这是哪种数据？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '数字或文字', icon: '🔢' }, b: { label: '图片或声音', icon: '🖼️' } },
        knowledgePoints: ['g2-kp-data-types'],
        items: [
          { id: 'i1', label: '一周的气温：25、27、22……', icon: '🌡️', bin: 'a', why: '气温是用数字记录的数据。' },
          { id: 'i2', label: '班级同学的身高表', icon: '📏', bin: 'a', why: '身高表里是数字。' },
          { id: 'i3', label: '一张购物清单', icon: '📝', bin: 'a', why: '清单是用文字记录的数据。' },
          { id: 'i4', label: '小猫的照片', icon: '🐱', bin: 'b', why: '照片是图片数据。' },
          { id: 'i5', label: '小鸟叫声的录音', icon: '🐦', bin: 'b', why: '录音是声音数据。' },
          { id: 'i6', label: '一幅蜡笔画', icon: '🖍️', bin: 'b', why: '画是图片数据。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '为什么天气预报要记录很多很多天的气温，而不是只记一天？',
        choices: [{ id: 'c1', label: '数据多了才能看出规律' }, { id: 'c2', label: '记一天就够了' }, { id: 'c3', label: '我不确定' }],
        discussion: '只有一天的数据，看不出变化。很多天的数据放在一起，才能发现"越来越冷"这样的规律。AI 学习也需要很多数据。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q21-1', prompt: '下面哪个是数据？', options: [{ id: 'a', label: '记下来的身高 120 厘米', icon: '📏' }, { id: 'b', label: '一阵风吹过，什么也没记', icon: '🌬️' }], answer: 'a', explain: '记录下来的信息才是数据。', knowledgePoints: ['g2-kp-data'] },
          { id: 'q21-2', prompt: '一段小狗叫声的录音，是哪种数据？', options: [{ id: 'a', label: '声音数据', icon: '🔊' }, { id: 'b', label: '数字数据', icon: '🔢' }], answer: 'a', explain: '录音是声音数据。', knowledgePoints: ['g2-kp-data-types'] },
          { id: 'q21-3', prompt: '想知道最近是不是越来越冷，需要什么？', options: [{ id: 'a', label: '很多天的气温记录', icon: '📅' }, { id: 'b', label: '只看今天的气温', icon: '1️⃣' }], answer: 'a', explain: '很多数据放在一起才能看出规律。', knowledgePoints: ['g2-kp-data-patterns'] },
          { id: 'q21-4', prompt: '哪个是要保护的个人数据？', options: [{ id: 'a', label: '我的照片', icon: '🤳' }, { id: 'b', label: '今天的气温', icon: '🌡️' }], answer: 'a', explain: '照片是关于你的数据，要保护。', knowledgePoints: ['g2-kp-personal-data'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：我是数据记录员', instruction: '连续 5 天，每天放学时和家长一起看看天气（晴、阴、雨），记在纸上。第 5 天说说你发现了什么。' },
    ],
    rubric: [
      '在提示下能说出"数据是记录下来的信息"',
      '能说出数据有数字、文字、图片、声音',
      '能说明为什么要很多数据才能发现规律',
      '能自己记录一组数据，并从中说出一个发现',
    ],
    parentGuide: {
      summary: '这节课认识"数据"。孩子会知道 AI 从数据中学习，也知道自己的照片、声音、住址是要保护的个人数据。',
      homeActivity: '和孩子一起连续几天记录天气或家里的用电、用水情况，最后一起看看有什么规律。',
    },
    reviewed: true,
  },
  {
    id: 'g2-l2', grade: 2, order: 2, module: 'principle', title: '数据分类', icon: '🧺', minutes: 20,
    goals: ['能说出"分类要先定规则"', '能把食物按颜色或形状分成两组', '知道换一条规则，分组结果就会变'],
    prerequisites: ['g2-l1'],
    knowledgePoints: [
      { id: 'g2-kp-classify', name: '分类要先定规则', dimension: 'computational', prerequisites: ['g2-kp-data'] },
      { id: 'g2-kp-rule-changes', name: '换规则，分组就会变', dimension: 'computational', prerequisites: ['g2-kp-classify'] },
      { id: 'g2-kp-ai-classify', name: 'AI 也常做分类', dimension: 'application', prerequisites: ['g2-kp-classify', 'g1-kp-vision'] },
    ],
    lifeExamples: [
      { icon: '♻️', text: '垃圾分类：可回收物、厨余垃圾、有害垃圾、其他垃圾，要按规则分。' },
      { icon: '🧸', text: '整理玩具箱：可以按大小分，也可以按颜色分。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是分类', text: '把有相同特点的东西放在一起，就是分类。', visual: '🍎🍓🍒 | 🥒🍏🥦' },
      { kind: 'explain', id: 's2', title: '先定规则', text: '分类之前要先说好规则，比如"按颜色分"。规则说清楚，大家分出来的才一样。', visual: '📏 规则 ➜ 🧺🧺' },
      { kind: 'explain', id: 's3', title: '换个规则试试', text: '同样的东西，按颜色分和按形状分，结果可能不一样。', visual: '🎨 颜色  vs  ⭕ 形状' },
      { kind: 'explain', id: 's4', title: 'AI 也会分类', text: '邮箱把广告邮件分出来，相册把同一个人的照片放在一起，都是 AI 在分类。', visual: '📧 ➜ 🗑️ / 📥' },
      {
        kind: 'sort', id: 'a1', title: '规则一：按颜色分', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '红色的', icon: '🔴' }, b: { label: '绿色的', icon: '🟢' } },
        knowledgePoints: ['g2-kp-classify'],
        items: [
          { id: 'i1', label: '红苹果', icon: '🍎', bin: 'a', why: '红苹果是红色的。' },
          { id: 'i2', label: '樱桃', icon: '🍒', bin: 'a', why: '樱桃是红色的。' },
          { id: 'i3', label: '红辣椒', icon: '🌶️', bin: 'a', why: '红辣椒是红色的。' },
          { id: 'i4', label: '青苹果', icon: '🍏', bin: 'b', why: '青苹果是绿色的。' },
          { id: 'i5', label: '黄瓜', icon: '🥒', bin: 'b', why: '黄瓜是绿色的。' },
          { id: 'i6', label: '绿色蜡笔', icon: '🖍️', bin: 'b', why: '这支蜡笔是绿色的。' },
        ],
      },
      {
        kind: 'sort', id: 'a2', title: '规则二：按形状分', instruction: '还是这些东西，这次按形状分。',
        bins: { a: { label: '圆圆的', icon: '⭕' }, b: { label: '长长的', icon: '➖' } },
        knowledgePoints: ['g2-kp-rule-changes'],
        items: [
          { id: 'i1', label: '红苹果', icon: '🍎', bin: 'a', why: '苹果是圆圆的。' },
          { id: 'i2', label: '樱桃', icon: '🍒', bin: 'a', why: '樱桃是圆圆的。' },
          { id: 'i4', label: '青苹果', icon: '🍏', bin: 'a', why: '青苹果也是圆圆的。' },
          { id: 'i3', label: '红辣椒', icon: '🌶️', bin: 'b', why: '辣椒是长长的。' },
          { id: 'i5', label: '黄瓜', icon: '🥒', bin: 'b', why: '黄瓜是长长的。' },
          { id: 'i6', label: '绿色蜡笔', icon: '🖍️', bin: 'b', why: '蜡笔是长长的。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '红苹果和青苹果，按颜色分时在不同的筐，按形状分时在同一个筐。为什么？',
        choices: [{ id: 'c1', label: '因为规则变了' }, { id: 'c2', label: '因为苹果变了' }, { id: 'c3', label: '我不确定' }],
        discussion: '苹果没有变，是规则变了。分类的结果由规则决定。给 AI 分类时，也要先想清楚按什么规则分。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q22-1', prompt: '分类之前，最先要做什么？', options: [{ id: 'a', label: '定好规则', icon: '📏' }, { id: 'b', label: '随便放', icon: '🎲' }], answer: 'a', explain: '先定规则，分类才清楚。', knowledgePoints: ['g2-kp-classify'] },
          { id: 'q22-2', prompt: '按"颜色"分，香蕉和柠檬会在一起吗？', options: [{ id: 'a', label: '会，都是黄色的', icon: '🍌' }, { id: 'b', label: '不会', icon: '🙅' }], answer: 'a', explain: '它们都是黄色的。', knowledgePoints: ['g2-kp-classify'] },
          { id: 'q22-3', prompt: '同样的东西换一条规则分，结果会怎样？', options: [{ id: 'a', label: '可能不一样' }, { id: 'b', label: '一定一样' }], answer: 'a', explain: '换规则，分组就可能变。', knowledgePoints: ['g2-kp-rule-changes'] },
          { id: 'q22-4', prompt: '邮箱自动把广告邮件放进一个文件夹，这是在做什么？', options: [{ id: 'a', label: '分类', icon: '🧺' }, { id: 'b', label: '画画', icon: '🎨' }], answer: 'a', explain: 'AI 常常帮我们做分类。', knowledgePoints: ['g2-kp-ai-classify'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：整理衣柜', instruction: '和家长一起，用两种不同的规则整理一次衣服（比如按颜色、按季节）。说说哪种规则更好用，为什么。' },
    ],
    rubric: [
      '在提示下能按一条规则分对',
      '能独立分对，并说出用的是什么规则',
      '能自己想出一条新的分类规则',
      '能说明数据不全会让分类出错（比如只见过红苹果）',
    ],
    parentGuide: {
      summary: '分类是 AI 最常做的事情之一。这节课让孩子体会：规则决定结果，换规则结果就会变。',
      homeActivity: '和孩子一起按两种不同规则整理一次衣柜或玩具，问问孩子哪种规则更好、为什么。',
    },
    reviewed: true,
  },
  {
    id: 'g2-l3', grade: 2, order: 3, module: 'principle', title: '图片标签', icon: '🏷️', minutes: 20,
    goals: ['知道标签是给数据起的名字', '知道标签要准确、说法要一致', '知道标签贴错了，AI 会学错'],
    prerequisites: ['g2-l2', 'g1-l5'],
    knowledgePoints: [
      { id: 'g2-kp-label', name: '标签是给数据起的名字', dimension: 'cognition', prerequisites: ['g1-kp-labels', 'g2-kp-data'] },
      { id: 'g2-kp-label-quality', name: '标签要准确、一致', dimension: 'critical', prerequisites: ['g2-kp-label'] },
      { id: 'g2-kp-wrong-label', name: '标签贴错，AI 会学错', dimension: 'critical', prerequisites: ['g2-kp-label'] },
    ],
    lifeExamples: [
      { icon: '🔤', text: '有些网站会请人看图片，然后写下"这是红绿灯""这是公交车"，这就是在给图片贴标签。' },
      { icon: '📒', text: '老师在作业本封面上写名字，大家一看就知道是谁的，名字就像一个标签。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是标签', text: '给一张图片写上"这是什么"，就是贴标签。比如给小猫的照片写上"猫"。', visual: '🐱 ➜ 🏷️ 猫' },
      { kind: 'explain', id: 's2', title: '谁来贴标签', text: '训练 AI 之前，常常要人一张一张地贴好标签。AI 再从这些带标签的图片里学习。', visual: '🧑‍🏫 🏷️🏷️🏷️ ➜ 💡' },
      { kind: 'explain', id: 's3', title: '说法要一样', text: '同一种东西，标签要用同一个说法。一会儿写"猫"，一会儿写"猫咪"，AI 会以为是两种东西。', visual: '🐱 猫 ✅   🐱 猫咪 ❓' },
      { kind: 'explain', id: 's4', title: '贴错会学错', text: '如果把小狗的照片贴成"猫"，AI 就会学错，以后可能把小狗认成猫。', visual: '🐶 🏷️猫 ➜ ❌' },
      {
        kind: 'sort', id: 'a1', title: '当一回标签员', instruction: '给每张图片贴上正确的标签：先点图片，再点标签筐。',
        bins: { a: { label: '猫', icon: '🐱' }, b: { label: '狗', icon: '🐶' } },
        knowledgePoints: ['g2-kp-label'],
        items: [
          { id: 'i1', label: '趴在沙发上的橘猫', icon: '🐈', bin: 'a', why: '这是一只猫。' },
          { id: 'i2', label: '在玩毛线球的小猫', icon: '🐱', bin: 'a', why: '这是一只猫。' },
          { id: 'i3', label: '黑白花纹的猫', icon: '🐈', bin: 'a', why: '这也是猫，颜色不同也是猫。' },
          { id: 'i4', label: '在草地上跑的小狗', icon: '🐕', bin: 'b', why: '这是一只狗。' },
          { id: 'i5', label: '戴项圈的狗', icon: '🐩', bin: 'b', why: '这是一只狗。' },
          { id: 'i6', label: '毛茸茸的小狗', icon: '🐶', bin: 'b', why: '这是一只狗。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果给 AI 学习的图片里，有一张小狗被贴成了"猫"，会发生什么？',
        choices: [{ id: 'c1', label: 'AI 可能会学错' }, { id: 'c2', label: '没关系' }, { id: 'c3', label: '我不确定' }],
        discussion: 'AI 不知道标签是错的，它会照着学。错的标签越多，AI 就越容易认错。所以贴标签要认真，贴完还要检查。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q23-1', prompt: '给图片写上"这是小鸟"，叫做什么？', options: [{ id: 'a', label: '贴标签', icon: '🏷️' }, { id: 'b', label: '拍照片', icon: '📷' }], answer: 'a', explain: '给数据写上名字，就是贴标签。', knowledgePoints: ['g2-kp-label'] },
          { id: 'q23-2', prompt: '同一种水果，标签应该怎样写？', options: [{ id: 'a', label: '每次都写"苹果"' }, { id: 'b', label: '有时写"苹果"，有时写"果子"' }], answer: 'a', explain: '说法一致，AI 才不会弄混。', knowledgePoints: ['g2-kp-label-quality'] },
          { id: 'q23-3', prompt: '很多小狗图片被贴成了"猫"，AI 学完会怎样？', options: [{ id: 'a', label: '可能把小狗认成猫', icon: '❌' }, { id: 'b', label: '一点影响也没有', icon: '✅' }], answer: 'a', explain: '标签错了，AI 就学错了。', knowledgePoints: ['g2-kp-wrong-label'] },
          { id: 'q23-4', prompt: '贴完标签后，最好再做什么？', options: [{ id: 'a', label: '检查一遍', icon: '🔍' }, { id: 'b', label: '马上扔掉', icon: '🗑️' }], answer: 'a', explain: '检查能发现贴错的标签。', knowledgePoints: ['g2-kp-label-quality'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：家庭标签员', instruction: '用便利贴给家里的 5 样东西贴上标签（比如"杯子""书"）。请家长检查有没有贴错、说法是不是一样。' },
    ],
    rubric: [
      '在提示下能给图片贴上标签',
      '能独立贴对标签，并知道说法要一致',
      '能找出别人贴错的标签',
      '能说明标签错了为什么会让 AI 学错',
    ],
    parentGuide: {
      summary: '标签是 AI 学习的重要一环。孩子会知道：标签要准确、一致，贴错了 AI 就会学错。',
      homeActivity: '和孩子一起用便利贴给家里的东西贴标签，再请孩子当"检查员"找出您故意贴错的一张。',
    },
    reviewed: true,
  },
  {
    id: 'g2-l4', grade: 2, order: 4, module: 'principle', title: 'AI 如何认识动物？', icon: '🦒', minutes: 20,
    goals: ['知道能帮助区分东西的特点叫"特征"', '知道 AI 从很多带标签的图片里找特征', '知道例子要多种多样，AI 才不容易认错'],
    prerequisites: ['g2-l3'],
    knowledgePoints: [
      { id: 'g2-kp-feature', name: '特征是能帮助区分的特点', dimension: 'cognition', prerequisites: ['g2-kp-classify'] },
      { id: 'g2-kp-learn-features', name: 'AI 从带标签的例子里找特征', dimension: 'cognition', prerequisites: ['g2-kp-feature', 'g2-kp-label'] },
      { id: 'g2-kp-diverse-examples', name: '例子要多种多样', dimension: 'critical', prerequisites: ['g2-kp-learn-features'] },
    ],
    lifeExamples: [
      { icon: '🐦', text: '我们认出小鸟，常常是因为它有羽毛、有翅膀、有尖尖的嘴。' },
      { icon: '📱', text: '识花软件看过很多花的照片，从中找到每种花的特点，才能说出花的名字。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是特征', text: '能帮我们区分东西的特点，叫特征。比如长颈鹿的特征是脖子很长。', visual: '🦒 ➜ 长脖子' },
      { kind: 'explain', id: 's2', title: 'AI 找特征', text: 'AI 看了很多写着"鸟"的图片，会自己找出它们常常有的特征，比如翅膀、羽毛。', visual: '🐦🦜🦆🦉 ➜ 🪶' },
      { kind: 'explain', id: 's3', title: 'AI 的找法和人不一样', text: 'AI 找到的特征，有时和人想的不一样。它靠的是大量例子里的规律，所以也可能找错。', visual: '🔍 ≠ 👀' },
      { kind: 'explain', id: 's4', title: '例子要多种多样', text: '如果只给 AI 看站着的鸟，它看到飞着的鸟可能就认不出来。例子越多种多样，AI 越不容易认错。', visual: '🐦 站着 + 🕊️ 飞着 = ✅' },
      {
        kind: 'sort', id: 'a1', title: '按特征分：是不是鸟？', instruction: '想一想它有没有羽毛和翅膀，再放进筐里。',
        bins: { a: { label: '是鸟', icon: '🐦' }, b: { label: '不是鸟', icon: '🙅' } },
        knowledgePoints: ['g2-kp-feature'],
        items: [
          { id: 'i1', label: '鹦鹉', icon: '🦜', bin: 'a', why: '鹦鹉有羽毛和翅膀，是鸟。' },
          { id: 'i2', label: '企鹅', icon: '🐧', bin: 'a', why: '企鹅不会飞，但有羽毛，也是鸟。' },
          { id: 'i3', label: '猫头鹰', icon: '🦉', bin: 'a', why: '猫头鹰有羽毛和翅膀，是鸟。' },
          { id: 'i4', label: '蝴蝶', icon: '🦋', bin: 'b', why: '蝴蝶有翅膀，但没有羽毛，它是昆虫。' },
          { id: 'i5', label: '蝙蝠', icon: '🦇', bin: 'b', why: '蝙蝠会飞，但没有羽毛，它是哺乳动物。' },
          { id: 'i6', label: '飞机', icon: '✈️', bin: 'b', why: '飞机会飞，但它是机器，不是动物。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果 AI 只用"会不会飞"来认鸟，它会犯什么错？',
        choices: [{ id: 'c1', label: '把蝴蝶、飞机也当成鸟' }, { id: 'c2', label: '不会犯错' }, { id: 'c3', label: '我不确定' }],
        discussion: '只看一个特征很容易出错：蝴蝶、蝙蝠、飞机都会飞，企鹅却不会飞。要看好几个特征，例子也要多种多样。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q24-1', prompt: '"斑马身上有黑白条纹"，这是斑马的什么？', options: [{ id: 'a', label: '特征', icon: '🦓' }, { id: 'b', label: '名字', icon: '🔤' }], answer: 'a', explain: '能帮我们认出斑马的特点，叫特征。', knowledgePoints: ['g2-kp-feature'] },
          { id: 'q24-2', prompt: 'AI 是怎么找到"鸟"的特征的？', options: [{ id: 'a', label: '看很多带"鸟"标签的图片', icon: '🖼️' }, { id: 'b', label: '它天生就知道', icon: '✨' }], answer: 'a', explain: 'AI 从很多带标签的例子里找特征。', knowledgePoints: ['g2-kp-learn-features'] },
          { id: 'q24-3', prompt: '只给 AI 看白色的狗，它看到黑色的狗可能会怎样？', options: [{ id: 'a', label: '可能认不出来' }, { id: 'b', label: '一定认得出来' }], answer: 'a', explain: '例子不够多样，AI 就容易认错。', knowledgePoints: ['g2-kp-diverse-examples'] },
          { id: 'q24-4', prompt: '企鹅不会飞，它是鸟吗？', options: [{ id: 'a', label: '是，它有羽毛', icon: '🐧' }, { id: 'b', label: '不是，因为不会飞', icon: '🙅' }], answer: 'a', explain: '企鹅有羽毛，是鸟。只看"会不会飞"会出错。', knowledgePoints: ['g2-kp-feature'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：特征侦探', instruction: '选一种你喜欢的动物，和家长一起说出它的 3 个特征。再想一想：有没有别的动物也有这些特征？' },
    ],
    rubric: [
      '在提示下能说出一种动物的一个特征',
      '能说出"AI 从带标签的例子里找特征"',
      '能举例说明只看一个特征会出错',
      '能说明为什么给 AI 的例子要多种多样',
    ],
    parentGuide: {
      summary: '这节课用"特征"解释 AI 怎样认识动物，并让孩子明白：AI 靠大量例子找规律，例子不够多样就容易出错。',
      homeActivity: '玩"猜动物"游戏：一人说特征，一人猜。说一个特征猜不出来时，讨论为什么需要更多特征。',
    },
    reviewed: true,
  },
  {
    id: 'g2-l5', grade: 2, order: 5, module: 'enlighten', title: '语音识别体验', icon: '🗣️', minutes: 20,
    goals: ['知道很多字读音相同（同音字）', '知道语音识别会根据前后的词来选字', '知道语音识别也会选错字，要检查'],
    prerequisites: ['g1-l4'],
    knowledgePoints: [
      { id: 'g2-kp-homophone', name: '同音字让语音识别更难', dimension: 'cognition', prerequisites: ['g1-kp-asr'] },
      { id: 'g2-kp-context', name: '语音识别根据前后的词来选字', dimension: 'cognition', prerequisites: ['g2-kp-homophone'] },
      { id: 'g2-kp-check-asr', name: '语音转出的文字要检查', dimension: 'critical', prerequisites: ['g1-kp-asr-conditions'] },
    ],
    lifeExamples: [
      { icon: '⌨️', text: '用"说话打字"时，有时会打出读音一样、意思不对的字。' },
      { icon: '📺', text: '有的视频会自动配字幕，字幕偶尔会出现错别字。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '同音字', text: '"书"和"叔"读音一样，都读 shū。读音相同的字叫同音字。', visual: '📕 书 = 👨 叔 = shū' },
      { kind: 'explain', id: 's2', title: '电脑的难题', text: '语音识别只听到"shū"，它要猜：是"书"还是"叔"？', visual: '👂 shū ➜ 书？叔？' },
      { kind: 'explain', id: 's3', title: '看前后的词', text: '听到"我在看一本 shū"，前面有"看一本"，所以更可能是"书"。语音识别就是这样根据前后的词来选字的。', visual: '看一本 + shū ➜ 书 ✅' },
      { kind: 'explain', id: 's4', title: '也会选错', text: '前后的词不够清楚时，语音识别也会选错字。所以转出来的文字要读一遍、检查一遍。', visual: '📝 ➜ 🔍 ➜ ✅' },
      {
        kind: 'sort', id: 'a1', title: '帮语音识别选字', instruction: '读一读句子，看看括号里的 shū 应该是哪个字。',
        bins: { a: { label: '书（看的书）', icon: '📕' }, b: { label: '叔（叔叔）', icon: '👨' } },
        knowledgePoints: ['g2-kp-context'],
        items: [
          { id: 'i1', label: '我在看一本（shū）', icon: '📖', bin: 'a', why: '"看一本"后面是书。' },
          { id: 'i2', label: '（shū）包里有铅笔', icon: '🎒', bin: 'a', why: '装铅笔的是书包。' },
          { id: 'i3', label: '图（shū）馆里很安静', icon: '🏛️', bin: 'a', why: '是图书馆。' },
          { id: 'i4', label: '（shū）叔给我讲故事', icon: '🧔', bin: 'b', why: '讲故事的是叔叔。' },
          { id: 'i5', label: '我叫他王（shū）叔', icon: '👋', bin: 'b', why: '称呼人用"叔叔"的"叔"。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '只说一个字"shū"，语音识别能确定是哪个字吗？',
        choices: [{ id: 'c1', label: '很难确定' }, { id: 'c2', label: '一定能确定' }, { id: 'c3', label: '我不确定' }],
        discussion: '只有一个读音，没有前后的词，语音识别也只能猜。说完整的句子，它才更容易选对字。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q25-1', prompt: '"书"和"叔"读音一样，它们叫什么？', options: [{ id: 'a', label: '同音字', icon: '🔊' }, { id: 'b', label: '反义词', icon: '↔️' }], answer: 'a', explain: '读音相同的字叫同音字。', knowledgePoints: ['g2-kp-homophone'] },
          { id: 'q25-2', prompt: '"我喜欢喝 guǒ 汁"，语音识别该选哪个字？', options: [{ id: 'a', label: '果', icon: '🍊' }, { id: 'b', label: '裹', icon: '🎁' }], answer: 'a', explain: '"喝……汁"，前后的词告诉我们是"果汁"。', knowledgePoints: ['g2-kp-context'] },
          { id: 'q25-3', prompt: '语音识别靠什么来选同音字？', options: [{ id: 'a', label: '前后的词', icon: '🧩' }, { id: 'b', label: '说话人穿的衣服', icon: '👕' }], answer: 'a', explain: '它会根据前后的词来猜最合适的字。', knowledgePoints: ['g2-kp-context'] },
          { id: 'q25-4', prompt: '用"说话打字"写完一句话，接下来最好做什么？', options: [{ id: 'a', label: '读一遍，检查错字', icon: '🔍' }, { id: 'b', label: '不用看，直接发出去', icon: '📤' }], answer: 'a', explain: '语音识别也会选错字，要检查。', knowledgePoints: ['g2-kp-check-asr'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：说完整的句子', instruction: '在家长陪同下用手机"说话打字"：先只说"shū"，再说"我在看一本书"，比一比哪次打对了。' },
    ],
    rubric: [
      '在提示下能说出一对同音字',
      '能说出"语音识别根据前后的词选字"',
      '能在句子里为同音字选对字',
      '能主动检查语音转出的文字，并说明为什么要说完整的句子',
    ],
    parentGuide: {
      summary: '这节课用同音字体验语音识别的难处。本课不打开麦克风；家庭任务需要您陪同使用手机的语音输入。',
      homeActivity: '和孩子一起用手机语音输入，比较只说一个字和说完整句子的区别，一起找找错别字。',
    },
    reviewed: true,
  },
  {
    id: 'g2-l6', grade: 2, order: 6, module: 'coding', title: '简单条件判断', icon: '🔀', minutes: 20,
    goals: ['能说出"如果……就……否则……"', '能按条件把东西分到两边', '知道机器只会严格按规则判断'],
    prerequisites: ['g1-l7'],
    knowledgePoints: [
      { id: 'g2-kp-if-else', name: '如果……就……否则……', dimension: 'computational', prerequisites: ['g1-kp-if-then'] },
      { id: 'g2-kp-condition', name: '条件只有"是"和"不是"两种结果', dimension: 'computational', prerequisites: ['g2-kp-if-else'] },
      { id: 'g2-kp-strict-rules', name: '机器严格按规则判断', dimension: 'critical', prerequisites: ['g2-kp-if-else'] },
    ],
    lifeExamples: [
      { icon: '🚪', text: '自动门：如果有人走近，就打开；否则，就关着。' },
      { icon: '💡', text: '楼道的声控灯：如果听到声音，就亮；否则，就不亮。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '复习：如果……就……', text: '一年级学过："如果下雨，就带伞。"', visual: '🌧️ ➜ ☂️' },
      { kind: 'explain', id: 's2', title: '加上"否则"', text: '"如果下雨，就带伞；否则，就戴帽子。"不下雨的时候该做什么，也说清楚了。', visual: '🌧️ ➜ ☂️   ☀️ ➜ 🧢' },
      { kind: 'explain', id: 's3', title: '条件的结果', text: '"下雨了吗？"答案只有"是"和"不是"。是，就走"就"那条路；不是，就走"否则"那条路。', visual: '❓ ➜ 是 / 不是' },
      { kind: 'explain', id: 's4', title: '机器很"死板"', text: '机器会严格按规则判断，不会自己变通。规则没想到的情况，它也照规则做。', visual: '🤖 📜 ➜ 一模一样' },
      {
        kind: 'sort', id: 'a1', title: '当分拣机器人', instruction: '规则："如果是圆形的，就放进左边筐；否则，就放进右边筐。"',
        bins: { a: { label: '左边筐：圆形', icon: '⭕' }, b: { label: '右边筐：否则', icon: '➡️' } },
        knowledgePoints: ['g2-kp-if-else', 'g2-kp-condition'],
        items: [
          { id: 'i1', label: '足球', icon: '⚽', bin: 'a', why: '足球是圆形的，放左边。' },
          { id: 'i2', label: '橙子', icon: '🍊', bin: 'a', why: '橙子是圆形的，放左边。' },
          { id: 'i3', label: '硬币', icon: '🪙', bin: 'a', why: '硬币是圆形的，放左边。' },
          { id: 'i4', label: '书本', icon: '📘', bin: 'b', why: '书本不是圆形的，按"否则"放右边。' },
          { id: 'i5', label: '铅笔', icon: '✏️', bin: 'b', why: '铅笔不是圆形的，放右边。' },
          { id: 'i6', label: '香蕉', icon: '🍌', bin: 'b', why: '香蕉是水果，但不是圆形的。规则只看形状，所以放右边。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '分拣机器人把香蕉放进了右边，和书本、铅笔放在一起。它做错了吗？',
        choices: [{ id: 'c1', label: '没错，它照规则做' }, { id: 'c2', label: '错了，香蕉该和橙子在一起' }, { id: 'c3', label: '我不确定' }],
        discussion: '机器严格按规则做，规则只看形状，所以它没做错。如果想让水果放在一起，就要改规则。写规则的人要想清楚！',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q26-1', prompt: '"如果天黑了，就开灯；否则，……"后面接哪个？', options: [{ id: 'a', label: '就关着灯', icon: '🌞' }, { id: 'b', label: '就开两盏灯', icon: '💡' }], answer: 'a', explain: '天没黑，就不用开灯。', knowledgePoints: ['g2-kp-if-else'] },
          { id: 'q26-2', prompt: '"门口有人吗？"这个问题的答案有几种？', options: [{ id: 'a', label: '两种：有、没有', icon: '2️⃣' }, { id: 'b', label: '很多很多种', icon: '♾️' }], answer: 'a', explain: '条件的结果只有"是"和"不是"。', knowledgePoints: ['g2-kp-condition'] },
          { id: 'q26-3', prompt: '声控灯的规则："如果听到声音，就亮。"有人在楼道里轻轻走，没发出声音，灯会怎样？', options: [{ id: 'a', label: '不亮', icon: '🌑' }, { id: 'b', label: '会亮', icon: '💡' }], answer: 'a', explain: '机器严格按规则判断，没听到声音就不亮。', knowledgePoints: ['g2-kp-strict-rules'] },
          { id: 'q26-4', prompt: '规则："如果是红色的，就放左边；否则放右边。"绿色的积木放哪边？', options: [{ id: 'a', label: '右边', icon: '➡️' }, { id: 'b', label: '左边', icon: '⬅️' }], answer: 'a', explain: '不是红色，按"否则"放右边。', knowledgePoints: ['g2-kp-if-else'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：家里的规则', instruction: '找一找家里按"如果……就……否则……"工作的东西（比如冰箱灯、自动门），说给家长听它的规则。' },
    ],
    rubric: [
      '在提示下能补全"如果……就……"',
      '能说出完整的"如果……就……否则……"',
      '能严格按规则分对每一样东西',
      '能发现规则没想到的情况，并提出改规则的办法',
    ],
    parentGuide: {
      summary: '这节课学习"如果……就……否则……"，这是编程里最基础的判断。孩子也会体会到：机器只会严格照规则做。',
      homeActivity: '和孩子一起找家里有"如果……就……否则……"规则的电器，比如冰箱打开门灯就亮。',
    },
    reviewed: true,
  },
  {
    id: 'g2-l7', grade: 2, order: 7, module: 'principle', title: '如何给 AI 下指令', icon: '🗣️', minutes: 25,
    goals: ['知道给 AI 的指令要清楚、具体', '能分辨清楚的指令和不清楚的指令', '完成年级项目：模拟训练水果识别 AI'],
    prerequisites: ['g2-l3', 'g2-l6'],
    knowledgePoints: [
      { id: 'g2-kp-clear-instruction', name: '指令要清楚、具体', dimension: 'application', prerequisites: ['g1-kp-instructions'] },
      { id: 'g2-kp-train-test', name: '用没见过的例子测试 AI', dimension: 'computational', prerequisites: ['g2-kp-learn-features'] },
      { id: 'g2-kp-train-ai', name: '贴好标签来训练 AI', dimension: 'creation', prerequisites: ['g2-kp-wrong-label', 'g2-kp-label'] },
    ],
    lifeExamples: [
      { icon: '🧹', text: '对扫地机器人说"打扫一下"不够清楚；"打扫客厅"就清楚多了。' },
      { icon: '🔊', text: '对智能音箱说"放首歌"，它只能随便放；说"放一首关于春天的儿歌"，就更接近你想要的。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '指令要清楚', text: '"把那个放这儿"，机器不知道"那个"和"这儿"是哪里。要说"把红色积木放进盒子里"。', visual: '❓ 那个 ➜ 🟥 ➜ 📦' },
      { kind: 'explain', id: 's2', title: '指令要具体', text: '说清楚做什么、在哪里、做多少。比如"往前走三步"，比"走一走"更具体。', visual: '🚶 1️⃣2️⃣3️⃣' },
      { kind: 'explain', id: 's3', title: '训练和测试', text: '训练 AI，要先给它贴好标签的例子。训练完，再用它没见过的新例子测试，看看它学得对不对。', visual: '🏷️ 训练 ➜ 🆕 测试 ➜ 📊' },
      {
        kind: 'sort', id: 'a1', title: '分一分：指令清楚吗？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '清楚具体', icon: '✅' }, b: { label: '不够清楚', icon: '❓' } },
        knowledgePoints: ['g2-kp-clear-instruction'],
        items: [
          { id: 'i1', label: '往前走三步', icon: '🚶', bin: 'a', why: '说清了方向和步数。' },
          { id: 'i2', label: '把红色积木放进盒子', icon: '🟥', bin: 'a', why: '说清了放什么、放哪里。' },
          { id: 'i3', label: '晚上八点提醒我刷牙', icon: '🪥', bin: 'a', why: '说清了时间和事情。' },
          { id: 'i4', label: '走一走', icon: '🤷', bin: 'b', why: '往哪走？走多远？不清楚。' },
          { id: 'i5', label: '把那个放这儿', icon: '👉', bin: 'b', why: '"那个""这儿"是什么？机器不知道。' },
          { id: 'i6', label: '弄好一点', icon: '🌀', bin: 'b', why: '"好一点"是什么样？说不清楚。' },
        ],
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q27-1', prompt: '哪句指令更清楚？', options: [{ id: 'a', label: '打扫客厅的地板', icon: '🧹' }, { id: 'b', label: '打扫一下', icon: '🤷' }], answer: 'a', explain: '说清楚在哪里、做什么。', knowledgePoints: ['g2-kp-clear-instruction'] },
          { id: 'q27-2', prompt: '训练完 AI，怎样看它学得好不好？', options: [{ id: 'a', label: '用它没见过的新例子测试', icon: '🆕' }, { id: 'b', label: '用它学过的例子再问一遍', icon: '🔁' }], answer: 'a', explain: '用没见过的例子测试，才知道它是不是真的学会了。', knowledgePoints: ['g2-kp-train-test'] },
          { id: 'q27-3', prompt: '训练时，标签贴错了，测试结果会怎样？', options: [{ id: 'a', label: '可能出错', icon: '❌' }, { id: 'b', label: '一定全对', icon: '💯' }], answer: 'a', explain: '标签错了，AI 学错，测试就可能出错。', knowledgePoints: ['g2-kp-train-ai'] },
          { id: 'q27-4', prompt: '对智能音箱说哪句，更可能放出你想听的歌？', options: [{ id: 'a', label: '放一首关于春天的儿歌', icon: '🌸' }, { id: 'b', label: '放首歌', icon: '🎵' }], answer: 'a', explain: '越具体，越接近你想要的。', knowledgePoints: ['g2-kp-clear-instruction'] },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '为什么测试 AI 时，要用它没见过的水果？',
        choices: [{ id: 'c1', label: '看它是不是真的学会了' }, { id: 'c2', label: '因为好玩' }, { id: 'c3', label: '我不确定' }],
        discussion: '就像考试不能只考背过的原题。用没见过的例子测试，才知道 AI 是真的找到了规律，还是只记住了那几个例子。',
      },
      { kind: 'project', id: 'p1', title: '年级项目：模拟训练水果识别 AI', instruction: '给 8 个水果贴标签，训练一个模拟 AI，再用 4 个它没见过的水果测试，看看正确率是多少。', editor: 'fruit-trainer', knowledgePoints: ['g2-kp-train-ai', 'g2-kp-wrong-label'] },
    ],
    rubric: [
      '在提示下能分辨清楚和不清楚的指令',
      '能把不清楚的指令改得清楚具体',
      '能贴对训练标签，并用新例子测试',
      '能发现错误标签导致的错误，改正后让正确率提高，并说出原因',
    ],
    parentGuide: {
      summary: '这节课学习给 AI 下清楚的指令，并完成年级项目：用模拟实验体验"贴标签 → 训练 → 测试 → 改进"。模拟实验不是真正的 AI 模型，页面上有明确说明。',
      homeActivity: '请孩子给您下指令，您故意只按字面做（比如"走一走"就原地踏步），让孩子体会指令要说清楚。',
    },
    reviewed: true,
  },
];
