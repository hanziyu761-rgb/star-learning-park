// Decision-tree classification game (四年级项目). This is a REAL classification
// algorithm (a decision tree), designed by the child and executed exactly.

export type Question = 'feathers' | 'gills' | 'flies' | 'fourLegs';
export type AnimalClass = '鸟类' | '鱼类' | '哺乳动物';
export const CLASSES: AnimalClass[] = ['鸟类', '鱼类', '哺乳动物'];

export const QUESTIONS: Record<Question, string> = {
  feathers: '有羽毛吗？',
  gills: '用鳃呼吸吗？',
  flies: '会飞吗？',
  fourLegs: '有四条腿吗？',
};

export interface Animal { id: string; icon: string; name: string; answers: Record<Question, boolean>; truth: AnimalClass }

const a = (id: string, icon: string, name: string, feathers: boolean, gills: boolean, flies: boolean, fourLegs: boolean, truth: AnimalClass): Animal =>
  ({ id, icon, name, answers: { feathers, gills, flies, fourLegs }, truth });

// Facts: penguins are birds that cannot fly; whales and dolphins
// are mammals that breathe air with lungs; bats are flying mammals with two legs and two wings.
export const ANIMALS: Animal[] = [
  a('sparrow', '🐦', '麻雀', true, false, true, false, '鸟类'),
  a('penguin', '🐧', '企鹅', true, false, false, false, '鸟类'),
  a('owl', '🦉', '猫头鹰', true, false, true, false, '鸟类'),
  a('goldfish', '🐠', '金鱼', false, true, false, false, '鱼类'),
  a('shark', '🦈', '鲨鱼', false, true, false, false, '鱼类'),
  a('clownfish', '🐟', '小丑鱼', false, true, false, false, '鱼类'),
  a('whale', '🐋', '鲸鱼', false, false, false, false, '哺乳动物'),
  a('dolphin', '🐬', '海豚', false, false, false, false, '哺乳动物'),
  a('bat', '🦇', '蝙蝠', false, false, true, false, '哺乳动物'),
  a('dog', '🐕', '狗', false, false, false, true, '哺乳动物'),
  a('panda', '🐼', '大熊猫', false, false, false, true, '哺乳动物'),
];

export type TreeNode = { leaf: AnimalClass } | { q: Question; yes: TreeNode; no: TreeNode };

export function classify(tree: TreeNode, animal: Animal, path: string[] = []): { label: AnimalClass; path: string[] } {
  if ('leaf' in tree) return { label: tree.leaf, path };
  const ans = animal.answers[tree.q];
  return classify(ans ? tree.yes : tree.no, animal, [...path, `${QUESTIONS[tree.q]}${ans ? '是' : '不是'}`]);
}

export function evaluate(tree: TreeNode, animals = ANIMALS) {
  const rows = animals.map((an) => { const r = classify(tree, an); return { animal: an, predicted: r.label, path: r.path, correct: r.label === an.truth }; });
  return { rows, correct: rows.filter((r) => r.correct).length, total: rows.length };
}

export function describe(tree: TreeNode, indent = ''): string {
  if ('leaf' in tree) return `${indent}→ ${tree.leaf}`;
  return `${indent}${QUESTIONS[tree.q]}\n${indent}  是：\n${describe(tree.yes, indent + '    ')}\n${indent}  不是：\n${describe(tree.no, indent + '    ')}`;
}
