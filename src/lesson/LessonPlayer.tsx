import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { zh } from '@/content/zh';
import { FeedbackBar } from '@/components/FeedbackBar';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { BigButton, Stars } from '@/components/ui';
import type { ExerciseOutcome } from '@/exercises/common';
import { ExerciseView } from '@/exercises/ExerciseView';
import { AskTeacher } from '@/ai/AskTeacher';
import { useProgress } from '@/progress/ProgressContext';
import { formatDuration } from '@/progress/stats';
import { prefetchSpeech, speak, speakablesOf, stopSpeaking } from '@/speech/speech';
import { colors, radius, space, subjectTheme } from '@/theme';
import { langForSubject, type FeedbackMessage } from './feedback';
import { DialogueStep, PictureBookStep, ReadPassageStep, RepeatStep, TeachCardsStep } from './steps/GeneralSteps';
import { CombineStep, CountDemoStep, DragBasketStep, OpenBuildStep } from './steps/MathSteps';
import type { Lesson, LessonStep } from './types';

interface Props {
  lesson: Lesson;
  resume: boolean;
  /** 中途退出（返回上一页，进度已保存） */
  onExit: () => void;
  /** 完成后回首页 */
  onHome: () => void;
}

export function LessonPlayer({ lesson, resume, onExit, onHome }: Props) {
  const { state, dispatch } = useProgress();
  const insets = useSafeAreaInsets();
  const theme = subjectTheme[lesson.subject];
  const lang = langForSubject(lesson.subject);

  const initialIndex =
    resume && state.active?.lessonId === lesson.id ? Math.min(state.active.stepIndex, lesson.steps.length - 1) : 0;
  const [index, setIndex] = useState(initialIndex);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [finished, setFinished] = useState(false);
  const started = useRef(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    dispatch({ type: 'lesson/start', lessonId: lesson.id, subject: lesson.subject, now: Date.now(), resume });
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = lesson.steps[index];
  // 提前合成这一步和后面两步的朗读，进题时不用等网络（V4.2；有预录音频的会自动跳过）
  useEffect(() => {
    prefetchSpeech(
      lesson.steps.slice(index, index + 3).flatMap((st) => [
        'title' in st ? st.title.speak : undefined,
        ...(st.kind === 'exercise' ? speakablesOf(st.exercise) : []),
      ]),
    );
  }, [lesson, index]);

  const handleDone = useCallback(
    (outcome?: ExerciseOutcome) => {
      if (outcome) {
        const exerciseId = step.kind === 'exercise' ? step.exercise.id : step.id;
        const skill = step.kind === 'exercise' ? step.exercise.skill : 'skill' in step ? step.skill : 'unknown';
        dispatch({
          type: 'exercise/result',
          lessonId: lesson.id,
          exerciseId,
          subject: lesson.subject,
          skill,
          firstTryCorrect: outcome.firstTryCorrect,
          attempts: outcome.attempts,
          now: Date.now(),
        });
      }
      setDone(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    },
    [dispatch, lesson.id, lesson.subject, step],
  );

  const next = () => {
    stopSpeaking();
    setFeedback(null);
    setDone(false);
    if (index >= lesson.steps.length - 1) {
      dispatch({ type: 'lesson/complete', lessonId: lesson.id, subject: lesson.subject, now: Date.now() });
      setFinished(true);
      return;
    }
    const n = index + 1;
    setIndex(n);
    dispatch({ type: 'lesson/step', lessonId: lesson.id, stepIndex: n, now: Date.now() });
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  if (finished) {
    return <LessonSummary lesson={lesson} onHome={onHome} />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm, backgroundColor: theme.soft }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            stopSpeaking();
            onExit();
          }}
          accessibilityRole="button"
          accessibilityLabel="退出课程，进度会保存"
          style={styles.closeBtn}
          testID="lesson-exit"
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.dots} accessibilityLabel={`第 ${index + 1} 步，共 ${lesson.steps.length} 步`}>
          {lesson.steps.map((s, i) => (
            <View
              key={s.id}
              style={[styles.dot, { backgroundColor: i < index ? theme.color : i === index ? colors.star : '#fff' }]}
            />
          ))}
        </View>
        <Text style={styles.stepNo} testID="step-no">
          {index + 1}/{lesson.steps.length}
        </Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View key={step.id} entering={FadeIn.duration(250)}>
          <StepView step={step} lang={lang} onFeedback={setFeedback} onDone={handleDone} />
          {step.kind === 'exercise' ? (
            <View style={{ marginTop: space.md }}>
              <AskTeacher key={step.id} exercise={step.exercise} subject={lesson.subject} solved={done} />
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <FeedbackBar message={feedback} />
        <BigButton
          emoji={index >= lesson.steps.length - 1 ? '🏁' : '▶️'}
          label={
            lang === 'en'
              ? index >= lesson.steps.length - 1
                ? 'Finish'
                : 'Next'
              : zh(
                  index >= lesson.steps.length - 1 ? '完成' : '继续',
                  index >= lesson.steps.length - 1 ? 'wán chéng' : 'jì xù',
                )
          }
          color={theme.color}
          size="md"
          disabled={!done}
          onPress={next}
          testID="lesson-next"
        />
      </View>
    </View>
  );
}

function StepView({
  step,
  lang,
  onFeedback,
  onDone,
}: {
  step: LessonStep;
  lang: 'zh' | 'en';
  onFeedback: (m: FeedbackMessage | null) => void;
  onDone: (o?: ExerciseOutcome) => void;
}) {
  switch (step.kind) {
    case 'count-demo':
      return <CountDemoStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'drag-basket':
      return <DragBasketStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'combine':
      return <CombineStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'open-build':
      return <OpenBuildStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'teach-cards':
      return <TeachCardsStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'repeat':
      return <RepeatStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'dialogue':
      return <DialogueStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'picture-book':
      return <PictureBookStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'read-passage':
      return <ReadPassageStep step={step} onFeedback={onFeedback} onDone={onDone} />;
    case 'exercise':
      return <ExerciseView exercise={step.exercise} lang={lang} onFeedback={onFeedback} onSolved={onDone} />;
  }
}

function LessonSummary({ lesson, onHome }: { lesson: Lesson; onHome: () => void }) {
  const { state } = useProgress();
  const insets = useSafeAreaInsets();
  const session = [...state.sessions].reverse().find((s) => s.lessonId === lesson.id);
  const theme = subjectTheme[lesson.subject];

  useEffect(() => {
    if (!session) return;
    speak(
      lesson.subject === 'english'
        ? { text: `Great job! You got ${session.stars} stars!`, lang: 'en-US' }
        : { text: `你完成了这节课，得到了${session.stars}颗星星！`, lang: 'zh-CN' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={[
        styles.summary,
        { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, backgroundColor: theme.soft },
      ]}
      testID="lesson-summary"
    >
      <Animated.View entering={ZoomIn.springify()}>
        <Mascot size={140} mood="cheer" />
      </Animated.View>
      <DisplayTextView text={zh('完成啦！', 'wán chéng la')} size={40} color={theme.color} />
      <DisplayTextView text={lesson.title} size={26} />
      {session ? (
        <>
          <Stars value={session.stars} size={52} />
          <View style={styles.summaryCard}>
            {session.exerciseCount > 0 ? (
              <Text style={styles.summaryText} testID="summary-score">
                一次答对 {session.firstTryCorrect} / {session.exerciseCount} 题
              </Text>
            ) : null}
            <Text style={styles.summaryText}>学习用时 {formatDuration(session.durationSec)}</Text>
          </View>
        </>
      ) : null}
      <BigButton
        emoji="🏠"
        label={zh('回首页', 'huí shǒu yè')}
        color={theme.color}
        onPress={onHome}
        style={{ alignSelf: 'stretch' }}
        testID="summary-home"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, gap: space.sm },
  closeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 24, fontWeight: '900', color: colors.textSoft },
  dots: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { flex: 1, height: 12, borderRadius: radius.round },
  stepNo: { fontSize: 16, fontWeight: '800', color: colors.textSoft, minWidth: 40, textAlign: 'right' },
  content: { padding: space.lg, paddingBottom: space.xxl, width: '100%', maxWidth: 720, alignSelf: 'center' },
  bottom: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  summary: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: space.xl },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: space.lg,
    alignSelf: 'stretch',
    gap: space.sm,
  },
  summaryText: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
