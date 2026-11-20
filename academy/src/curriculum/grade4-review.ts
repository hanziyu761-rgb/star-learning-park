import type { QuizQuestion } from './types';

// Review-only questions for grade 4.
export const GRADE4_REVIEW: Record<string, QuizQuestion[]> = {
  'g4-l1': [
    { id: 'r41-1', prompt: '"认出照片里是哪种鸟"，更适合哪种办法？', options: [{ id: 'a', label: '机器学习', icon: '🧠' }, { id: 'b', label: '人写一条规则', icon: '📜' }], answer: 'a', explain: '规则太难写，适合从大量例子中学习。', knowledgePoints: ['g4-kp-rules-vs-learning', 'g4-kp-ml'] },
    { id: 'r41-2', prompt: '机器学习学到的规律，主要来自哪里？', options: [{ id: 'a', label: '数据', icon: '📊' }, { id: 'b', label: '运气', icon: '🍀' }], answer: 'a', explain: '规律全靠数据。', knowledgePoints: ['g4-kp-ml-needs-data'] },
  ],
  'g4-l2': [
    { id: 'r42-1', prompt: '老师用上周练过的原题考试，能看出你真的学会了吗？', options: [{ id: 'a', label: '不一定，可能只是记住了', icon: '🙈' }, { id: 'b', label: '一定能', icon: '✅' }], answer: 'a', explain: '用学过的题测试，可能只是背答案。', knowledgePoints: ['g4-kp-memorize', 'g4-kp-test-set'] },
    { id: 'r42-2', prompt: '用来让模型找规律的数据叫什么？', options: [{ id: 'a', label: '训练数据', icon: '📊' }, { id: 'b', label: '测试数据', icon: '📝' }], answer: 'a', explain: '找规律用的是训练数据。', knowledgePoints: ['g4-kp-train-set'] },
  ],
  'g4-l3': [
    { id: 'r43-1', prompt: '模型看到一张新照片，说"这是兔子"，这一步叫什么？', options: [{ id: 'a', label: '预测', icon: '🔮' }, { id: 'b', label: '训练', icon: '📊' }], answer: 'a', explain: '对新数据给出答案，是预测。', knowledgePoints: ['g4-kp-prediction'] },
    { id: 'r43-2', prompt: 'AI 说"有 95% 的把握"，意思是？', options: [{ id: 'a', label: '很有把握，但仍可能错', icon: '🤔' }, { id: 'b', label: '保证正确', icon: '💯' }], answer: 'a', explain: '把握不等于正确。', knowledgePoints: ['g4-kp-confidence', 'g4-kp-model'] },
  ],
  'g4-l4': [
    { id: 'r44-1', prompt: '一个识别人脸的模型，训练照片大多是成年人，它可能对谁表现差？', options: [{ id: 'a', label: '小朋友和老人', icon: '👶' }, { id: 'b', label: '谁都一样好', icon: '✅' }], answer: 'a', explain: '数据偏差会让模型对缺少的人群表现差。', knowledgePoints: ['g4-kp-bias', 'g4-kp-fairness'] },
    { id: 'r44-2', prompt: '模型认不出青苹果，因为训练数据只有红苹果。怎么改进？', options: [{ id: 'a', label: '加入青苹果等不同颜色的苹果', icon: '🍏' }, { id: 'b', label: '再加很多红苹果', icon: '🍎' }], answer: 'a', explain: '要补充缺少的那部分。', knowledgePoints: ['g4-kp-fix-bias'] },
  ],
  'g4-l5': [
    { id: 'r45-1', prompt: '一个模型只学过晴天的路面照片，下雪天它可能会？', options: [{ id: 'a', label: '更容易出错', icon: '❄️' }, { id: 'b', label: '表现更好', icon: '☀️' }], answer: 'a', explain: '没见过的情况更容易出错。', knowledgePoints: ['g4-kp-new-situations', 'g4-kp-error-reasons'] },
    { id: 'r45-2', prompt: 'AI 推荐了一个药，生病的人应该怎么做？', options: [{ id: 'a', label: '听医生的', icon: '👩‍⚕️' }, { id: 'b', label: '直接照 AI 说的吃', icon: '💊' }], answer: 'a', explain: '和健康有关的决定要由专业的人把关。', knowledgePoints: ['g4-kp-human-check'] },
  ],
  'g4-l6': [
    { id: 'r46-1', prompt: '一条消息只有一个陌生账号发过，没有任何可靠报道。你该怎么做？', options: [{ id: 'a', label: '先不信、不转发', icon: '🛑' }, { id: 'b', label: '马上转发给大家', icon: '📤' }], answer: 'a', explain: '找不到可靠来源，就不要相信和转发。', knowledgePoints: ['g4-kp-check-source', 'g4-kp-cross-check'] },
    { id: 'r46-2', prompt: '一张照片里的招牌文字乱七八糟、看不懂，说明什么？', options: [{ id: 'a', label: '可能是电脑生成的，要查来源', icon: '🔍' }, { id: 'b', label: '一定是真照片', icon: '📷' }], answer: 'a', explain: '文字混乱是常见破绽，还要看来源。', knowledgePoints: ['g4-kp-ai-images'] },
  ],
  'g4-l7': [
    { id: 'r47-1', prompt: '"重复 3 次"后面接"向右转"，机器人一共转了多少？', options: [{ id: 'a', label: '向右转 3 次', icon: '↱' }, { id: 'b', label: '向右转 1 次', icon: '↪️' }], answer: 'a', explain: '重复 3 次，就执行 3 次向右转。', knowledgePoints: ['g4-kp-loop'] },
    { id: 'r47-2', prompt: '程序里有 9 块连续的"前进"，怎样改得更短？', options: [{ id: 'a', label: '用 3 次"重复 3 次 前进"', icon: '🔁' }, { id: 'b', label: '没办法改', icon: '🙅' }], answer: 'a', explain: '发现重复，就用循环。', knowledgePoints: ['g4-kp-shorter', 'g4-kp-pattern'] },
  ],
  'g4-l8': [
    { id: 'r48-1', prompt: '要把哺乳动物和鸟分开，哪个问题更好？', options: [{ id: 'a', label: '有羽毛吗？', icon: '🪶' }, { id: 'b', label: '会飞吗？', icon: '🦇' }], answer: 'a', explain: '只有鸟有羽毛；会飞的蝙蝠是哺乳动物。', knowledgePoints: ['g4-kp-separating-question'] },
    { id: 'r48-2', prompt: '两个分类方法，怎样比较哪个更好？', options: [{ id: 'a', label: '用同样的卡片测试，比正确率', icon: '⚖️' }, { id: 'b', label: '看谁先设计好', icon: '⏱️' }], answer: 'a', explain: '用同样的测试数据比较正确率。', knowledgePoints: ['g4-kp-evaluate', 'g4-kp-decision-tree'] },
  ],
};
