import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { lessonsFor } from '@/content';
import { zh } from '@/content/zh';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, Stars } from '@/components/ui';
import type { Subject } from '@/lesson/types';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { BankSection, OralSection } from './PracticeSections';
import { colors, radius, shadow, space, subjectTheme } from '@/theme';

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
  const lessons = lessonsFor(subject);

  return (
    <Screen bg={theme.soft} testID={`subject-screen-${subject}`}>
      <Header title={TITLES[subject]} onBack={goHome} />
      {lessons.length === 0 ? <Notice text="这个学科还没有课程。" /> : null}
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
      <Text style={styles.more}>更多精做课程正在制作中</Text>
      {subject === 'math' ? <OralSection state={state} /> : null}
      <BankSection subject={subject} state={state} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.lg, gap: space.md, ...shadow },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  emoji: { fontSize: 56 },
  meta: { fontSize: 14, color: colors.textSoft },
  more: { textAlign: 'center', color: colors.textSoft, fontSize: 14 },
});
