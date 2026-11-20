import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app/state';
import { go } from '../app/router';
import { allKnowledgePoints, LESSONS } from '../curriculum/catalog';
import { DIMENSIONS, LEVEL_NAMES, type Grade } from '../curriculum/types';
import { abilityLevels } from '../learning/abilities';
import { reviewStates } from '../learning/review';
import { dailyMinutes, formatMinutes, lessonProgress, totalActiveMs } from '../learning/progress';
import { exportAll, safetyEvents, saveLearner, saveSettings, setActiveLearnerId } from '../store/db';
import type { ParentSettings, SafetyEvent } from '../store/types';
import { Shell } from '../ui/Shell';

// The parent gate is a light check that a grown-up is here (a sum a first
// grader can't do yet). It is not a security boundary; the family access code
// on the server is.
function makeGate() {
  const a = 12 + Math.floor(Math.random() * 8), b = 3 + Math.floor(Math.random() * 6);
  return { q: `${a} × ${b} = ?`, answer: a * b };
}

export function Parent() {
  const [open, setOpen] = useState(false);
  const [gate] = useState(makeGate);
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  if (!open) {
    return (
      <Shell back="/" title="家长中心">
        <section className="card gate">
          <h1>家长确认</h1>
          <p>请家长回答下面的问题，进入家长中心。</p>
          <p className="gate-q">{gate.q}</p>
          <input inputMode="numeric" value={input} onChange={(e) => { setInput(e.target.value); setWrong(false); }} aria-label="答案" />
          {wrong && <p className="error" role="alert">答案不对，请家长再试一次。</p>}
          <button className="big-btn" onClick={() => (Number(input) === gate.answer ? setOpen(true) : setWrong(true))}>进入家长中心</button>
        </section>
      </Shell>
    );
  }
  return <ParentDashboard />;
}

function ParentDashboard() {
  const { learner, learners, events, works, settings, refresh } = useApp();
  const [draft, setDraft] = useState<ParentSettings>(settings);
  const [savedMsg, setSavedMsg] = useState('');
  const [safety, setSafety] = useState<SafetyEvent[]>([]);
  useEffect(() => { void safetyEvents().then(setSafety); }, []);
  useEffect(() => setDraft(settings), [settings]);
  const results = useMemo(() => abilityLevels(allKnowledgePoints(), events, works), [events, works]);
  const week = dailyMinutes(events, 7);
  const maxMin = Math.max(10, ...week.map((d) => d.minutes));
  if (!learner) return null;

  async function save() {
    await saveSettings(draft);
    await refresh();
    setSavedMsg('设置已保存');
    setTimeout(() => setSavedMsg(''), 2500);
  }

  async function switchTo(id: string) { await setActiveLearnerId(id); await refresh(); }
  async function changeGrade(g: Grade) { if (!learner) return; await saveLearner({ ...learner, grade: g }); await refresh(); }

  async function download() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI少年学院-备份-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const lessonRows = LESSONS.filter((l) => l.grade === learner.grade || lessonProgress(l, events).started).map((l) => {
    const p = lessonProgress(l, events);
    const firsts = new Map<string, boolean>();
    for (const e of events) if (e.type === 'answer' && e.lessonId === l.id && e.attemptNo === 1) firsts.set(e.questionId, e.correct);
    const right = [...firsts.values()].filter(Boolean).length;
    const task = events.some((e) => e.type === 'task' && e.lessonId === l.id);
    return { l, p, right, asked: firsts.size, task };
  });

  return (
    <Shell back="/" title="家长中心">
      <section className="card">
        <h2>孩子</h2>
        <div className="chips">
          {learners.map((x) => (
            <button key={x.id} className={'chip' + (x.id === learner.id ? ' on' : '')} onClick={() => void switchTo(x.id)}>{x.avatar} {x.nickname}</button>
          ))}
          <button className="chip" onClick={() => go('/setup')}>＋ 添加孩子</button>
        </div>
        <label className="field inline"><span>{learner.nickname} 的年级</span>
          <select value={learner.grade} onChange={(e) => void changeGrade(Number(e.target.value) as Grade)} aria-label="年级">
            {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g} 年级</option>)}
          </select>
        </label>
      </section>

      <section className="card">
        <h2>学习时间</h2>
        <p>累计 {formatMinutes(totalActiveMs(events))}（只计算页面打开、且 1 分钟内有操作的时间）</p>
        <div className="bars" role="img" aria-label={'最近 7 天学习分钟：' + week.map((d) => `${d.day.slice(5)} ${d.minutes} 分钟`).join('，')}>
          {week.map((d) => (
            <div key={d.day} className="bar-col">
              <span className="bar-val">{d.minutes}</span>
              <span className="bar" style={{ height: `${(d.minutes / maxMin) * 100}%` }} />
              <span className="bar-day">{d.day.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>学习进度</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>课程</th><th>状态</th><th>用时</th><th>首次答对</th><th>实践任务</th></tr></thead>
            <tbody>
              {lessonRows.map(({ l, p, right, asked, task }) => (
                <tr key={l.id}>
                  <td>{l.icon} {l.title}</td>
                  <td>{p.completed ? '已完成' : p.started ? '学习中' : '未开始'}</td>
                  <td>{p.activeMs ? formatMinutes(p.activeMs) : '—'}</td>
                  <td>{asked ? `${right}/${asked}` : '—'}</td>
                  <td>{task ? '自报完成' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">显示 {learner.grade} 年级的课程，以及其他年级里已经开始学的课程。</p>
      </section>

      <section className="card">
        <h2>能力评价</h2>
        <ul className="ability-detail">
          {results.map((r) => (
            <li key={r.dimension}>
              <div><b>{DIMENSIONS.find((d) => d.id === r.dimension)!.name}</b> <span className={'lv lv' + r.level}>{LEVEL_NAMES[r.level]}</span></div>
              <p className="muted small">依据：{r.reason}{r.evidence.length ? `（${r.evidence.length} 条记录）` : ''}</p>
            </li>
          ))}
        </ul>
        <p className="muted small">计算规则：练习题只算第一次作答；互动实验看是否一次做对；作品只计算孩子自己完成的部分。"创造迁移"在认知、应用等维度需要迁移任务（后续版本加入），目前最高到"独立应用"。</p>
      </section>

      <KnowledgeMap />

      <section className="card">
        <h2>安全设置</h2>
        <label className="field inline"><span>每日学习提醒</span>
          <select value={draft.dailyMinutes} onChange={(e) => setDraft({ ...draft, dailyMinutes: Number(e.target.value) })} aria-label="每日学习提醒">
            {[0, 10, 15, 20, 30, 45].map((m) => <option key={m} value={m}>{m ? `${m} 分钟` : '不提醒'}</option>)}
          </select>
        </label>
        <label className="toggle"><input type="checkbox" checked={draft.readAloud} onChange={(e) => setDraft({ ...draft, readAloud: e.target.checked })} /> 朗读（使用设备自带的语音，不录音、不联网）</label>
        <label className="toggle"><input type="checkbox" checked={draft.pinyin} onChange={(e) => setDraft({ ...draft, pinyin: e.target.checked })} /> 一、二年级显示拼音</label>
        <div className="locked">
          <p><b>以下功能默认关闭，当前版本不能开启：</b></p>
          <ul>
            <li>🎙️ 语音输入：V4.0 开放，开启前需家长同意</li>
            <li>🖼️ 图片上传：V3.0 起评估，默认关闭</li>
            <li>🔗 对外分享：默认关闭，作品只保存在本机</li>
            <li>🤝 陪同模式（开放式 AI 生成）：V3.0 开放。按教育部要求，小学生不能独自使用开放式内容生成</li>
          </ul>
        </div>
        <button className="big-btn" onClick={() => void save()}>保存设置</button>
        {savedMsg && <p className="hint ok" role="status">{savedMsg}</p>}
      </section>

      <section className="card">
        <h2>安全记录</h2>
        <p>{safety.length ? `共拦截 ${safety.length} 次个人信息输入（只记录类别和位置，不保存孩子写的原文）。` : '还没有拦截记录。'}</p>
        <p className="muted small">当前版本不连接任何 AI 模型，所有实验都在本机运行。</p>
      </section>

      <section className="card">
        <h2>给家长的指导</h2>
        {LESSONS.filter((l) => lessonProgress(l, events).started).length === 0 ? <p className="muted">孩子开始学习后，这里会出现每节课的家庭活动建议。</p> : (
          <ul className="guides">
            {LESSONS.filter((l) => lessonProgress(l, events).started).map((l) => (
              <li key={l.id}><b>{l.icon} {l.title}</b><p>{l.parentGuide.summary}</p><p><b>在家可以做：</b>{l.parentGuide.homeActivity}</p></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>数据与备份</h2>
        <p>所有学习记录只保存在这台设备的浏览器里（数据库名 ai-academy），不会上传，也不会影响星星闯关乐园的记录。清除浏览器数据会删除这些记录，建议定期导出备份。</p>
        <button className="big-btn secondary" onClick={() => void download()}>⬇ 导出学习记录（JSON）</button>
      </section>
    </Shell>
  );
}

function KnowledgeMap() {
  const { events } = useApp();
  const states = reviewStates(events);
  const status = (id: string) => {
    const s = states.get(id);
    if (!s) return { text: '未学', cls: 'lv0' };
    if (!s.lastPassed) return { text: '需要巩固', cls: 'lv-weak' };
    if (s.streak >= 3) return { text: '掌握', cls: 'lv3' };
    return { text: '学习中', cls: 'lv2' };
  };
  const grades = [...new Set(LESSONS.map((l) => l.grade))];
  const weak = [...states.values()].filter((s) => !s.lastPassed).length;
  return (
    <section className="card">
      <h2>知识点图谱</h2>
      <p className="muted small">每个知识点都有自己的复习计划：当天首次作答正确率达到 75% 算通过，复习间隔依次拉长为 1、3、7、14、30 天；没通过就第二天再复习。{weak ? `现在有 ${weak} 个知识点需要巩固。` : ''}</p>
      {grades.map((g) => (
        <details key={g} className="kp-grade" open={g === grades[0]}>
          <summary>{g} 年级</summary>
          <div className="table-wrap">
            <table>
              <thead><tr><th>知识点</th><th>能力</th><th>首次答对</th><th>状态</th><th>下次复习</th></tr></thead>
              <tbody>
                {LESSONS.filter((l) => l.grade === g).flatMap((l) => l.knowledgePoints).map((k) => {
                  const s = states.get(k.id), st = status(k.id);
                  return (
                    <tr key={k.id}>
                      <td>{k.name}</td>
                      <td>{DIMENSIONS.find((d) => d.id === k.dimension)!.name.replace('能力', '')}</td>
                      <td>{s ? `${s.correct}/${s.attempts}` : '—'}</td>
                      <td><span className={'lv ' + st.cls}>{st.text}</span></td>
                      <td>{s ? s.dueDay.slice(5) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </section>
  );
}
