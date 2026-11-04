import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { exerciseLabel, getLesson, skillLabel } from '@/content';
import { plainText } from '@/content/zh';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { ParentGate } from '@/components/ParentGate';
import { Card, SectionTitle, Stars } from '@/components/ui';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import {
  activeDaysLast7,
  formatDateTime,
  formatDuration,
  openMistakes,
  recentSessions,
  studySecOnDay,
  subjectStats,
  SUBJECTS,
  weakSkills,
} from '@/progress/stats';
import { colors, radius, space, subjectTheme } from '@/theme';

export default function ParentScreen() {
  const { status } = useProgress();
  const [passed, setPassed] = useState(false);
  const nav = useNav();
  const goBack = nav.back;

  if (status === 'loading') return <LoadingView />;
  return (
    <Screen bg="#F2F1FF" testID="parent-screen">
      <Header title="家长中心" onBack={goBack} />
      {passed ? <ParentDashboard /> : <ParentGate onPass={() => setPassed(true)} />}
    </Screen>
  );
}

function ParentDashboard() {
  const { state, dispatch } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [now] = useState(() => Date.now());
  const sessions = recentSessions(state, 10);
  const weak = weakSkills(state);
  const mistakes = openMistakes(state);
  const hasData = state.results.length > 0 || state.sessions.length > 0;
  const completedLessons = Object.values(state.lessons).filter((l) => l.completedCount > 0).length;

  return (
    <View style={{ gap: space.lg }} testID="parent-dashboard">
      {!hasData ? (
        <Notice text="还没有学习记录。孩子完成课程或练习后，这里会显示真实的学习情况。" />
      ) : null}

      <Card>
        <SectionTitle>总览</SectionTitle>
        <View style={styles.grid}>
          <Metric label="累计星星" value={String(state.totalStars)} testID="m-stars" />
          <Metric label="学会的课程" value={`${completedLessons} 节`} testID="m-lessons" />
          <Metric label="今天学习" value={formatDuration(studySecOnDay(state, now))} testID="m-today" />
          <Metric label="近 7 天学习" value={`${activeDaysLast7(state, now)} 天`} testID="m-days" />
        </View>
      </Card>

      {SUBJECTS.map((s) => {
        const st = subjectStats(state, s);
        return (
          <Card key={s} style={{ borderLeftWidth: 8, borderLeftColor: subjectTheme[s].color }}>
            <View testID={`stats-${s}`}>
              <SectionTitle>
                {subjectTheme[s].emoji} {subjectTheme[s].name}
              </SectionTitle>
              {st.sessions === 0 && st.exercises === 0 ? (
                <Text style={styles.empty}>还没有学习记录</Text>
              ) : (
                <View style={styles.grid}>
                  <Metric label="完成课程" value={`${st.completedLessons} 节`} />
                  <Metric label="完成次数" value={`${st.sessions} 次`} />
                  <Metric label="一次答对率" value={st.accuracy === null ? '—' : `${st.accuracy}%`} testID={`acc-${s}`} />
                  <Metric label="学习时长" value={formatDuration(st.studySec)} />
                </View>
              )}
              {st.lastStudiedAt ? <Text style={styles.small}>最近学习：{formatDateTime(st.lastStudiedAt)}</Text> : null}
            </View>
          </Card>
        );
      })}

      <Card>
        <SectionTitle>最近完成的课程</SectionTitle>
        {sessions.length === 0 ? <Text style={styles.empty}>暂无</Text> : null}
        {sessions.map((x, i) => {
          const lesson = getLesson(x.lessonId);
          return (
            <View key={`${x.endedAt}-${i}`} style={styles.row} testID="session-row">
              <Text style={styles.rowEmoji}>{subjectTheme[x.subject].emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{lesson ? plainText(lesson.title) : x.lessonId}</Text>
                <Text style={styles.small}>
                  {formatDateTime(x.endedAt)} · 用时 {formatDuration(x.durationSec)}
                  {x.exerciseCount > 0 ? ` · 一次答对 ${x.firstTryCorrect}/${x.exerciseCount}` : ''}
                </Text>
              </View>
              <Stars value={x.stars} size={16} />
            </View>
          );
        })}
      </Card>

      <Card>
        <SectionTitle>薄弱知识点</SectionTitle>
        <Text style={styles.small}>至少练习 2 题、一次答对率低于 70% 的知识点</Text>
        {weak.length === 0 ? <Text style={styles.empty}>{hasData ? '暂无，继续保持' : '暂无'}</Text> : null}
        {weak.map((w) => (
          <View key={w.skill} style={styles.row} testID="weak-row">
            <Text style={styles.rowEmoji}>{subjectTheme[w.subject].emoji}</Text>
            <Text style={[styles.rowTitle, { flex: 1 }]}>{skillLabel(w.skill)}</Text>
            <Text style={styles.bad}>
              {w.correct}/{w.total}（{w.accuracy}%）
            </Text>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle>错题（尚未掌握）</SectionTitle>
        <Text style={styles.small}>第一次答错的题目；之后再次一次答对会自动移出</Text>
        {mistakes.length === 0 ? <Text style={styles.empty}>暂无错题</Text> : null}
        {mistakes.map((m) => (
          <View key={m.key} style={styles.row} testID="mistake-row">
            <Text style={styles.rowEmoji}>{subjectTheme[m.subject].emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{exerciseLabel(m.lessonId, m.exerciseId)}</Text>
              <Text style={styles.small}>
                {skillLabel(m.skill)} · 答错 {m.wrongCount} 次 · {formatDateTime(m.lastWrongAt)}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <Notice text="说明：所有数据只保存在这台设备上，不会上传。学习时长按完成的课程统计（单次最多计 60 分钟），中途退出的课程不计时长。" />

      <Pressable
        accessibilityRole="button"
        testID="reset"
        onPress={() => {
          if (confirmReset) {
            dispatch({ type: 'reset' });
            setConfirmReset(false);
          } else setConfirmReset(true);
        }}
        style={[styles.reset, confirmReset && { backgroundColor: colors.wrong }]}
      >
        <Text style={[styles.resetText, confirmReset && { color: '#fff' }]}>
          {confirmReset ? '再点一次确认清除（无法恢复）' : '清除全部学习记录'}
        </Text>
      </Pressable>
      {confirmReset ? (
        <Pressable onPress={() => setConfirmReset(false)} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.small}>取消</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Metric({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue} testID={testID}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  metric: { flexBasis: '46%', flexGrow: 1, backgroundColor: '#F7F6FF', borderRadius: radius.md, padding: space.md },
  metricValue: { fontSize: 22, fontWeight: '900', color: colors.text },
  metricLabel: { fontSize: 13, color: colors.textSoft, marginTop: 2 },
  empty: { fontSize: 15, color: colors.textSoft, paddingVertical: space.sm },
  small: { fontSize: 13, color: colors.textSoft, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: '#EEE' },
  rowEmoji: { fontSize: 24 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  bad: { fontSize: 15, fontWeight: '800', color: colors.wrong },
  reset: { borderWidth: 2, borderColor: colors.wrong, borderRadius: radius.md, padding: space.md, alignItems: 'center' },
  resetText: { color: colors.wrong, fontWeight: '800', fontSize: 16 },
  cancel: { alignItems: 'center', padding: space.sm },
});
