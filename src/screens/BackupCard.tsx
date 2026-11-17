/**
 * 家长中心 · 设置 · 学习记录备份（V5.4）：导出所有孩子的学习记录（分享或下载一个文件）；
 * 在新手机上选这个文件导入；导入前显示内容并要确认，导入时自动留一份原来的记录，可以撤销。
 */
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { Card, SectionTitle } from '@/components/ui';
import { GRADE_CN } from '@/progress/grade';
import { BACKUP_ERROR, backupSummary, makeBackup, parseBackup, type Backup } from '@/progress/backup';
import { pickBackupText, shareBackupFile } from '@/progress/backupIO';
import { useProgress } from '@/progress/ProgressContext';
import { dayKey } from '@/progress/srs';
import { APP_VERSION } from '@/version';
import { colors, radius, space, themed } from '@/theme';

export function BackupCard() {
  const { exportAll, restoreAll, undoRestore } = useProgress();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [confirm, setConfirm] = useState(false);

  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await f();
    } catch (e) {
      setMsg({ ok: false, text: `没有完成：${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <SectionTitle>💾 学习记录备份 · 换手机</SectionTitle>
      <Text style={styles.small}>
        把这台手机上所有孩子的学习记录（含错题本、星星、设置）存成一个文件，可以发到微信“文件传输助手”或存到网盘。换手机后在新手机上点“从备份导入”。会员和手机绑定，不在备份里。
      </Text>
      <Pressable
        onPress={() =>
          run(async () => {
            const all = await exportAll();
            const now = Date.now();
            await shareBackupFile(`linheng-backup-${dayKey(now)}.json`, makeBackup(all.profiles, all.data, now, APP_VERSION));
            setMsg({ ok: true, text: `已导出 ${all.profiles.list.length} 个孩子的学习记录。` });
          })
        }
        style={styles.btn}
        accessibilityRole="button"
        testID="backup-export"
      >
        {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.btnText}>导出学习记录</Text>}
      </Pressable>
      <Pressable
        onPress={() =>
          run(async () => {
            setPending(null);
            setConfirm(false);
            const text = await pickBackupText();
            if (text === null) return;
            const r = parseBackup(text);
            if (!r.ok) setMsg({ ok: false, text: BACKUP_ERROR[r.reason] });
            else setPending(r.backup);
          })
        }
        style={[styles.btn, styles.btnAlt]}
        accessibilityRole="button"
        testID="backup-import"
      >
        <Text style={styles.btnAltText}>从备份导入</Text>
      </Pressable>

      {pending ? (
        <View style={styles.box} testID="backup-preview">
          <Text style={styles.label}>{`备份时间：${new Date(pending.at).toLocaleString('zh-CN')}`}</Text>
          {backupSummary(pending).map((c) => (
            <Text key={c.id} style={styles.line}>{`${c.emoji} ${c.name} · ${GRADE_CN[c.grade]}年级 · 做过 ${c.questions} 道题 · ${c.stars} 颗星`}</Text>
          ))}
          <Text style={[styles.small, { color: colors.wrong }]}>导入会用备份替换这台手机上现在的全部学习记录。导入前会自动留一份现在的记录，导入错了可以点“撤销上次导入”。</Text>
          <Pressable
            onPress={() => {
              if (!confirm) {
                setConfirm(true);
                return;
              }
              run(async () => {
                await restoreAll(pending);
                setPending(null);
                setConfirm(false);
                setMsg({ ok: true, text: '导入完成，可以接着学了。' });
              });
            }}
            style={[styles.btn, confirm && { backgroundColor: colors.wrong }]}
            accessibilityRole="button"
            testID="backup-confirm"
          >
            <Text style={styles.btnText}>{confirm ? '确认替换' : '用这个备份替换现在的记录'}</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() =>
          run(async () => {
            const ok = await undoRestore();
            setMsg(ok ? { ok: true, text: '已换回导入前的记录。' } : { ok: false, text: '没有可以撤销的导入。' });
          })
        }
        style={styles.link}
        accessibilityRole="button"
        testID="backup-undo"
      >
        <Text style={styles.linkText}>撤销上次导入</Text>
      </Pressable>
      {msg ? (
        <Text style={[styles.small, { color: msg.ok ? colors.correct : colors.wrong }]} testID="backup-msg">
          {msg.text}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    small: { fontSize: 13, color: colors.textSoft, lineHeight: 19, marginTop: 4 },
    label: { fontSize: 15, fontWeight: '600', color: colors.text },
    line: { fontSize: 15, color: colors.text },
    box: { marginTop: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.parentSoft, gap: space.xs },
    btn: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.parent, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
    btnAlt: { backgroundColor: colors.parentSoft },
    btnText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
    btnAltText: { color: colors.parent, fontSize: 16, fontWeight: '600' },
    link: { alignSelf: 'flex-start', paddingVertical: space.sm },
    linkText: { color: colors.textSoft, fontSize: 14, textDecorationLine: 'underline' },
  }),
);
