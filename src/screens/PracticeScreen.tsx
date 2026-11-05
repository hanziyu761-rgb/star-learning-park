/**
 * 题库闯关 / 口算闯关：一轮 10 题，复用课程的练习组件和反馈。
 * - 题库：优先抽没做过的题；家长屏蔽的题不出现；长按“这题有问题”可屏蔽当前题。
 * - 口算：程序生成，答案由程序计算。
 * 做错的题自动进入“今日复习”。
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BANK_SOURCE, bankExercise, findUnit, pickRound } from '@/content/bank';
import { ORAL_TOPICS, oralExercise, oralRound } from '@/content/oral';
import { sourceName } from '@/content/resolve';
import { isWriteLessonId, traceExercise, WRITE_SETS } from '@/content/writing';
import { kpRound } from '@/knowledge/generators';
import { zh } from '@/content/zh';
import { FeedbackBar } from '@/components/FeedbackBar';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, Stars } from '@/components/ui';
import { AskTeacher } from '@/ai/AskTeacher';
import type { ExerciseOutcome } from '@/exercises/common';
import { ExerciseView } from '@/exercises/ExerciseView';
import { GRAPHICS_GENERATORS } from '@/knowledge/graphics';
import { getKp } from '@/knowledge/graph';
import { kpForRecord } from '@/knowledge/mapping';
import { shouldAskStrategy } from '@/thinking/strategies';
import { StrategyAsk } from '@/thinking/StrategyAsk';
import { KP_TEACH } from '@/knowledge/teach';
import { TeachPanel } from '@/components/TeachPanel';
import { langForSubject, type FeedbackMessage } from '@/lesson/feedback';
import type { Exercise, Subject } from '@/lesson/types';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { speak, stopSpeaking } from '@/speech/speech';
import { colors, radius, space, subjectTheme } from '@/theme';

interface Round {
  subject: Subject;
  title: string;
  isBank: boolean;
  exercises: Exercise[];
}

export default function PracticeScreen({ id }: { id: string | undefined }) {
  const { status } = useProgress();
  if (status === 'loading') return <LoadingView />;
  return <PracticeSession id={String(id ?? '')} />;
}

function buildRound(id: string, done: Set<string>, hidden: Set<string>): Round | null {
  if (id.startsWith('bank:')) {
    const f = findUnit(id.slice(5));
    if (!f) return null;
    const qs = pickRound(f.unit, { done, hidden });
    return {
      subject: f.book.subject,
      title: sourceName(id),
      isBank: true,
      exercises: qs.map((q) => bankExercise(f.book, q)),
    };
  }
  if (id.startsWith('kp:')) {
    // 知识点练习：原创题目生成器，优先出没做过的题
    const kpId = id.slice(3);
    // 图形类是动手操作题，每轮 6 题，避免孩子疲劳
    const exercises = kpRound(kpId, kpId in GRAPHICS_GENERATORS ? 6 : 10, Math.random, done);
    return exercises.length
      ? { subject: getKp(kpId)?.subject ?? 'math', title: sourceName(id), isBank: false, exercises }
      : null;
  }
  if (isWriteLessonId(id)) {
    const set = WRITE_SETS[Number(id.slice(6)) - 1];
    return set
      ? { subject: 'chinese', title: sourceName(id), isBank: false, exercises: set.map((c) => traceExercise(c.char)) }
      : null;
  }
  if (id.startsWith('oral:')) {
    const topic = ORAL_TOPICS.find((t) => `oral:${t.id}` === id);
    if (!topic) return null;
    return {
      subject: 'math',
      title: sourceName(id),
      isBank: false,
      // 每隔一道题自己填数（V2.9）
      exercises: oralRound(topic).map((expr, i) => oralExercise(topic.id, i % 2 ? `${expr}#in` : expr)),
    };
  }
  return null;
}

function PracticeSession({ id }: { id: string }) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useProgress();
  const [startedAt] = useState(() => Date.now());
  const [round] = useState<Round | null>(() => {
    const done = new Set(state.results.filter((r) => r.lessonId === id).map((r) => r.exerciseId));
    return buildRound(id, done, new Set(state.hidden));
  });
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [finished, setFinished] = useState(false);
  /** 本轮一次答对的题数；第 1、4、7… 道一次答对的题问“你是怎么想的” */
  const [correctCount, setCorrectCount] = useState(0);
  const [askKp, setAskKp] = useState<string | null>(null);
  // 先教后练：知识点练习有小讲解；第一次练这个知识点时先看讲解（V2.10）
  const teachKp = id.startsWith('kp:') ? id.slice(3) : null;
  const slides = teachKp ? KP_TEACH[teachKp] : undefined;
  const [teaching, setTeaching] = useState(() => !!slides && !state.results.some((r) => r.lessonId === id));

  useEffect(() => () => stopSpeaking(), []);

  if (!round) {
    return (
      <Screen>
        <Header title="找不到这个练习" onBack={nav.back} />
        <Notice tone="warn" text="练习不存在或题库已更新，请返回重新选择。" />
      </Screen>
    );
  }
  if (round.exercises.length === 0) {
    return (
      <Screen>
        <Header title={round.title} onBack={nav.back} />
        <Notice text="这个单元的题目都被屏蔽了。家长可以在家长中心恢复。" />
      </Screen>
    );
  }

  const theme = subjectTheme[round.subject];
  const total = round.exercises.length;
  const ex = round.exercises[index];
  const last = index >= total - 1;

  const finish = () => {
    dispatch({ type: 'practice/complete', lessonId: id, subject: round.subject, startedAt, now: Date.now() });
    speak({ text: '闯关完成！', lang: 'zh-CN' });
    setFinished(true);
  };

  const next = () => {
    stopSpeaking();
    setFeedback(null);
    setDone(false);
    setAskKp(null);
    if (last) finish();
    else setIndex((i) => i + 1);
  };

  const onSolved = (o: ExerciseOutcome) => {
    dispatch({
      type: 'exercise/result',
      lessonId: id,
      exerciseId: ex.id,
      subject: round.subject,
      skill: ex.skill,
      firstTryCorrect: o.firstTryCorrect,
      attempts: o.attempts,
      now: Date.now(),
    });
    if (o.firstTryCorrect) {
      const n = correctCount + 1;
      setCorrectCount(n);
      const kp = kpForRecord(id, ex.id, ex.skill);
      if (shouldAskStrategy(kp, n)) setAskKp(kp);
    }
    setDone(true);
  };

  if (finished) {
    const session = [...state.sessions].reverse().find((s) => s.lessonId === id && s.startedAt === startedAt);
    return (
      <View
        style={[styles.center, { paddingTop: insets.top + space.xl, backgroundColor: theme.soft }]}
        testID="practice-summary"
      >
        <Mascot size={130} mood="cheer" />
        <DisplayTextView text={zh('闯关完成！', 'chuǎng guān wán chéng')} size={36} color={theme.color} />
        {session ? (
          <>
            <Stars value={session.stars} size={52} />
            <Text style={styles.summary} testID="practice-score">
              一次答对 {session.firstTryCorrect} / {session.exerciseCount} 题
            </Text>
          </>
        ) : null}
        <BigButton
          emoji="🔁"
          label={zh('再来一轮', 'zài lái yì lún')}
          color={theme.color}
          onPress={() => {
            nav.back();
            nav.push({ name: 'practice', id });
          }}
          style={{ alignSelf: 'stretch' }}
          testID="practice-again"
        />
        <BigButton
          emoji="🏠"
          label={zh('回首页', 'huí shǒu yè')}
          color={colors.textSoft}
          size="md"
          onPress={nav.home}
          style={{ alignSelf: 'stretch' }}
          testID="practice-home"
        />
      </View>
    );
  }

  const hideCurrent = () => {
    dispatch({ type: 'bank/hide', questionId: ex.id });
    setSkipped((s) => [...s, index]);
    setFeedback({ kind: 'info', text: '已屏蔽这道题，家长可在家长中心恢复' });
    setDone(true);
  };

  return (
    <View
      style={[styles.root, { paddingTop: insets.top + space.sm, backgroundColor: theme.soft }]}
      testID="practice-screen"
    >
      <View style={styles.headerWrap}>
        <Header
          title={round.title.split(' · ').pop() ?? round.title}
          onBack={nav.back}
          right={
            <Text style={styles.count} testID="practice-progress">
              {index + 1}/{total}
            </Text>
          }
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {teaching && slides ? (
          <TeachPanel slides={slides} color={theme.color} onDone={() => setTeaching(false)} />
        ) : (
          <>
            {slides && index === 0 && !done ? (
              <Pressable
                onPress={() => setTeaching(true)}
                accessibilityRole="button"
                testID="teach-open"
                style={styles.teachOpen}
              >
                <Text style={styles.teachOpenText}>📖 先看讲解</Text>
              </Pressable>
            ) : null}
            {skipped.includes(index) ? (
              <Notice text="这道题已屏蔽，点“继续”做下一题。" />
            ) : (
              <View testID={`practice-exercise-${ex.id}`}>
                <ExerciseView
                  key={`ex-${index}-${ex.id}`}
                  exercise={ex}
                  lang={langForSubject(round.subject)}
                  onFeedback={setFeedback}
                  onSolved={onSolved}
                />
              </View>
            )}
            {askKp && done ? <StrategyAsk key={`st-${index}`} kp={askKp} lessonId={id} exerciseId={ex.id} /> : null}
            <AskTeacher
              key={`ai-${index}-${ex.id}`}
              exercise={ex}
              subject={round.subject}
              solved={done && !skipped.includes(index)}
            />
            {round.isBank ? (
              <View style={styles.sourceRow}>
                <Text style={styles.source}>{BANK_SOURCE}</Text>
                <Pressable
                  onLongPress={hideCurrent}
                  delayLongPress={800}
                  accessibilityRole="button"
                  testID="report-question"
                  hitSlop={8}
                >
                  <Text style={styles.report}>🚩 长按：这题有问题</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      {teaching && slides ? null : (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
          <FeedbackBar message={feedback} />
          <BigButton
            size="md"
            emoji={last ? '🏁' : '▶️'}
            label={last ? zh('完成', 'wán chéng') : zh('继续', 'jì xù')}
            color={theme.color}
            disabled={!done}
            onPress={next}
            testID="practice-next"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerWrap: { paddingHorizontal: space.lg },
  content: { padding: space.lg, gap: space.md, width: '100%', maxWidth: 720, alignSelf: 'center' },
  count: { fontSize: 18, fontWeight: '800', color: colors.textSoft },
  bottom: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: space.xl },
  summary: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: space.lg,
  },
  teachOpen: { alignSelf: 'flex-end', paddingHorizontal: space.sm, paddingVertical: 4 },
  teachOpenText: { fontSize: 14, fontWeight: '700', color: colors.parent },
  sourceRow: { alignItems: 'center', gap: 4, marginTop: space.sm },
  source: { fontSize: 12, color: colors.textSoft, textAlign: 'center' },
  report: { fontSize: 13, color: colors.textSoft, padding: 4 },
});
