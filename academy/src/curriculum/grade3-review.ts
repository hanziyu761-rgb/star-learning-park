import type { QuizQuestion } from './types';

// Review-only questions for grade 3.
export const GRADE3_REVIEW: Record<string, QuizQuestion[]> = {
  'g3-l1': [
    { id: 'r31-1', prompt: '哪个问题更好？', options: [{ id: 'a', label: '为什么树叶到了秋天会变黄？', icon: '🍂' }, { id: 'b', label: '树叶', icon: '🤷' }], answer: 'a', explain: '清楚具体的问题更好。', knowledgePoints: ['g3-kp-good-question'] },
    { id: 'r31-2', prompt: '向 AI 提问时，哪个信息不该说？', options: [{ id: 'a', label: '我在哪个班、班主任叫什么', icon: '🏫' }, { id: 'b', label: '请讲得简单一点', icon: '🗣️' }], answer: 'a', explain: '班级、老师名字也会暴露你的身份。', knowledgePoints: ['g3-kp-context-no-privacy'] },
  ],
  'g3-l2': [
    { id: 'r32-1', prompt: '"请你当一位故事大王"是提示词的哪部分？', options: [{ id: 'a', label: '角色', icon: '🎭' }, { id: 'b', label: '任务', icon: '🎯' }], answer: 'a', explain: '让 AI 扮演谁，是角色。', knowledgePoints: ['g3-kp-prompt-parts'] },
    { id: 'r32-2', prompt: '同一个提示词问了两次，两次回答不一样，正常吗？', options: [{ id: 'a', label: '正常，生成式 AI 每次重新生成', icon: '🔄' }, { id: 'b', label: '不正常，一定坏了', icon: '💥' }], answer: 'a', explain: '生成式 AI 每次回答可能不同。', knowledgePoints: ['g3-kp-different-output'] },
  ],
  'g3-l3': [
    { id: 'r33-1', prompt: 'AI 讲的故事太难懂，下次提示词加什么？', options: [{ id: 'a', label: '用三年级能懂的话', icon: '🗣️' }, { id: 'b', label: '快一点', icon: '⏩' }], answer: 'a', explain: '针对不满意的地方加要求。', knowledgePoints: ['g3-kp-add-requirements', 'g3-kp-iterate'] },
    { id: 'r33-2', prompt: '提示词里可以写自己的照片链接吗？', options: [{ id: 'a', label: '不可以，照片是个人信息', icon: '🔒' }, { id: 'b', label: '可以', icon: '📷' }], answer: 'a', explain: '提示词里不写个人信息。', knowledgePoints: ['g3-kp-prompt-safety'] },
  ],
  'g3-l4': [
    { id: 'r34-1', prompt: '哪个是用 AI 学语文的好方法？', options: [{ id: 'a', label: '请它找出我作文里的错别字', icon: '🔍' }, { id: 'b', label: '请它替我写读后感', icon: '📋' }], answer: 'a', explain: '内容自己写，AI 帮忙检查。', knowledgePoints: ['g3-kp-ai-hint', 'g3-kp-own-writing'] },
    { id: 'r34-2', prompt: 'AI 说"守株待兔"是夸人很有耐心。查字典后发现不对，该信谁？', options: [{ id: 'a', label: '字典', icon: '📕' }, { id: 'b', label: 'AI', icon: '🤖' }], answer: 'a', explain: '"守株待兔"比喻死守经验、不知变通，或心存侥幸想不劳而获。以字典为准。', knowledgePoints: ['g3-kp-check-explain'] },
  ],
  'g3-l5': [
    { id: 'r35-1', prompt: '示例 AI 回答：6 × 9 = 56。对吗？', options: [{ id: 'a', label: '不对，是 54', icon: '❌' }, { id: 'b', label: '对', icon: '✅' }], answer: 'a', explain: '6 × 9 = 54。AI 也会算错。', knowledgePoints: ['g3-kp-ai-math-errors'] },
    { id: 'r35-2', prompt: '做数学题时，什么时候用 AI 核对最好？', options: [{ id: 'a', label: '自己做完以后', icon: '✏️' }, { id: 'b', label: '还没开始想之前', icon: '⏪' }], answer: 'a', explain: '先自己做，再核对。', knowledgePoints: ['g3-kp-try-first'] },
  ],
  'g3-l6': [
    { id: 'r36-1', prompt: '翻译软件把"马马虎虎"翻成了 horse horse tiger tiger，说明什么？', options: [{ id: 'a', label: '字对字翻译可能不合适，要核对', icon: '🔍' }, { id: 'b', label: '翻译得很好', icon: '👍' }], answer: 'a', explain: '"马马虎虎"可以说 so-so。翻译要核对。', knowledgePoints: ['g3-kp-check-translation'] },
    { id: 'r36-2', prompt: '跟着朗读练发音后，怎样知道自己读得准不准？', options: [{ id: 'a', label: '请老师或家长听一听', icon: '👩‍🏫' }, { id: 'b', label: '读得大声就是准的', icon: '📢' }], answer: 'a', explain: '发音要请人确认。', knowledgePoints: ['g3-kp-pronunciation'] },
  ],
  'g3-l7': [
    { id: 'r37-1', prompt: '用"找最大数"的算法看 4、11、7、2，最后记住的是几？', options: [{ id: 'a', label: '11' }, { id: 'b', label: '7' }], answer: 'a', explain: '一个个比下来，最大的是 11。', knowledgePoints: ['g3-kp-find-max'] },
    { id: 'r37-2', prompt: '"按步骤做，谁来做结果都一样"，说的是什么？', options: [{ id: 'a', label: '算法', icon: '🧩' }, { id: 'b', label: '运气', icon: '🍀' }], answer: 'a', explain: '算法是一步步清楚的方法。', knowledgePoints: ['g3-kp-algorithm'] },
  ],
  'g3-l8': [
    { id: 'r38-1', prompt: '"我觉得数学课最有趣"是事实还是观点？', options: [{ id: 'a', label: '观点', icon: '💭' }, { id: 'b', label: '事实', icon: '📏' }], answer: 'a', explain: '这是个人的想法。', knowledgePoints: ['g3-kp-fact-opinion'] },
    { id: 'r38-2', prompt: '示例 AI 回答说"地球上最高的山是泰山"。你该怎么做？', options: [{ id: 'a', label: '查地图册或百科核对', icon: '📚' }, { id: 'b', label: '直接记下来', icon: '📝' }], answer: 'a', explain: '地球上最高的山是珠穆朗玛峰。AI 可能说错，要核对。', knowledgePoints: ['g3-kp-reliable-source', 'g3-kp-hallucination'] },
  ],
  'g3-l9': [
    { id: 'r39-1', prompt: '机器人朝上，执行"右转、前进"后，它往哪个方向走了一格？', options: [{ id: 'a', label: '向右', icon: '➡️' }, { id: 'b', label: '向上', icon: '⬆️' }], answer: 'a', explain: '朝上时右转就朝右，再前进就向右走一格。', knowledgePoints: ['g3-kp-turns'] },
    { id: 'r39-2', prompt: '找出程序里错误的积木并改正，这叫什么？', options: [{ id: 'a', label: '调试', icon: '🔧' }, { id: 'b', label: '删除', icon: '🗑️' }], answer: 'a', explain: '找错、改错、再运行，叫调试。', knowledgePoints: ['g3-kp-debug'] },
  ],
};
