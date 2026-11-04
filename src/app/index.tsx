import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getLesson, lessonsFor, LESSONS } from '@/content';
import { plainText, zh } from '@/content/zh';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, SpeakerButton, StarBadge, tapFeedback } from '@/components/ui';
import type { Subject } from '@/lesson/types';
import { useProgress } from '@/progress/ProgressContext';
import { completedSubjectToday, SUBJECTS } from '@/progress/stats';
import { speak } from '@/speech/speech';
import { colors, radius, shadow, space, subjectTheme } from '@/theme';

const SUBJECT_LABEL: Record<Subject, { text: ReturnType<typeof zh>; say: string }> = {
  math: { text: zh('数学', 'shù xué'), say: '数学' },
  chinese: { text: zh('语文', 'yǔ wén'), say: '语文' },
  english: { text: zh('英语', 'yīng yǔ'), say: '英语' },
};

export default function Home() {
  const { status, state, loadProblem, saveFailed } = useProgress();
  // 打开首页时的时间，用于判断“今天”的任务
  const [now] = useState(() => Date.now());
  if (status === 'loading') return <LoadingView />;

  const active = state.active ? getLesson(state.active.lessonId) : undefined;
  const completedLessons = LESSONS.filter((l) => (state.lessons[l.id]?.completedCount ?? 0) > 0).length;
  const todayDone = SUBJECTS.filter((s) => completedSubjectToday(state, s, now)).length;

  return (
    <Screen testID="home">
      {/* 顶部：吉祥物、问候、星星 */}
      <View style={styles.top}>
        <Mascot size={84} />
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <DisplayTextView text={zh('你好！', 'nǐ hǎo')} size={26} />
          <Text style={styles.appName}>星星学习乐园</Text>
        </View>
        <StarBadge count={state.totalStars} testID="total-stars" />
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <SpeakerButton
          item={{ text: '你好，小朋友！今天想学什么？点一点下面的大按钮吧。', lang: 'zh-CN' }}
          size={52}
          color={colors.parent}
        />
      </View>

      {loadProblem ? (
        <Notice tone="warn" text="学习记录读取失败，已从新开始记录。原来的数据已在手机上另存备份，请联系开发者恢复。" />
      ) : null}
      {saveFailed ? <Notice tone="warn" text="最近一次学习记录保存失败，请检查手机存储空间。" /> : null}

      {/* 继续上次学习 */}
      {active && state.active ? (
        <Pressable
          testID="continue-card"
          accessibilityRole="button"
          onPress={() => {
            tapFeedback();
            speak({ text: '继续学习', lang: 'zh-CN' });
            router.push({ pathname: '/lesson/[id]', params: { id: active.id, resume: '1' } });
          }}
          style={[styles.continue, { borderColor: subjectTheme[active.subject].color }]}
        >
          <Text style={styles.continueEmoji}>{active.emoji}</Text>
          <View style={{ flex: 1 }}>
            <DisplayTextView text={zh('继续学习', 'jì xù xué xí')} size={22} color={subjectTheme[active.subject].color} />
            <Text style={styles.continueSub}>
              {plainText(active.title)} · 第 {state.active.stepIndex + 1}/{active.steps.length} 步
            </Text>
          </View>
          <Text style={styles.play}>▶️</Text>
        </Pressable>
      ) : null}

      {/* 三个学科入口 */}
      <View style={styles.subjects}>
        {SUBJECTS.map((s) => (
          <Pressable
            key={s}
            testID={`subject-${s}`}
            accessibilityRole="button"
            accessibilityLabel={SUBJECT_LABEL[s].say}
            onPress={() => {
              tapFeedback();
              speak({ text: SUBJECT_LABEL[s].say, lang: 'zh-CN' });
              router.push({ pathname: '/subject/[subject]', params: { subject: s } });
            }}
            style={({ pressed }) => [styles.subject, { backgroundColor: subjectTheme[s].color }, pressed && styles.pressed]}
          >
            <Text style={styles.subjectEmoji}>{subjectTheme[s].emoji}</Text>
            <DisplayTextView text={SUBJECT_LABEL[s].text} size={30} color="#fff" />
          </Pressable>
        ))}
      </View>

      {/* 今日学习任务 */}
      <View style={styles.panel} testID="today-tasks">
        <View style={styles.panelHead}>
          <DisplayTextView text={zh('今天的任务', 'jīn tiān de rèn wu')} size={22} />
          <Text style={styles.panelCount}>
            {todayDone}/{SUBJECTS.length}
          </Text>
        </View>
        {SUBJECTS.map((s) => {
          const lesson = lessonsFor(s)[0];
          const done = completedSubjectToday(state, s, now);
          return (
            <Pressable
              key={s}
              testID={`task-${s}`}
              accessibilityRole="button"
              onPress={() => lesson && router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
              style={styles.task}
            >
              <Text style={styles.taskEmoji}>{done ? '✅' : subjectTheme[s].emoji}</Text>
              <View style={{ flex: 1 }}>
                <DisplayTextView text={lesson ? lesson.title : SUBJECT_LABEL[s].text} size={20} />
              </View>
              <DisplayTextView
                text={done ? zh('完成', 'wán chéng') : zh('去学习', 'qù xué xí')}
                size={16}
                color={done ? colors.correct : colors.primary}
              />
            </Pressable>
          );
        })}
      </View>

      {/* 学习进度 */}
      <View style={styles.panel} testID="progress-panel">
        <DisplayTextView text={zh('我的进度', 'wǒ de jìn dù')} size={22} />
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${(completedLessons / LESSONS.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText} testID="lessons-completed">
          已学会 {completedLessons} / {LESSONS.length} 节课
        </Text>
      </View>

      {/* 家长入口 */}
      <BigButton
        size="md"
        emoji="🔒"
        label="家长中心"
        color={colors.parent}
        onPress={() => router.push('/parent')}
        testID="parent-entry"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  appName: { fontSize: 15, color: colors.textSoft, fontWeight: '700', marginTop: 2 },
  continue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 4,
    ...shadow,
  },
  continueEmoji: { fontSize: 44 },
  continueSub: { fontSize: 14, color: colors.textSoft, marginTop: 2 },
  play: { fontSize: 36 },
  subjects: { flexDirection: 'row', gap: space.md },
  subject: {
    flex: 1,
    aspectRatio: 0.8,
    minHeight: 130,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    ...shadow,
  },
  subjectEmoji: { fontSize: 46 },
  pressed: { transform: [{ scale: 0.95 }] },
  panel: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.lg, gap: space.sm, ...shadow },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelCount: { fontSize: 20, fontWeight: '900', color: colors.primary },
  task: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 64, borderTopWidth: 1, borderTopColor: colors.line },
  taskEmoji: { fontSize: 30 },
  barBg: { height: 18, borderRadius: radius.round, backgroundColor: '#F3E9D2', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.star, borderRadius: radius.round },
  progressText: { fontSize: 16, color: colors.textSoft, fontWeight: '700' },
});
