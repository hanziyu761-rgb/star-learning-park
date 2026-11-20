import type { QuizQuestion } from './types';

// Review-only questions for grade 2 (new situations, same knowledge points).
export const GRADE2_REVIEW: Record<string, QuizQuestion[]> = {
  'g2-l1': [
    { id: 'r21-1', prompt: '体检表上写着"体重 25 千克"，这是什么？', options: [{ id: 'a', label: '数据', icon: '📋' }, { id: 'b', label: '一首歌', icon: '🎵' }], answer: 'a', explain: '记录下来的体重是数据。', knowledgePoints: ['g2-kp-data'] },
    { id: 'r21-2', prompt: '一个陌生网站让你上传自己的照片，你该怎么做？', options: [{ id: 'a', label: '先问家长', icon: '👨‍👩‍👧' }, { id: 'b', label: '马上上传', icon: '📤' }], answer: 'a', explain: '照片是个人数据，要保护。', knowledgePoints: ['g2-kp-personal-data'] },
    { id: 'r21-3', prompt: '想知道班上同学最喜欢什么水果，最好怎么做？', options: [{ id: 'a', label: '问很多同学并记下来', icon: '📝' }, { id: 'b', label: '只问一个同学', icon: '1️⃣' }], answer: 'a', explain: '数据多了，才能看出大家的喜好。', knowledgePoints: ['g2-kp-data-patterns'] },
  ],
  'g2-l2': [
    { id: 'r22-1', prompt: '按"会不会飞"分，小鸟和小狗在同一组吗？', options: [{ id: 'a', label: '不在', icon: '🙅' }, { id: 'b', label: '在', icon: '👌' }], answer: 'a', explain: '小鸟会飞，小狗不会飞。', knowledgePoints: ['g2-kp-classify'] },
    { id: 'r22-2', prompt: '按颜色分时，红积木和红苹果在一组；按"能不能吃"分时呢？', options: [{ id: 'a', label: '不在一组了', icon: '🔀' }, { id: 'b', label: '还在一组', icon: '🔗' }], answer: 'a', explain: '换了规则，分组就变了。', knowledgePoints: ['g2-kp-rule-changes'] },
  ],
  'g2-l3': [
    { id: 'r23-1', prompt: '给一张熊猫照片贴标签，写哪个最合适？', options: [{ id: 'a', label: '熊猫', icon: '🐼' }, { id: 'b', label: '黑白的东西', icon: '⬛' }], answer: 'a', explain: '标签要准确地说出这是什么。', knowledgePoints: ['g2-kp-label', 'g2-kp-label-quality'] },
    { id: 'r23-2', prompt: '标签员把几张兔子照片贴成了"猫"，AI 学完可能会怎样？', options: [{ id: 'a', label: '把兔子认成猫', icon: '❌' }, { id: 'b', label: '还是能认对兔子', icon: '✅' }], answer: 'a', explain: '标签错了，AI 就学错了。', knowledgePoints: ['g2-kp-wrong-label'] },
  ],
  'g2-l4': [
    { id: 'r24-1', prompt: '"大象有长长的鼻子"，长鼻子是大象的什么？', options: [{ id: 'a', label: '特征', icon: '🐘' }, { id: 'b', label: '标签', icon: '🏷️' }], answer: 'a', explain: '能帮助认出大象的特点叫特征。', knowledgePoints: ['g2-kp-feature'] },
    { id: 'r24-2', prompt: '想让 AI 认出各种各样的狗，给它看什么样的图片更好？', options: [{ id: 'a', label: '各种颜色、大小、姿势的狗', icon: '🐕' }, { id: 'b', label: '同一只狗的同一张照片', icon: '📷' }], answer: 'a', explain: '例子多种多样，AI 才不容易认错。', knowledgePoints: ['g2-kp-diverse-examples', 'g2-kp-learn-features'] },
  ],
  'g2-l5': [
    { id: 'r25-1', prompt: '"天上有一只 niǎo"，语音识别该选哪个字？', options: [{ id: 'a', label: '鸟', icon: '🐦' }, { id: 'b', label: '袅', icon: '🌫️' }], answer: 'a', explain: '"天上有一只"后面，最可能是"鸟"。', knowledgePoints: ['g2-kp-context'] },
    { id: 'r25-2', prompt: '语音输入把"我爱吃苹果"打成了"我爱吃平果"，这说明什么？', options: [{ id: 'a', label: '要检查语音转出的文字', icon: '🔍' }, { id: 'b', label: '"平果"才是对的', icon: '✅' }], answer: 'a', explain: '语音识别也会选错字，要检查。', knowledgePoints: ['g2-kp-check-asr', 'g2-kp-homophone'] },
  ],
  'g2-l6': [
    { id: 'r26-1', prompt: '"如果作业写完了，就去玩；否则，……"后面接哪个？', options: [{ id: 'a', label: '就继续写作业', icon: '✏️' }, { id: 'b', label: '就去睡觉', icon: '😴' }], answer: 'a', explain: '没写完，就继续写。', knowledgePoints: ['g2-kp-if-else'] },
    { id: 'r26-2', prompt: '规则："如果是红色的，就放进水果篮。"机器把红色的玩具车也放进了水果篮。它做错了吗？', options: [{ id: 'a', label: '没做错，规则只看颜色', icon: '📜' }, { id: 'b', label: '做错了，它应该知道玩具车不是水果', icon: '🤔' }], answer: 'a', explain: '机器严格照规则做。想只放水果，就要把规则写清楚。', knowledgePoints: ['g2-kp-strict-rules'] },
  ],
  'g2-l7': [
    { id: 'r27-1', prompt: '哪句指令更具体？', options: [{ id: 'a', label: '把三本书放到书架第二层', icon: '📚' }, { id: 'b', label: '收拾一下', icon: '🤷' }], answer: 'a', explain: '说清楚做什么、在哪里、做多少。', knowledgePoints: ['g2-kp-clear-instruction'] },
    { id: 'r27-2', prompt: '测试 AI 时，用它训练时见过的图片，能说明它学会了吗？', options: [{ id: 'a', label: '不能，要用没见过的', icon: '🆕' }, { id: 'b', label: '能', icon: '✅' }], answer: 'a', explain: '用没见过的例子测试，才知道它是不是真的学会了。', knowledgePoints: ['g2-kp-train-test'] },
  ],
};
