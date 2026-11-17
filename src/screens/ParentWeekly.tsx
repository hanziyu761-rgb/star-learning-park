/**
 * 家长中心 · 本周小结（V5.4）：最近 7 天和之前 7 天比较；进步、要加油的本领；错得最多的本领。只来自真实学习记录。
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui';
import { skillLabel } from '@/content';
import { useProgress } from '@/progress/ProgressContext';
import { streak, weekly } from '@/progress/weekly';
import { colors, space, themed } from '@/theme';

const trend = (a: number, b: number) => (a > b ? '↑' : a < b ? '↓' : '');

export function WeeklyCard({ now }: { now: number }) {
  const { state } = useProgress();
  const w = weekly(state, now);
  const s = streak(state, now);
  return (
    <Card>
      <SectionTitle>📅 本周小结（最近 7 天）</SectionTitle>
      <View style={styles.grid} testID="weekly-card">
        <Stat label="学习天数" value={`${w.days} 天`} sub={`上周 ${w.prev.days} 天 ${trend(w.days, w.prev.days)}`} />
        <Stat label="学习时间" value={`${w.minutes} 分钟`} sub={`上周 ${w.prev.minutes} 分钟 ${trend(w.minutes, w.prev.minutes)}`} />
        <Stat label="做题" value={`${w.questions} 道`} sub={`上周 ${w.prev.questions} 道 ${trend(w.questions, w.prev.questions)}`} />
        <Stat
          label="一次答对"
          value={w.accuracy === null ? '—' : `${w.accuracy}%`}
          sub={`上周 ${w.prev.accuracy === null ? '—' : `${w.prev.accuracy}%`} ${w.accuracy !== null && w.prev.accuracy !== null ? trend(w.accuracy, w.prev.accuracy) : ''}`}
        />
      </View>
      <Text style={styles.line} testID="weekly-streak">{`连续学习 ${s.current} 天，最长 ${s.best} 天${s.badges.length ? `，已得奖章 ${s.badges.length} 枚` : ''}`}</Text>
      {w.improved.length ? (
        <Text style={[styles.line, { color: colors.correct }]} testID="weekly-improved">
          {`进步了：${w.improved.map((c) => `${skillLabel(c.skill)}（${c.before}% → ${c.now}%）`).join('、')}`}
        </Text>
      ) : null}
      {w.slipped.length ? (
        <Text style={[styles.line, { color: colors.wrong }]} testID="weekly-slipped">
          {`要加油：${w.slipped.map((c) => `${skillLabel(c.skill)}（${c.before}% → ${c.now}%）`).join('、')}`}
        </Text>
      ) : null}
      {w.topWrong.length ? (
        <Text style={styles.line} testID="weekly-wrong">{`这周错得最多：${w.topWrong.map(([k, n]) => `${skillLabel(k)} ${n} 次`).join('、')}`}</Text>
      ) : null}
      {!w.questions ? <Text style={styles.small}>这 7 天还没有做题记录。</Text> : null}
      <Text style={styles.small}>“进步 / 要加油”比较这 7 天和以前的一次答对率（各至少 4 道题、相差 15% 以上才列出）。</Text>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
    stat: { flexBasis: '46%', flexGrow: 1, backgroundColor: colors.parentSoft, borderRadius: 16, padding: space.md },
    value: { fontSize: 22, fontWeight: '700', color: colors.text },
    label: { fontSize: 14, color: colors.text },
    sub: { fontSize: 12, color: colors.textSoft },
    line: { fontSize: 15, color: colors.text, marginTop: space.sm, lineHeight: 22 },
    small: { fontSize: 12, color: colors.textSoft, marginTop: space.sm },
  }),
);
