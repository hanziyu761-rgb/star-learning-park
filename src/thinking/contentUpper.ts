/**
 * 三～六年级思维题的数据（V2.7，本项目编写；成语、民间字谜为汉语中公有的传统说法）。
 * 句子、短文、故事均为原创；三年级起不注拼音。待教师审核。
 */

/* ───────── 语文 ───────── */

/** 成语填空：前 10 个用于三、四年级，全部用于五、六年级 */
export const IDIOMS: { blank: string; ans: string; others: string[]; meaning: string }[] = [
  { blank: '画蛇添（ ）', ans: '足', others: ['手', '尾', '脚'], meaning: '比喻做了多余的事，反而不好。' },
  { blank: '守株待（ ）', ans: '兔', others: ['鸟', '鹿', '人'], meaning: '比喻不努力，只想碰运气得到好处。' },
  { blank: '亡羊补（ ）', ans: '牢', others: ['圈', '门', '墙'], meaning: '比喻出了问题以后赶紧想办法补救。' },
  { blank: '井底之（ ）', ans: '蛙', others: ['鱼', '龟', '蛇'], meaning: '比喻见识很少的人。' },
  { blank: '狐假虎（ ）', ans: '威', others: ['皮', '声', '力'], meaning: '比喻依仗别人的势力欺负人。' },
  { blank: '对牛弹（ ）', ans: '琴', others: ['曲', '歌', '笛'], meaning: '比喻说话、做事不看对象。' },
  { blank: '掩耳盗（ ）', ans: '铃', others: ['钟', '门', '宝'], meaning: '比喻自己骗自己。' },
  { blank: '自相矛（ ）', ans: '盾', others: ['枪', '剑', '刀'], meaning: '比喻自己说话做事前后抵触。' },
  { blank: '一石二（ ）', ans: '鸟', others: ['虎', '人', '兔'], meaning: '比喻做一件事得到两种好处。' },
  { blank: '拔苗助（ ）', ans: '长', others: ['高', '力', '大'], meaning: '比喻违反事物的规律，急于求成，反而坏事。' },
  { blank: '胸有成（ ）', ans: '竹', others: ['树', '画', '林'], meaning: '比喻做事之前已经有了完整的计划。' },
  { blank: '刻舟求（ ）', ans: '剑', others: ['船', '宝', '物'], meaning: '比喻不懂得事物已经变化，还用老办法。' },
  { blank: '半途而（ ）', ans: '废', others: ['回', '停', '止'], meaning: '做事没有完成就停下来，不能坚持到底。' },
  { blank: '杯弓蛇（ ）', ans: '影', others: ['形', '声', '身'], meaning: '比喻疑神疑鬼，自己吓自己。' },
  { blank: '叶公好（ ）', ans: '龙', others: ['虎', '鸟', '画'], meaning: '比喻表面上爱好某事物，实际上并不真爱好。' },
  { blank: '三心二（ ）', ans: '意', others: ['思', '想', '志'], meaning: '形容犹豫不决，或者不专心。' },
];

/** 关联词：干扰项都是放进去不通顺的 */
export const CONNECT_ITEMS: { sentence: string; ans: string; others: string[] }[] = [
  { sentence: '（ ）天下雨了，我们（ ）没去公园。', ans: '因为…所以', others: ['虽然…但是', '一边…一边', '不但…而且'] },
  { sentence: '（ ）明天下雨，运动会（ ）推迟。', ans: '如果…就', others: ['虽然…但是', '一边…一边', '不但…而且'] },
  {
    sentence: '（ ）他很累，（ ）还是坚持跑完了全程。',
    ans: '虽然…但是',
    others: ['因为…所以', '如果…就', '一边…一边'],
  },
  { sentence: '小红（ ）会唱歌，（ ）会跳舞。', ans: '不但…而且', others: ['因为…所以', '如果…就', '虽然…但是'] },
  { sentence: '（ ）认真听讲，（ ）能真正学好知识。', ans: '只有…才', others: ['虽然…但是', '一边…一边', '无论…都'] },
  {
    sentence: '我们（ ）走（ ）说，一会儿就到了学校。',
    ans: '一边…一边',
    others: ['虽然…但是', '因为…所以', '只有…才'],
  },
  { sentence: '（ ）遇到多大的困难，他（ ）不放弃。', ans: '无论…都', others: ['因为…所以', '只有…才', '一边…一边'] },
  {
    sentence: '（ ）天气很冷，同学们（ ）准时来到了操场。',
    ans: '虽然…但是',
    others: ['因为…所以', '如果…就', '一边…一边'],
  },
  { sentence: '（ ）你肯努力，（ ）一定会进步。', ans: '只要…就', others: ['因为…所以', '虽然…但是', '一边…一边'] },
  { sentence: '这个苹果（ ）大（ ）红。', ans: '又…又', others: ['因为…所以', '只有…才', '虽然…但是'] },
];

export const SENTENCE_CORRECT = [
  '我们要养成爱护公物的好习惯。',
  '春天来了，公园里的花都开了。',
  '同学们认真地听老师讲故事。',
  '秋天到了，树叶一片一片地落下来。',
  '老师耐心地给我们讲解难题。',
  '小明一边写作业，一边哼着歌。',
  '通过这次活动，我懂得了团结的重要。',
  '我国是世界上人口最多的国家之一。',
];

/** 有毛病的句子；hard = 只给五、六年级 */
export const SENTENCE_WRONG: { text: string; why: string; hard?: boolean }[] = [
  { text: '通过这次活动，使我懂得了团结的重要。', why: '缺少“谁懂得了”（主语）' },
  { text: '他穿着一件红上衣和一顶蓝帽子。', why: '“穿”和“帽子”不能搭配，应该是“戴”' },
  { text: '我大约估计有一百人左右。', why: '“大约”“估计”“左右”意思重复' },
  { text: '听了老师的话，使我很受感动。', why: '缺少“谁很受感动”（主语）' },
  { text: '他的作文写得非常十分好。', why: '“非常”和“十分”意思重复' },
  { text: '今天天空格外晴朗，万里无云，阴沉沉的。', why: '“晴朗”和“阴沉沉”前后矛盾' },
  { text: '妈妈买了苹果、香蕉、水果和葡萄。', why: '“水果”包括苹果、香蕉，不能并列' },
  { text: '我看见了一阵美妙的歌声。', why: '“看见”和“歌声”不能搭配' },
  { text: '我们班大约有四十名左右同学。', why: '“大约”和“左右”意思重复' },
  { text: '我国的人口是世界上最多的国家。', why: '“人口”不是“国家”，前后不搭配', hard: true },
  { text: '能否保护好环境，是我们每个人的责任。', why: '“能否”包含两方面，后面只说了一方面', hard: true },
  { text: '我们要发扬勤俭节约的好习惯。', why: '“发扬”和“习惯”不能搭配，应该是“养成”', hard: true },
];

/** 民间字谜（三～六年级） */
export const RIDDLES_HIGH: { riddle: string; ans: string; others: string[]; why: string }[] = [
  { riddle: '一口咬掉牛尾巴', ans: '告', others: ['吉', '舌', '牢'], why: '“牛”去掉尾巴，下面加“口”' },
  { riddle: '一人一张口，口下长只手', ans: '拿', others: ['合', '拾', '哈'], why: '“人”“一”“口”组成“合”，下面加“手”' },
  { riddle: '二人土上坐', ans: '坐', others: ['座', '佳', '圭'], why: '两个“人”坐在“土”上' },
  { riddle: '一加一不是二', ans: '王', others: ['三', '土', '主'], why: '“一”加“十”再加“一”' },
  { riddle: '半个月亮', ans: '胖', others: ['朋', '伴', '胜'], why: '“半”和“月”合起来' },
  { riddle: '千里相逢', ans: '重', others: ['千', '里', '量'], why: '“千”和“里”上下相连' },
  { riddle: '森林里起了火', ans: '焚', others: ['林', '烧', '炎'], why: '“林”下面加“火”' },
  { riddle: '上下一起', ans: '卡', others: ['下', '止', '步'], why: '“上”和“下”合在一起' },
  { riddle: '十张口，一颗心', ans: '思', others: ['田', '古', '恩'], why: '“十”和“口”组成“田”，下面加“心”' },
];

/** 排成小故事：三、四年级 4 句，五、六年级 5 句 */
export const STORIES_MID: string[][] = [
  [
    '早上，小明发现窗外下起了大雨。',
    '他赶紧拿上雨伞，出门上学。',
    '走到半路，他看见一个小妹妹没有带伞。',
    '小明把伞撑在小妹妹头上，两人一起走进了学校。',
  ],
  [
    '春天，农民伯伯把种子撒进田里。',
    '夏天，田里的禾苗长得又高又壮。',
    '秋天，稻子熟了，田野一片金黄。',
    '农民伯伯开着收割机，收获了满仓的粮食。',
  ],
  [
    '小蚂蚁在路上发现了一块大饼干。',
    '它试着搬了搬，饼干一动也不动。',
    '小蚂蚁跑回洞里，叫来了许多伙伴。',
    '大家一起用力，终于把饼干搬回了家。',
  ],
  [
    '放学了，同学们排好队走出教室。',
    '小华发现自己的铅笔盒忘在了座位上。',
    '他赶紧跑回教室，拿起铅笔盒。',
    '小华追上队伍，和同学们一起走出了校门。',
  ],
  [
    '天气越来越冷了。',
    '大雁们聚在一起，排成整齐的队伍。',
    '它们一边飞一边叫，向南方飞去。',
    '到了温暖的南方，大雁终于可以休息了。',
  ],
];
export const STORIES_HIGH: string[][] = [
  [
    '学校要举办科技节，老师请每个同学做一件小作品。',
    '小林决定做一个会转的小风车。',
    '第一次做好后，风车怎么吹都不转。',
    '他仔细检查，发现是叶片的方向装反了。',
    '改好以后，风车在风中呼呼地转了起来。',
  ],
  [
    '周末，我们一家去山里露营。',
    '到了营地，爸爸和我一起搭好了帐篷。',
    '晚上，我们围坐在火堆旁讲故事。',
    '夜深了，满天的星星一闪一闪的。',
    '第二天清晨，我们在鸟叫声中醒来。',
  ],
  [
    '小红想养一盆花。',
    '她去花店买回了一包种子。',
    '她每天给种子浇水，把花盆放在阳光下。',
    '过了几天，花盆里冒出了嫩绿的小芽。',
    '一个月后，小芽长成了一株开满花的植物。',
  ],
  [
    '运动会上，接力赛开始了。',
    '第一棒的同学飞快地冲了出去。',
    '交接棒时，我们班的同学不小心把棒掉在了地上。',
    '他迅速捡起接力棒，奋力追赶。',
    '最后，我们班虽然得了第二名，但大家都很开心。',
  ],
];

/** 读一读，想一想 */
export type Infer = { text: string; q: string; ans: string; others: string[] };
export const INFERS_MID: Infer[] = [
  {
    text: '妈妈下班回家，看见饭菜已经摆在桌上，碗筷也放整齐了，小明正坐在桌边等她。',
    q: '这说明了什么？',
    ans: '小明帮妈妈准备好了晚饭',
    others: ['小明一直在看电视', '妈妈忘了做饭'],
  },
  {
    text: '小华的手套湿了，脸冻得红红的，鞋底还沾着雪。',
    q: '小华刚才可能在做什么？',
    ans: '在外面玩雪',
    others: ['在家里看书', '在游泳池游泳'],
  },
  {
    text: '图书馆里，大家都在安静地看书。小刚走进来，悄悄地找了个座位坐下。',
    q: '小刚为什么“悄悄地”坐下？',
    ans: '不想打扰别人看书',
    others: ['他生病了', '他在玩捉迷藏'],
  },
  {
    text: '比赛结束了，小丽低着头，眼里含着泪水，一句话也不说。',
    q: '比赛的结果最可能是什么？',
    ans: '小丽没有取得好成绩',
    others: ['小丽得了第一名', '比赛还没开始'],
  },
  {
    text: '地上的蚂蚁排着长队搬家，天边的乌云越来越黑。',
    q: '接下来可能会怎样？',
    ans: '要下雨了',
    others: ['要出太阳了', '天快亮了'],
  },
  {
    text: '爷爷戴上老花镜，把报纸拿得远远的，才看清上面的字。',
    q: '爷爷为什么要戴老花镜？',
    ans: '看不清近处的字',
    others: ['报纸放得太远', '他想看电视'],
  },
];
export const INFERS_HIGH: Infer[] = [
  {
    text: '王老师走进教室，发现黑板已经擦干净了，讲台上放着一杯热水，杯子下压着一张写着“老师辛苦了”的纸条。',
    q: '这件事最可能发生在哪一天？',
    ans: '教师节',
    others: ['儿童节', '春节'],
  },
  {
    text: '小明拿着试卷回家，在门口站了很久，才轻轻地推开门。',
    q: '小明这时的心情最可能是怎样的？',
    ans: '担心考得不好',
    others: ['非常兴奋', '很困想睡觉'],
  },
  {
    text: '这棵大树朝南的一边枝叶茂盛，朝北的一边却很稀疏。',
    q: '为什么会这样？',
    ans: '朝南的一边阳光更充足',
    others: ['朝北的一边风更小', '朝南的一边离地更近'],
  },
  {
    text: '小林在作文里写道：“我的心像揣了只小兔子，怦怦直跳。”',
    q: '这句话表达了什么心情？',
    ans: '紧张',
    others: ['难过', '生气'],
  },
  {
    text: '妈妈打开冰箱，发现昨天买的蛋糕少了一大块，而小弟弟嘴角还沾着奶油。',
    q: '蛋糕最可能是谁吃的？',
    ans: '小弟弟',
    others: ['妈妈', '邻居'],
  },
  {
    text: '这家小店门口排起了长队，有人说：“我已经连着来三天了，还是这个味道。”',
    q: '从这句话可以推断出什么？',
    ans: '这家店的东西很受欢迎',
    others: ['这家店刚刚开业', '这家店的东西很便宜'],
  },
];

/* ───────── 英语 ───────── */

export type W = { w: string; e?: string };
export const GUESS_MID: { clue: string; zh: string; ans: W; others: W[] }[] = [
  {
    clue: 'It is an animal. It has a long neck. It eats leaves from tall trees.',
    zh: '它是动物，脖子很长，吃高高的树上的叶子。',
    ans: { w: 'giraffe', e: '🦒' },
    others: [
      { w: 'elephant', e: '🐘' },
      { w: 'panda', e: '🐼' },
    ],
  },
  {
    clue: 'It is black and white. It likes eating bamboo.',
    zh: '它是黑白相间的，喜欢吃竹子。',
    ans: { w: 'panda', e: '🐼' },
    others: [
      { w: 'zebra', e: '🦓' },
      { w: 'tiger', e: '🐯' },
    ],
  },
  {
    clue: 'This person works in a hospital and helps sick people.',
    zh: '这个人在医院工作，帮助生病的人。',
    ans: { w: 'doctor', e: '🧑‍⚕️' },
    others: [
      { w: 'teacher', e: '🧑‍🏫' },
      { w: 'farmer', e: '🧑‍🌾' },
    ],
  },
  {
    clue: 'This person works in a school and teaches students.',
    zh: '这个人在学校工作，教学生。',
    ans: { w: 'teacher', e: '🧑‍🏫' },
    others: [
      { w: 'doctor', e: '🧑‍⚕️' },
      { w: 'cook', e: '🧑‍🍳' },
    ],
  },
  {
    clue: 'You can borrow books here. You should be quiet here.',
    zh: '你可以在这里借书，在这里要保持安静。',
    ans: { w: 'library', e: '📚' },
    others: [
      { w: 'zoo', e: '🦁' },
      { w: 'park', e: '🌳' },
    ],
  },
  {
    clue: "It's hot. You can swim in the sea.",
    zh: '天气很热，可以在海里游泳。',
    ans: { w: 'summer', e: '☀️' },
    others: [
      { w: 'winter', e: '❄️' },
      { w: 'autumn', e: '🍂' },
    ],
  },
  {
    clue: 'It is cold. It snows. People make snowmen.',
    zh: '天气冷，下雪，人们堆雪人。',
    ans: { w: 'winter', e: '❄️' },
    others: [
      { w: 'summer', e: '☀️' },
      { w: 'spring', e: '🌸' },
    ],
  },
  {
    clue: 'It is rainy. You need it to stay dry.',
    zh: '下雨了，你需要它才不会被淋湿。',
    ans: { w: 'umbrella', e: '☂️' },
    others: [
      { w: 'kite', e: '🪁' },
      { w: 'cap', e: '🧢' },
    ],
  },
];
export const GUESS_HIGH: { clue: string; zh: string; ans: W; others: W[] }[] = [
  {
    clue: 'It is the day after Friday.',
    zh: '它是星期五的后一天。',
    ans: { w: 'Saturday' },
    others: [{ w: 'Sunday' }, { w: 'Thursday' }],
  },
  {
    clue: 'It is the month after March.',
    zh: '它是三月的后一个月。',
    ans: { w: 'April' },
    others: [{ w: 'May' }, { w: 'February' }],
  },
  {
    clue: 'It comes after summer. Leaves turn yellow and fall.',
    zh: '它在夏天之后，树叶变黄落下。',
    ans: { w: 'autumn' },
    others: [{ w: 'spring' }, { w: 'winter' }],
  },
  {
    clue: 'You go here when you are ill.',
    zh: '你生病的时候去这里。',
    ans: { w: 'hospital' },
    others: [{ w: 'cinema' }, { w: 'library' }],
  },
  {
    clue: 'You go here to buy food and drinks.',
    zh: '你去这里买吃的和喝的。',
    ans: { w: 'supermarket' },
    others: [{ w: 'hospital' }, { w: 'school' }],
  },
  {
    clue: 'It is the first meal of the day.',
    zh: '它是一天中的第一顿饭。',
    ans: { w: 'breakfast' },
    others: [{ w: 'lunch' }, { w: 'dinner' }],
  },
  {
    clue: 'There are seven of them in a week.',
    zh: '一个星期里有七个它。',
    ans: { w: 'days' },
    others: [{ w: 'months' }, { w: 'years' }],
  },
  {
    clue: 'It has twelve months. It begins in January.',
    zh: '它有十二个月，从一月开始。',
    ans: { w: 'a year' },
    others: [{ w: 'a week' }, { w: 'a day' }],
  },
];

/** 找不同类（文字，三～六年级）；days、months 只给五、六年级 */
export const EN_CATS_UPPER: { zh: string; items: string[]; high?: boolean }[] = [
  { zh: '天气', items: ['sunny', 'rainy', 'windy', 'snowy', 'cloudy'] },
  { zh: '职业', items: ['doctor', 'teacher', 'farmer', 'nurse', 'driver'] },
  { zh: '家人', items: ['father', 'mother', 'sister', 'brother', 'grandma'] },
  { zh: '食物', items: ['rice', 'bread', 'noodles', 'soup', 'cake'] },
  { zh: '身体部位', items: ['head', 'hand', 'foot', 'nose', 'ear'] },
  { zh: '星期', items: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Sunday'], high: true },
  { zh: '月份', items: ['January', 'March', 'June', 'August', 'October'], high: true },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
export const TENS = ['ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 连词成句：三、四年级 / 五、六年级 */
export const SENTENCES_MID: { words: string[]; zh: string }[] = [
  { words: ["What's", 'your', 'favourite', 'food?'], zh: '你最喜欢的食物是什么？' },
  { words: ['I', 'go to school', 'by bike.'], zh: '我骑自行车上学。' },
  { words: ['There is', 'a big tree', 'in the park.'], zh: '公园里有一棵大树。' },
  { words: ['Can you', 'help me,', 'please?'], zh: '请你帮帮我好吗？' },
  { words: ['My father', 'is', 'a doctor.'], zh: '我爸爸是医生。' },
  { words: ['I like', 'reading books', 'on Sunday.'], zh: '我喜欢在星期天看书。' },
  { words: ["It's", 'warm and sunny', 'today.'], zh: '今天天气温暖晴朗。' },
  { words: ['Where', 'is', 'the library?'], zh: '图书馆在哪里？' },
];
export const SENTENCES_HIGH: { words: string[]; zh: string }[] = [
  { words: ['I', 'often', 'play football', 'after school.'], zh: '我经常在放学后踢足球。' },
  { words: ['What did you', 'do', 'last weekend?'], zh: '你上周末做了什么？' },
  { words: ['She', 'is going to', 'visit her grandma', 'tomorrow.'], zh: '她明天要去看望奶奶。' },
  { words: ['The library', 'is', 'next to', 'the hospital.'], zh: '图书馆在医院旁边。' },
  { words: ['We should', 'turn off', 'the lights.'], zh: '我们应该把灯关掉。' },
  { words: ['How do you', 'go to school', 'every day?'], zh: '你每天怎么去上学？' },
  { words: ['He was', 'very tired', 'yesterday.'], zh: '他昨天很累。' },
  { words: ['Turn left', 'at', 'the cinema.'], zh: '在电影院左转。' },
];

/** 短文阅读 */
export type EnRead = { text: string; q: string; zh: string; ans: string; others: string[]; why: string };
export const EN_READ: { mid: EnRead[]; high: EnRead[] } = {
  mid: [
    {
      text: 'Amy gets up at 6:30. She has breakfast at 7:00. Then she goes to school.',
      q: 'What does Amy do at 7:00?',
      zh: '艾米七点做什么？',
      ans: 'She has breakfast.',
      others: ['She gets up.', 'She goes to school.'],
      why: '短文说她 7:00 吃早饭',
    },
    {
      text: 'Tom has a cat and a dog. The cat is white. The dog is black.',
      q: 'What colour is the dog?',
      zh: '狗是什么颜色的？',
      ans: "It's black.",
      others: ["It's white.", "It's brown."],
      why: '短文说狗是黑色的',
    },
    {
      text: 'It is cold and windy today. Mike puts on his coat and hat.',
      q: "What's the weather like today?",
      zh: '今天天气怎么样？',
      ans: 'Cold and windy.',
      others: ['Hot and sunny.', 'Warm and rainy.'],
      why: '短文第一句说了天气',
    },
    {
      text: "Lily's birthday is in the month after April.",
      q: "When is Lily's birthday?",
      zh: '莉莉的生日在几月？',
      ans: 'In May.',
      others: ['In April.', 'In March.'],
      why: '四月的后一个月是五月',
    },
    {
      text: 'Ben likes sports. He plays basketball on Monday and swims on Saturday.',
      q: 'What does Ben do on Saturday?',
      zh: '本星期六做什么？',
      ans: 'He swims.',
      others: ['He plays basketball.', 'He reads books.'],
      why: '短文说他星期六游泳',
    },
    {
      text: "There are three people in Sam's family: his father, his mother and Sam.",
      q: "How many people are there in Sam's family?",
      zh: '萨姆家有几口人？',
      ans: 'Three.',
      others: ['Two.', 'Four.'],
      why: '爸爸、妈妈和萨姆一共三人',
    },
  ],
  high: [
    {
      text: 'Yesterday was Sunday. Jack went to the park with his parents. They flew kites and had a picnic.',
      q: 'What day is it today?',
      zh: '今天星期几？',
      ans: "It's Monday.",
      others: ["It's Sunday.", "It's Saturday."],
      why: '昨天是星期天，今天就是星期一',
    },
    {
      text: 'Mr Brown can\'t sleep well. He drinks coffee every night. The doctor says, "Don\'t drink coffee at night."',
      q: "Why can't Mr Brown sleep well?",
      zh: '布朗先生为什么睡不好？',
      ans: 'Because he drinks coffee at night.',
      others: ['Because he is hungry.', 'Because it is noisy.'],
      why: '医生让他晚上别喝咖啡，说明原因是晚上喝咖啡',
    },
    {
      text: "Tim's watch says 8:10. School starts at 8:00. Tim is still on his way.",
      q: 'Is Tim late for school?',
      zh: '蒂姆上学迟到了吗？',
      ans: 'Yes, he is.',
      others: ["No, he isn't.", 'He is early.'],
      why: '8:10 已经过了 8:00，他还在路上',
    },
    {
      text: 'Kitty wants to buy a book. It costs 20 yuan. She has 15 yuan.',
      q: 'How much more money does Kitty need?',
      zh: '基蒂还需要多少钱？',
      ans: '5 yuan.',
      others: ['35 yuan.', '15 yuan.'],
      why: '20 − 15 = 5',
    },
    {
      text: 'It is winter in Beijing now. In Sydney, it is hot and people swim in the sea.',
      q: 'What season is it in Sydney?',
      zh: '悉尼现在是什么季节？',
      ans: "It's summer.",
      others: ["It's winter.", "It's autumn."],
      why: '天气热、在海里游泳，说明是夏天',
    },
    {
      text: "Peter's mother is a nurse. She works at night. So Peter often has breakfast with his father.",
      q: 'Why does Peter often have breakfast with his father?',
      zh: '彼得为什么常和爸爸一起吃早饭？',
      ans: 'Because his mother works at night.',
      others: ['Because his father is a cook.', 'Because he gets up late.'],
      why: '短文用 So 说明了原因',
    },
  ],
};
