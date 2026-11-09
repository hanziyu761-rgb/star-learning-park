import { useState } from 'react';
import type { RetrievalActivity } from '../curriculum/types';
import { answerFromKb, KB_QUESTIONS, KNOWLEDGE_BASE, retrieve } from '../learning/retrieval';
import { Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

const UNKNOWN = '食堂中午吃什么？';

export function RetrievalView({ step, recorder, onDone }: ActivityProps<RetrievalActivity>) {
  const [q, setQ] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const known = KB_QUESTIONS.find((x) => x.text === q);
  const hits = q ? retrieve(q) : [];
  const rag = q ? answerFromKb(q) : null;

  function ask(text: string) { setQ(text); if (!tried.includes(text)) setTried([...tried, text]); }
  async function choose(id: string) {
    if (answer) return;
    setAnswer(id);
    await recorder.record({ type: 'experiment', stepId: step.id, kind: 'retrieval', knowledgePoints: step.knowledgePoints, total: 1, mistakes: id === 'rag' ? 0 : 1 });
  }

  return (
    <section className="activity">
      <p className="kind-tag">互动实验 · 真实检索</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="sim-note">这里的<b>知识库是编出来的示例</b>（一个班级图书角的规定）。检索是真实计算：比一比问题和每条资料有多少相同的字。"不查资料"的回答是<b>预先写好的示例</b>，用来对比。</p>
      <p className="instruction">{step.instruction}</p>
      <details className="kb"><summary>看看知识库（{KNOWLEDGE_BASE.length} 条）</summary>
        <ol>{KNOWLEDGE_BASE.map((d) => <li key={d.id}><b>{d.title}</b>：{d.text}</li>)}</ol>
      </details>
      <div className="chips">
        {[...KB_QUESTIONS.map((x) => x.text), UNKNOWN].map((t) => (
          <button key={t} className={'chip' + (q === t ? ' on' : '')} aria-pressed={q === t} onClick={() => ask(t)}>{t}</button>
        ))}
      </div>

      {q && (
        <div className="rag-compare">
          <div className="rag-col">
            <h2>🔍 第 1 步：检索</h2>
            <ol className="hits">{hits.map((h) => <li key={h.doc.id} className={h === hits[0] && rag?.source ? 'top' : ''}><b>{h.doc.title}</b> · 得分 {h.score}</li>)}</ol>
            <h2>✅ 第 2 步：根据资料回答</h2>
            <p className="rag-answer">{rag!.answer}{rag!.source && <span className="cite">来源：知识库「{rag!.source.title}」</span>}</p>
          </div>
          <div className="rag-col norag">
            <h2>🤷 不查资料直接回答</h2>
            <p className="rag-answer">{known ? <>示例 AI 回答：{known.noRagAnswer}</> : '示例 AI 回答：食堂中午有红烧肉和炒青菜。'}</p>
            <p className="small muted">（预先写好的示例：听起来很像真的，但没有依据。）</p>
          </div>
        </div>
      )}

      {tried.length >= 2 && (
        <div className="result">
          <p className="discussion">💬 哪一种回答更可信？</p>
          <div className="options">
            <button className={'option' + (answer === 'rag' ? ' chosen' : '')} disabled={!!answer} onClick={() => void choose('rag')}>先检索、再根据资料回答，并写明来源</button>
            <button className={'option' + (answer === 'norag' ? ' chosen' : '')} disabled={!!answer} onClick={() => void choose('norag')}>不查资料直接回答，说得更快更肯定</button>
          </div>
          {answer && (
            <>
              <p className={'hint ' + (answer === 'rag' ? 'ok' : 'try')}>{(answer === 'rag' ? '对！' : '再想想：') + step.explain}</p>
              <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
            </>
          )}
        </div>
      )}
      {tried.length < 2 && <p className="muted small center">至少试两个问题，再比较。别忘了试试最后那个问题。</p>}
    </section>
  );
}
