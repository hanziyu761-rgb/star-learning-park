// Fruit-recognition training SIMULATOR (二年级项目).
// This is NOT a real machine-learning model. It imitates the idea of learning
// from labelled examples with the simplest possible rule: a new fruit gets the
// label of the training example it is most similar to ("nearest neighbour").
// The UI always labels it "模拟实验". Real models are introduced in grade 4+.

export type FruitLabel = '苹果' | '香蕉' | '橘子';
export const FRUIT_LABELS: FruitLabel[] = ['苹果', '香蕉', '橘子'];

export interface FruitSample {
  id: string;
  icon: string;
  name: string;
  color: '红' | '绿' | '黄' | '橙';
  shape: '圆' | '长';
  size: '小' | '中' | '大';
  truth: FruitLabel;
}

export const TRAINING_SET: FruitSample[] = [
  { id: 't1', icon: '🍎', name: '红苹果', color: '红', shape: '圆', size: '中', truth: '苹果' },
  { id: 't2', icon: '🍏', name: '青苹果', color: '绿', shape: '圆', size: '中', truth: '苹果' },
  { id: 't3', icon: '🍎', name: '大红苹果', color: '红', shape: '圆', size: '大', truth: '苹果' },
  { id: 't4', icon: '🍌', name: '黄香蕉', color: '黄', shape: '长', size: '中', truth: '香蕉' },
  { id: 't5', icon: '🍌', name: '青香蕉', color: '绿', shape: '长', size: '中', truth: '香蕉' },
  { id: 't6', icon: '🍌', name: '小香蕉', color: '黄', shape: '长', size: '小', truth: '香蕉' },
  { id: 't7', icon: '🍊', name: '橘子', color: '橙', shape: '圆', size: '中', truth: '橘子' },
  { id: 't8', icon: '🍊', name: '小橘子', color: '橙', shape: '圆', size: '小', truth: '橘子' },
];

/** Fruits the model has never seen. */
export const TEST_SET: FruitSample[] = [
  { id: 'x1', icon: '🍏', name: '小青苹果', color: '绿', shape: '圆', size: '小', truth: '苹果' },
  { id: 'x2', icon: '🍌', name: '大香蕉', color: '黄', shape: '长', size: '大', truth: '香蕉' },
  { id: 'x3', icon: '🍊', name: '大橘子', color: '橙', shape: '圆', size: '大', truth: '橘子' },
  { id: 'x4', icon: '🍎', name: '小红苹果', color: '红', shape: '圆', size: '小', truth: '苹果' },
];

/** How different two fruits look: colour and shape count 1 each, size counts 0.5. */
export function distance(a: FruitSample, b: FruitSample): number {
  return (a.color !== b.color ? 1 : 0) + (a.shape !== b.shape ? 1 : 0) + (a.size !== b.size ? 0.5 : 0);
}

export interface Prediction {
  sample: FruitSample;
  predicted: FruitLabel;
  /** The training example it looked most like. */
  nearest: FruitSample;
  nearestLabel: FruitLabel;
  correct: boolean;
}

/**
 * "Train" = remember the labelled examples. "Predict" = copy the label of the
 * most similar remembered example (ties go to the earlier example).
 */
export function predict(labels: Record<string, FruitLabel>, train = TRAINING_SET, test = TEST_SET): Prediction[] {
  const known = train.filter((t) => labels[t.id]);
  if (!known.length) throw new Error('no labelled training data');
  return test.map((sample) => {
    let best = known[0];
    for (const t of known) if (distance(sample, t) < distance(sample, best)) best = t;
    const predicted = labels[best.id];
    return { sample, predicted, nearest: best, nearestLabel: predicted, correct: predicted === sample.truth };
  });
}

export function accuracy(preds: Prediction[]): number {
  return preds.length ? preds.filter((p) => p.correct).length / preds.length : 0;
}

export function mislabeled(labels: Record<string, FruitLabel>, train = TRAINING_SET): FruitSample[] {
  return train.filter((t) => labels[t.id] && labels[t.id] !== t.truth);
}
