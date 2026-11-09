import { useMemo, useState } from 'react';
import type { MiniLmActivity } from '../curriculum/types';
import { CORPUS, END, nextWords, START, train } from '../learning/minilm';
import { Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

export function MiniLmView({ step, recorder, onDone }: ActivityProps<MiniLmActivity>) {
  const model = useMemo(() => train(), []);
  const [words, setWords] = useState<string[]>([]);
  const [sentences, setSentences] = useState<string[]>([]);
  const [showCorpus, setShowCorpus] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const last = words.length ? words[words.length - 1] : START;
  const cands = nextWords(model, last);
  const finished = last === END;

  function pick(w: string) {
    const next = [...words, w];
    setWords(next);
    if (w === END) setSentences((s) => [...s, next.join('')]);
  }

  async function choose(id: string) {
    if (answer) return;
    setAnswer(id);
    await recorder.record({ type: 'experiment', stepId: step.id, kind: 'language-model', knowledgePoints: step.knowledgePoints, total: 1, mistakes: id === 'count' ? 0 : 1 });
  }

  return (
    <section className="activity">
      <p className="kind-tag">互动实验 · 真实计算</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="sim-note">这是一个<b>迷你语言模型</b>：它只读过下面 {CORPUS.length} 句话，靠"数一数哪个词后面常接哪个词"来算概率。大语言模型也是预测下一个词，但用的是巨大的神经网络和海量文字，比它复杂得多。</p>
      <p className="instruction">{step.instruction}</p>
      <button className="link" onClick={() => setShowCorpus(!showCorpus)}>{showCorpus ? '收起' : '看看它读过的句子（语料）'}</button>
      {showCorpus && <ul className="corpus">{CORPUS.map((c) => <li key={c}>{c.replace(/ /g, '')}</li>)}</ul>}

      <div className="lm-sentence" aria-label="正在生成的句子">{words.length ? words.join('') : <span className="muted">（从这里开始）</span>}</div>
      {!finished ? (
        <>
          <p className="small muted">"{last === START ? '开头' : last}"后面，下一个词的概率：</p>
          <ul className="cands">
            {cands.map((c) => (
              <li key={c.word}>
                <button className="cand" onClick={() => pick(c.word)} aria-label={`选择"${c.word}"，概率 ${Math.round(c.p * 100)}%`}>
                  <span className="cand-word">{c.word}</span>
                  <span className="cand-bar"><span style={{ width: `${Math.round(c.p * 100)}%` }} /></span>
                  <span className="cand-p">{Math.round(c.p * 100)}%（出现 {c.count} 次）</span>
                </button>
              </li>
            ))}
          </ul>
          <button className="chip" onClick={() => cands[0] && pick(cands[0].word)}>🎯 自动选概率最高的</button>
        </>
      ) : (
        <button className="big-btn secondary" onClick={() => setWords([])}>🔄 再生成一句</button>
      )}
      {sentences.length > 0 && <p className="small">已生成：{sentences.join(' / ')}</p>}

      {sentences.length > 0 && (
        <div className="result">
          <p className="discussion">💬 <Txt>这个迷你模型是根据什么选下一个词的？</Txt></p>
          <div className="options">
            <button className={'option' + (answer === 'count' ? ' chosen' : '')} disabled={!!answer} onClick={() => void choose('count')}>它读过的句子里，哪个词常接在后面</button>
            <button className={'option' + (answer === 'mean' ? ' chosen' : '')} disabled={!!answer} onClick={() => void choose('mean')}>它真的懂这句话的意思</button>
          </div>
          {answer && (
            <>
              <p className={'hint ' + (answer === 'count' ? 'ok' : 'try')}>{(answer === 'count' ? '对！' : '再想想：') + step.explain}</p>
              <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
