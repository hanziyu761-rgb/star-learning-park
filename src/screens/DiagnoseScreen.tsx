/**
 * 找原因小游戏（儿童端的前置知识诊断）
 * 孩子看到的是“星星宝小侦探”，不出现“薄弱”“诊断”等字眼；结论写入家长中心。
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { zh } from '@/content/zh';
import { FeedbackBar } from '@/components/FeedbackBar';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, Stars } from '@/components/ui';
import type { ExerciseOutcome } from '@/exercises/common';
import { ExerciseView } from '@/exercises/ExerciseView';
import { answer, nextKp, startDiagnosis, summarize, type DiagSession, type DiagSummary } from '@/knowledge/diagnose';
import { kpRound } from '@/knowledge/generators';
import { kpLabel, getKp } from '@/knowledge/graph';
import { computeMastery } from '@/knowledge/mastery';
import { langForSubject, type FeedbackMessage } from '@/lesson/feedback';
import type { Exercise } from '@/lesson/types';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { speak, stopSpeaking } from '@/speech/speech';
import { colors, radius, space, themed } from '@/theme';

export default function DiagnoseScreen({ kp }: { kp: string | undefined }) {
  const { status } = useProgress();
  const nav = useNav();
  if (status === 'loading') return <LoadingView />;
  if (!kp || !getKp(kp)) {
    return (
      <Screen>
        <Header title="找不到这个本领" onBack={nav.back} />
        <Notice tone="warn" text="请返回知识小地图重新选择。" />
      </Screen>
    );
  }
  return <DiagnoseGame target={kp} />;
}

function DiagnoseGame({ target }: { target: string }) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useProgress();
  const [mastery] = useState(() => computeMastery(state, Date.now()));
  const [started, setStarted] = useState(false);
  const [session, setSession] = useState<DiagSession>(() => startDiagnosis(target));
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [lastOutcome, setLastOutcome] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [summary, setSummary] = useState<DiagSummary | null>(null);
  const [used] = useState(() => new Set<string>());
  const targetKp = getKp(target)!;

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    speak({ text: `星星宝小侦探来帮你啦！我们一起做几道小题，找找${targetKp.kidName}哪里还不太熟。`, lang: 'zh-CN' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 取下一题；没有了就结束 */
  const advance = (s: DiagSession) => {
    const n = nextKp(s, mastery);
    if (!n.kpId) {
      const sum = summarize(n.session);
      dispatch({
        type: 'diagnosis/complete',
        record: {
          at: Date.now(),
          target,
          verdicts: n.session.verdicts,
          roots: sum.roots,
          questionCount: sum.questionCount,
        },
      });
      setSession(n.session);
      setSummary(sum);
      setExercise(null);
      const first = sum.roots[0] ? getKp(sum.roots[0]) : undefined;
      speak({
        text: first
          ? `找到啦！我们先去练一练“${first.kidName}”，练熟了再回来就简单啦！`
          : '你其实都会！多练几次就更棒啦！',
        lang: 'zh-CN',
      });
      return;
    }
    const ex = kpRound(n.kpId, 1, Math.random, used)[0];
    used.add(ex.id);
    setSession(n.session);
    setExercise(ex);
    setLastOutcome(null);
    setFeedback(null);
  };

  const onSolved = (o: ExerciseOutcome) => {
    if (!exercise) return;
    dispatch({
      type: 'exercise/result',
      lessonId: `diag:${target}`,
      exerciseId: exercise.id,
      subject: getKp(exercise.skill)?.subject ?? 'math',
      skill: exercise.skill,
      firstTryCorrect: o.firstTryCorrect,
      attempts: o.attempts,
      now: Date.now(),
      source: 'diagnose',
    });
    setLastOutcome(o.firstTryCorrect);
  };

  const next = () => {
    if (!exercise || lastOutcome === null) return;
    stopSpeaking();
    advance(answer(session, exercise.id, lastOutcome));
  };

  if (!started) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + space.xl }]} testID="diagnose-intro">
        <Mascot size={130} />
        <DisplayTextView text={zh('星星宝小侦探', 'xīng xing bǎo xiǎo zhēn tàn')} size={30} color={colors.parent} />
        <DisplayTextView
          text={zh('做几道小题，找找哪里还不太熟', 'zuò jǐ dào xiǎo tí zhǎo zhao nǎ lǐ hái bú tài shú')}
          size={20}
        />
        <BigButton
          emoji="🔍"
          label={zh('开始', 'kāi shǐ')}
          color={colors.parent}
          onPress={() => {
            setStarted(true);
            advance(session);
          }}
          style={{ alignSelf: 'stretch' }}
          testID="diagnose-start"
        />
        <BigButton
          emoji="←"
          label={zh('下次再说', 'xià cì zài shuō')}
          color={colors.textSoft}
          size="md"
          onPress={nav.back}
          style={{ alignSelf: 'stretch' }}
        />
      </View>
    );
  }

  if (summary) {
    const first = summary.roots[0] ? getKp(summary.roots[0]) : undefined;
    return (
      <View style={[styles.center, { paddingTop: insets.top + space.xl }]} testID="diagnose-summary">
        <Mascot size={130} mood="cheer" />
        <Stars value={1} max={1} size={48} />
        {first ? (
          <>
            <DisplayTextView text={zh('找到啦！先练这个本领：', 'zhǎo dào la xiān liàn zhè ge běn lǐng')} size={22} />
            <View style={styles.found} testID="diagnose-root">
              <Text style={{ fontSize: 40 }}>{first.emoji}</Text>
              <DisplayTextView text={kpLabel(first)} size={28} />
            </View>
            <BigButton
              emoji="✏️"
              label={zh('去练一练', 'qù liàn yi liàn')}
              color={colors.primary}
              onPress={() => {
                nav.back();
                nav.push({ name: 'practice', id: `kp:${first.id}` });
              }}
              style={{ alignSelf: 'stretch' }}
              testID="diagnose-practice"
            />
          </>
        ) : (
          <DisplayTextView
            text={zh('你其实都会！多练几次就更棒啦！', 'nǐ qí shí dōu huì duō liàn jǐ cì jiù gèng bàng la')}
            size={22}
          />
        )}
        <Text style={styles.small}>一共做了 {summary.questionCount} 道题，结果已告诉爸爸妈妈</Text>
        <BigButton
          emoji="🗺️"
          label={zh('回小地图', 'huí xiǎo dì tú')}
          color={colors.textSoft}
          size="md"
          onPress={nav.back}
          style={{ alignSelf: 'stretch' }}
          testID="diagnose-back"
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]} testID="diagnose-screen">
      <View style={styles.pad}>
        <Header
          title={zh('小侦探', 'xiǎo zhēn tàn')}
          onBack={nav.back}
          right={
            <Text style={styles.count} testID="diagnose-count">
              第 {session.answers.length + 1} 题
            </Text>
          }
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {exercise ? (
          <View testID={`diag-exercise-${exercise.id}`}>
            <ExerciseView
              key={`diag-${exercise.id}`}
              exercise={exercise}
              lang={langForSubject(getKp(exercise.skill)?.subject ?? 'math')}
              onFeedback={setFeedback}
              onSolved={onSolved}
            />
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <FeedbackBar message={feedback} />
        <BigButton
          size="md"
          emoji="▶️"
          label={zh('继续', 'jì xù')}
          color={colors.parent}
          disabled={lastOutcome === null}
          onPress={next}
          testID="diagnose-next"
        />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parentSoft },
  pad: { paddingHorizontal: space.lg },
  content: { padding: space.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  count: { fontSize: 16, fontWeight: '600', color: colors.textSoft },
  bottom: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.sm,
    backgroundColor: colors.glass,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
    backgroundColor: colors.parentSoft,
  },
  found: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  small: { fontSize: 13, color: colors.textSoft },
}));
