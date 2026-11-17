/**
 * 页面跳转抽象：页面组件只调用 useNav()，不直接依赖具体路由库。
 * - APP（安卓/iOS/网站）：由 Expo Router 实现（见 src/app/_layout.tsx）。
 * - 单文件 HTML 版：由内存页面栈实现（见 src/single/App.tsx），因为 file:// 打开的网页不能改地址栏路径。
 */
import React, { createContext, useContext } from 'react';
import type { Subject } from '@/lesson/types';

export type Route =
  | { name: 'home' }
  | { name: 'subject'; subject: Subject }
  | { name: 'lesson'; id: string; resume?: boolean }
  | { name: 'parent' }
  /** 今日复习；带 subject = 错题本里重做这一科的错题（V2.21） */
  | { name: 'review'; subject?: Subject; grade?: number }
  /** 错题本（V2.21） */
  | { name: 'mistakes'; subject: Subject }
  /** 家长中心 · 教材资源库（V4.0） */
  | { name: 'textbooks' }
  /** 题库单元（bank:单元id）或口算（oral:主题id）练习 */
  | { name: 'practice'; id: string }
  /** 问问星星宝（AI 老师） */
  | { name: 'teacher' }
  /** 我的知识小地图（一年级数学） */
  | { name: 'map' }
  /** 找原因小游戏：前置知识诊断 */
  | { name: 'diagnose'; kp: string }
  /** 家长中心：试卷生成 */
  | { name: 'exam' }
  /** 家长中心：拍照错题（V4.1） */
  | { name: 'photo' }
  /** 每日挑战（思维题） */
  | { name: 'challenge' }
  /** 英语单词卡（V2.18） */
  | { name: 'words' }
  /** 游戏乐园（V2.19）与某一个游戏 */
  | { name: 'games' }
  | { name: 'game'; id: 'kitchen' | 'fish' | 'bubble' };

export interface Nav {
  push: (route: Route) => void;
  /** 返回上一页；没有上一页时回首页 */
  back: () => void;
  /** 回到首页（清空中间页面） */
  home: () => void;
}

const NavContext = createContext<Nav | null>(null);

export function NavProvider({ nav, children }: { nav: Nav; children: React.ReactNode }) {
  return <NavContext.Provider value={nav}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav 必须在 NavProvider 内使用');
  return nav;
}
