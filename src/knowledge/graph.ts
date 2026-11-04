/**
 * 一年级数学知识图谱（原创数据）
 *
 * 由本项目依据《义务教育数学课程标准（2022 年版）》第一学段内容要求和一年级常见教学顺序独立编写：
 * 知识点划分、编号、说明、先修关系及其理由均为原创，未复制 cn-math-taxonomy（CC BY-NC 4.0）的数据。
 * 先修关系是“教学上通常需要先具备”的经验判断，不代表每个孩子的学习路径都相同；
 * 诊断时只把 hard（必需）先修作为回溯依据，soft（有帮助）先修只用于推荐顺序。
 * 状态：未经一线教师审核（见 docs/KNOWLEDGE_GRAPH.md）。
 */

export type Strength = 'hard' | 'soft';

export interface KnowledgePoint {
  id: string;
  /** 给家长看的名称 */
  name: string;
  /** 给孩子看的短名称与拼音（知识小地图） */
  kidName: string;
  kidPy: string;
  emoji: string;
  grade: number;
  term: '上' | '下';
  /** 在知识小地图上的顺序 */
  order: number;
  /** 给家长看的说明：掌握了意味着能做什么 */
  canDo: string;
  prerequisites: { id: string; strength: Strength; why: string }[];
  /** 是否有原创题目生成器（可用于诊断和知识点练习） */
  practicable: boolean;
}

const kp = (k: KnowledgePoint) => k;

export const KNOWLEDGE_POINTS: KnowledgePoint[] = [
  kp({
    id: 'm1.count5',
    name: '认识 1～5',
    kidName: '数到5',
    kidPy: 'shù dào',
    emoji: '🖐️',
    grade: 1,
    term: '上',
    order: 1,
    canDo: '能一个一个数出 5 以内的物体，认读 1～5，说出数量。',
    prerequisites: [],
    practicable: true,
  }),
  kp({
    id: 'm1.zero',
    name: '认识 0',
    kidName: '认识0',
    kidPy: 'rèn shi',
    emoji: '⭕',
    grade: 1,
    term: '上',
    order: 2,
    canDo: '知道“一个也没有”用 0 表示。',
    prerequisites: [{ id: 'm1.count5', strength: 'hard', why: '先会数“有几个”，才能理解“一个也没有”' }],
    practicable: true,
  }),
  kp({
    id: 'm1.compose5',
    name: '5 以内数的分与合',
    kidName: '分一分合一合',
    kidPy: 'fēn yi fēn hé yi hé',
    emoji: '🧩',
    grade: 1,
    term: '上',
    order: 3,
    canDo: '知道 5 可以分成 2 和 3 等，几和几合起来是 5 以内的数。',
    prerequisites: [{ id: 'm1.count5', strength: 'hard', why: '分与合要先能准确数出每一部分的数量' }],
    practicable: true,
  }),
  kp({
    id: 'm1.add5',
    name: '5 以内的加法',
    kidName: '5以内加法',
    kidPy: 'yǐ nèi jiā fǎ',
    emoji: '➕',
    grade: 1,
    term: '上',
    order: 4,
    canDo: '理解“合起来”就是加法，会算 5 以内的加法。',
    prerequisites: [{ id: 'm1.compose5', strength: 'hard', why: '加法的意义是“几和几合起来”' }],
    practicable: true,
  }),
  kp({
    id: 'm1.sub5',
    name: '5 以内的减法',
    kidName: '5以内减法',
    kidPy: 'yǐ nèi jiǎn fǎ',
    emoji: '➖',
    grade: 1,
    term: '上',
    order: 5,
    canDo: '理解“去掉”“还剩”就是减法，会算 5 以内的减法。',
    prerequisites: [
      { id: 'm1.compose5', strength: 'hard', why: '减法要知道总数可以分成哪两部分' },
      { id: 'm1.add5', strength: 'soft', why: '会用“想加算减”检查答案' },
    ],
    practicable: true,
  }),
  kp({
    id: 'm1.count10',
    name: '认识 6～10',
    kidName: '数到10',
    kidPy: 'shù dào',
    emoji: '🔟',
    grade: 1,
    term: '上',
    order: 6,
    canDo: '能数出、认读 10 以内的数，知道数的顺序。',
    prerequisites: [{ id: 'm1.count5', strength: 'hard', why: '在 1～5 的基础上接着往后数' }],
    practicable: true,
  }),
  kp({
    id: 'm1.compare10',
    name: '10 以内数的比较',
    kidName: '比大小',
    kidPy: 'bǐ dà xiǎo',
    emoji: '⚖️',
    grade: 1,
    term: '上',
    order: 7,
    canDo: '能比较两组物体谁多谁少，比较 10 以内两个数的大小。',
    prerequisites: [{ id: 'm1.count10', strength: 'hard', why: '比较大小前要先数清两边各有多少' }],
    practicable: true,
  }),
  kp({
    id: 'm1.compose10',
    name: '10 以内数的分与合',
    kidName: '10的分与合',
    kidPy: 'de fēn yǔ hé',
    emoji: '🧩',
    grade: 1,
    term: '上',
    order: 8,
    canDo: '熟悉 6～10 每个数可以分成哪两个数，尤其是“凑成 10”。',
    prerequisites: [
      { id: 'm1.compose5', strength: 'hard', why: '从 5 以内的分与合扩展到 10 以内' },
      { id: 'm1.count10', strength: 'hard', why: '要先认识 6～10' },
    ],
    practicable: true,
  }),
  kp({
    id: 'm1.add10',
    name: '10 以内的加法',
    kidName: '10以内加法',
    kidPy: 'yǐ nèi jiā fǎ',
    emoji: '➕',
    grade: 1,
    term: '上',
    order: 9,
    canDo: '能熟练口算 10 以内的加法。',
    prerequisites: [
      { id: 'm1.add5', strength: 'hard', why: '理解加法的意义' },
      { id: 'm1.compose10', strength: 'hard', why: '10 以内的加法依靠数的分与合' },
    ],
    practicable: true,
  }),
  kp({
    id: 'm1.sub10',
    name: '10 以内的减法',
    kidName: '10以内减法',
    kidPy: 'yǐ nèi jiǎn fǎ',
    emoji: '➖',
    grade: 1,
    term: '上',
    order: 10,
    canDo: '能熟练口算 10 以内的减法。',
    prerequisites: [
      { id: 'm1.sub5', strength: 'hard', why: '理解减法的意义' },
      { id: 'm1.compose10', strength: 'hard', why: '10 以内的减法依靠数的分与合' },
      { id: 'm1.add10', strength: 'soft', why: '会用“想加算减”' },
    ],
    practicable: true,
  }),
  kp({
    id: 'm1.wordprob10',
    name: '用加减法解决简单问题',
    kidName: '看图列算式',
    kidPy: 'kàn tú liè suàn shì',
    emoji: '📝',
    grade: 1,
    term: '上',
    order: 11,
    canDo: '能根据“一共”“还剩”“又来了”等情境选择用加法还是减法。',
    prerequisites: [
      { id: 'm1.add10', strength: 'hard', why: '要会计算' },
      { id: 'm1.sub10', strength: 'hard', why: '要会计算' },
    ],
    practicable: true,
  }),
  kp({
    id: 'm1.count20',
    name: '认识 11～20',
    kidName: '数到20',
    kidPy: 'shù dào',
    emoji: '🔢',
    grade: 1,
    term: '上',
    order: 12,
    canDo: '知道 1 个十和几个一组成十几，能认读、比较 20 以内的数。',
    prerequisites: [{ id: 'm1.count10', strength: 'hard', why: '十几是“十”加上 10 以内的数' }],
    practicable: true,
  }),
  kp({
    id: 'm1.make10',
    name: '凑十',
    kidName: '凑成10',
    kidPy: 'còu chéng',
    emoji: '🎯',
    grade: 1,
    term: '上',
    order: 13,
    canDo: '能很快说出一个数再加几就是 10。',
    prerequisites: [{ id: 'm1.compose10', strength: 'hard', why: '凑十就是 10 的分与合' }],
    practicable: true,
  }),
  kp({
    id: 'm1.carry20',
    name: '20 以内的进位加法',
    kidName: '进位加法',
    kidPy: 'jìn wèi jiā fǎ',
    emoji: '🚀',
    grade: 1,
    term: '上',
    order: 14,
    canDo: '会用凑十法算 9+几、8+几等进位加法。',
    prerequisites: [
      { id: 'm1.make10', strength: 'hard', why: '进位加法的核心方法是凑十' },
      { id: 'm1.count20', strength: 'hard', why: '结果是十几，要认识 11～20' },
      { id: 'm1.add10', strength: 'soft', why: '凑十后还要再加剩下的数' },
    ],
    practicable: true,
  }),
  kp({
    id: 'm1.position',
    name: '位置（上下前后左右）',
    kidName: '找位置',
    kidPy: 'zhǎo wèi zhì',
    emoji: '🧭',
    grade: 1,
    term: '上',
    order: 15,
    canDo: '能用上下、前后、左右描述物体的位置。',
    prerequisites: [],
    practicable: true,
  }),
  kp({
    id: 'm1.shapes3d',
    name: '认识立体图形',
    kidName: '认识积木',
    kidPy: 'rèn shi jī mù',
    emoji: '🧊',
    grade: 1,
    term: '上',
    order: 16,
    canDo: '能认出长方体、正方体、圆柱和球。',
    prerequisites: [],
    practicable: true,
  }),
  kp({
    id: 'm1.clock',
    name: '认识整时',
    kidName: '认钟表',
    kidPy: 'rèn zhōng biǎo',
    emoji: '⏰',
    grade: 1,
    term: '上',
    order: 17,
    canDo: '能读出钟面上的整时。',
    prerequisites: [{ id: 'm1.count20', strength: 'hard', why: '要认识钟面上的数 1～12' }],
    practicable: true,
  }),
  kp({
    id: 'm1.borrow20',
    name: '20 以内的退位减法',
    kidName: '退位减法',
    kidPy: 'tuì wèi jiǎn fǎ',
    emoji: '🎯',
    grade: 1,
    term: '下',
    order: 18,
    canDo: '会算十几减 9、8、7 等退位减法（破十法或想加算减）。',
    prerequisites: [
      { id: 'm1.count20', strength: 'hard', why: '要把十几看成 1 个十和几个一' },
      { id: 'm1.sub10', strength: 'hard', why: '破十后要算 10 以内的减法' },
      { id: 'm1.carry20', strength: 'soft', why: '可以用“想加算减”' },
    ],
    practicable: true,
  }),
  kp({
    id: 'm1.shapes2d',
    name: '认识平面图形',
    kidName: '认识图形',
    kidPy: 'rèn shi tú xíng',
    emoji: '🔺',
    grade: 1,
    term: '下',
    order: 19,
    canDo: '能认出长方形、正方形、三角形、圆。',
    prerequisites: [{ id: 'm1.shapes3d', strength: 'soft', why: '平面图形可以从立体图形的面上“画”下来' }],
    practicable: true,
  }),
  kp({
    id: 'm1.classify',
    name: '分类与整理',
    kidName: '分一分',
    kidPy: 'fēn yi fēn',
    emoji: '🗂️',
    grade: 1,
    term: '下',
    order: 20,
    canDo: '能按一个标准把物品分类并数一数每类有几个。',
    prerequisites: [{ id: 'm1.count20', strength: 'soft', why: '分完要数出每类的数量' }],
    practicable: true,
  }),
  kp({
    id: 'm1.count100',
    name: '认识 100 以内的数',
    kidName: '数到100',
    kidPy: 'shù dào',
    emoji: '💯',
    grade: 1,
    term: '下',
    order: 21,
    canDo: '知道几个十和几个一组成多少，能比较 100 以内数的大小。',
    prerequisites: [{ id: 'm1.count20', strength: 'hard', why: '从“十几”推广到“几十几”' }],
    practicable: true,
  }),
  kp({
    id: 'm1.money',
    name: '认识人民币',
    kidName: '认识钱',
    kidPy: 'rèn shi qián',
    emoji: '💰',
    grade: 1,
    term: '下',
    order: 22,
    canDo: '认识元、角、分，知道 1 元 = 10 角，会简单付钱找钱。',
    prerequisites: [
      { id: 'm1.count100', strength: 'soft', why: '要数较大的钱数' },
      { id: 'm1.sub10', strength: 'soft', why: '找钱要用减法' },
    ],
    practicable: false,
  }),
  kp({
    id: 'm1.addsub100',
    name: '100 以内的加减法（一）',
    kidName: '两位数加减',
    kidPy: 'liǎng wèi shù jiā jiǎn',
    emoji: '🧮',
    grade: 1,
    term: '下',
    order: 23,
    canDo: '会算整十数加减、两位数加减一位数。',
    prerequisites: [
      { id: 'm1.count100', strength: 'hard', why: '要理解几个十和几个一' },
      { id: 'm1.carry20', strength: 'hard', why: '个位相加满十要进位' },
      { id: 'm1.borrow20', strength: 'hard', why: '个位不够减要退位' },
    ],
    practicable: true,
  }),
  kp({
    id: 'm1.pattern',
    name: '找规律',
    kidName: '找规律',
    kidPy: 'zhǎo guī lǜ',
    emoji: '🔁',
    grade: 1,
    term: '下',
    order: 24,
    canDo: '能发现简单图形、数字排列的规律并接着往下排。',
    prerequisites: [{ id: 'm1.count20', strength: 'soft', why: '数字规律要会数和比较' }],
    practicable: true,
  }),
];

export const KP_BY_ID: Record<string, KnowledgePoint> = Object.fromEntries(KNOWLEDGE_POINTS.map((k) => [k.id, k]));

export function getKp(id: string): KnowledgePoint | undefined {
  return KP_BY_ID[id];
}

/** 所有祖先（先修的先修），可选只沿 hard 边 */
export function ancestors(id: string, onlyHard = false): string[] {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = KP_BY_ID[stack.pop()!];
    for (const p of cur?.prerequisites ?? []) {
      if (onlyHard && p.strength !== 'hard') continue;
      if (!out.has(p.id)) {
        out.add(p.id);
        stack.push(p.id);
      }
    }
  }
  return [...out];
}

/** 拓扑排序（先修在前；同层按 order） */
export function topoOrder(ids: string[] = KNOWLEDGE_POINTS.map((k) => k.id)): string[] {
  const set = new Set(ids);
  const done = new Set<string>();
  const out: string[] = [];
  const visit = (id: string, path: Set<string>) => {
    if (done.has(id)) return;
    if (path.has(id)) throw new Error(`知识图谱存在环：${[...path, id].join(' → ')}`);
    path.add(id);
    const k = KP_BY_ID[id];
    const pres = [...(k?.prerequisites ?? [])].sort(
      (a, b) => (KP_BY_ID[a.id]?.order ?? 0) - (KP_BY_ID[b.id]?.order ?? 0),
    );
    for (const p of pres) if (set.has(p.id)) visit(p.id, path);
    path.delete(id);
    done.add(id);
    out.push(id);
  };
  [...ids].sort((a, b) => (KP_BY_ID[a]?.order ?? 0) - (KP_BY_ID[b]?.order ?? 0)).forEach((id) => visit(id, new Set()));
  return out;
}
