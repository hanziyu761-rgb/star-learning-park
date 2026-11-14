import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { lessonsFor } from '@/content';
import { zh } from '@/content/zh';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, Stars } from '@/components/ui';
import type { Subject } from '@/lesson/types';
import { openCount } from '@/mistakes/book';
import { useNav } from '@/nav/Nav';
import { NEXT_LABEL, nextUp } from '@/progress/nextUp';
import { useProgress } from '@/progress/ProgressContext';
import { BankSection, GraphicsSection, JuniorKpSection, OralSection, WriteSection } from './PracticeSections';
import { contentGrade } from '@/progress/grade';
import { EnglishTracks, ReadingHouse } from './EnglishTracks';
import { GAME_BY_ID } from '@/games/common';
import { colors, radius, shadow, space, subjectTheme, themed } from '@/theme';

const GAME_OF = { math: 'kitchen', chinese: 'fish', english: 'bubble' } as const;

const TITLES: Record<Subject, ReturnType<typeof zh>> = {
  math: zh('数学乐园', 'shù xué lè yuán'),
  chinese: zh('语文乐园', 'yǔ wén lè yuán'),
  english: zh('英语乐园', 'yīng yǔ lè yuán'),
};

function isSubject(v: unknown): v is Subject {
  return v === 'math' || v === 'chinese' || v === 'english';
}

export default function SubjectScreen({ subject }: { subject: string | undefined }) {
  const nav = useNav();
  const { status, state } = useProgress();
  const goHome = nav.back;
  const [now] = useState(() => Date.now());
  // 初中（V5.2）：一年级的精做课程收起来，点一下再展开
  const [showPrimary, setShowPrimary] = useState(false);

  if (status === 'loading') return <LoadingView />;
  if (!isSubject(subject)) {
    return (
      <Screen>
        <Header title="找不到这个学科" onBack={goHome} />
        <Notice tone="warn" text="链接地址有误，请返回首页重新选择。" />
      </Screen>
    );
  }

  const theme = subjectTheme[subject];
  // 英语启蒙课按三条主线单独展示
  const lessons = lessonsFor(subject).filter((l) => !l.track);
  const junior = contentGrade(state.settings.grade) >= 7;
  const wrong = openCount(state, subject);
  const next = nextUp(state, subject, now);

  return (
    <Screen bg={theme.soft} testID={`subject-screen-${subject}`}>
      <Header title={TITLES[subject]} onBack={goHome} />
      {/* 接着学：这一科下一步该学的内容（V4.2），不再总是把学过的课放在最上面 */}
      {next ? (
        <View style={styles.card} testID={`next-${subject}`}>
          <View style={styles.cardTop}>
            <Text style={styles.emoji}>{next.emoji}</Text>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <DisplayTextView text={next.title} size={26} />
            </View>
          </View>
          <BigButton
            emoji="▶️"
            label={NEXT_LABEL[next.kind]}
            color={theme.color}
            onPress={() => nav.push(next.route)}
            testID={`next-go-${subject}`}
          />
        </View>
      ) : null}
      <View style={styles.tiles}>
        <Pressable
          onPress={() => nav.push({ name: 'game', id: GAME_OF[subject] })}
          style={styles.tile}
          accessibilityRole="button"
          accessibilityLabel={`游戏：${GAME_BY_ID[GAME_OF[subject]].namePlain}`}
          testID={`subject-game-${subject}`}
        >
          <Text style={styles.tileEmoji}>{GAME_BY_ID[GAME_OF[subject]].emoji}</Text>
          <Text style={styles.tileText}>{GAME_BY_ID[GAME_OF[subject]].namePlain}</Text>
        </Pressable>
        <Pressable
          onPress={() => nav.push({ name: 'mistakes', subject })}
          style={styles.tile}
          accessibilityRole="button"
          accessibilityLabel={`${theme.name}错题本`}
          testID={`subject-mistakes-${subject}`}
        >
          <Text style={styles.tileEmoji}>📒</Text>
          <Text style={styles.tileText}>错题本</Text>
          {wrong ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wrong}</Text>
            </View>
          ) : null}
        </Pressable>
        {subject === 'english' ? (
          <Pressable onPress={() => nav.push({ name: 'words' })} style={styles.tile} accessibilityRole="button" accessibilityLabel="单词卡" testID="words-entry">
            <Text style={styles.tileEmoji}>🃏</Text>
            <Text style={styles.tileText}>单词卡</Text>
          </Pressable>
        ) : null}
      </View>
      <JuniorKpSection subject={subject} state={state} />
      {subject === 'english' && !junior ? <EnglishTracks state={state} /> : null}
      {lessons.length === 0 && subject !== 'english' ? <Notice text="这个学科还没有课程。" /> : null}
      {junior ? (
        <Pressable
          onPress={() => setShowPrimary((v) => !v)}
          style={styles.row}
          accessibilityRole="button"
          testID="primary-toggle"
        >
          <Text style={styles.rowEmoji}>🎒</Text>
          <Text style={[styles.pillText, { flex: 1, color: colors.text }]}>
            {subject === 'english' ? '小学英语启蒙课' : subject === 'math' ? '小学一年级精做课程、图形乐园' : '小学一年级精做课程'}（{showPrimary ? '收起' : '展开'}）
          </Text>
        </Pressable>
      ) : null}
      {subject === 'english' && junior && showPrimary ? <EnglishTracks state={state} /> : null}
      {(junior && !showPrimary ? [] : lessons).map((lesson) => {
        const p = state.lessons[lesson.id];
        const isActive = state.active?.lessonId === lesson.id;
        return (
          <View key={lesson.id} style={styles.row} testID={`lesson-card-${lesson.id}`}>
            <Text style={styles.rowEmoji}>{lesson.emoji}</Text>
            <View style={{ flex: 1, alignItems: 'flex-start', gap: 2 }}>
              <DisplayTextView text={lesson.title} size={20} />
              <Stars value={p?.bestStars ?? 0} size={16} />
            </View>
            {isActive ? (
              <Pressable
                onPress={() => nav.push({ name: 'lesson', id: lesson.id, resume: true })}
                style={[styles.pill, { backgroundColor: theme.color }]}
                accessibilityRole="button"
                accessibilityLabel="继续学习"
                testID={`resume-${lesson.id}`}
              >
                <Text style={styles.pillText}>继续</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => nav.push({ name: 'lesson', id: lesson.id })}
              style={[styles.pill, isActive || p?.completedCount ? styles.pillGhost : { backgroundColor: theme.color }]}
              accessibilityRole="button"
              accessibilityLabel={p?.completedCount ? '再学一次' : '开始学习'}
              testID={`start-${lesson.id}`}
            >
              <Text style={[styles.pillText, isActive || p?.completedCount ? { color: theme.color } : null]}>
                {p?.completedCount ? '再学' : isActive ? '重学' : '开始'}
              </Text>
            </Pressable>
          </View>
        );
      })}
      {subject === 'chinese' ? <ReadingHouse state={state} /> : null}
      {subject === 'chinese' ? <WriteSection state={state} /> : null}
      {subject === 'math' && (!junior || showPrimary) ? <GraphicsSection state={state} /> : null}
      {subject === 'math' ? <OralSection state={state} /> : null}
      <BankSection subject={subject} state={state} />
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  tiles: { flexDirection: 'row', gap: space.md },
  tile: {
    flex: 1,
    minHeight: 92,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: space.sm,
    ...shadow,
  },
  tileEmoji: { fontSize: 34, color: colors.text },
  tileText: { fontSize: 16, fontWeight: '600', color: colors.text },
  badge: { position: 'absolute', top: 8, right: 8, minWidth: 26, height: 26, borderRadius: 13, backgroundColor: colors.wrong, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.md, ...shadow },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  emoji: { fontSize: 56, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, ...shadow },
  rowEmoji: { fontSize: 36, color: colors.text },
  pill: { minHeight: 44, minWidth: 64, paddingHorizontal: space.md, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  pillGhost: { backgroundColor: colors.cardAlt },
  pillText: { fontSize: 16, fontWeight: '700', color: colors.onAccent },
}));
