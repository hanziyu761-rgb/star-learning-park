/**
 * 首页 · 连续打卡（V5.4）：连续学习天数、最近 7 天、奖章。只来自真实学习记录。
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DisplayTextView } from '@/components/PinyinText';
import { zh } from '@/content/zh';
import { useProgress } from '@/progress/ProgressContext';
import { STREAK_BADGES, streak } from '@/progress/weekly';
import { colors, radius, space, themed } from '@/theme';

const BADGE_EMOJI: Record<number, string> = { 3: '🥉', 7: '🥈', 14: '🥇', 30: '🏆', 100: '👑' };
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

export function StreakCard({ now }: { now: number }) {
  const { state } = useProgress();
  const s = streak(state, now);
  const dayOfWeek = (i: number) => WEEK[new Date(now - (6 - i) * 86400000).getDay()];
  return (
    <View style={styles.card} testID="streak-card">
      <View style={styles.head}>
        <Text style={styles.fire}>{s.current ? '🔥' : '🌱'}</Text>
        <View style={{ flex: 1 }}>
          <DisplayTextView
            text={s.current ? zh(`连续学了${s.current}天`, 'lián xù xué le tiān') : zh('今天开始学吧', 'jīn tiān kāi shǐ xué ba')}
            size={22}
          />
        </View>
        <Text style={styles.badges} testID="streak-badges">
          {STREAK_BADGES.map((b) => (s.badges.includes(b) ? BADGE_EMOJI[b] : '')).join('')}
        </Text>
      </View>
      <View style={styles.week}>
        {s.last7.map((on, i) => (
          <View key={i} style={styles.dayCol}>
            <View style={[styles.dot, on && styles.dotOn, i === 6 && styles.today]} testID={`streak-day-${i}${on ? '-on' : ''}`}>
              <Text style={[styles.check, { color: on ? colors.onAccent : colors.textFaint }]}>{on ? '✓' : ''}</Text>
            </View>
            <Text style={styles.dayText}>{i === 6 ? '今' : dayOfWeek(i)}</Text>
          </View>
        ))}
      </View>
      {s.best >= 3 ? <Text style={styles.small}>{`最长连续 ${s.best} 天`}</Text> : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.md },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    fire: { fontSize: 32, color: colors.text },
    badges: { fontSize: 24, color: colors.text },
    week: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCol: { alignItems: 'center', gap: 4 },
    dot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
    dotOn: { backgroundColor: colors.orange },
    today: { borderWidth: 2, borderColor: colors.primary },
    check: { fontSize: 16, fontWeight: '700' },
    dayText: { fontSize: 13, color: colors.textSoft },
    small: { fontSize: 13, color: colors.textSoft },
  }),
);
