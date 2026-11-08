import { useMemo, useState } from 'react';
import type { Grade } from '../curriculum/types';
import { useApp } from '../app/state';
import { go } from '../app/router';
import { logSafety, newId, saveLearner, setActiveLearnerId } from '../store/db';
import { readLegacyGrade } from '../store/legacy';
import { AVATARS, checkNickname, containsPrivateInfo, SUGGESTED_NICKNAMES } from '../safety/privacy';

export function Setup() {
  const { refresh, learners } = useApp();
  const legacyGrade = useMemo(() => readLegacyGrade(), []);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState<Grade>(legacyGrade ?? 1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    const problem = checkNickname(nickname);
    if (problem) {
      setError(problem);
      if (containsPrivateInfo(nickname)) await logSafety({ id: newId(), learnerId: null, at: new Date().toISOString(), category: 'privacy', where: 'nickname' });
      return;
    }
    setBusy(true);
    const id = newId();
    await saveLearner({ id, nickname: nickname.trim(), avatar, grade, createdAt: new Date().toISOString() });
    await setActiveLearnerId(id);
    await refresh();
    go('/');
  }

  return (
    <div className="shell setup">
      <main className="content">
        <section className="hero">
          <div className="hero-bot" aria-hidden>🤖</div>
          <h1>欢迎来到 AI 少年学院</h1>
          <p>先请家长帮孩子建一个学习档案。只需要昵称和年级，<b>不要填真实姓名</b>。</p>
        </section>

        <section className="card">
          <h2>选一个头像</h2>
          <div className="chips big">
            {AVATARS.map((a) => (
              <button key={a} className={'chip avatar' + (a === avatar ? ' on' : '')} onClick={() => setAvatar(a)} aria-pressed={a === avatar}>{a}</button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>起一个昵称</h2>
          <div className="chips">
            {SUGGESTED_NICKNAMES.map((n) => (
              <button key={n} className={'chip' + (n === nickname ? ' on' : '')} onClick={() => { setNickname(n); setError(''); }}>{n}</button>
            ))}
          </div>
          <label className="field">
            <span>或者自己写（最多 8 个字）</span>
            <input value={nickname} maxLength={12} onChange={(e) => { setNickname(e.target.value); setError(''); }} placeholder="比如：小星星" aria-label="昵称" />
          </label>
        </section>

        <section className="card">
          <h2>孩子读几年级？</h2>
          {legacyGrade && <p className="muted">星星闯关乐园里选的是 {legacyGrade} 年级，已为你选好，可以修改。</p>}
          <div className="grade-grid">
            {([1, 2, 3, 4, 5, 6] as Grade[]).map((g) => (
              <button key={g} className={'grade-btn' + (g === grade ? ' on' : '')} onClick={() => setGrade(g)} aria-pressed={g === grade}>{g} 年级</button>
            ))}
          </div>
        </section>

        {error && <p className="error" role="alert">{error}</p>}
        <button className="big-btn" disabled={busy} onClick={() => void create()}>开始学习 →</button>
        {learners.length > 0 && <button className="link center" onClick={() => go('/')}>取消</button>}
        <p className="muted small center">学习记录只保存在这台设备的浏览器里，不会上传。家长可以在家长中心导出备份。</p>
      </main>
    </div>
  );
}
