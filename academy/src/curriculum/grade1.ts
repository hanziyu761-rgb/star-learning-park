import type { Lesson } from './types';

// 一年级：AI 小小探索家 — 7 lessons + grade project (in lesson 7).
// Wording follows the accuracy checklist in the architecture doc:
// - AI is a program made by people that finds patterns in many examples.
// - Robot = a machine body that can move; robots may or may not use AI.
// - AI is not alive and can be wrong, so we check with adults.
// - Anything simulated is labelled as such (no simulations in grade 1 yet).

export const GRADE1: Lesson[] = [
  {
    id: 'g1-l1', grade: 1, order: 1, module: 'enlighten', title: 'AI 是什么？', icon: '💡', minutes: 15,
    goals: ['知道 AI 是人们做出来的电脑程序', '能找出 2 个用到 AI 的东西', '知道 AI 没有生命，也会出错'],
    prerequisites: [],
    knowledgePoints: [
      { id: 'g1-kp-ai-program', name: 'AI 是人做的电脑程序', dimension: 'cognition', prerequisites: [] },
      { id: 'g1-kp-ai-patterns', name: 'AI 从很多例子里找规律', dimension: 'cognition', prerequisites: ['g1-kp-ai-program'] },
      { id: 'g1-kp-ai-mistakes', name: 'AI 会出错，要检查', dimension: 'critical', prerequisites: ['g1-kp-ai-program'] },
    ],
    lifeExamples: [
      { icon: '🔊', text: '对智能音箱说"放一首儿歌"，它能听懂并播放。' },
      { icon: '📱', text: '用手机拍一朵花，有的软件能说出花的名字。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: 'AI 的名字', text: 'AI 是"人工智能"的简称。它是人们做出来的电脑程序。', visual: '👩‍💻 ➜ 💻' },
      { kind: 'explain', id: 's2', title: 'AI 怎么学', text: 'AI 看过很多很多例子，从里面找到规律，再用规律来判断。', visual: '🐱🐱🐱🐱 ➜ 🔍 ➜ "这是猫"' },
      { kind: 'explain', id: 's3', title: 'AI 不是生命', text: 'AI 不是小动物，也不是人。它没有生命，不会真的开心或难过。', visual: '💻 ≠ 🐶 ≠ 🧒' },
      { kind: 'explain', id: 's4', title: 'AI 也会出错', text: 'AI 有时会说错、认错。重要的事情，要和爸爸妈妈、老师一起检查。', visual: '🤔 ➜ ✅' },
      {
        kind: 'sort', id: 'a1', title: '找一找：哪些用到了 AI？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '用到了 AI', icon: '💡' }, b: { label: '没用到 AI', icon: '📦' } },
        knowledgePoints: ['g1-kp-ai-program'],
        items: [
          { id: 'i1', label: '能听懂说话的智能音箱', icon: '🔊', bin: 'a', why: '它要听懂你说的话，用到了 AI。' },
          { id: 'i2', label: '认出照片里小猫的手机软件', icon: '📱', bin: 'a', why: '认出图片里有什么，用到了 AI。' },
          { id: 'i3', label: '把英语变成中文的翻译笔', icon: '🖊️', bin: 'a', why: '把一种语言变成另一种语言，用到了 AI。' },
          { id: 'i4', label: '普通铅笔', icon: '✏️', bin: 'b', why: '铅笔只是写字的工具，没有程序。' },
          { id: 'i5', label: '手电筒', icon: '🔦', bin: 'b', why: '按下开关就亮，不需要判断。' },
          { id: 'i6', label: '到点就响的普通闹钟', icon: '⏰', bin: 'b', why: '它只按设定好的时间响，不用 AI 判断。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果 AI 告诉你"鲸鱼是一种鱼"，你会怎么做？',
        choices: [{ id: 'c1', label: '马上相信' }, { id: 'c2', label: '去查书或问老师' }, { id: 'c3', label: '我不确定' }],
        discussion: '鲸鱼其实是哺乳动物，不是鱼。AI 也会说错，所以查一查、问一问是很棒的习惯。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q1-1', prompt: 'AI 是什么？', options: [{ id: 'a', label: '一种小动物', icon: '🐶' }, { id: 'b', label: '人们做出来的电脑程序', icon: '💻' }, { id: 'c', label: '一种玩具车', icon: '🚗' }], answer: 'b', explain: 'AI 是人们做出来的电脑程序。', knowledgePoints: ['g1-kp-ai-program'] },
          { id: 'q1-2', prompt: '下面哪个用到了 AI？', options: [{ id: 'a', label: '橡皮', icon: '🧽' }, { id: 'b', label: '能听懂说话的智能音箱', icon: '🔊' }, { id: 'c', label: '尺子', icon: '📏' }], answer: 'b', explain: '智能音箱要听懂你的话，用到了 AI。', knowledgePoints: ['g1-kp-ai-program'] },
          { id: 'q1-3', prompt: 'AI 是怎么学会认猫的？', options: [{ id: 'a', label: '看了很多猫的图片，找到规律', icon: '🐱' }, { id: 'b', label: '它天生就会', icon: '✨' }], answer: 'a', explain: 'AI 从很多例子里找规律。', knowledgePoints: ['g1-kp-ai-patterns'] },
          { id: 'q1-4', prompt: 'AI 会不会出错？', options: [{ id: 'a', label: '会，要检查', icon: '🤔' }, { id: 'b', label: '永远不会', icon: '💯' }], answer: 'a', explain: 'AI 也会出错，重要的事要检查。', knowledgePoints: ['g1-kp-ai-mistakes'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：家里的 AI', instruction: '和爸爸妈妈一起，在家里找一个用到 AI 的东西，说给他们听：它是怎么帮忙的？' },
    ],
    rubric: [
      '在提示下能说出"AI 是电脑程序"',
      '能自己说出 AI 是什么，并找出 1 个用到 AI 的东西',
      '能分清哪些东西用到了 AI，并说出理由',
      '能主动提醒家人：AI 也会出错，要检查',
    ],
    parentGuide: {
      summary: '这节课让孩子知道：AI 是人做的程序，不是生命，也会出错。',
      homeActivity: '和孩子一起找找家里用到 AI 的东西（比如智能音箱、手机里的拍照识别），请孩子说说它怎么帮忙。',
    },
    reviewed: true,
  },
  {
    id: 'g1-l2', grade: 1, order: 2, module: 'enlighten', title: 'AI 和机器人有什么区别？', icon: '🤖', minutes: 15,
    goals: ['知道机器人是能动的机器身体', '知道 AI 是会判断的程序', '知道有的机器人没有 AI，有的 AI 没有机器人身体'],
    prerequisites: ['g1-l1'],
    knowledgePoints: [
      { id: 'g1-kp-robot-body', name: '机器人是能动的机器身体', dimension: 'cognition', prerequisites: [] },
      { id: 'g1-kp-ai-vs-robot', name: 'AI 和机器人不一样', dimension: 'cognition', prerequisites: ['g1-kp-ai-program', 'g1-kp-robot-body'] },
    ],
    lifeExamples: [
      { icon: '🍜', text: '有的餐厅里，送餐机器人会自己绕开桌子，把菜送到你面前。' },
      { icon: '🏭', text: '工厂里的机械臂，每天重复做同样的动作。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '机器人是什么', text: '机器人是一种机器，它有身体，能动起来帮人做事。', visual: '🤖 ➜ 🦾🦿' },
      { kind: 'explain', id: 's2', title: 'AI 是什么', text: 'AI 是会判断的程序，像机器的"大脑"。它可以装在机器人里，也可以装在手机、音箱里。', visual: '💡 ➜ 🤖 / 📱 / 🔊' },
      { kind: 'explain', id: 's3', title: '不一定在一起', text: '有的机器人没有 AI，只会按固定步骤做事。有的 AI 没有机器人身体，比如手机里的语音助手。', visual: '🦾 没有 AI    📱 没有身体' },
      { kind: 'explain', id: 's4', title: '在一起会怎样', text: '送餐机器人有身体，也用 AI 看路、躲开桌子，所以它能自己找到你的座位。', visual: '🤖 + 💡 = 🍜✅' },
      {
        kind: 'sort', id: 'a1', title: '分一分：有没有机器人身体？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '有会动的身体', icon: '🦿' }, b: { label: '没有身体，只是程序', icon: '💻' } },
        knowledgePoints: ['g1-kp-robot-body', 'g1-kp-ai-vs-robot'],
        items: [
          { id: 'i1', label: '送餐机器人', icon: '🍜', bin: 'a', why: '它有轮子和身体，能在餐厅里走动。' },
          { id: 'i2', label: '工厂里的机械臂', icon: '🦾', bin: 'a', why: '它有能动的手臂。' },
          { id: 'i3', label: '扫地机器人', icon: '🧹', bin: 'a', why: '它有身体，能在地上移动。' },
          { id: 'i4', label: '手机里的语音助手', icon: '📱', bin: 'b', why: '它是手机里的程序，没有机器人身体。' },
          { id: 'i5', label: '拍照认花的软件', icon: '🌸', bin: 'b', why: '它是一个软件程序，没有身体。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果你造一个机器人，你想让它有 AI 吗？为什么？',
        choices: [{ id: 'c1', label: '想，它能自己判断' }, { id: 'c2', label: '不想，按我的步骤做就好' }, { id: 'c3', label: '看它要做什么事' }],
        discussion: '都有道理！要做的事很简单、每次都一样，不用 AI 也可以；要看路、听话、做判断，才需要 AI。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q2-1', prompt: '机器人一定有 AI 吗？', options: [{ id: 'a', label: '一定有' }, { id: 'b', label: '不一定' }], answer: 'b', explain: '有的机器人只按固定步骤做事，没有 AI。', knowledgePoints: ['g1-kp-ai-vs-robot'] },
          { id: 'q2-2', prompt: '手机里的语音助手有机器人身体吗？', options: [{ id: 'a', label: '有' }, { id: 'b', label: '没有' }], answer: 'b', explain: '语音助手是手机里的程序，没有身体。', knowledgePoints: ['g1-kp-ai-vs-robot'] },
          { id: 'q2-3', prompt: '下面哪个是机器人？', options: [{ id: 'a', label: '扫地机器人', icon: '🧹' }, { id: 'b', label: '一本书', icon: '📕' }, { id: 'c', label: '一个苹果', icon: '🍎' }], answer: 'a', explain: '扫地机器人有身体，能动起来帮人做事。', knowledgePoints: ['g1-kp-robot-body'] },
          { id: 'q2-4', prompt: '送餐机器人能自己绕开桌子，是因为它用到了什么？', options: [{ id: 'a', label: '会判断的程序（AI）' }, { id: 'b', label: '只靠漂亮的颜色' }], answer: 'a', explain: '它用 AI 看路、判断怎么走。', knowledgePoints: ['g1-kp-ai-vs-robot'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：机器人侦探', instruction: '看看家里或小区里有没有机器人。和家长说一说：它有身体吗？它会自己判断吗？' },
    ],
    rubric: [
      '在提示下能指出哪个是机器人',
      '能说出"机器人有身体，AI 是程序"',
      '能举例说明有的机器人没有 AI、有的 AI 没有身体',
      '能为自己想造的机器人说明需不需要 AI，并给出理由',
    ],
    parentGuide: {
      summary: '孩子常把 AI 和机器人当成一回事。这节课帮孩子分清"身体"和"会判断的程序"。',
      homeActivity: '看到扫地机器人或语音助手时，问问孩子：它有身体吗？它用到 AI 了吗？',
    },
    reviewed: true,
  },
  {
    id: 'g1-l3', grade: 1, order: 3, module: 'enlighten', title: 'AI 可以做什么？', icon: '🧰', minutes: 15,
    goals: ['知道 AI 能帮忙听、看、说、推荐', '知道有些事要靠人自己', '知道自己的事情要自己负责'],
    prerequisites: ['g1-l1'],
    knowledgePoints: [
      { id: 'g1-kp-ai-can', name: 'AI 能帮忙听、看、说、推荐', dimension: 'application', prerequisites: ['g1-kp-ai-program'] },
      { id: 'g1-kp-ai-cannot', name: '有些事要靠人自己', dimension: 'critical', prerequisites: ['g1-kp-ai-can'] },
    ],
    lifeExamples: [
      { icon: '🗺️', text: '爸爸妈妈开车时，地图软件会推荐一条路线。' },
      { icon: '🌐', text: '翻译软件能把外国话变成中文。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: 'AI 会听', text: 'AI 能听懂人说的话，把声音变成文字。', visual: '🗣️ ➜ 📝' },
      { kind: 'explain', id: 's2', title: 'AI 会看', text: 'AI 能认出照片里有什么，比如小猫、苹果、汽车。', visual: '📷 ➜ 🐱🍎🚗' },
      { kind: 'explain', id: 's3', title: 'AI 会说、会推荐', text: 'AI 能写句子、翻译，还能推荐你可能喜欢的动画片。', visual: '💬 🌐 📺' },
      { kind: 'explain', id: 's4', title: '要靠人自己的事', text: '交朋友、安慰别人、为自己的作业负责，这些要靠我们自己。AI 只是帮手。', visual: '🤝 🤗 📒' },
      {
        kind: 'sort', id: 'a1', title: '分一分：AI 能帮忙，还是要靠自己？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: 'AI 能帮忙', icon: '💡' }, b: { label: '要靠人自己', icon: '🧒' } },
        knowledgePoints: ['g1-kp-ai-can', 'g1-kp-ai-cannot'],
        items: [
          { id: 'i1', label: '把中文翻译成英语', icon: '🌐', bin: 'a', why: '翻译是 AI 擅长帮忙的事。' },
          { id: 'i2', label: '认出照片里的花', icon: '🌸', bin: 'a', why: '认图片是 AI 能帮忙的事。' },
          { id: 'i3', label: '推荐一部动画片', icon: '📺', bin: 'a', why: '推荐是 AI 常做的事，但看不看由你和家长决定。' },
          { id: 'i4', label: '抱一抱难过的好朋友', icon: '🤗', bin: 'b', why: '关心朋友要靠我们自己。' },
          { id: 'i5', label: '为自己的作业负责', icon: '📒', bin: 'b', why: '作业是自己的事，AI 不能替你学会。' },
          { id: 'i6', label: '决定和谁做好朋友', icon: '🤝', bin: 'b', why: '交朋友要靠自己的心。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果让 AI 帮你写完作业，你自己学会了吗？',
        choices: [{ id: 'c1', label: '学会了' }, { id: 'c2', label: '没学会' }, { id: 'c3', label: '我不确定' }],
        discussion: '作业是帮我们练习的。AI 写的不是我们学会的。可以请 AI 给提示，但答案要自己想。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q3-1', prompt: '哪件事是 AI 能帮忙的？', options: [{ id: 'a', label: '把英语翻译成中文', icon: '🌐' }, { id: 'b', label: '替你交朋友', icon: '🤝' }], answer: 'a', explain: '翻译是 AI 擅长的事。', knowledgePoints: ['g1-kp-ai-can'] },
          { id: 'q3-2', prompt: 'AI 能认出照片里的小猫吗？', options: [{ id: 'a', label: '能' }, { id: 'b', label: '不能' }], answer: 'a', explain: '认出图片里有什么，叫图像识别，AI 能做到（有时也会认错）。', knowledgePoints: ['g1-kp-ai-can'] },
          { id: 'q3-3', prompt: '作业应该由谁负责？', options: [{ id: 'a', label: 'AI', icon: '💻' }, { id: 'b', label: '我自己', icon: '🧒' }], answer: 'b', explain: '作业是自己的事，AI 只是帮手。', knowledgePoints: ['g1-kp-ai-cannot'] },
          { id: 'q3-4', prompt: '地图软件推荐了一条路，最后走哪条路由谁决定？', options: [{ id: 'a', label: '开车的人', icon: '🧑' }, { id: 'b', label: '只能听软件的', icon: '🗺️' }], answer: 'a', explain: 'AI 给建议，人来做决定。', knowledgePoints: ['g1-kp-ai-cannot'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：AI 小帮手清单', instruction: '和家长一起说出 3 件 AI 能帮忙的事，再说出 1 件一定要自己做的事。' },
    ],
    rubric: [
      '在提示下能说出 1 件 AI 能做的事',
      '能说出 AI 会听、会看、会推荐',
      '能分清哪些事 AI 能帮忙、哪些要靠自己',
      '能说明为什么"AI 给建议，人来做决定"',
    ],
    parentGuide: {
      summary: '这节课让孩子知道 AI 是帮手，学习、交朋友和做决定要靠自己。',
      homeActivity: '用地图或翻译软件时，告诉孩子"这是 AI 在帮忙"，再一起讨论"最后谁来决定"。',
    },
    reviewed: true,
  },
  {
    id: 'g1-l4', grade: 1, order: 4, module: 'enlighten', title: '语音识别', icon: '🎙️', minutes: 15,
    goals: ['知道语音识别是把说的话变成文字', '知道说清楚、环境安静时识别更准', '知道用麦克风前要先问家长'],
    prerequisites: ['g1-l3'],
    knowledgePoints: [
      { id: 'g1-kp-asr', name: '语音识别把声音变成文字', dimension: 'cognition', prerequisites: ['g1-kp-ai-can'] },
      { id: 'g1-kp-asr-conditions', name: '什么情况下更容易听清', dimension: 'critical', prerequisites: ['g1-kp-asr'] },
      { id: 'g1-kp-voice-privacy', name: '声音也是个人信息', dimension: 'critical', prerequisites: [] },
    ],
    lifeExamples: [
      { icon: '🔊', text: '对智能音箱说"今天天气怎么样"，它会先把你的话变成文字，再回答。' },
      { icon: '⌨️', text: '有的输入法可以"说话打字"，不用一个个按键。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是语音识别', text: '语音识别，就是让电脑把人说的话变成文字。', visual: '🗣️ "你好" ➜ 📝 你好' },
      { kind: 'explain', id: 's2', title: '它是怎么学会的', text: 'AI 听过很多人说话的录音，也知道每段录音说的是什么字，从里面找到规律。', visual: '🎧🎧🎧 + 📝 ➜ 💡' },
      { kind: 'explain', id: 's3', title: '怎样更容易听清', text: '说话清楚、不太快、周围安静，AI 就更容易听对。太吵或太小声，它就可能听错。', visual: '🤫✅    📢🎉❓' },
      { kind: 'explain', id: 's4', title: '声音也要保护', text: '你的声音也是你的个人信息。用麦克风之前，要先问爸爸妈妈。', visual: '🎙️ ➜ 👨‍👩‍👧 ✅' },
      {
        kind: 'sort', id: 'a1', title: '分一分：AI 容易听清吗？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '容易听清', icon: '👂' }, b: { label: '可能听错', icon: '❓' } },
        knowledgePoints: ['g1-kp-asr-conditions'],
        items: [
          { id: 'i1', label: '在安静的房间慢慢说', icon: '🤫', bin: 'a', why: '安静、说得清楚，AI 更容易听对。' },
          { id: 'i2', label: '对着麦克风清楚地说', icon: '🎙️', bin: 'a', why: '声音清楚，更容易识别。' },
          { id: 'i3', label: '在很吵的地方小声说', icon: '📢', bin: 'b', why: '噪音太大，声音太小，AI 可能听错。' },
          { id: 'i4', label: '嘴里含着东西说话', icon: '🍬', bin: 'b', why: '说不清楚，AI 也难听清。' },
          { id: 'i5', label: '好几个人同时说话', icon: '👥', bin: 'b', why: '声音混在一起，AI 分不清。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '为什么用麦克风前，要先问爸爸妈妈？',
        choices: [{ id: 'c1', label: '声音是我的个人信息' }, { id: 'c2', label: '不用问也可以' }, { id: 'c3', label: '我不确定' }],
        discussion: '声音能让别人认出你，是你的个人信息。先问家长，由家长决定能不能用，这样更安全。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q4-1', prompt: '语音识别是做什么的？', options: [{ id: 'a', label: '把说的话变成文字', icon: '📝' }, { id: 'b', label: '把图片变大', icon: '🖼️' }], answer: 'a', explain: '语音识别把声音变成文字。', knowledgePoints: ['g1-kp-asr'] },
          { id: 'q4-2', prompt: '哪种情况 AI 更容易听清？', options: [{ id: 'a', label: '安静的房间里慢慢说', icon: '🤫' }, { id: 'b', label: '很吵的操场上小声说', icon: '📢' }], answer: 'a', explain: '安静、清楚，更容易听对。', knowledgePoints: ['g1-kp-asr-conditions'] },
          { id: 'q4-3', prompt: '用麦克风之前要怎么做？', options: [{ id: 'a', label: '先问爸爸妈妈' }, { id: 'b', label: '直接打开' }], answer: 'a', explain: '声音是个人信息，先问家长。', knowledgePoints: ['g1-kp-voice-privacy'] },
          { id: 'q4-4', prompt: 'AI 把"苹果"听成了"平果"，说明了什么？', options: [{ id: 'a', label: 'AI 也会听错' }, { id: 'b', label: 'AI 永远是对的' }], answer: 'a', explain: '语音识别也会出错，要检查。', knowledgePoints: ['g1-kp-asr-conditions'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：说清楚', instruction: '在家长陪同下，试试用手机的语音输入说一句话，看看它写对了没有。再在吵一点的地方试一次，比一比。' },
    ],
    rubric: [
      '在提示下能说出"语音识别把话变成文字"',
      '能自己说出语音识别是做什么的',
      '能判断什么情况下 AI 容易听错',
      '能主动说明用麦克风前要征得家长同意',
    ],
    parentGuide: {
      summary: '这节课介绍语音识别，也让孩子知道声音是个人信息。本课不会打开麦克风。',
      homeActivity: '在您的陪同下用手机语音输入试一试，和孩子一起看它有没有写对。',
    },
    reviewed: true,
  },
  {
    id: 'g1-l5', grade: 1, order: 5, module: 'enlighten', title: '图像识别', icon: '🖼️', minutes: 15,
    goals: ['知道图像识别是让电脑认出图片里有什么', '知道 AI 从很多带名字的图片里学习', '知道图片不清楚时 AI 可能认错'],
    prerequisites: ['g1-l3'],
    knowledgePoints: [
      { id: 'g1-kp-vision', name: '图像识别认出图片里有什么', dimension: 'cognition', prerequisites: ['g1-kp-ai-can'] },
      { id: 'g1-kp-labels', name: 'AI 从带名字的图片里学习', dimension: 'cognition', prerequisites: ['g1-kp-ai-patterns'] },
      { id: 'g1-kp-vision-errors', name: '图片不清楚时 AI 可能认错', dimension: 'critical', prerequisites: ['g1-kp-vision'] },
    ],
    lifeExamples: [
      { icon: '🌸', text: '拍一朵花，识花软件能告诉你它可能叫什么名字。' },
      { icon: '🅿️', text: '停车场的摄像头能认出车牌号码，自动抬起栏杆。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是图像识别', text: '图像识别，就是让电脑认出图片里有什么。', visual: '📷 ➜ "这是苹果" 🍎' },
      { kind: 'explain', id: 's2', title: '带名字的图片', text: '人们给很多图片写上名字，比如"猫""狗"。这些名字叫"标签"。AI 从这些图片里找规律。', visual: '🐱 猫  🐶 狗  🐱 猫' },
      { kind: 'explain', id: 's3', title: '它可能认错', text: '图片太模糊、太暗，或者只拍到一点点，AI 就可能认错。', visual: '🌫️🐱 ➜ "是狗？" ❓' },
      { kind: 'explain', id: 's4', title: '不像人那样看', text: 'AI 认图片，靠的是找规律，和我们用眼睛、用心去看不一样，所以它的答案也要检查。', visual: '👀 ≠ 🔍' },
      {
        kind: 'sort', id: 'a1', title: '分一分：AI 容易认对吗？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '容易认对', icon: '✅' }, b: { label: '可能认错', icon: '❓' } },
        knowledgePoints: ['g1-kp-vision-errors'],
        items: [
          { id: 'i1', label: '光线明亮、正面拍的小猫', icon: '🐱', bin: 'a', why: '清楚、完整，AI 更容易认对。' },
          { id: 'i2', label: '桌上一个清清楚楚的苹果', icon: '🍎', bin: 'a', why: '清楚的图片更容易认。' },
          { id: 'i3', label: '很模糊的照片', icon: '🌫️', bin: 'b', why: '看不清，AI 可能认错。' },
          { id: 'i4', label: '只拍到一点点尾巴', icon: '〰️', bin: 'b', why: '信息太少，AI 很难判断。' },
          { id: 'i5', label: '黑漆漆的房间里拍的照片', icon: '🌑', bin: 'b', why: '太暗了，AI 可能认错。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果 AI 只看过白色小猫的图片，它看到黑色小猫时，可能会怎样？',
        choices: [{ id: 'c1', label: '一定能认出来' }, { id: 'c2', label: '可能认不出来' }, { id: 'c3', label: '我不确定' }],
        discussion: 'AI 只能从看过的例子里找规律。没见过黑色小猫，它可能就认不准。所以给 AI 学习的例子要多种多样。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q5-1', prompt: '图像识别是做什么的？', options: [{ id: 'a', label: '认出图片里有什么', icon: '🖼️' }, { id: 'b', label: '把声音变成文字', icon: '🗣️' }], answer: 'a', explain: '图像识别认出图片里有什么。', knowledgePoints: ['g1-kp-vision'] },
          { id: 'q5-2', prompt: '给图片写上的名字，比如"猫"，叫什么？', options: [{ id: 'a', label: '标签', icon: '🏷️' }, { id: 'b', label: '颜色', icon: '🎨' }], answer: 'a', explain: '图片的名字叫标签。', knowledgePoints: ['g1-kp-labels'] },
          { id: 'q5-3', prompt: '哪张图片 AI 更容易认对？', options: [{ id: 'a', label: '清清楚楚的苹果', icon: '🍎' }, { id: 'b', label: '模糊不清的照片', icon: '🌫️' }], answer: 'a', explain: '清楚的图片更容易认对。', knowledgePoints: ['g1-kp-vision-errors'] },
          { id: 'q5-4', prompt: 'AI 是怎么学会认猫的？', options: [{ id: 'a', label: '看了很多写着"猫"的图片', icon: '🐱' }, { id: 'b', label: '它自己就知道', icon: '✨' }], answer: 'a', explain: 'AI 从很多带标签的图片里找规律。', knowledgePoints: ['g1-kp-labels'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：给图片起名字', instruction: '找 5 样家里的东西，像 AI 的老师一样，一个一个说出它们的名字（标签）。' },
    ],
    rubric: [
      '在提示下能说出"图像识别认出图片里有什么"',
      '能说出 AI 从带标签的图片里学习',
      '能判断哪些图片 AI 可能认错',
      '能说明为什么学习的例子要多种多样',
    ],
    parentGuide: {
      summary: '这节课介绍图像识别和"标签"，为二年级"训练 AI"打基础。',
      homeActivity: '拍照识物时，故意拍得模糊一点，和孩子一起看看 AI 会不会认错。',
    },
    reviewed: true,
  },
  {
    id: 'g1-l6', grade: 1, order: 6, module: 'safety', title: 'AI 在生活中的应用', icon: '🏙️', minutes: 15,
    goals: ['能说出 AI 在交通、医疗、学习中的例子', '知道使用 AI 时要保护个人信息', '知道 AI 说的和书上不一样时要核对'],
    prerequisites: ['g1-l3'],
    knowledgePoints: [
      { id: 'g1-kp-ai-life', name: 'AI 在生活中的应用', dimension: 'application', prerequisites: ['g1-kp-ai-can'] },
      { id: 'g1-kp-ai-safety', name: '安全地使用 AI', dimension: 'critical', prerequisites: [] },
    ],
    lifeExamples: [
      { icon: '🏥', text: '有的医院用 AI 帮医生看片子，但最后由医生来判断。' },
      { icon: '🚦', text: '有的城市用 AI 帮忙调整红绿灯，让车走得更顺。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '出门路上', text: '地图软件用 AI 推荐路线。有的城市用 AI 帮忙安排红绿灯。', visual: '🗺️ 🚦 🚗' },
      { kind: 'explain', id: 's2', title: '在医院', text: 'AI 可以帮医生看片子，发现可能的问题。最后还是医生来判断。', visual: '🩻 ➜ 💡 ➜ 👩‍⚕️' },
      { kind: 'explain', id: 's3', title: '在学习中', text: 'AI 可以帮我们查资料、练发音。答案还要自己想，也要检查。', visual: '📚 🗣️ ✅' },
      { kind: 'explain', id: 's4', title: '安全小规则', text: '不把名字、住址、电话、照片告诉 AI。AI 说的和书上、老师说的不一样时，要核对。', visual: '🔒 🏠 ☎️ 📷' },
      {
        kind: 'sort', id: 'a1', title: '分一分：安全还是不安全？', instruction: '先点一张卡片，再点它该去的筐。',
        bins: { a: { label: '安全的做法', icon: '🛡️' }, b: { label: '不安全的做法', icon: '⚠️' } },
        knowledgePoints: ['g1-kp-ai-safety'],
        items: [
          { id: 'i1', label: '用 AI 之前先问家长', icon: '👨‍👩‍👧', bin: 'a', why: '家长同意再用，更安全。' },
          { id: 'i2', label: 'AI 说的和书上不一样时去核对', icon: '📚', bin: 'a', why: '核对能发现 AI 的错误。' },
          { id: 'i3', label: '把家里的地址告诉 AI', icon: '🏠', bin: 'b', why: '住址是个人信息，不能随便说。' },
          { id: 'i4', label: '把自己的照片发给不认识的软件', icon: '📷', bin: 'b', why: '照片也是个人信息。' },
          { id: 'i5', label: 'AI 让你别告诉家长，你就照做', icon: '🤐', bin: 'b', why: '任何让你瞒着家长的要求都不对，要马上告诉家长。' },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '你最希望 AI 在哪里帮帮忙？',
        choices: [{ id: 'c1', label: '学习' }, { id: 'c2', label: '交通出行' }, { id: 'c3', label: '看病' }, { id: 'c4', label: '保护环境' }],
        discussion: '这些地方 AI 都能帮上忙。无论在哪里，都要记得：AI 是帮手，重要的决定由人来做。',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q6-1', prompt: 'AI 帮医生看片子，最后由谁判断？', options: [{ id: 'a', label: '医生', icon: '👩‍⚕️' }, { id: 'b', label: '只听 AI 的', icon: '💻' }], answer: 'a', explain: 'AI 是帮手，医生来判断。', knowledgePoints: ['g1-kp-ai-life'] },
          { id: 'q6-2', prompt: '下面哪个可以告诉 AI？', options: [{ id: 'a', label: '我喜欢的动物', icon: '🐼' }, { id: 'b', label: '我家的地址', icon: '🏠' }], answer: 'a', explain: '喜欢的动物不是个人信息；地址是个人信息。', knowledgePoints: ['g1-kp-ai-safety'] },
          { id: 'q6-3', prompt: 'AI 让你"别告诉爸爸妈妈"，你该怎么做？', options: [{ id: 'a', label: '马上告诉爸爸妈妈' }, { id: 'b', label: '照它说的做' }], answer: 'a', explain: '让你瞒着家长的要求都不对。', knowledgePoints: ['g1-kp-ai-safety'] },
          { id: 'q6-4', prompt: '地图软件推荐路线，用到了什么？', options: [{ id: 'a', label: 'AI', icon: '💡' }, { id: 'b', label: '魔法', icon: '🪄' }], answer: 'a', explain: '地图软件用 AI 帮忙推荐路线。', knowledgePoints: ['g1-kp-ai-life'] },
        ],
      },
      { kind: 'task', id: 'k1', title: '实践任务：安全约定', instruction: '和家长一起定 3 条"使用 AI 的家庭约定"，说给家长听。' },
    ],
    rubric: [
      '在提示下能说出 1 个生活中的 AI 应用',
      '能说出交通、医疗、学习里的 AI 例子',
      '能分清使用 AI 时哪些做法安全、哪些不安全',
      '能和家人一起定下使用 AI 的规则并说明原因',
    ],
    parentGuide: {
      summary: '这节课既认识生活中的 AI，也建立安全习惯：不说个人信息、不瞒着家长、遇到不一样的说法要核对。',
      homeActivity: '和孩子一起写下 3 条"家庭 AI 使用约定"，贴在显眼的地方。',
    },
    reviewed: true,
  },
  {
    id: 'g1-l7', grade: 1, order: 7, module: 'coding', title: '指令和简单逻辑', icon: '🧭', minutes: 20,
    goals: ['知道指令是一步一步告诉机器做什么', '知道步骤的顺序很重要', '能说出"如果……就……"的规则', '完成年级项目：设计我的智能机器人'],
    prerequisites: ['g1-l2'],
    knowledgePoints: [
      { id: 'g1-kp-instructions', name: '指令是一步一步的', dimension: 'computational', prerequisites: [] },
      { id: 'g1-kp-sequence', name: '步骤顺序很重要', dimension: 'computational', prerequisites: ['g1-kp-instructions'] },
      { id: 'g1-kp-if-then', name: '如果……就……', dimension: 'computational', prerequisites: ['g1-kp-instructions'] },
      { id: 'g1-kp-design-robot', name: '设计自己的机器人', dimension: 'creation', prerequisites: ['g1-kp-ai-vs-robot', 'g1-kp-if-then'] },
    ],
    lifeExamples: [
      { icon: '🍳', text: '做西红柿炒蛋要按步骤：先打蛋，再下锅。顺序乱了就做不好。' },
      { icon: '☔', text: '如果下雨，就带伞。这就是一条"如果……就……"的规则。' },
    ],
    steps: [
      { kind: 'explain', id: 's1', title: '什么是指令', text: '指令就是一步一步告诉机器要做什么。机器会照着做。', visual: '1️⃣ ➜ 2️⃣ ➜ 3️⃣' },
      { kind: 'explain', id: 's2', title: '顺序很重要', text: '先穿袜子再穿鞋。顺序反了，就不对啦。给机器的指令也一样。', visual: '🧦 ➜ 👟 ✅    👟 ➜ 🧦 ❌' },
      { kind: 'explain', id: 's3', title: '如果……就……', text: '"如果下雨，就带伞。"机器也能按这样的规则做判断。', visual: '🌧️ ➜ ☂️' },
      {
        kind: 'order', id: 'a1', title: '排一排：教机器人刷牙', instruction: '按正确的顺序，依次点下面的卡片。',
        knowledgePoints: ['g1-kp-instructions', 'g1-kp-sequence'],
        steps: [
          { id: 'o1', label: '拿起牙刷', icon: '🪥' },
          { id: 'o2', label: '挤上牙膏', icon: '🧴' },
          { id: 'o3', label: '刷牙', icon: '😁' },
          { id: 'o4', label: '用水漱口', icon: '💧' },
        ],
        explain: '机器人会严格按顺序做。先挤牙膏再拿牙刷，牙膏就挤到手上啦！',
      },
      {
        kind: 'quiz', id: 'q1', title: '小练习',
        questions: [
          { id: 'q7-1', prompt: '指令是什么？', options: [{ id: 'a', label: '一步一步告诉机器做什么' }, { id: 'b', label: '机器自己乱做' }], answer: 'a', explain: '指令要一步一步说清楚。', knowledgePoints: ['g1-kp-instructions'] },
          { id: 'q7-2', prompt: '穿鞋和穿袜子，先做哪个？', options: [{ id: 'a', label: '先穿袜子', icon: '🧦' }, { id: 'b', label: '先穿鞋', icon: '👟' }], answer: 'a', explain: '顺序很重要：先袜子，后鞋子。', knowledgePoints: ['g1-kp-sequence'] },
          { id: 'q7-3', prompt: '"如果天黑了，就……"后面接哪个最合适？', options: [{ id: 'a', label: '打开灯', icon: '💡' }, { id: 'b', label: '戴上墨镜', icon: '🕶️' }], answer: 'a', explain: '如果天黑了，就打开灯。', knowledgePoints: ['g1-kp-if-then'] },
          { id: 'q7-4', prompt: '扫地机器人的规则："如果前面有墙，就……"', options: [{ id: 'a', label: '转个方向', icon: '↩️' }, { id: 'b', label: '一直往前撞', icon: '💥' }], answer: 'a', explain: '碰到墙就转向，这是"如果……就……"。', knowledgePoints: ['g1-kp-if-then'] },
        ],
      },
      {
        kind: 'think', id: 't1', title: '想一想', question: '如果你给机器人的指令少了一步，会怎么样？',
        choices: [{ id: 'c1', label: '它会自己补上' }, { id: 'c2', label: '它可能做错' }, { id: 'c3', label: '我不确定' }],
        discussion: '机器只会照着指令做。少一步，它就可能做错。所以写指令要想得仔细。',
      },
      { kind: 'project', id: 'p1', title: '年级项目：设计我的智能机器人', instruction: '给你的机器人起个名字，选它的身体、本领和工作，再定一条"如果……就……"的规则。', editor: 'robot-designer' },
    ],
    rubric: [
      '在提示下能把 2 个步骤排对',
      '能自己把 4 个步骤排对，并说出"如果……就……"',
      '能为生活中的事写出正确顺序的指令',
      '能设计出有规则的智能机器人，并说明它为什么需要这条规则',
    ],
    parentGuide: {
      summary: '这节课是计算思维的起点：按顺序给指令、用"如果……就……"做判断。最后孩子会设计自己的机器人。',
      homeActivity: '请孩子当"指令员"，一步一步指挥您倒一杯水。您要严格照着做，指令漏了就停下，让孩子补上。',
    },
    reviewed: true,
  },
];
