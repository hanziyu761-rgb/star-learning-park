import type { Lesson } from './types';

// 三年级：AI 小小应用师 — 学会有效使用 AI。9 lessons; project in lesson 3.
// Rules for this grade:
// - No real AI is called. Any "AI answer" shown is a pre-written example and
//   is always introduced with "示例 AI 回答". (Checked by the validator.)
// - Primary-school children must not use open-ended generation on their own
//   (教育部《中小学生成式人工智能使用指南（2025 年版）》), so tasks say "和家长一起".
// - Generative AI may answer differently each time and may make things up.

export const GRADE3: Lesson[] = [
  {
    id: 'g3-l1', grade: 3, order: 1, module: 'apply', title: '如何提出好问题？', icon: '❓', minutes: 25,
    goals: ['知道好问题要清楚、具体', '知道一次最好只问一件事', '会说明自己的情况，但不说个人信息'],
    prerequisites: ['g2-l7'],
    knowledgePoints: [
      { id: 'g3-kp-good-question', name: '好问题清楚具体', dimension: 'application', prerequisites: ['g2-kp-clear-instruction'] },
      { id: 'g3-kp-one-thing', name: '一次问一件事', dimension: 'application', prerequisites: ['g3-kp-good-question'] },
      { id: 'g3-kp-context-no-privacy', name: '说明情况，但不说个人信息', dimension: 'critical', prerequisites: ['g2-kp-personal-data'] },
    ],
    lifeExamples: [
      { icon: '🏫', text: '问老师"这道题不会"，老师不知道你卡在哪；问"这道题第二步为什么要减 5"，老师马上就能帮你。' },
      { icon: '📚', text: '去图书馆问"有没有书"，管理员很难帮你；问"有没有讲恐龙的绘本"，就容易多了。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '问题问得好，帮助才得好', text: '不管是问老师、问家长还是问 AI，问题越清楚，得到的帮助越有用。', visual: '❓ ➜ 💡' },
      { kind: 'explain', id: 's2', title: '清楚具体', text: '只说"恐龙"，别人不知道你想知道什么。问"恐龙是怎么灭绝的"，就清楚多了。', visual: '🦖？ ➜ 🦖 怎么灭绝的？' },
      { kind: 'explain', id: 's3', title: '一次问一件事', text: '一下子问好几件事，回答容易乱。可以一件一件地问。', visual: '❓❓❓ ➜ ❓ ❓ ❓' },
      { kind: 'explain', id: 's4', title: '说明情况，不说隐私', text: '可以说"我是三年级学生，请用简单的话讲"。但不要说名字、学校、住址这些个人信息。', visual: '✅ 三年级  ❌ 名字 学校 住址' },
      {
        kind: 'sort', id: 'a1', title: '分一分：好问题还是不够好的问题？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '好问题', icon: '👍' }, b: { label: '不够好', icon: '🤔' } },
        knowledgePoints: ['g3-kp-good-question', 'g3-kp-context-no-privacy'],
        items: [
          { id: 'i1', label: '恐龙是怎么灭绝的？请用三年级能懂的话讲', icon: '🦖', bin: 'a', why: '问题清楚，还说明了要讲得简单。' },
          { id: 'i2', label: '月亮为什么有时圆、有时弯？', icon: '🌙', bin: 'a', why: '问题清楚具体。' },
          { id: 'i3', label: '蚂蚁是怎么找到回家的路的？', icon: '🐜', bin: 'a', why: '一次只问一件事，很清楚。' },
          { id: 'i4', label: '给我讲讲', icon: '🤷', bin: 'b', why: '讲什么呢？太不清楚了。' },
          { id: 'i5', label: '那个东西怎么弄？', icon: '🌀', bin: 'b', why: '"那个东西"是什么？别人不知道。' },
          { id: 'i6', label: '我叫小明，在某某小学上学，帮我写作业', icon: '🙅', bin: 'b', why: '说了名字和学校这些个人信息，而且让别人代写作业也不对。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '问"这道题的答案是什么"和问"这道题应该从哪里想起"，哪个更能帮你学会？',
        choices: [{ id: 'c1', label: '问答案' }, { id: 'c2', label: '问从哪里想起' }, { id: 'c3', label: '我不确定' }],
        discussion: '只拿到答案，下次遇到类似的题还是不会。问思路、问提示，自己想出来，才是真的学会。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q31-1', prompt: '哪个问题更清楚？', options: [{ id: 'a', label: '彩虹为什么有七种颜色？', icon: '🌈' }, { id: 'b', label: '彩虹', icon: '🤷' }], answer: 'a', explain: '说清楚想知道什么，才是好问题。', knowledgePoints: ['g3-kp-good-question'] },
          { id: 'q31-2', prompt: '想知道鲸鱼吃什么、住在哪、能活多久，怎样问更好？', options: [{ id: 'a', label: '一件一件地问', icon: '1️⃣' }, { id: 'b', label: '一口气全部问完', icon: '🌀' }], answer: 'a', explain: '一次问一件事，回答更清楚。', knowledgePoints: ['g3-kp-one-thing'] },
          { id: 'q31-3', prompt: '向 AI 提问时，哪句话可以说？', options: [{ id: 'a', label: '我是三年级学生', icon: '3️⃣' }, { id: 'b', label: '我家住在幸福小区 5 号楼', icon: '🏠' }], answer: 'a', explain: '可以说年级，不说住址等个人信息。', knowledgePoints: ['g3-kp-context-no-privacy'] },
          { id: 'q31-4', prompt: '"帮我把这篇日记写完"是一个好的请求吗？', options: [{ id: 'a', label: '不是，日记要自己写', icon: '📔' }, { id: 'b', label: '是', icon: '👍' }], answer: 'a', explain: '可以请别人给思路，但日记要自己写。', knowledgePoints: ['g3-kp-good-question'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：好奇心问题单', instruction: '写下 3 个你好奇的好问题（清楚、具体、一次一件事）。和家长一起查书或请教老师，找到答案。' },
    ],
    rubric: [
      '在提示下能把一个问题说得更清楚',
      '能自己提出清楚具体的问题',
      '能把复杂的问题拆成几个小问题来问',
      '会主动问思路而不是要答案，并能说明为什么',
    ],
    parentGuide: {
      summary: '会提问是用好 AI 的第一步。这节课练习把问题问清楚，同时守住隐私：可以说年级，不说名字、学校、住址。',
      homeActivity: '孩子问您问题时，如果问得不清楚，请孩子"再说具体一点"，帮他养成好习惯。',
    },
    reviewed: true,
  },
  {
    id: 'g3-l2', grade: 3, order: 2, module: 'apply', title: '提示词是什么？', icon: '💬', minutes: 25,
    goals: ['知道提示词是给 AI 的问题或指令', '能说出提示词常包含角色、任务、要求', '知道提示词不同，回答就不同，同一提示词也可能得到不同回答'],
    prerequisites: ['g3-l1'],
    knowledgePoints: [
      { id: 'g3-kp-prompt', name: '提示词是给 AI 的问题或指令', dimension: 'cognition', prerequisites: ['g3-kp-good-question'] },
      { id: 'g3-kp-prompt-parts', name: '提示词的角色、任务、要求', dimension: 'application', prerequisites: ['g3-kp-prompt'] },
      { id: 'g3-kp-different-output', name: '提示词不同，回答就不同', dimension: 'cognition', prerequisites: ['g3-kp-prompt'] },
    ],
    lifeExamples: [
      { icon: '🍜', text: '在餐厅点菜，说"一碗面"和"一碗不要葱、少放辣的牛肉面"，端上来的会不一样。' },
      { icon: '✂️', text: '请理发师"剪短一点"和"剪到耳朵上面"，结果也不一样。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是提示词', text: '我们输入给 AI 的问题或指令，叫做提示词。AI 会根据提示词生成回答。', visual: '⌨️ 提示词 ➜ 💡 ➜ 📝' },
      { kind: 'explain', id: 's2', title: '角色', text: '可以告诉 AI 扮演一个角色，比如"请你当一位科学老师"。', visual: '🎭 科学老师' },
      { kind: 'explain', id: 's3', title: '任务', text: '任务就是要 AI 做什么，比如"解释彩虹是怎么形成的"。', visual: '🎯 解释彩虹' },
      { kind: 'explain', id: 's4', title: '要求', text: '要求说明怎么做，比如"用三年级能懂的话，不超过 100 字"。', visual: '📏 简单 · 100 字以内' },
      { kind: 'explain', id: 's5', title: '回答会变', text: '提示词不同，回答就不同。生成式 AI 每次都是重新生成，同一个提示词问两次，回答也可能不一样。', visual: '💬 ➜ 📝A  /  📝B' },
      {
        kind: 'sort', id: 'a1', title: '分一分：任务还是要求？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '任务（做什么）', icon: '🎯' }, b: { label: '要求（怎么做）', icon: '📏' } },
        knowledgePoints: ['g3-kp-prompt-parts'],
        items: [
          { id: 'i1', label: '写一首关于春天的小诗', icon: '🌸', bin: 'a', why: '这是要 AI 做的事，是任务。' },
          { id: 'i2', label: '介绍一下大熊猫', icon: '🐼', bin: 'a', why: '这是任务。' },
          { id: 'i3', label: '解释彩虹是怎么形成的', icon: '🌈', bin: 'a', why: '这是任务。' },
          { id: 'i4', label: '不超过 50 个字', icon: '🔢', bin: 'b', why: '这是对长度的要求。' },
          { id: 'i5', label: '用三年级能懂的话', icon: '🗣️', bin: 'b', why: '这是对说法的要求。' },
          { id: 'i6', label: '最后出一道小题考考我', icon: '📝', bin: 'b', why: '这是对回答格式的要求。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '同一个提示词"讲一个小故事"问两次，回答为什么可能不一样？',
        choices: [{ id: 'c1', label: 'AI 每次都重新生成' }, { id: 'c2', label: 'AI 坏掉了' }, { id: 'c3', label: '我不确定' }],
        discussion: '生成式 AI 不是从书里找出一个固定答案，而是每次重新生成，所以回答可能不同。这也提醒我们：AI 的回答要检查。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q32-1', prompt: '输入给 AI 的问题或指令叫什么？', options: [{ id: 'a', label: '提示词', icon: '💬' }, { id: 'b', label: '密码', icon: '🔑' }], answer: 'a', explain: '给 AI 的问题或指令叫提示词。', knowledgePoints: ['g3-kp-prompt'] },
          { id: 'q32-2', prompt: '"请你当一位动物园讲解员"属于提示词的哪一部分？', options: [{ id: 'a', label: '角色', icon: '🎭' }, { id: 'b', label: '要求', icon: '📏' }], answer: 'a', explain: '让 AI 扮演谁，是角色。', knowledgePoints: ['g3-kp-prompt-parts'] },
          { id: 'q32-3', prompt: '"用三句话回答"属于哪一部分？', options: [{ id: 'a', label: '要求', icon: '📏' }, { id: 'b', label: '任务', icon: '🎯' }], answer: 'a', explain: '规定怎么回答，是要求。', knowledgePoints: ['g3-kp-prompt-parts'] },
          { id: 'q32-4', prompt: '把"讲个故事"改成"讲个关于勇气的短故事"，回答会怎样？', options: [{ id: 'a', label: '会更接近你想要的', icon: '🎯' }, { id: 'b', label: '一点也不会变', icon: '🟰' }], answer: 'a', explain: '提示词不同，回答就不同。', knowledgePoints: ['g3-kp-different-output'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：给家长下"提示词"', instruction: '请家长扮演 AI。先说"讲个故事"，再说"请你当童话作家，讲一个关于小兔子的故事，不超过一分钟"，比较两次有什么不同。' },
    ],
    rubric: [
      '在提示下能说出提示词是什么',
      '能分清提示词里的角色、任务和要求',
      '能写出包含角色、任务、要求的提示词',
      '能说明为什么同一个提示词也可能得到不同回答，并因此会检查回答',
    ],
    parentGuide: {
      summary: '这节课认识提示词。课程里没有调用任何 AI；家庭任务请您扮演"AI"，让孩子体会提示词怎样影响回答。',
      homeActivity: '玩"人工 AI"游戏：孩子给您下提示词，您严格按提示词回答，提示词不清楚就回答得模糊一些。',
    },
    reviewed: true,
  },
  {
    id: 'g3-l3', grade: 3, order: 3, module: 'apply', title: '如何优化提示词？', icon: '🛠️', minutes: 30,
    goals: ['会给提示词加上具体要求', '知道要看结果、再修改提示词', '知道提示词里不写个人信息', '完成年级项目：设计我的 AI 故事助手'],
    prerequisites: ['g3-l2'],
    knowledgePoints: [
      { id: 'g3-kp-add-requirements', name: '加上具体要求', dimension: 'application', prerequisites: ['g3-kp-prompt-parts'] },
      { id: 'g3-kp-iterate', name: '看结果，再修改', dimension: 'computational', prerequisites: ['g3-kp-different-output'] },
      { id: 'g3-kp-prompt-safety', name: '提示词里不写个人信息', dimension: 'critical', prerequisites: ['g3-kp-context-no-privacy'] },
      { id: 'g3-kp-design-prompt', name: '设计自己的提示词', dimension: 'creation', prerequisites: ['g3-kp-add-requirements'] },
    ],
    lifeExamples: [
      { icon: '🎨', text: '画画时先画草稿，看看哪里不满意再改，提示词也可以这样一遍遍改好。' },
      { icon: '🧁', text: '做蛋糕第一次太甜，下次少放点糖。看结果、再调整，就是优化。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '加上具体要求', text: '"讲个故事"太笼统。加上"讲给二年级的弟弟听，不超过 200 字，结尾有个道理"，就具体多了。', visual: '📝 + 📏📏📏 = 🎯' },
      { kind: 'explain', id: 's2', title: '看结果，再修改', text: '第一次的回答不满意很正常。想想哪里不满意，就在提示词里补上要求，再试一次。', visual: '✍️ ➜ 👀 ➜ ✏️ ➜ 👀' },
      { kind: 'explain', id: 's3', title: '安全第一', text: '提示词里不写名字、学校、住址、电话、照片。也要写清楚：不要可怕的内容。', visual: '🔒 + 🛡️' },
      {
        kind: 'sort', id: 'a1', title: '分一分：这样改有帮助吗？', instruction: '原来的提示词是"讲个故事"。下面这些修改，哪些让它更好？',
        bins: { a: { label: '更好了', icon: '⬆️' }, b: { label: '没帮助或不安全', icon: '⛔' } },
        knowledgePoints: ['g3-kp-add-requirements', 'g3-kp-prompt-safety'],
        items: [
          { id: 'i1', label: '加上：讲给二年级的弟弟听', icon: '👦', bin: 'a', why: '说清楚了听众。' },
          { id: 'i2', label: '加上：不超过 200 字', icon: '🔢', bin: 'a', why: '说清楚了长度。' },
          { id: 'i3', label: '加上：结尾告诉我一个道理', icon: '💡', bin: 'a', why: '说清楚了想要的内容。' },
          { id: 'i4', label: '只是多打几个感叹号！！！', icon: '❗', bin: 'b', why: '感叹号没有说清楚任何要求。' },
          { id: 'i5', label: '加上：我家住在幸福小区', icon: '🏠', bin: 'b', why: '这是个人信息，不安全，也和故事无关。' },
          { id: 'i6', label: '把"讲个故事"重复写三遍', icon: '🔁', bin: 'b', why: '重复不会让要求更清楚。' },
        ],
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q33-1', prompt: 'AI 写的故事太长了，下次提示词里加什么？', options: [{ id: 'a', label: '不超过 200 字', icon: '🔢' }, { id: 'b', label: '请认真一点', icon: '🙏' }], answer: 'a', explain: '具体的长度要求最有用。', knowledgePoints: ['g3-kp-add-requirements', 'g3-kp-iterate'] },
          { id: 'q33-2', prompt: '第一次的回答不满意，应该怎么做？', options: [{ id: 'a', label: '想想哪里不满意，改提示词再试', icon: '✏️' }, { id: 'b', label: '再也不用了', icon: '🚫' }], answer: 'a', explain: '看结果、再修改，就是优化提示词。', knowledgePoints: ['g3-kp-iterate'] },
          { id: 'q33-3', prompt: '哪句话不应该写进提示词？', options: [{ id: 'a', label: '我的电话号码', icon: '☎️' }, { id: 'b', label: '用简单的词', icon: '🗣️' }], answer: 'a', explain: '提示词里不写个人信息。', knowledgePoints: ['g3-kp-prompt-safety'] },
          { id: 'q33-4', prompt: '给弟弟讲故事，提示词里写哪个要求最合适？', options: [{ id: 'a', label: '用一年级能听懂的话', icon: '👶' }, { id: 'b', label: '用很难的成语', icon: '📚' }], answer: 'a', explain: '要求要适合听众。', knowledgePoints: ['g3-kp-add-requirements'] },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '为什么好的提示词里要写"不出现可怕的内容"？',
        choices: [{ id: 'c1', label: '让 AI 知道我们的边界' }, { id: 'c2', label: '没有必要写' }, { id: 'c3', label: '我不确定' }],
        discussion: 'AI 不知道你是小朋友，也不知道你怕什么。把安全要求写清楚，是保护自己的好习惯。即使写了，也要和家长一起检查回答。',
      },
      { kind: 'project', id: 'p1', title: '年级项目：设计我的 AI 故事助手', instruction: '选好角色、听众、故事主题和要求，设计一张提示词卡片。检查清单全部打勾就能保存。', editor: 'prompt-card', knowledgePoints: ['g3-kp-design-prompt'] },
    ],
    rubric: [
      '在提示下能给提示词加上一条要求',
      '能自己加上听众、长度等具体要求',
      '能根据不满意的地方修改提示词',
      '能设计出完整、安全的提示词卡片，并说明每条要求的理由',
    ],
    parentGuide: {
      summary: '孩子会设计一张"故事助手"提示词卡片。按教育部要求，小学生不能独自使用开放式内容生成，所以本课只设计、不生成；以后您开启陪同模式，可以和孩子一起用它生成故事并检查。',
      homeActivity: '和孩子一起读一读他设计的提示词卡片，问问"为什么要加这条要求"。',
    },
    reviewed: true,
  },
  {
    id: 'g3-l4', grade: 3, order: 4, module: 'apply', title: 'AI 辅助语文学习', icon: '📖', minutes: 25,
    goals: ['知道可以让 AI 解释词语、给思路、找错别字', '知道作文、日记要自己写', '会用字典核对 AI 的解释'],
    prerequisites: ['g3-l2'],
    knowledgePoints: [
      { id: 'g3-kp-ai-hint', name: '让 AI 给提示，不让它代写', dimension: 'application', prerequisites: ['g3-kp-prompt'] },
      { id: 'g3-kp-check-explain', name: '用字典核对 AI 的解释', dimension: 'critical', prerequisites: ['g1-kp-ai-mistakes'] },
      { id: 'g3-kp-own-writing', name: '作文要自己写', dimension: 'critical', prerequisites: ['g1-kp-ai-cannot'] },
    ],
    lifeExamples: [
      { icon: '📕', text: '遇到不懂的词，可以查字典，也可以在家长陪同下请 AI 解释，再和字典对一对。' },
      { icon: '✏️', text: '写完作文后，可以请 AI 帮忙找错别字，但内容要自己想、自己写。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: 'AI 能帮什么', text: '在家长陪同下，AI 可以帮忙解释词语、给写作思路、找错别字。', visual: '📖 🧭 🔍' },
      { kind: 'explain', id: 's2', title: '作文要自己写', text: '老师想看的是你的想法和你的话。让 AI 代写作文，你没有练习，也不诚实。', visual: '✍️ 我的话 ✅  🤖 代写 ❌' },
      { kind: 'explain', id: 's3', title: '解释要核对', text: '示例 AI 回答："画蛇添足"比喻做了多余的事，反而把事情弄坏了。（这是预先写好的示例，不是实时 AI 生成。）这个解释对吗？查字典核对一下，是对的。', visual: '🐍 ➕ 🦶 ➜ 📕 ✅' },
      { kind: 'explain', id: 's4', title: '不一样时信谁', text: '如果 AI 的解释和字典、课本不一样，以字典、课本和老师说的为准。', visual: '🤖 ≠ 📕 ➜ 📕 👩‍🏫' },
      {
        kind: 'sort', id: 'a1', title: '分一分：好的用法还是不好的用法？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '好的用法', icon: '👍' }, b: { label: '不好的用法', icon: '👎' } },
        knowledgePoints: ['g3-kp-ai-hint', 'g3-kp-own-writing', 'g3-kp-check-explain'],
        items: [
          { id: 'i1', label: '请 AI 解释"坚持不懈"，再查字典核对', icon: '📕', bin: 'a', why: '用 AI 帮忙理解，并且核对了。' },
          { id: 'i2', label: '写完作文后，请 AI 帮我找错别字', icon: '🔍', bin: 'a', why: '内容是自己写的，AI 只是帮忙检查。' },
          { id: 'i3', label: '请 AI 给三个作文开头的思路，我自己写', icon: '🧭', bin: 'a', why: '要的是思路，作文还是自己写。' },
          { id: 'i4', label: '让 AI 写一篇作文，直接抄上去交给老师', icon: '📋', bin: 'b', why: '这是代写，没有学到东西，也不诚实。' },
          { id: 'i5', label: 'AI 的解释和字典不一样，还是只信 AI', icon: '🙈', bin: 'b', why: '不一样时，要以字典、课本和老师为准。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果同学的作文是 AI 代写的，老师夸他写得好，这公平吗？',
        choices: [{ id: 'c1', label: '不公平' }, { id: 'c2', label: '公平' }, { id: 'c3', label: '我不确定' }],
        discussion: '作文是用来练习表达自己的。用 AI 代写，夸奖不是给自己的，也没有学会写作。诚实地说明哪些地方用了 AI，才是对的。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q34-1', prompt: '写作文卡住了，怎样用 AI 更好？', options: [{ id: 'a', label: '请它给几个思路，我自己写', icon: '🧭' }, { id: 'b', label: '请它写完整篇', icon: '📋' }], answer: 'a', explain: '要提示、要思路，不要代写。', knowledgePoints: ['g3-kp-ai-hint'] },
          { id: 'q34-2', prompt: 'AI 对一个成语的解释和字典不一样，听谁的？', options: [{ id: 'a', label: '字典', icon: '📕' }, { id: 'b', label: 'AI', icon: '🤖' }], answer: 'a', explain: '以字典、课本和老师为准。', knowledgePoints: ['g3-kp-check-explain'] },
          { id: 'q34-3', prompt: '日记应该由谁来写？', options: [{ id: 'a', label: '我自己', icon: '🧒' }, { id: 'b', label: 'AI', icon: '🤖' }], answer: 'a', explain: '日记记录的是自己的生活和想法。', knowledgePoints: ['g3-kp-own-writing'] },
          { id: 'q34-4', prompt: '在家里用 AI 学语文，要和谁一起？', options: [{ id: 'a', label: '家长', icon: '👨‍👩‍👧' }, { id: 'b', label: '自己偷偷用', icon: '🤫' }], answer: 'a', explain: '小学生使用生成式 AI 要有家长或老师陪同。', knowledgePoints: ['g3-kp-ai-hint'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：成语小侦探', instruction: '和家长一起查字典，弄懂 2 个成语，每个造一个句子。如果家里用 AI，也可以在家长陪同下请 AI 解释，再和字典对一对。' },
    ],
    rubric: [
      '在提示下能说出 AI 可以帮忙做的一件语文学习的事',
      '能分清"要思路"和"让 AI 代写"',
      '能用字典核对 AI 的解释',
      '能说明为什么作文要自己写，并诚实说明哪里用了 AI',
    ],
    parentGuide: {
      summary: '这节课讲怎样用 AI 帮助学语文而不是代替学语文。课程内展示的 AI 回答都是预先写好的示例。',
      homeActivity: '如果您允许孩子使用 AI，请陪在身边：让 AI 解释词语、给思路，再和孩子一起用字典核对。',
    },
    reviewed: true,
  },
  {
    id: 'g3-l5', grade: 3, order: 5, module: 'apply', title: 'AI 辅助数学学习', icon: '🧮', minutes: 25,
    goals: ['知道先自己做，再用 AI 核对或讲思路', '知道 AI 也会算错', '会用估算检查答案'],
    prerequisites: ['g3-l2'],
    knowledgePoints: [
      { id: 'g3-kp-try-first', name: '先自己做，再核对', dimension: 'application', prerequisites: ['g3-kp-ai-hint'] },
      { id: 'g3-kp-ai-math-errors', name: 'AI 也会算错', dimension: 'critical', prerequisites: ['g1-kp-ai-mistakes'] },
      { id: 'g3-kp-ask-steps', name: '让 AI 讲思路', dimension: 'application', prerequisites: ['g3-kp-prompt'] },
    ],
    lifeExamples: [
      { icon: '🛒', text: '买东西时先估一估总价，收银的结果差太多，就知道可能算错了。' },
      { icon: '📐', text: '做完数学题，用另一种方法验算一遍，是好习惯。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '先自己做', text: '做数学题，先自己想、自己算。做完后再核对，才能知道自己哪里会、哪里不会。', visual: '✏️ ➜ ✅' },
      { kind: 'explain', id: 's2', title: '让 AI 讲思路', text: '在家长陪同下，可以问 AI："这道题第一步应该想什么？"而不是"答案是多少"。', visual: '🤔 ➜ 🧭' },
      { kind: 'explain', id: 's3', title: 'AI 也会算错', text: '示例 AI 回答：48 + 37 = 75。（这是预先写好的示例，不是实时 AI 生成。）这个答案是错的，正确答案是 85。', visual: '🤖 75 ❌  ✏️ 85 ✅' },
      { kind: 'explain', id: 's4', title: '估算来检查', text: '48 差不多是 50，37 差不多是 40，50 + 40 = 90。答案应该在 90 附近，75 差太多了，一定要再算一遍。', visual: '50 + 40 ≈ 90' },
      {
        kind: 'sort', id: 'a1', title: '当检查员：示例 AI 回答算对了吗？', instruction: '下面是预先写好的示例 AI 回答。自己算一算，再放进筐里。',
        bins: { a: { label: '算对了', icon: '✅' }, b: { label: '算错了', icon: '❌' } },
        knowledgePoints: ['g3-kp-ai-math-errors'],
        items: [
          { id: 'i1', label: '示例 AI 回答：36 + 47 = 83', icon: '➕', bin: 'a', why: '36 + 47 = 83，算对了。' },
          { id: 'i2', label: '示例 AI 回答：25 × 4 = 100', icon: '✖️', bin: 'a', why: '25 × 4 = 100，算对了。' },
          { id: 'i3', label: '示例 AI 回答：72 ÷ 8 = 9', icon: '➗', bin: 'a', why: '72 ÷ 8 = 9，算对了。' },
          { id: 'i4', label: '示例 AI 回答：100 − 37 = 73', icon: '➖', bin: 'b', why: '100 − 37 = 63，AI 算错了。' },
          { id: 'i5', label: '示例 AI 回答：8 × 7 = 54', icon: '✖️', bin: 'b', why: '8 × 7 = 56，AI 算错了。' },
          { id: 'i6', label: '示例 AI 回答：45 + 38 = 73', icon: '➕', bin: 'b', why: '45 + 38 = 83，AI 算错了。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '为什么要先自己做题，再用 AI 核对？',
        choices: [{ id: 'c1', label: '这样才知道自己会不会' }, { id: 'c2', label: '直接问 AI 更快' }, { id: 'c3', label: '我不确定' }],
        discussion: '直接要答案，看起来快，可是考试时没有 AI。先自己做，才能发现自己的问题；而且 AI 也会算错，自己会算才能发现它的错。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q35-1', prompt: '数学作业应该怎么用 AI？', options: [{ id: 'a', label: '先自己做，再核对', icon: '✏️' }, { id: 'b', label: '先问 AI 答案，再抄', icon: '📋' }], answer: 'a', explain: '先自己做，才知道自己会不会。', knowledgePoints: ['g3-kp-try-first'] },
          { id: 'q35-2', prompt: '示例 AI 回答说 29 + 52 = 71。用估算检查：30 + 50 = 80，这个答案对吗？', options: [{ id: 'a', label: '不对，差太多了', icon: '❌' }, { id: 'b', label: '对', icon: '✅' }], answer: 'a', explain: '29 + 52 = 81。估算是 80 左右，71 差太多，说明算错了。', knowledgePoints: ['g3-kp-ai-math-errors'] },
          { id: 'q35-3', prompt: '哪个问题更能帮你学会？', options: [{ id: 'a', label: '这道题第一步该想什么？', icon: '🧭' }, { id: 'b', label: '答案是多少？', icon: '🔢' }], answer: 'a', explain: '问思路，比只要答案更能学会。', knowledgePoints: ['g3-kp-ask-steps'] },
          { id: 'q35-4', prompt: 'AI 会不会算错？', options: [{ id: 'a', label: '会，要检查', icon: '🔍' }, { id: 'b', label: '永远不会', icon: '💯' }], answer: 'a', explain: 'AI 也会算错，要检查。', knowledgePoints: ['g3-kp-ai-math-errors'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：估算小达人', instruction: '和家长去超市时，先估一估买的 3 样东西大约多少钱，再看看实际总价，比一比差多少。' },
    ],
    rubric: [
      '在提示下能用估算判断一个答案大概对不对',
      '能做到先自己做题，再核对',
      '能发现示例 AI 回答中的计算错误',
      '能说明为什么不能只要答案，并主动问思路',
    ],
    parentGuide: {
      summary: '这节课让孩子知道：AI 也会算错，要先自己做、再核对，并学会用估算检查。课程中的 AI 回答都是预先写好的示例。',
      homeActivity: '做完数学作业后，请孩子用估算或另一种方法检查一道题。',
    },
    reviewed: true,
  },
  {
    id: 'g3-l6', grade: 3, order: 6, module: 'apply', title: 'AI 辅助英语学习', icon: '🔤', minutes: 25,
    goals: ['知道可以在家长陪同下用 AI 练习简单英语对话', '知道发音要请老师或家长确认', '知道翻译要核对，直译可能不合适'],
    prerequisites: ['g3-l2'],
    knowledgePoints: [
      { id: 'g3-kp-ai-practice', name: '用 AI 练习英语对话', dimension: 'application', prerequisites: ['g3-kp-prompt'] },
      { id: 'g3-kp-pronunciation', name: '发音要请老师或家长确认', dimension: 'critical', prerequisites: ['g1-kp-asr-conditions'] },
      { id: 'g3-kp-check-translation', name: '翻译要核对', dimension: 'critical', prerequisites: ['g2-kp-check-asr'] },
    ],
    lifeExamples: [
      { icon: '🗺️', text: '出国旅行时，有人用翻译软件问路，但有时翻译出来的话会让人看不懂。' },
      { icon: '🎧', text: '学英语时可以跟着朗读模仿，但读得准不准，最好请老师听一听。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '对话练习', text: '在家长陪同下，可以请 AI 用简单英语和你练对话，比如 "What\'s your favorite animal?"', visual: '🗨️ Hi! ➜ 🗨️ I like pandas!' },
      { kind: 'explain', id: 's2', title: '发音要确认', text: '跟着朗读可以模仿发音，但自己读得准不准，最好请英语老师或家长听一听。', visual: '🗣️ ➜ 👩‍🏫 👂' },
      { kind: 'explain', id: 's3', title: '翻译要核对', text: '把"加油"一个字一个字翻成 add oil，英语里通常不这么说。鼓励别人可以说 "You can do it!"', visual: '加油 ➜ add oil ❓ ➜ You can do it! ✅' },
      { kind: 'explain', id: 's4', title: '保护自己', text: '练习自我介绍时，可以用昵称和喜欢的东西，不说真名、学校和住址。', visual: '🦊 Nickname ✅  🏠 Address ❌' },
      {
        kind: 'sort', id: 'a1', title: '分一分：好的英语学习用法吗？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '好的用法', icon: '👍' }, b: { label: '不好的用法', icon: '👎' } },
        knowledgePoints: ['g3-kp-ai-practice', 'g3-kp-check-translation'],
        items: [
          { id: 'i1', label: '在家长陪同下，请 AI 用简单英语和我练习聊天气', icon: '🌤️', bin: 'a', why: '用 AI 当练习伙伴，而且有家长陪同。' },
          { id: 'i2', label: 'AI 翻译后，再查词典或问老师', icon: '📘', bin: 'a', why: '翻译要核对。' },
          { id: 'i3', label: '练习自我介绍时，用昵称代替真名', icon: '🦊', bin: 'a', why: '保护了个人信息。' },
          { id: 'i4', label: 'AI 问我家住哪里，我用英语说出真实地址', icon: '🏠', bin: 'b', why: '住址是个人信息，不能说。' },
          { id: 'i5', label: '英语作业全部让 AI 翻译好，直接抄', icon: '📋', bin: 'b', why: '这样学不会英语。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '为什么一个字一个字地翻译，有时会翻得很奇怪？',
        choices: [{ id: 'c1', label: '不同语言的说法习惯不一样' }, { id: 'c2', label: '翻译永远不会错' }, { id: 'c3', label: '我不确定' }],
        discussion: '每种语言都有自己的习惯说法。字对字翻译可能意思对不上，所以翻译结果要核对，最好问问老师。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q36-1', prompt: '鼓励朋友时，英语里通常怎么说"加油"？', options: [{ id: 'a', label: 'You can do it!', icon: '💪' }, { id: 'b', label: 'Add oil to the car', icon: '⛽' }], answer: 'a', explain: '"You can do it!" 是常用的鼓励说法。', knowledgePoints: ['g3-kp-check-translation'] },
          { id: 'q36-2', prompt: '自己的英语发音准不准，最好请谁确认？', options: [{ id: 'a', label: '英语老师或家长', icon: '👩‍🏫' }, { id: 'b', label: '只靠自己感觉', icon: '🤷' }], answer: 'a', explain: '请老师或家长听一听更可靠。', knowledgePoints: ['g3-kp-pronunciation'] },
          { id: 'q36-3', prompt: '用 AI 练英语对话，下面哪句可以说？', options: [{ id: 'a', label: 'I like pandas.', icon: '🐼' }, { id: 'b', label: 'My school is ... and my phone is ...', icon: '☎️' }], answer: 'a', explain: '可以聊喜好，不说学校和电话。', knowledgePoints: ['g3-kp-ai-practice'] },
          { id: 'q36-4', prompt: 'AI 的翻译和课本不一样，怎么办？', options: [{ id: 'a', label: '问老师或查词典', icon: '📘' }, { id: 'b', label: '只信 AI', icon: '🤖' }], answer: 'a', explain: '翻译要核对。', knowledgePoints: ['g3-kp-check-translation'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：英语小对话', instruction: '和家长用英语互相问答 3 句（比如喜欢的颜色、动物、食物）。不确定的说法，一起查词典。' },
    ],
    rubric: [
      '在提示下能说出一种用 AI 练英语的方法',
      '知道发音和翻译都要核对',
      '能发现不合适的字对字翻译',
      '能安全地设计一段英语练习对话，并说明怎样核对',
    ],
    parentGuide: {
      summary: '这节课讲怎样在陪同下用 AI 练英语，并知道发音、翻译都要核对。本课不打开麦克风。',
      homeActivity: '和孩子用英语聊 3 句日常话题，遇到不确定的表达一起查词典。',
    },
    reviewed: true,
  },
  {
    id: 'g3-l7', grade: 3, order: 7, module: 'coding', title: '算法和逻辑', icon: '🧩', minutes: 25,
    goals: ['知道算法是解决问题的一步步方法', '能按算法找出一组数里最大的数', '知道同一个问题可以有不同的算法'],
    prerequisites: ['g2-l6'],
    knowledgePoints: [
      { id: 'g3-kp-algorithm', name: '算法是解决问题的步骤', dimension: 'computational', prerequisites: ['g1-kp-sequence'] },
      { id: 'g3-kp-find-max', name: '找最大数的算法', dimension: 'computational', prerequisites: ['g3-kp-algorithm', 'g2-kp-if-else'] },
      { id: 'g3-kp-many-algorithms', name: '一个问题可以有不同算法', dimension: 'computational', prerequisites: ['g3-kp-algorithm'] },
    ],
    lifeExamples: [
      { icon: '🍳', text: '菜谱就是做菜的算法：按步骤做，就能做出同样的菜。' },
      { icon: '🏃', text: '体育课排队时，老师按"从矮到高"的方法排，也是一种算法。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是算法', text: '解决一个问题的一步步方法，叫算法。只要按步骤做，谁来做结果都一样。', visual: '❓ ➜ 1️⃣ 2️⃣ 3️⃣ ➜ ✅' },
      { kind: 'explain', id: 's2', title: '找最大的数', text: '从第一个数开始，一个一个往后比。遇到更大的，就记住更大的那个。比到最后，记住的就是最大的。', visual: '7 3 9 4 ➜ 7 ➜ 9 ✅' },
      { kind: 'explain', id: 's3', title: '不同的算法', text: '整理书包，可以按课表顺序放，也可以按大小放。同一个问题可以有不同的算法，有的更快、更清楚。', visual: '🎒 📅 / 📏' },
      {
        kind: 'order', id: 'a1', title: '排一排：找出最大数的算法', instruction: '按正确的顺序，依次点下面的卡片。',
        knowledgePoints: ['g3-kp-algorithm', 'g3-kp-find-max'],
        steps: [
          { id: 'o1', label: '先记住第一个数', icon: '1️⃣' },
          { id: 'o2', label: '和下一个数比一比', icon: '⚖️' },
          { id: 'o3', label: '如果下一个数更大，就改记它', icon: '🔄' },
          { id: 'o4', label: '重复比较，直到最后一个数', icon: '🔁' },
          { id: 'o5', label: '最后记住的就是最大的数', icon: '🏆' },
        ],
        explain: '这就是一个算法：每一步都清楚，按顺序做，不管有多少个数都能找出最大的。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q37-1', prompt: '用"找最大数"的算法看 5、8、2、6：比完 5 和 8 后，记住的是几？', options: [{ id: 'a', label: '8' }, { id: 'b', label: '5' }], answer: 'a', explain: '8 比 5 大，所以改记 8。', knowledgePoints: ['g3-kp-find-max'] },
          { id: 'q37-2', prompt: '5、8、2、6 里最大的数是几？', options: [{ id: 'a', label: '8' }, { id: 'b', label: '6' }], answer: 'a', explain: '一个个比完，最大的是 8。', knowledgePoints: ['g3-kp-find-max'] },
          { id: 'q37-3', prompt: '下面哪个是算法？', options: [{ id: 'a', label: '菜谱上一步步的做法', icon: '🍳' }, { id: 'b', label: '一盘做好的菜', icon: '🍲' }], answer: 'a', explain: '算法是解决问题的步骤。', knowledgePoints: ['g3-kp-algorithm'] },
          { id: 'q37-4', prompt: '同一个问题，只能有一种算法吗？', options: [{ id: 'a', label: '不是，可以有很多种', icon: '🔀' }, { id: 'b', label: '是，只有一种', icon: '1️⃣' }], answer: 'a', explain: '可以有不同的算法，有的更好。', knowledgePoints: ['g3-kp-many-algorithms'] },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '找全班最高的同学，你还能想出别的算法吗？',
        choices: [{ id: 'c1', label: '先分组找每组最高的，再比' }, { id: 'c2', label: '只能一个个比' }, { id: 'c3', label: '我不确定' }],
        discussion: '先分组、再比较组里最高的，也能找到答案，而且几个人可以同时找，更快。同一个问题可以有不同的算法。',
      },
      { kind: 'task', id: 'k1', title: '实践任务：我的家务算法', instruction: '选一件家务（比如叠衣服），写下 4–5 个步骤。请家长严格按你的步骤做一遍，看看有没有漏掉的步骤。' },
    ],
    rubric: [
      '在提示下能说出算法是一步步的方法',
      '能按算法找出一组数中最大的数',
      '能为生活中的问题写出清楚的算法步骤',
      '能为同一个问题想出两种算法，并比较哪种更好',
    ],
    parentGuide: {
      summary: '算法是计算思维的核心。这节课用"找最大数"体验一步步的算法，也知道同一问题可以有不同方法。',
      homeActivity: '请孩子写一份家务步骤，您严格按步骤执行，漏了步骤就停下，让孩子修改。',
    },
    reviewed: true,
  },
  {
    id: 'g3-l8', grade: 3, order: 8, module: 'safety', title: 'AI 生成内容的判断', icon: '🔎', minutes: 25,
    goals: ['知道 AI 可能编造看起来很真的内容', '会用课本、工具书、老师等可靠来源核对', '能分清事实和观点'],
    prerequisites: ['g3-l2'],
    knowledgePoints: [
      { id: 'g3-kp-hallucination', name: 'AI 可能编造看起来很真的内容', dimension: 'critical', prerequisites: ['g1-kp-ai-mistakes', 'g3-kp-different-output'] },
      { id: 'g3-kp-reliable-source', name: '用可靠来源核对', dimension: 'critical', prerequisites: ['g3-kp-hallucination'] },
      { id: 'g3-kp-fact-opinion', name: '分清事实和观点', dimension: 'critical', prerequisites: [] },
    ],
    lifeExamples: [
      { icon: '📰', text: '网上有些消息看起来很像真的，其实是编出来的。' },
      { icon: '🗣️', text: '"西瓜是最好吃的水果"是一个人的想法；"西瓜里有很多水分"是可以查证的事实。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '说得很像真的', text: 'AI 生成的话常常很通顺、很肯定，但通顺不等于正确。AI 有时会编造根本不存在的事。', visual: '😎 说得很肯定 ≠ ✅ 正确' },
      { kind: 'explain', id: 's2', title: '一个例子', text: '示例 AI 回答：长颈鹿的脖子里有 20 块骨头。（这是预先写好的示例，不是实时 AI 生成。）其实长颈鹿的颈椎只有 7 块，和人一样多。', visual: '🦒 20？❌  7 ✅' },
      { kind: 'explain', id: 's3', title: '去哪里核对', text: '可以查课本、字典和百科全书等工具书，问老师，或者在家长帮助下看正规的科普网站。', visual: '📚 👩‍🏫 🏛️' },
      { kind: 'explain', id: 's4', title: '事实和观点', text: '事实是可以查证的，比如"一年有 12 个月"。观点是一个人的想法，比如"夏天最好玩"。', visual: '📏 事实  💭 观点' },
      {
        kind: 'sort', id: 'a1', title: '分一分：事实还是观点？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '事实（能查证）', icon: '📏' }, b: { label: '观点（是想法）', icon: '💭' } },
        knowledgePoints: ['g3-kp-fact-opinion'],
        items: [
          { id: 'i1', label: '一年有 12 个月', icon: '📅', bin: 'a', why: '可以查证，是事实。' },
          { id: 'i2', label: '长城在中国', icon: '🏯', bin: 'a', why: '可以查证，是事实。' },
          { id: 'i3', label: '蜘蛛有 8 条腿', icon: '🕷️', bin: 'a', why: '可以查证，是事实。' },
          { id: 'i4', label: '草莓是最好吃的水果', icon: '🍓', bin: 'b', why: '每个人喜欢的不一样，这是观点。' },
          { id: 'i5', label: '下雨天最无聊', icon: '🌧️', bin: 'b', why: '有人喜欢下雨天，这是观点。' },
          { id: 'i6', label: '猫比狗更可爱', icon: '🐱', bin: 'b', why: '这是个人的想法，是观点。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '一个回答写得很长、很肯定，它就一定是对的吗？',
        choices: [{ id: 'c1', label: '不一定，要核对' }, { id: 'c2', label: '一定对' }, { id: 'c3', label: '我不确定' }],
        discussion: '写得长、说得肯定，不代表正确。尤其是数字、日期、人名和"冷知识"，最容易出错，要用可靠来源核对。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q38-1', prompt: '示例 AI 回答："大熊猫每天要睡 25 个小时。"哪里有问题？', options: [{ id: 'a', label: '一天只有 24 小时', icon: '⏰' }, { id: 'b', label: '没有问题', icon: '✅' }], answer: 'a', explain: '一天只有 24 小时，这句话一定是错的。', knowledgePoints: ['g3-kp-hallucination'] },
          { id: 'q38-2', prompt: '核对一个科学知识，哪个来源更可靠？', options: [{ id: 'a', label: '课本或百科全书', icon: '📚' }, { id: 'b', label: '不认识的人随便发的消息', icon: '💬' }], answer: 'a', explain: '课本和工具书更可靠。', knowledgePoints: ['g3-kp-reliable-source'] },
          { id: 'q38-3', prompt: '"冬天比夏天好"是事实还是观点？', options: [{ id: 'a', label: '观点', icon: '💭' }, { id: 'b', label: '事实', icon: '📏' }], answer: 'a', explain: '这是个人的想法，是观点。', knowledgePoints: ['g3-kp-fact-opinion'] },
          { id: 'q38-4', prompt: 'AI 的回答里有数字和日期，你应该怎么做？', options: [{ id: 'a', label: '特别注意核对', icon: '🔍' }, { id: 'b', label: '直接相信', icon: '👍' }], answer: 'a', explain: '数字、日期最容易出错，要核对。', knowledgePoints: ['g3-kp-reliable-source', 'g3-kp-hallucination'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：冷知识核对员', instruction: '和家长一起找一个"冷知识"（比如"章鱼有三颗心脏"），用百科全书或正规科普网站核对它是真是假。' },
    ],
    rubric: [
      '在提示下能说出 AI 的回答需要核对',
      '能分清事实和观点',
      '能用可靠来源核对一个说法',
      '能主动发现回答中可疑的数字、日期，并说明核对的方法',
    ],
    parentGuide: {
      summary: '这节课培养"会怀疑、会核对"的习惯：AI 可能编造看起来很真的内容；要分清事实和观点，用可靠来源核对。',
      homeActivity: '看到"冷知识"或网络消息时，和孩子一起讨论"这是事实还是观点？怎么核对？"',
    },
    reviewed: true,
  },
  {
    id: 'g3-l9', grade: 3, order: 9, module: 'coding', title: '图形化编程入门', icon: '🧱', minutes: 30,
    goals: ['会用"前进、左转、右转"积木编程', '会运行程序并找出出错的积木（调试）', '能用转向和前进的组合走出迷宫'],
    prerequisites: ['g3-l7'],
    knowledgePoints: [
      { id: 'g3-kp-blocks', name: '用积木块编程', dimension: 'computational', prerequisites: ['g1-kp-instructions'] },
      { id: 'g3-kp-debug', name: '程序出错时找出错误（调试）', dimension: 'computational', prerequisites: ['g3-kp-blocks'] },
      { id: 'g3-kp-turns', name: '转向和前进的组合', dimension: 'computational', prerequisites: ['g3-kp-blocks', 'g1-kp-sequence'] },
    ],
    lifeExamples: [
      { icon: '🧭', text: '给别人指路："往前走两个路口，向右转，再往前走。"这就是一段程序。' },
      { icon: '🎮', text: '很多编程游戏用拼积木的方式写程序，不用打字也能编程。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '用积木编程', text: '把"前进""左转""右转"这样的积木一块块拼起来，就是一个程序。机器人会从上到下依次执行。', visual: '⬆️ ⬆️ ↱ ⬆️ ➜ 🤖' },
      { kind: 'explain', id: 's2', title: '转向不移动', text: '"左转""右转"只是让机器人转个方向，不会往前走。要往前走，还得用"前进"。', visual: '🤖↱ = 转身，不走' },
      { kind: 'explain', id: 's3', title: '调试', text: '程序出错很正常。看看机器人在哪一块积木出了问题，改掉它，再运行，这叫调试。', visual: '🐞 ➜ 🔍 ➜ 🔧' },
      {
        kind: 'blocks', id: 'a1', title: '积木闯关：帮机器人拿到星星', instruction: '点积木拼出程序，再点"运行程序"。撞墙了就调试一下。',
        knowledgePoints: ['g3-kp-blocks', 'g3-kp-turns', 'g3-kp-debug'],
        levels: [
          { id: 'l1', width: 4, height: 3, start: { x: 0, y: 1, dir: 1 }, goal: { x: 3, y: 1 }, walls: [], maxBlocks: 5 },
          { id: 'l2', width: 4, height: 4, start: { x: 0, y: 3, dir: 0 }, goal: { x: 3, y: 0 }, walls: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 1 }], maxBlocks: 9 },
          { id: 'l3', width: 5, height: 5, start: { x: 0, y: 0, dir: 1 }, goal: { x: 4, y: 4 }, walls: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }], maxBlocks: 12 },
        ],
        explain: '你用积木写出了程序，还学会了调试。这就是编程的开始！',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q39-1', prompt: '机器人朝右，执行"左转"以后，它朝哪里？', options: [{ id: 'a', label: '朝上', icon: '⬆️' }, { id: 'b', label: '朝下', icon: '⬇️' }], answer: 'a', explain: '面朝右时向左转，就朝上了。', knowledgePoints: ['g3-kp-turns'] },
          { id: 'q39-2', prompt: '"右转"会让机器人往前走一格吗？', options: [{ id: 'a', label: '不会，只是转方向', icon: '↱' }, { id: 'b', label: '会', icon: '⬆️' }], answer: 'a', explain: '转向只改方向，不移动。', knowledgePoints: ['g3-kp-turns'] },
          { id: 'q39-3', prompt: '程序运行时机器人撞墙了，应该怎么做？', options: [{ id: 'a', label: '找出哪块积木错了，改掉再运行', icon: '🔧' }, { id: 'b', label: '全部删掉，不玩了', icon: '🗑️' }], answer: 'a', explain: '找错、改错、再运行，就是调试。', knowledgePoints: ['g3-kp-debug'] },
          { id: 'q39-4', prompt: '积木程序是按什么顺序执行的？', options: [{ id: 'a', label: '从第一块到最后一块', icon: '⬇️' }, { id: 'b', label: '随便哪块先', icon: '🎲' }], answer: 'a', explain: '程序按顺序一块一块执行。', knowledgePoints: ['g3-kp-blocks'] },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '程序出错时，你是怎么找到错误的？',
        choices: [{ id: 'c1', label: '看机器人在哪一步出问题' }, { id: 'c2', label: '随便改改试试' }, { id: 'c3', label: '请别人帮忙' }],
        discussion: '看机器人在哪一步出问题，是最好的办法：一步步对照程序，就能找到出错的那块积木。请别人帮忙时，也要自己弄懂错在哪里。',
      },
      { kind: 'task', id: 'k1', title: '实践任务：真人编程', instruction: '用"前进一步、左转、右转"这几个口令，指挥家长从客厅走到门口。说错了就"调试"一下。' },
    ],
    rubric: [
      '在提示下能拼出简单的程序',
      '能独立完成第一、二关',
      '能通过调试独立完成全部关卡',
      '能用最少的积木完成关卡，并解释自己的调试过程',
    ],
    parentGuide: {
      summary: '这节课用积木编程走迷宫，学习顺序执行、方向组合和调试，为四年级的图形化编程进阶打基础。',
      homeActivity: '玩"真人编程"：孩子用口令指挥您走到某个地方，您严格照口令做。',
    },
    reviewed: true,
  },
];
