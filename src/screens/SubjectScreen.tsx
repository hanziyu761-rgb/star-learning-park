import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { lessonsFor } from '@/content';
import { zh } from '@/content/zh';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, Stars } from '@/components/ui';
import type { Subject } from '@/lesson/types';
import { openCount } from '@/mistakes/book';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { BankSection, GraphicsSection, OralSection, WriteSection } from './PracticeSections';
import { EnglishTracks, ReadingHouse } from './EnglishTracks';
import { GAME_BY_ID } from '@/games/common';
import { colors, radius, shadow, space, subjectTheme } from '@/theme';

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
  const wrong = openCount(state, subject);

  return (
    <Screen bg={theme.soft} testID={`subject-screen-${subject}`}>
      <Header title={TITLES[subject]} onBack={goHome} />
      <Pressable
        onPress={() => nav.push({ name: 'game', id: GAME_OF[subject] })}
        style={styles.gameEntry}
        accessibilityRole="button"
        testID={`subject-game-${subject}`}
      >
        <Text style={styles.wordEmoji}>{GAME_BY_ID[GAME_OF[subject]].emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.gameTitle}>游戏：{GAME_BY_ID[GAME_OF[subject]].namePlain}</Text>
          <Text style={styles.gameSub}>{GAME_BY_ID[GAME_OF[subject]].intro}</Text>
        </View>
        <Text style={styles.gameGo}>▶️</Text>
      </Pressable>
      <Pressable
        onPress={() => nav.push({ name: 'mistakes', subject })}
        style={[styles.bookEntry, { borderColor: theme.color }]}
        accessibilityRole="button"
        testID={`subject-mistakes-${subject}`}
      >
        <Text style={styles.wordEmoji}>📒</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.gameTitle, { color: theme.color }]}>{theme.name}错题本</Text>
          <Text style={styles.gameSub}>{wrong ? `还有 ${wrong} 道题没掌握 · 可以重做、打印` : '还没有错题 · 做错的题会自动记在这里'}</Text>
        </View>
        {wrong ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{wrong}</Text>
          </View>
        ) : null}
        <Text style={[styles.gameGo, { color: theme.color }]}>›</Text>
      </Pressable>
      {subject === 'english' ? (
        <Pressable onPress={() => nav.push({ name: 'words' })} style={styles.wordEntry} accessibilityRole="button" testID="words-entry">
          <Text style={styles.wordEmoji}>🃏</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.wordTitle}>单词卡 Word Cards</Text>
            <Text style={styles.wordSub}>翻卡片记单词 · 生词本 · 听写（启蒙 + 三～六年级）</Text>
          </View>
          <Text style={styles.wordGo}>›</Text>
        </Pressable>
      ) : null}
      {subject === 'english' ? <EnglishTracks state={state} /> : null}
      {lessons.length === 0 && subject !== 'english' ? <Notice text="这个学科还没有课程。" /> : null}
      {lessons.map((lesson) => {
        const p = state.lessons[lesson.id];
        const isActive = state.active?.lessonId === lesson.id;
        return (
          <View key={lesson.id} style={styles.card} testID={`lesson-card-${lesson.id}`}>
            <View style={styles.cardTop}>
              <Text style={styles.emoji}>{lesson.emoji}</Text>
              <View style={{ flex: 1, alignItems: 'flex-start', gap: 4 }}>
                <DisplayTextView text={lesson.title} size={26} />
                <Stars value={p?.bestStars ?? 0} size={22} />
                <Text style={styles.meta}>约 {lesson.estimatedMinutes} 分钟</Text>
              </View>
            </View>
            {isActive ? (
              <BigButton
                emoji="▶️"
                label={zh('继续学习', 'jì xù xué xí')}
                color={theme.color}
                onPress={() => nav.push({ name: 'lesson', id: lesson.id, resume: true })}
                testID={`resume-${lesson.id}`}
              />
            ) : null}
            <BigButton
              emoji={p?.completedCount ? '🔁' : '🚀'}
              label={p?.completedCount ? zh('再学一次', 'zài xué yí cì') : zh('开始学习', 'kāi shǐ xué xí')}
              color={isActive ? colors.textSoft : theme.color}
              size={isActive ? 'md' : 'lg'}
              onPress={() => nav.push({ name: 'lesson', id: lesson.id })}
              testID={`start-${lesson.id}`}
            />
          </View>
        );
      })}
      {subject !== 'english' ? <Text style={styles.more}>更多精做课程正在制作中</Text> : null}
      {subject === 'chinese' ? <ReadingHouse state={state} /> : null}
      {subject === 'chinese' ? <WriteSection state={state} /> : null}
      {subject === 'math' ? <GraphicsSection state={state} /> : null}
      {subject === 'math' ? <OralSection state={state} /> : null}
      <BankSection subject={subject} state={state} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bookEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: '#FFFDF5',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: space.md,
  },
  badge: { minWidth: 30, height: 30, borderRadius: 15, backgroundColor: colors.wrong, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  gameEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: '#E8772E',
    padding: space.md,
    minHeight: 76,
  },
  gameTitle: { fontSize: 19, fontWeight: '900', color: '#E8772E' },
  gameSub: { fontSize: 13, color: colors.textSoft, marginTop: 2 },
  gameGo: { fontSize: 26 },
  wordEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: '#1E4D3A',
    borderRadius: radius.lg,
    padding: space.md,
    minHeight: 84,
  },
  wordEmoji: { fontSize: 40 },
  wordTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  wordSub: { fontSize: 13, color: '#D6E6DC', marginTop: 2 },
  wordGo: { fontSize: 36, color: '#F2C14E', fontWeight: '900' },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.lg, gap: space.md, ...shadow },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  emoji: { fontSize: 56 },
  meta: { fontSize: 14, color: colors.textSoft },
  more: { textAlign: 'center', color: colors.textSoft, fontSize: 14 },
});
