/**
 * 语文、英语单元的小讲解（V2.13，本项目原创，待教师审核）：练题库前先看一页“学习方法”或“重点句型”。
 * - 语文二～六年级：每个单元一页“怎么学”（读书方法、写作方法），二年级注拼音，三年级起不注；不摘录课文。
 * - 英语三～六年级：每个单元一页常用句型（自编的通用表达，不是课本对话原文）和中文意思，朗读英语。
 */
import { zh } from '@/content/zh';
import type { TeachSlide } from './teachTypes';

/** 二年级语文：带拼音 */
const S = (show: string, chars: string, py: string): TeachSlide[] => [{ show, text: zh(chars, py), speak: chars }];
/** 三年级起语文：不注拼音 */
const T = (show: string, text: string): TeachSlide[] => [{ show, text, speak: text }];
/** 英语：显示并朗读英语句子，下面写中文意思 */
const E = (sentences: string, meaning: string): TeachSlide[] => [
  { show: sentences, text: meaning, speak: sentences.replace(/\n/g, ' '), lang: 'en-US' },
];

export const LANG_TEACH: Record<string, TeachSlide[]> = {
  /* ───── 语文 二年级（带拼音） ───── */
  'c2.a1': S('🔍🌿', '读课文时，找一找大自然里有趣的秘密。', 'dú kè wén shí zhǎo yi zhǎo dà zì rán lǐ yǒu qù de mì mì'),
  'c2.a2': S(
    '🧩',
    '认字时，想一想字的偏旁和意思有什么关系。',
    'rèn zì shí xiǎng yi xiǎng zì de piān páng hé yì si yǒu shén me guān xì',
  ),
  'c2.a3': S(
    '🎒',
    '读一读，说说课文里的事你有没有遇到过。',
    'dú yi dú shuō shuo kè wén lǐ de shì nǐ yǒu méi yǒu yù dào guò',
  ),
  'c2.a4': S(
    '🏡',
    '读的时候，想象一下课文写的家乡美景。',
    'dú de shí hou xiǎng xiàng yí xià kè wén xiě de jiā xiāng měi jǐng',
  ),
  'c2.a5': S('💡', '想一想故事里的人是怎样想办法的。', 'xiǎng yi xiǎng gù shi lǐ de rén shì zěn yàng xiǎng bàn fǎ de'),
  'c2.a6': S('⭐', '读完说一说，你想向谁学习，为什么。', 'dú wán shuō yi shuō nǐ xiǎng xiàng shuí xué xí wèi shén me'),
  'c2.a7': S(
    '🌈',
    '一边读一边想象画面，还可以接着往下编。',
    'yì biān dú yì biān xiǎng xiàng huà miàn hái kě yǐ jiē zhe wǎng xià biān',
  ),
  'c2.a8': S('🤝', '读故事，想想怎样和别人好好相处。', 'dú gù shi xiǎng xiang zěn yàng hé bié rén hǎo hǎo xiāng chǔ'),
  'c2.b1': S('🌸', '找出写春天的词语，读出美好的感觉。', 'zhǎo chū xiě chūn tiān de cí yǔ dú chū měi hǎo de gǎn jué'),
  'c2.b2': S('🧹', '读完说一说，劳动让人有什么收获。', 'dú wán shuō yi shuō láo dòng ràng rén yǒu shén me shōu huò'),
  'c2.b3': S('🏮', '识字时把字放进词语里记，记得更牢。', 'shí zì shí bǎ zì fàng jìn cí yǔ lǐ jì jì de gèng láo'),
  'c2.b4': S('🎈', '读出童话里人物说话的语气。', 'dú chū tóng huà lǐ rén wù shuō huà de yǔ qì'),
  'c2.b5': S('🤔', '读故事，想一想它告诉我们什么道理。', 'dú gù shi xiǎng yi xiǎng tā gào su wǒ men shén me dào lǐ'),
  'c2.b6': S(
    '🔭',
    '读一读，把你知道的新知识讲给别人听。',
    'dú yi dú bǎ nǐ zhī dào de xīn zhī shi jiǎng gěi bié rén tīng',
  ),
  'c2.b7': S('🦋', '找一找故事里发生了什么变化。', 'zhǎo yi zhǎo gù shi lǐ fā shēng le shén me biàn huà'),
  'c2.b8': S(
    '🌏',
    '读神话故事，说说古人是怎样想象世界的。',
    'dú shén huà gù shi shuō shuo gǔ rén shì zěn yàng xiǎng xiàng shì jiè de',
  ),

  /* ───── 语文 三年级 ───── */
  'c3.a1': T('🏫', '边读边圈出有新鲜感的词语，体会它们用得好在哪里。'),
  'c3.a2': T('🍂', '读写景的文字时，留意作者写了哪些颜色、声音和气味。'),
  'c3.a3': T('🧚', '读童话时展开想象，试着自己编一个小童话。'),
  'c3.a4': T('🔮', '边读边预测后面会发生什么，再读下去看看猜得对不对。'),
  'c3.a5': T('👀', '观察时调动眼睛、耳朵、鼻子等多种感官，把看到的变化写下来。'),
  'c3.a6': T('🏞️', '找出每段话中心意思的句子，借助关键句理解一段话。'),
  'c3.a7': T('🌱', '读科普文章时，把有趣的新发现用自己的话说出来。'),
  'c3.a8': T('💎', '通过人物的语言和动作，体会人物的好品质。'),
  'c3.b1': T('🐦', '读文章时，想象画面，抓住描写动物的语句体会它们的可爱。'),
  'c3.b2': T('🦊', '读寓言，先弄懂故事，再想想它讲的道理和生活有什么联系。'),
  'c3.b3': T('🏮', '了解传统节日的习俗，可以说说自己家是怎样过节的。'),
  'c3.b4': T('🔍', '仔细观察，把一种事物的样子和变化写清楚。'),
  'c3.b5': T('🚀', '大胆想象，把想象中的事物和经历写得有趣。'),
  'c3.b6': T('🧒', '体会文中表达的感情，说说自己类似的童年经历。'),
  'c3.b7': T('🌌', '读懂文章介绍的奇妙事物，提出自己感兴趣的问题。'),
  'c3.b8': T('📖', '复述故事：按顺序讲清楚起因、经过和结果。'),

  /* ───── 语文 四年级 ───── */
  'c4.a1': T('🌊', '边读边想象画面，体会作者怎样把景物写得生动。'),
  'c4.a2': T('❓', '阅读时积极提问：从内容、写法、启示等不同角度提出问题。'),
  'c4.a3': T('🔬', '学习作者连续细致地观察事物，写观察日记。'),
  'c4.a4': T('🐉', '了解神话的神奇想象，按起因、经过、结果讲清故事。'),
  'c4.a5': T('✍️', '写一件事，把事情的过程写清楚。'),
  'c4.a6': T('🎠', '体会文章中人物的心情变化，写写自己的心情。'),
  'c4.a7': T('🇨🇳', '关注主要人物和事件，学习把握文章的主要内容。'),
  'c4.a8': T('📜', '读历史故事，简要复述，说说从中得到的启示。'),
  'c4.b1': T('🌾', '抓住关键语句，体会文章表达的思想感情。'),
  'c4.b2': T('🛰️', '阅读时提出不懂的问题，并尝试通过查资料解决。'),
  'c4.b3': T('🎐', '读现代诗，找出诗中的形象，体会诗人的情感，有感情地朗读。'),
  'c4.b4': T('🐱', '体会作者是怎样写出动物特点的，表达对动物的喜爱。'),
  'c4.b5': T('🏔️', '按游览的顺序写景物，写清楚看到的景物和感受。'),
  'c4.b6': T('👣', '从人物的言行中体会人物的品质。'),
  'c4.b7': T('🤲', '联系生活实际，说说怎样与人相处、怎样做事。'),
  'c4.b8': T('🏰', '感受童话中人物的真善美，按自己的想法新编故事。'),

  /* ───── 语文 五年级 ───── */
  'c5.a1': T('🌻', '体会作者借助具体事物抒发感情的方法。'),
  'c5.a2': T('⏩', '提高阅读速度：集中注意力，不回读，连词成句地读。'),
  'c5.a3': T('🧞', '了解民间故事的特点，创造性地复述故事。'),
  'c5.a4': T('🏯', '结合查找的资料，体会课文表达的爱国情感。'),
  'c5.a5': T('🔎', '学习说明方法（列数字、作比较、打比方等），介绍一种事物。'),
  'c5.a6': T('👨‍👩‍👧', '通过场景和细节描写，体会父母之爱。'),
  'c5.a7': T('🍁', '初步体会静态描写和动态描写，写出景物的变化。'),
  'c5.a8': T('📚', '根据要求梳理信息，把握内容要点，说说自己的读书体会。'),
  'c5.b1': T('🪁', '体会课文表达的情感，写一写自己的童年趣事。'),
  'c5.b2': T('🐒', '读古典名著选段，借助资料理解，了解人物形象。'),
  'c5.b3': T('🔠', '搜集与汉字有关的资料，了解汉字的演变和趣味。'),
  'c5.b4': T('🎖️', '通过人物的动作、语言、神态描写体会人物的内心。'),
  'c5.b5': T('🧑', '用具体事例写出一个人的特点。'),
  'c5.b6': T('💭', '了解人物的思维过程，加深对课文内容的理解。'),
  'c5.b7': T('🗺️', '体会静态描写和动态描写的表达效果，介绍一个地方。'),
  'c5.b8': T('😄', '感受课文风趣的语言，学习用幽默的方式表达。'),

  /* ───── 语文 六年级 ───── */
  'c6.a1': T('🌄', '阅读时从所读的内容想开去，联系生活展开联想。'),
  'c6.a2': T('🚩', '了解文章是怎样点面结合写场面的。'),
  'c6.a3': T('🎯', '根据不同的阅读目的，选用恰当的阅读方法。'),
  'c6.a4': T('📕', '读小说，关注情节、环境，感受人物形象。'),
  'c6.a5': T('🎯', '写作时围绕中心意思，从不同方面或选取不同事例来写。'),
  'c6.a6': T('🌍', '抓住关键句，把握文章的主要观点。'),
  'c6.a7': T('🎨', '借助语言文字展开想象，体会艺术之美。'),
  'c6.a8': T('🖋️', '借助相关资料，理解文章的主要内容和人物形象。'),
  'c6.b1': T('🎎', '分清内容的主次，体会作者是怎样详写主要部分的。'),
  'c6.b2': T('🌐', '借助作品梗概，了解外国文学名著的主要内容。'),
  'c6.b3': T('💌', '体会文章是怎样表达情感的，选择合适的内容表达真情实感。'),
  'c6.b4': T('🦁', '关注外貌、神态、言行的描写，体会人物的品质。'),
  'c6.b5': T('🧪', '体会文章是怎样用具体事例说明观点的。'),
  'c6.b6': T('🎓', '回顾小学生活，用多种形式记录难忘的经历。'),

  /* ───── 英语 三年级 ───── */
  'e3.a1': E("Hello! I'm Lily.\nGoodbye!", '打招呼和介绍自己：你好！我是莉莉。再见！'),
  'e3.a2': E("What colour is it?\nIt's red.", '问颜色和回答：它是什么颜色？它是红色的。'),
  'e3.a3': E('This is my nose.\nTouch your head.', '介绍身体部位：这是我的鼻子。摸摸你的头。'),
  'e3.a4': E("What's this?\nIt's a panda.", '问东西是什么：这是什么？是一只熊猫。'),
  'e3.a5': E("I'd like some bread.\nHave some juice.", '说想吃什么、请别人吃：我想要些面包。喝点果汁吧。'),
  'e3.a6': E("How old are you?\nI'm nine.\nHappy birthday!", '问年龄和祝生日：你几岁了？我九岁。生日快乐！'),
  'e3.b1': E("Where are you from?\nI'm from China.", '问从哪里来：你来自哪里？我来自中国。'),
  'e3.b2': E("Who's that man?\nHe's my father.", '介绍家人：那个男人是谁？他是我的爸爸。'),
  'e3.b3': E("It's so big!\nIt has a long nose.", '描述动物：它真大！它有长长的鼻子。'),
  'e3.b4': E("Where is my pen?\nIt's in the box.", '问东西在哪里：我的钢笔在哪里？在盒子里。'),
  'e3.b5': E("Do you like pears?\nYes, I do. / No, I don't.", '问喜不喜欢：你喜欢梨吗？喜欢。/ 不喜欢。'),
  'e3.b6': E('How many apples?\nTwelve.', '问数量：有多少个苹果？十二个。'),

  /* ───── 英语 四年级 ───── */
  'e4.a1': E("What's in the classroom?\nOne blackboard, many desks.", '介绍教室：教室里有什么？一块黑板，许多课桌。'),
  'e4.a2': E(
    "What's in your schoolbag?\nA maths book and a pencil box.",
    '介绍书包：你书包里有什么？一本数学书和一个文具盒。',
  ),
  'e4.a3': E("He's tall and strong.\nShe has long hair.", '描述朋友：他又高又壮。她有长头发。'),
  'e4.a4': E("Is she in the study?\nNo, she isn't.", '问人在不在某个房间：她在书房吗？不，她不在。'),
  'e4.a5': E("What would you like for dinner?\nI'd like some fish.", '问想吃什么：你晚餐想吃什么？我想吃鱼。'),
  'e4.a6': E('How many people are there in your family?\nThree.', '问家里几口人：你家有几口人？三口。'),
  'e4.b1': E("Where's the library?\nIt's on the second floor.", '问学校里的地点：图书馆在哪里？在二楼。'),
  'e4.b2': E("What time is it?\nIt's seven o'clock. It's time for breakfast.", '问时间：几点了？七点了，该吃早饭了。'),
  'e4.b3': E("What's the weather like?\nIt's sunny and warm.", '问天气：天气怎么样？晴朗暖和。'),
  'e4.b4': E('Are these carrots?\nYes, they are.', '问复数的东西：这些是胡萝卜吗？是的。'),
  'e4.b5': E("Whose coat is this?\nIt's mine.", '问东西是谁的：这是谁的外套？是我的。'),
  'e4.b6': E("How much is it?\nIt's ten yuan.\nCan I help you?", '购物：多少钱？十元。需要帮忙吗？'),

  /* ───── 英语 五年级 ───── */
  'e5.a1': E("What's he like?\nHe's kind and funny.", '描述人的性格：他是什么样的人？他和蔼又风趣。'),
  'e5.a2': E(
    'What do you have on Mondays?\nI have English and maths.',
    '说课程和每周安排：你周一上什么课？我上英语和数学。',
  ),
  'e5.a3': E("What would you like to eat?\nI'd like a sandwich.", '点餐：你想吃什么？我想要一个三明治。'),
  'e5.a4': E('What can you do?\nI can sing English songs.', '说自己会做什么：你会做什么？我会唱英文歌。'),
  'e5.a5': E('There is a bed in my room.\nThere are two pictures.', '描述房间：我的房间里有一张床，有两幅画。'),
  'e5.a6': E('Is there a river in the park?\nYes, there is.', '描述公园：公园里有河吗？有。'),
  'e5.b1': E('When do you get up?\nI usually get up at 6:30.', '说日常作息：你什么时候起床？我通常六点半起床。'),
  'e5.b2': E(
    'Which season do you like best?\nSummer, because I can swim.',
    '说喜欢的季节和原因：你最喜欢哪个季节？夏天，因为我能游泳。',
  ),
  'e5.b3': E("When is the trip?\nIt's in October.", '说一年中的活动在几月：旅行在什么时候？在十月。'),
  'e5.b4': E("When is your birthday?\nIt's on April 5th.", '用序数词说日期：你的生日是哪天？四月五日。'),
  'e5.b5': E(
    "Whose dog is it?\nIt's Mike's. It's sleeping.",
    '问是谁的、正在做什么：这是谁的狗？是迈克的，它正在睡觉。',
  ),
  'e5.b6': E('Keep quiet, please.\nTalk quietly.', '提出要求和规则：请保持安静。小声说话。'),

  /* ───── 英语 六年级 ───── */
  'e6.a1': E('How can I get to the museum?\nTurn left at the bookstore.', '问路和指路：我怎么去博物馆？在书店左转。'),
  'e6.a2': E('How do you come to school?\nUsually on foot.', '说出行方式：你怎么来学校？通常步行。'),
  'e6.a3': E(
    "What are you going to do tomorrow?\nI'm going to visit my grandparents.",
    '说计划（将来）：你明天打算做什么？我打算去看望祖父母。',
  ),
  'e6.a4': E('What are his hobbies?\nHe likes reading stories.', '介绍笔友的爱好：他有什么爱好？他喜欢读故事。'),
  'e6.a5': E(
    "What does he do?\nHe's a doctor. He works in a hospital.",
    '问职业和工作地点：他是做什么的？他是医生，在医院工作。',
  ),
  'e6.a6': E("How do you feel?\nI'm happy. / I'm a little worried.", '说感受：你感觉怎么样？我很开心。/ 我有点担心。'),
  'e6.b1': E("How tall are you?\nI'm 1.5 metres. I'm taller than you.", '比较身高：你多高？我1.5米，我比你高。'),
  'e6.b2': E(
    'What did you do last weekend?\nI watched TV and read a book.',
    '说过去的事（过去式）：你上周末做了什么？我看了电视、读了书。',
  ),
  'e6.b3': E('Where did you go?\nI went to the beach.', '说去过哪里：你去了哪里？我去了海边。'),
  'e6.b4': E(
    'There was no library before.\nNow there is a big one.',
    '比较过去和现在：以前没有图书馆，现在有一座大的。',
  ),
};
