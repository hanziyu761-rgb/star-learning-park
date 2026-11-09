// Knowledge-base retrieval (六年级·RAG 入门). REAL, simple retrieval: score each
// document by how many characters and two-character pieces it shares with the
// question, then answer only from the best document and cite it. The
// knowledge base is a made-up example (示例知识库), labelled in the UI.

export interface Doc { id: string; title: string; text: string }

export const KNOWLEDGE_BASE: Doc[] = [
  { id: 'd1', title: '借书规定', text: '每人每次最多借 2 本书，借期 7 天。' },
  { id: 'd2', title: '还书方法', text: '还书时把书放进还书箱，由图书管理员登记。' },
  { id: 'd3', title: '开放时间', text: '图书角每天中午 12 点开门，12 点半关门。' },
  { id: 'd4', title: '爱护图书', text: '书弄坏了要告诉管理员，大家一起修补。' },
  { id: 'd5', title: '推荐书单', text: '推荐书单每月第一周的周一更新。' },
  { id: 'd6', title: '保持安静', text: '在图书角要小声说话，不打扰别人看书。' },
];

export interface KbQuestion { id: string; text: string; expectDoc: string; noRagAnswer: string }

/** Each question comes with a pre-written example of an answer made WITHOUT looking anything up. */
export const KB_QUESTIONS: KbQuestion[] = [
  { id: 'k1', text: '一次能借几本书？', expectDoc: 'd1', noRagAnswer: '一般可以借 5 本书，借期一个月。' },
  { id: 'k2', text: '图书角几点开门？', expectDoc: 'd3', noRagAnswer: '图书角每天早上 8 点开门。' },
  { id: 'k3', text: '书弄坏了怎么办？', expectDoc: 'd4', noRagAnswer: '书弄坏了要赔一本新的。' },
  { id: 'k4', text: '推荐书单什么时候更新？', expectDoc: 'd5', noRagAnswer: '推荐书单每学期更新一次。' },
];

const STOP = new Set([...'什么怎么办吗呢的了？?，。,.几时候'.split(''), ' ']);

function pieces(s: string): { chars: Set<string>; pairs: Set<string> } {
  const clean = [...s].filter((c) => !STOP.has(c));
  const pairs = new Set<string>();
  for (let i = 0; i < clean.length - 1; i++) pairs.add(clean[i] + clean[i + 1]);
  return { chars: new Set(clean), pairs };
}

export interface Hit { doc: Doc; score: number }

/** Score = shared characters + 2 × shared two-character pieces. */
export function retrieve(question: string, kb: Doc[] = KNOWLEDGE_BASE, topK = 3): Hit[] {
  const q = pieces(question);
  return kb
    .map((doc) => {
      const d = pieces(doc.title + doc.text);
      let score = 0;
      for (const c of q.chars) if (d.chars.has(c)) score += 1;
      for (const p of q.pairs) if (d.pairs.has(p)) score += 2;
      return { doc, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** Answers only from the retrieved document, and says "不知道" when nothing matches well. */
export function answerFromKb(question: string, minScore = 5): { answer: string; source: Doc | null } {
  const [best] = retrieve(question, KNOWLEDGE_BASE, 1);
  if (!best || best.score < minScore) return { answer: '知识库里没有找到相关内容，我不知道。', source: null };
  return { answer: best.doc.text, source: best.doc };
}
