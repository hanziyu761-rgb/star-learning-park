/**
 * 每日挑战（V2.5）：每天一道思维题，题型按天轮换。
 * - 不计入正确率、不进复习本；答对 2 颗星，答错也有 1 颗星（鼓励尝试）。
 * - 选错时先给“想一想”的提示，可以再试。
 * - 做完后可以“再玩一道”（不再给星星，但记入思维记录）。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedbackBar } from '@/components/FeedbackBar';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView } from '@/components/Screen';
import { BigButton } from '@/components/ui';
import { zh } from '@/content/zh';
import type { ExerciseOutcome } from '@/exercises/common';
import { ExerciseView } from '@/exercises/ExerciseView';
import { langForSubject, type FeedbackMessage } from '@/lesson/feedback';
import { useNav } from '@/nav/Nav';
import { challengeStars } from '@/progress/model';
import { useProgress } from '@/progress/ProgressContext';
import { dayKey } from '@/progress/srs';
import { speak, stopSpeaking } from '@/speech/speech';
import { CHALLENGE_BY_TYPE, dailyChallenge, recommendedSubject } from '@/thinking/registry';
import type { Subject } from '@/lesson/types';
import { challengeLevel, LEVEL_NAME } from '@/thinking/adaptive';
import { THINK_DIMS } from '@/thinking/dims';
import { colors, radius, space } from '@/theme';
import { contentGrade } from '@/progress/grade';

const COLOR = '#E07A2E';
const SUBJECTS: { id: Subject; label: ReturnType<typeof zh> }[] = [
  { id: 'math', label: zh('数学', 'shù xué') },
  { id: 'chinese', label: zh('语文', 'yǔ wén') },
  { id: 'english', label: zh('英语', 'yīng yǔ') },
];
const SOFT = '#FFF1E3';

export default function ChallengeScreen() {
  const { status } = useProgress();
  if (status === 'loading') return <LoadingView />;
  return <ChallengeSession />;
}

function ChallengeSession() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useProgress();
  const [today] = useState(() => dayKey(Date.now()));
  const todays = state.challenges.filter((c) => c.day === today);
  const dailyDone = todays.some((c) => c.daily);
  // 进入页面时决定做哪一道：今天没做过 → 每日挑战；做过 → 先看结果，可以“再玩一道”
  const [extra, setExtra] = useState<number | null>(() => (dailyDone ? null : 0));
  const [solved, setSolved] = useState<{ correct: boolean; stars: number } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const recommended = recommendedSubject(today);
  const [subject, setSubject] = useState<Subject>(recommended);

  useEffect(() => () => stopSpeaking(), []);

  // 难度跟着孩子走（V2.11）：出题时按这一科最近的作答定难度档；做完这道题不会让眼前的题变掉
  const grade = contentGrade(state.settings.grade);
  const adapt = useMemo(
    () => challengeLevel(state, subject),
    [extra, grade, subject], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const ex = useMemo(
    () => (extra === null ? null : dailyChallenge(today, grade, extra, subject, adapt.level)),
    [extra, today, grade, subject, adapt.level],
  );

  // 这道题出现时今天是否还没做过每日挑战（做过的话这道是“再玩一道”，不计星星）
  const isDaily = useMemo(() => !dailyDone, [ex?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSolved = (o: ExerciseOutcome) => {
    if (!ex) return;
    const daily = isDaily && !dailyDone;
    const record = {
      at: Date.now(),
      day: today,
      id: ex.id,
      type: ex.type,
      dims: CHALLENGE_BY_TYPE[ex.type].dims,
      firstTryCorrect: o.firstTryCorrect,
      attempts: o.attempts,
      daily,
      subject,
      level: adapt.level,
    };
    dispatch({ type: 'challenge/complete', record });
    setSolved({ correct: o.firstTryCorrect, stars: challengeStars(record) });
  };

  const playMore = () => {
    stopSpeaking();
    setFeedback(null);
    setSolved(null);
    setExtra(Math.max(1, todays.length));
  };

  const last = [...todays].reverse()[0];

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.sm }]} testID="challenge-screen">
      <View style={styles.headerWrap}>
        <Header title={zh('每日挑战', 'měi rì tiǎo zhàn')} onBack={nav.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.subjects}>
          {SUBJECTS.map((x) => (
            <Pressable
              key={x.id}
              testID={`challenge-subject-${x.id}`}
              accessibilityRole="button"
              onPress={() => {
                if (x.id === subject) return;
                stopSpeaking();
                setFeedback(null);
                setSolved(null);
                setSubject(x.id);
              }}
              style={[styles.subject, subject === x.id && styles.subjectOn]}
            >
              <DisplayTextView text={x.label} size={18} color={subject === x.id ? '#fff' : COLOR} />
              {x.id === recommended ? (
                <Text style={[styles.rec, subject === x.id && { color: '#fff' }]}>今天推荐</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
        {ex === null ? (
          <View style={styles.doneCard} testID="challenge-done-today">
            <Mascot size={110} mood="cheer" />
            <DisplayTextView
              text={zh('今天的挑战完成啦！', 'jīn tiān de tiǎo zhàn wán chéng la')}
              size={26}
              color={COLOR}
            />
            {last ? (
              <Text style={styles.meta}>
                {CHALLENGE_BY_TYPE[last.type as keyof typeof CHALLENGE_BY_TYPE]?.name ?? '挑战'} ·{' '}
                {last.firstTryCorrect ? '一次就答对了' : '想了几次做出来了'}
              </Text>
            ) : null}
            <DisplayTextView text={zh('明天还有新的挑战。', 'míng tiān hái yǒu xīn de tiǎo zhàn')} size={18} />
          </View>
        ) : (
          <>
            <View style={styles.tags}>
              <Text style={styles.typeName} testID="challenge-type">
                {CHALLENGE_BY_TYPE[ex.type].name}
              </Text>
              {CHALLENGE_BY_TYPE[ex.type].dims.map((d) => (
                <Text key={d} style={styles.tag}>
                  {THINK_DIMS.find((x) => x.id === d)!.emoji} {THINK_DIMS.find((x) => x.id === d)!.name}
                </Text>
              ))}
              {!isDaily ? <Text style={styles.tag}>再玩一道 · 不计星星</Text> : null}
              <Text style={styles.tag} testID="challenge-level">
                {LEVEL_NAME[adapt.level]}
                {adapt.change === 'up' ? ' ⬆ 最近答得好，难一点' : adapt.change === 'down' ? ' ⬇ 先练简单一点的' : ''}
              </Text>
            </View>
            <View testID={`challenge-exercise-${ex.id}`}>
              <ExerciseView
                key={ex.id}
                exercise={ex}
                lang={langForSubject(subject)}
                onFeedback={setFeedback}
                onSolved={onSolved}
              />
            </View>
            {solved ? (
              <View style={styles.doneCard} testID="challenge-result">
                <DisplayTextView
                  text={
                    solved.correct
                      ? zh('一次就想出来了，真会动脑筋！', 'yí cì jiù xiǎng chū lái le zhēn huì dòng nǎo jīn')
                      : zh('多想了几次，也做出来了！', 'duō xiǎng le jǐ cì yě zuò chū lái le')
                  }
                  size={20}
                  color={COLOR}
                />
                {solved.stars > 0 ? (
                  <Text style={styles.meta} testID="challenge-stars">
                    获得 {'⭐'.repeat(solved.stars)}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
        <FeedbackBar message={feedback} />
        {ex === null || solved ? (
          <View style={{ gap: space.sm }}>
            <BigButton
              size="md"
              emoji="🧩"
              label={zh('再玩一道', 'zài wán yí dào')}
              color={COLOR}
              onPress={() => {
                speak({ text: '再玩一道', lang: 'zh-CN' });
                playMore();
              }}
              testID="challenge-more"
            />
            <BigButton
              size="md"
              emoji="🏠"
              label={zh('回首页', 'huí shǒu yè')}
              color={colors.textSoft}
              onPress={nav.home}
              testID="challenge-home"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SOFT },
  headerWrap: { paddingHorizontal: space.lg },
  content: { padding: space.lg, gap: space.md, width: '100%', maxWidth: 720, alignSelf: 'center' },
  subjects: { flexDirection: 'row', gap: space.sm },
  subject: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: COLOR,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  subjectOn: { backgroundColor: COLOR },
  rec: { fontSize: 11, color: COLOR, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
  typeName: { fontSize: 18, fontWeight: '900', color: COLOR, marginRight: space.xs },
  tag: {
    fontSize: 13,
    color: colors.textSoft,
    backgroundColor: '#fff',
    borderRadius: radius.round,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  doneCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: space.lg,
    alignItems: 'center',
    gap: space.sm,
  },
  meta: { fontSize: 16, color: colors.textSoft, fontWeight: '700' },
  bottom: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
