import type { ReactNode } from 'react';
import { useApp } from '../app/state';
import { go } from '../app/router';
import { activeMsOnDay, localDay } from '../learning/progress';

export function Shell({ children, back, title }: { children: ReactNode; back?: string; title?: string }) {
  const { learner, events, settings } = useApp();
  const todayMin = Math.round(activeMsOnDay(events, localDay(new Date().toISOString())) / 60000);
  const over = settings.dailyMinutes > 0 && todayMin >= settings.dailyMinutes;
  return (
    <div className={'shell' + (learner && learner.grade <= 2 ? ' lower' : '')}>
      <header className="topbar">
        {back ? <button className="icon-btn" onClick={() => go(back)} aria-label="返回">←</button> : <span className="brand-mark">🤖</span>}
        <button className="brand" onClick={() => go('/')}>{title ?? 'AI 少年学院'}</button>
        {learner && <button className="me" onClick={() => go('/growth')} aria-label="我的成长中心"><span>{learner.avatar}</span></button>}
      </header>
      {over && (
        <div className="rest-banner" role="status">今天已经学了 {todayMin} 分钟，到了家长设定的时间。休息一下眼睛吧！</div>
      )}
      <main className="content">{children}</main>
      <footer className="foot">
        <a href="/">← 回到星星闯关乐园</a>
        <button className="link" onClick={() => go('/parent')}>家长中心</button>
      </footer>
    </div>
  );
}
