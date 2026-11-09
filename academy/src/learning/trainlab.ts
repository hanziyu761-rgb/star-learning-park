// AI 训练模拟器 (四年级). A SIMULATION, always labelled as such in the UI.
// The "model" remembers its training examples and labels a new item with the
// label of the most similar example (weighted nearest neighbour). Feature
// weights are fixed per preset so the model visibly "leans" on colour — which
// is exactly how a narrow training set produces biased predictions.

export interface LabSample {
  id: string;
  icon: string;
  name: string;
  features: Record<string, string>;
  truth: string;
}

export interface LabPreset {
  id: 'exam' | 'bias';
  featureNames: Record<string, string>;
  weights: Record<string, number>;
  train: LabSample[];
  test: LabSample[];
  /** Extra examples the child may add to the training set (bias mode). */
  pool: LabSample[];
}

const s = (id: string, icon: string, name: string, color: string, shape: string, size: string, truth: string): LabSample =>
  ({ id, icon, name, features: { color, shape, size }, truth });

const FRUIT_FEATURES = { color: '颜色', shape: '形状', size: '大小' };
const WEIGHTS = { color: 1, shape: 0.6, size: 0.3 };

export const PRESETS: Record<LabPreset['id'], LabPreset> = {
  exam: {
    id: 'exam', featureNames: FRUIT_FEATURES, weights: WEIGHTS,
    train: [
      s('e1', '🍎', '红苹果', '红', '圆', '中', '苹果'),
      s('e2', '🍎', '大红苹果', '红', '圆', '大', '苹果'),
      s('e3', '🍌', '黄香蕉', '黄', '长', '中', '香蕉'),
      s('e4', '🍌', '小香蕉', '黄', '长', '小', '香蕉'),
      s('e5', '🍊', '橘子', '橙', '圆', '中', '橘子'),
    ],
    test: [
      s('n1', '🍎', '黄苹果', '黄', '圆', '中', '苹果'),
      s('n2', '🍌', '青香蕉', '绿', '长', '中', '香蕉'),
      s('n3', '🍊', '小橘子', '橙', '圆', '小', '橘子'),
      s('n4', '🍎', '小红苹果', '红', '圆', '小', '苹果'),
    ],
    pool: [],
  },
  bias: {
    id: 'bias', featureNames: FRUIT_FEATURES, weights: WEIGHTS,
    train: [
      s('b1', '🍎', '红苹果', '红', '圆', '中', '苹果'),
      s('b2', '🍎', '大红苹果', '红', '圆', '大', '苹果'),
      s('b3', '🍎', '小红苹果', '红', '圆', '小', '苹果'),
      s('b4', '🍐', '绿梨', '绿', '葫芦形', '中', '梨'),
      s('b5', '🍐', '黄梨', '黄', '葫芦形', '中', '梨'),
      s('b6', '🍐', '小绿梨', '绿', '葫芦形', '小', '梨'),
    ],
    test: [
      s('t1', '🍏', '小青苹果', '绿', '圆', '小', '苹果'),
      s('t2', '🍎', '大黄苹果', '黄', '圆', '大', '苹果'),
      s('t3', '🍎', '另一个大红苹果', '红', '圆', '大', '苹果'),
      s('t4', '🍐', '小黄梨', '黄', '葫芦形', '小', '梨'),
    ],
    pool: [
      s('p1', '🍏', '青苹果', '绿', '圆', '中', '苹果'),
      s('p2', '🍎', '黄苹果', '黄', '圆', '中', '苹果'),
      s('p3', '🍎', '又一个红苹果', '红', '圆', '中', '苹果'),
    ],
  },
};

export function labDistance(a: LabSample, b: LabSample, weights: Record<string, number>): number {
  return Object.entries(weights).reduce((d, [f, w]) => d + (a.features[f] !== b.features[f] ? w : 0), 0);
}

export interface LabPrediction { sample: LabSample; predicted: string; nearest: LabSample; correct: boolean }

export function labPredict(train: LabSample[], test: LabSample[], weights: Record<string, number>): LabPrediction[] {
  if (!train.length) throw new Error('no training data');
  return test.map((sample) => {
    let best = train[0];
    for (const t of train) if (labDistance(sample, t, weights) < labDistance(sample, best, weights)) best = t;
    return { sample, predicted: best.truth, nearest: best, correct: best.truth === sample.truth };
  });
}

export const labAccuracy = (p: LabPrediction[]) => (p.length ? p.filter((x) => x.correct).length / p.length : 0);
