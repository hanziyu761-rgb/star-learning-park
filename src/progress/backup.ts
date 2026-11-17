/**
 * 学习记录备份与换手机（V5.4，纯函数）：把这台手机上所有孩子的学习记录和孩子名单存成一个文件；
 * 在新手机上导入就能接着学。导入前逐个孩子用 parseProgress 检查（旧版本的记录也会照常迁移）。
 * 会员不在备份里（会员和手机绑定，换手机要按新设备号开通）。
 */
import { parseProgress, type ProgressState } from './model';
import { parseProfiles, type ProfileIndex } from './profiles';

export const BACKUP_APP = 'linheng-learning-park';
/** 导入前自动留一份现在的记录，导入错了可以撤销 */
export const BEFORE_IMPORT_KEY = 'slp.backup.before-import';

export interface Backup {
  app: typeof BACKUP_APP;
  kind: 'backup';
  v: 1;
  at: number;
  appVersion: string;
  profiles: ProfileIndex;
  data: Record<string, ProgressState>;
}

export function makeBackup(profiles: ProfileIndex, data: Record<string, ProgressState>, now: number, appVersion: string): string {
  const b: Backup = { app: BACKUP_APP, kind: 'backup', v: 1, at: now, appVersion, profiles, data };
  return JSON.stringify(b);
}

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false; reason: 'not-json' | 'not-ours' | 'bad-child' | 'empty' };

export function parseBackup(text: string): ParsedBackup {
  let x: Partial<Backup>;
  try {
    x = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not-json' };
  }
  if (!x || x.app !== BACKUP_APP || x.kind !== 'backup' || x.v !== 1 || typeof x.data !== 'object' || !x.data) return { ok: false, reason: 'not-ours' };
  const profiles = parseProfiles(JSON.stringify(x.profiles ?? null));
  const data: Record<string, ProgressState> = {};
  for (const p of profiles.list) {
    const raw = x.data[p.id];
    if (raw === undefined) continue;
    const st = parseProgress(JSON.stringify(raw));
    if (!st) return { ok: false, reason: 'bad-child' };
    data[p.id] = st;
  }
  // 名单里有、但备份里没有记录的孩子不导入
  const list = profiles.list.filter((p) => data[p.id]);
  if (!list.length) return { ok: false, reason: 'empty' };
  const active = list.some((p) => p.id === profiles.active) ? profiles.active : list[0].id;
  return { ok: true, backup: { app: BACKUP_APP, kind: 'backup', v: 1, at: Number(x.at) || 0, appVersion: String(x.appVersion ?? ''), profiles: { v: 1, active, list }, data } };
}

/** 给家长看的内容摘要：每个孩子的名字、年级、做过多少题、星星 */
export function backupSummary(b: Backup): { id: string; name: string; emoji: string; grade: number; questions: number; stars: number }[] {
  return b.profiles.list.map((p) => {
    const s = b.data[p.id];
    return { id: p.id, name: p.name, emoji: p.emoji, grade: s.settings.grade, questions: s.results.length, stars: s.totalStars };
  });
}

export const BACKUP_ERROR: Record<Exclude<ParsedBackup, { ok: true }>['reason'], string> = {
  'not-json': '这个文件不是学习记录备份（打不开）。请选择从“导出学习记录”得到的 .json 文件。',
  'not-ours': '这个文件不是林亨学习乐园的学习记录备份。',
  'bad-child': '备份文件里有记录损坏了，没有导入。',
  empty: '备份文件里没有学习记录。',
};
