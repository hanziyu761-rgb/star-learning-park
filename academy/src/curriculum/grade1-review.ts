import type { QuizQuestion } from './types';

// Review-only questions for grade 1. Different wording and situations from the
// lesson quizzes, so a review checks understanding, not memory of one question.
export const GRADE1_REVIEW: Record<string, QuizQuestion[]> = {
  'g1-l1': [
    { id: 'r1-1', prompt: '小狗和 AI，哪个有生命？', options: [{ id: 'a', label: '小狗', icon: '🐶' }, { id: 'b', label: 'AI', icon: '💻' }], answer: 'a', explain: '小狗是生命，AI 是电脑程序。', knowledgePoints: ['g1-kp-ai-program'] },
    { id: 'r1-2', prompt: 'AI 说"太阳从西边升起"，你应该怎么做？', options: [{ id: 'a', label: '查一查、问一问', icon: '🔍' }, { id: 'b', label: '马上相信', icon: '👍' }], answer: 'a', explain: '太阳从东边升起。AI 也会说错，要检查。', knowledgePoints: ['g1-kp-ai-mistakes'] },
    { id: 'r1-3', prompt: 'AI 要学会认小鸟，需要什么？', options: [{ id: 'a', label: '很多小鸟的图片', icon: '🐦' }, { id: 'b', label: '一张小猫的图片', icon: '🐱' }], answer: 'a', explain: 'AI 从很多例子里找规律。', knowledgePoints: ['g1-kp-ai-patterns'] },
  ],
  'g1-l2': [
    { id: 'r2-1', prompt: '下面哪个有机器人身体？', options: [{ id: 'a', label: '送餐机器人', icon: '🍜' }, { id: 'b', label: '手机里的翻译软件', icon: '📱' }], answer: 'a', explain: '送餐机器人有能动的身体。', knowledgePoints: ['g1-kp-robot-body'] },
    { id: 'r2-2', prompt: '工厂里每天重复同一个动作的机械臂，一定用了 AI 吗？', options: [{ id: 'a', label: '不一定' }, { id: 'b', label: '一定用了' }], answer: 'a', explain: '只按固定步骤做事的机器，可以不用 AI。', knowledgePoints: ['g1-kp-ai-vs-robot'] },
  ],
  'g1-l3': [
    { id: 'r3-1', prompt: '哪件事 AI 能帮上忙？', options: [{ id: 'a', label: '推荐一首儿歌', icon: '🎵' }, { id: 'b', label: '替你向朋友道歉', icon: '🙇' }], answer: 'a', explain: '推荐是 AI 常做的事；道歉要靠自己的心意。', knowledgePoints: ['g1-kp-ai-can', 'g1-kp-ai-cannot'] },
    { id: 'r3-2', prompt: 'AI 推荐了一部动画片，看不看由谁决定？', options: [{ id: 'a', label: '我和家长', icon: '👨‍👩‍👧' }, { id: 'b', label: 'AI', icon: '💻' }], answer: 'a', explain: 'AI 给建议，人来做决定。', knowledgePoints: ['g1-kp-ai-cannot'] },
  ],
  'g1-l4': [
    { id: 'r4-1', prompt: '"说话打字"用到了什么本领？', options: [{ id: 'a', label: '语音识别', icon: '🎙️' }, { id: 'b', label: '图像识别', icon: '🖼️' }], answer: 'a', explain: '把说的话变成文字，叫语音识别。', knowledgePoints: ['g1-kp-asr'] },
    { id: 'r4-2', prompt: '一个软件想用你的麦克风，你先要做什么？', options: [{ id: 'a', label: '问爸爸妈妈' }, { id: 'b', label: '马上点"允许"' }], answer: 'a', explain: '声音是个人信息，由家长决定能不能用。', knowledgePoints: ['g1-kp-voice-privacy'] },
    { id: 'r4-3', prompt: '在热闹的商场里小声说话，语音识别可能会怎样？', options: [{ id: 'a', label: '可能听错' }, { id: 'b', label: '一定听对' }], answer: 'a', explain: '太吵、声音太小，都可能听错。', knowledgePoints: ['g1-kp-asr-conditions'] },
  ],
  'g1-l5': [
    { id: 'r5-1', prompt: '停车场的摄像头认出车牌号，用到了什么？', options: [{ id: 'a', label: '图像识别', icon: '📷' }, { id: 'b', label: '语音识别', icon: '🎙️' }], answer: 'a', explain: '认出图片里的内容，是图像识别。', knowledgePoints: ['g1-kp-vision'] },
    { id: 'r5-2', prompt: '在图片上写"苹果"这两个字，是在做什么？', options: [{ id: 'a', label: '贴标签', icon: '🏷️' }, { id: 'b', label: '画画', icon: '🎨' }], answer: 'a', explain: '给图片写上名字，就是贴标签。', knowledgePoints: ['g1-kp-labels'] },
    { id: 'r5-3', prompt: '晚上关灯后拍的照片，AI 容易认对吗？', options: [{ id: 'a', label: '可能认错' }, { id: 'b', label: '一定认对' }], answer: 'a', explain: '太暗的图片，AI 可能认错。', knowledgePoints: ['g1-kp-vision-errors'] },
  ],
  'g1-l6': [
    { id: 'r6-1', prompt: '下面哪个是个人信息，不能告诉 AI？', options: [{ id: 'a', label: '我家的电话号码', icon: '☎️' }, { id: 'b', label: '我喜欢蓝色', icon: '💙' }], answer: 'a', explain: '电话号码是个人信息。', knowledgePoints: ['g1-kp-ai-safety'] },
    { id: 'r6-2', prompt: '城市里用 AI 调整红绿灯，是为了什么？', options: [{ id: 'a', label: '让车走得更顺', icon: '🚦' }, { id: 'b', label: '让灯更漂亮', icon: '✨' }], answer: 'a', explain: 'AI 帮忙安排红绿灯，让交通更顺畅。', knowledgePoints: ['g1-kp-ai-life'] },
  ],
  'g1-l7': [
    { id: 'r7-1', prompt: '洗手的顺序，哪个对？', options: [{ id: 'a', label: '打湿 → 抹肥皂 → 搓手 → 冲干净' }, { id: 'b', label: '冲干净 → 搓手 → 打湿 → 抹肥皂' }], answer: 'a', explain: '顺序很重要，按步骤才能洗干净。', knowledgePoints: ['g1-kp-sequence'] },
    { id: 'r7-2', prompt: '"如果天冷了，就……"后面接哪个？', options: [{ id: 'a', label: '多穿一件衣服', icon: '🧥' }, { id: 'b', label: '去游泳', icon: '🏊' }], answer: 'a', explain: '如果天冷了，就多穿衣服。', knowledgePoints: ['g1-kp-if-then'] },
    { id: 'r7-3', prompt: '给机器人指令时，少说了一步会怎样？', options: [{ id: 'a', label: '它可能做错' }, { id: 'b', label: '它会自己猜对' }], answer: 'a', explain: '机器只会照着指令做。', knowledgePoints: ['g1-kp-instructions'] },
  ],
};
