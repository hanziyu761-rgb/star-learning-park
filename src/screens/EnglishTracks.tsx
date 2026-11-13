/**
 * 英语乐园：一、二年级启蒙的三条主线（交流 / 拼读 / 分级阅读），每条主线一张卡片、一行一课。
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { lessonsFor } from '@/content';
import { STARTER_NOTE, TRACK_INFO, type EnglishTrack } from '@/content/englishStarter';
import { Stars, tapFeedback } from '@/components/ui';
import { DisplayTextView } from '@/components/PinyinText';
import { useNav } from '@/nav/Nav';
import type { ProgressState } from '@/progress/model';
import { colors, radius, shadow, space, subjectTheme } from '@/theme';
import { contentGrade } from '@/progress/grade';

const TRACKS: EnglishTrack[] = ['talk', 'phonics', 'reading'];

export function trackProgress(state: ProgressState, track: EnglishTrack) {
  const lessons = lessonsFor('english').filter((l) => l.track === track);
  const done = lessons.filter((l) => (state.lessons[l.id]?.completedCount ?? 0) > 0);
  const next = lessons.find((l) => !(state.lessons[l.id]?.completedCount ?? 0));
  return { total: lessons.length, done: done.length, next, lessons };
}

export function EnglishTracks({ state }: { state: ProgressState }) {
  const nav = useNav();
  const theme = subjectTheme.english;
  return (
    <View style={{ gap: space.lg }} testID="english-tracks">
      {TRACKS.map((t) => {
        const info = TRACK_INFO[t];
        const { total, done, next, lessons } = trackProgress(state, t);
        return (
          <View key={t} style={styles.card} testID={`track-${t}`}>
            <View style={styles.head}>
              <Text style={styles.headEmoji}>{info.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {info.name} {info.en}
                </Text>
                <Text style={styles.sub}>配合：{info.book}</Text>
              </View>
              <Text style={[styles.count, { color: theme.color }]} testID={`track-progress-${t}`}>
                {done}/{total}
              </Text>
            </View>
            {lessons.map((l) => {
              const p = state.lessons[l.id];
              const isNext = next?.id === l.id;
              const active = state.active?.lessonId === l.id;
              return (
                <Pressable
                  key={l.id}
                  testID={`start-${l.id}`}
                  accessibilityRole="button"
                  onPress={() => {
                    tapFeedback();
                    nav.push({ name: 'lesson', id: l.id, resume: active });
                  }}
                  style={[styles.row, isNext && { borderColor: theme.color, backgroundColor: theme.soft }]}
                >
                  <Text style={styles.rowEmoji}>{p?.completedCount ? '✅' : l.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{typeof l.title === 'string' ? l.title : ''}</Text>
                    <Stars value={p?.bestStars ?? 0} size={16} />
                  </View>
                  <Text style={[styles.go, { color: theme.color }]}>
                    {active ? '继续' : p?.completedCount ? '再学' : isNext ? '开始' : '学习'} ▶
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
      {/* 版权说明：只留这一句，放在最下面 */}
      <Text style={styles.note}>{STARTER_NOTE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.md, gap: space.sm, ...shadow },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs },
  headEmoji: { fontSize: 36 },
  title: { fontSize: 20, fontWeight: '900', color: colors.text },
  sub: { fontSize: 12, color: colors.textSoft },
  count: { fontSize: 18, fontWeight: '900' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  rowEmoji: { fontSize: 24 },
  rowTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  go: { fontSize: 15, fontWeight: '800' },
});

/** 语文“阅读小屋”（V2.10）：原创带拼音短文，一行一篇 */
export function ReadingHouse({ state }: { state: ProgressState }) {
  const nav = useNav();
  const theme = subjectTheme.chinese;
  // 按家长设的年级显示这一年级的短文（V2.14）
  const grade = contentGrade(state.settings.grade);
  const lessons = lessonsFor('chinese').filter((l) => l.track === 'zhread' && (l.grade ?? 1) === grade);
  const done = lessons.filter((l) => (state.lessons[l.id]?.completedCount ?? 0) > 0).length;
  return (
    <View style={styles.card} testID="reading-house">
      <View style={styles.head}>
        <Text style={styles.headEmoji}>🏡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>阅读小屋</Text>
        </View>
        <Text style={[styles.count, { color: theme.color }]} testID="reading-progress">
          {done}/{lessons.length}
        </Text>
      </View>
      {lessons.map((l) => {
        const p = state.lessons[l.id];
        return (
          <Pressable
            key={l.id}
            testID={`start-${l.id}`}
            accessibilityRole="button"
            onPress={() => {
              tapFeedback();
              nav.push({ name: 'lesson', id: l.id });
            }}
            style={styles.row}
          >
            <Text style={styles.rowEmoji}>{p?.completedCount ? '✅' : l.emoji}</Text>
            <View style={{ flex: 1 }}>
              <DisplayTextView text={l.title} size={18} />
              <Stars value={p?.bestStars ?? 0} size={16} />
            </View>
            <Text style={[styles.go, { color: theme.color }]}>{p?.completedCount ? '再读' : '读一读'} ▶</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
