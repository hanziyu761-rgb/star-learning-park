/**
 * 今日复习：重做到期的错题（间隔复习）。
 * 题目直接复用课程中的原题和练习组件，结果写回同一条错题记录。
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveExercise } from '@/content/resolve';
import { zh } from '@/content/zh';
import { FeedbackBar } from '@/components/FeedbackBar';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView } from '@/components/Screen';
import { BigButton, Stars } from '@/components/ui';
import type { ExerciseOutcome } from '@/exercises/common';
import { ExerciseView } from '@/exercises/ExerciseView';
import { AskTeacher } from '@/ai/AskTeacher';
import { langForSubject, type FeedbackMessage } from '@/lesson/feedback';
import { useNav } from '@/nav/Nav';
import { reviewQueue, type ReviewItem } from '@/progress/plan';
import { useProgress } from '@/progress/ProgressContext';
import { speak, stopSpeaking } from '@/speech/speech';
import { colors, radius, space, subjectTheme } from '@/theme';

export default function ReviewScreen() {
  const { status } = useProgress();
  if (status === 'loading') return <LoadingView />;
  return <ReviewSession />;
}

function ReviewSession() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useProgress();
  // 进入页面时确定本轮题目，作答过程中不再变化
  const [queue] = useState<ReviewItem[]>(() => reviewQueue(state, resolveExercise, Date.now()));
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [firstTry, setFirstTry] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (queue.length === 0) speak({ text: '今天没有要复习的题目，你真棒！', lang: 'zh-CN' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (queue.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + space.md, backgroundColor: colors.bg }]} testID="review-empty">
        <View style={styles.headerWrap}>
          <Header title={zh('今日复习', 'jīn rì fù xí')} onBack={nav.back} />
        </View>
        <View style={styles.center}>
          <Mascot size={130} mood="cheer" />
          <DisplayTextView text={zh('今天没有要复习的题目', 'jīn tiān méi yǒu yào fù xí de tí mù')} size={24} />
          <DisplayTextView text={zh('你真棒！', 'nǐ zhēn bàng')} size={32} color={colors.correct} />
        </View>
      </View>
    );
  }

  const item = queue[index];
  const theme = subjectTheme[item.subject];

  const onSolved = (o: ExerciseOutcome) => {
    dispatch({
      type: 'exercise/result',
      lessonId: item.mistake.lessonId,
      exerciseId: item.exercise.id,
      subject: item.subject,
      skill: item.exercise.skill,
      firstTryCorrect: o.firstTryCorrect,
      attempts: o.attempts,
      now: Date.now(),
      source: 'review',
    });
    if (o.firstTryCorrect) setFirstTry((n) => n + 1);
    setDone(true);
  };

  const next = () => {
    stopSpeaking();
    setFeedback(null);
    setDone(false);
    if (index >= queue.length - 1) {
      dispatch({ type: 'review/complete', now: Date.now(), count: queue.length, firstTryCorrect: firstTry });
      speak({ text: '复习完成，奖励你一颗星星！', lang: 'zh-CN' });
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  if (finished) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + space.xl }]} testID="review-summary">
        <Mascot size={130} mood="cheer" />
        <DisplayTextView text={zh('复习完成！', 'fù xí wán chéng')} size={36} color={colors.correct} />
        <Stars value={1} max={1} size={56} />
        <Text style={styles.summary} testID="review-score">
          一次答对 {firstTry} / {queue.length} 题
        </Text>
        <BigButton emoji="🏠" label={zh('回首页', 'huí shǒu yè')} onPress={nav.home} style={{ alignSelf: 'stretch' }} testID="review-home" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm, backgroundColor: theme.soft }]} testID="review-screen">
      <View style={styles.headerWrap}>
        <Header
          title={zh('今日复习', 'jīn rì fù xí')}
          onBack={nav.back}
          right={
            <Text style={styles.count} testID="review-progress">
              {index + 1}/{queue.length}
            </Text>
          }
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.from}>
          {theme.emoji} 来自：{item.source}
        </Text>
        <ExerciseView
          key={item.mistake.key}
          exercise={item.exercise}
          lang={langForSubject(item.subject)}
          onFeedback={setFeedback}
          onSolved={onSolved}
        />
        <AskTeacher key={item.mistake.key} exercise={item.exercise} subject={item.subject} solved={done} />
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <FeedbackBar message={feedback} />
        <BigButton
          size="md"
          emoji={index >= queue.length - 1 ? '🏁' : '▶️'}
          label={index >= queue.length - 1 ? zh('完成', 'wán chéng') : zh('继续', 'jì xù')}
          color={theme.color}
          disabled={!done}
          onPress={next}
          testID="review-next"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: { paddingHorizontal: space.lg, alignSelf: 'stretch' },
  content: { padding: space.lg, gap: space.md, width: '100%', maxWidth: 720, alignSelf: 'center' },
  from: { fontSize: 14, color: colors.textSoft, textAlign: 'center' },
  count: { fontSize: 18, fontWeight: '800', color: colors.textSoft },
  bottom: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm, backgroundColor: 'rgba(255,255,255,0.7)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: space.xl, backgroundColor: colors.bg },
  summary: { fontSize: 20, fontWeight: '700', color: colors.text, backgroundColor: '#fff', borderRadius: radius.lg, padding: space.lg },
});
