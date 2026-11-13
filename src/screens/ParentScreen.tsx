import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { getLesson, LESSONS, skillLabel } from '@/content';
import { plainText } from '@/content/zh';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { markParentUnlocked, ParentGate } from '@/components/ParentGate';
import { Card, SectionTitle, Stars } from '@/components/ui';
import { openCount } from '@/mistakes/book';
import { useNav } from '@/nav/Nav';
import { mistakeLabel, resolveExercise, sourceName } from '@/content/resolve';
import { suggestNext, type Suggestion } from '@/progress/plan';
import { AiCard, AppearanceCard, GradeCard, HiddenCard } from './ParentSettings';
import { KnowledgeCard } from './ParentKnowledge';
import { ThinkingCard } from './ParentThinking';
import { VoiceCheckCard } from './VoiceCheckCard';
import { GameParentCard } from '@/games/ui/GameParentCard';
import { trackProgress } from './EnglishTracks';
import { STARTER_NOTE, TRACK_INFO } from '@/content/englishStarter';
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
import { colors, radius, space, subjectTheme, themed } from '@/theme';

export default function ParentScreen() {
  const { status } = useProgress();
  const [passed, setPassed] = useState(false);
  const nav = useNav();
  const goBack = nav.back;

  if (status === 'loading') return <LoadingView />;
  return (
    <Screen bg="#F2F1FF" testID="parent-screen">
      <Header title="家长中心" onBack={goBack} />
      {passed ? (
        <ParentDashboard />
      ) : (
        <ParentGate
          onPass={() => {
            markParentUnlocked();
            setPassed(true);
          }}
        />
      )}
    </Screen>
  );
}

function ParentDashboard() {
  const nav = useNav();
  const { state, dispatch } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [now] = useState(() => Date.now());
  const sessions = recentSessions(state, 10);
  const weak = weakSkills(state);
  const mistakes = openMistakes(state);
  const hasData = state.results.length > 0 || state.sessions.length > 0;
  const completedLessons = LESSONS.filter((l) => (state.lessons[l.id]?.completedCount ?? 0) > 0).length;
  const suggestions = suggestNext(state, LESSONS, resolveExercise, now, 3);
  const mastered = Object.values(state.mistakes).filter((m) => m.resolved).length;

  return (
    <View style={{ gap: space.lg }} testID="parent-dashboard">
      {!hasData ? <Notice text="还没有学习记录" /> : null}

      <Card>
        <SectionTitle>总览</SectionTitle>
        <View style={styles.grid}>
          <Metric label="累计星星" value={String(state.totalStars)} testID="m-stars" />
          <Metric label="学会的课程" value={`${completedLessons} 节`} testID="m-lessons" />
          <Metric label="今天学习" value={formatDuration(studySecOnDay(state, now))} testID="m-today" />
          <Metric label="近 7 天学习" value={`${activeDaysLast7(state, now)} 天`} testID="m-days" />
        </View>
      </Card>

      <Card>
        <SectionTitle>下一步学习建议</SectionTitle>
        {suggestions.map((sg, i) => (
          <View key={i} style={styles.row} testID="suggestion-row">
            <Text style={styles.rowEmoji}>{['①', '②', '③'][i]}</Text>
            <Text style={[styles.rowTitle, { flex: 1 }]}>{describeSuggestion(sg)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle>试卷生成</SectionTitle>
        <Pressable
          onPress={() => nav.push({ name: 'exam' })}
          style={styles.examBtn}
          accessibilityRole="button"
          testID="exam-entry"
        >
          <Text style={styles.examBtnText}>📝 生成试卷</Text>
        </Pressable>
      </Card>

      <Card>
        <SectionTitle>拍照错题</SectionTitle>
        <Pressable onPress={() => nav.push({ name: 'photo' })} style={styles.examBtn} accessibilityRole="button" testID="photo-entry">
          <Text style={styles.examBtnText}>📷 拍照错题{state.photoMistakes.length ? `（已存 ${state.photoMistakes.length} 道）` : ''}</Text>
        </Pressable>
      </Card>

      <KnowledgeCard />
      <ThinkingCard />

      <Card>
        <SectionTitle>英语启蒙三条主线（一、二年级）</SectionTitle>
        <Text style={styles.small}>{STARTER_NOTE}</Text>
        {(['talk', 'phonics', 'reading'] as const).map((t) => {
          const tp = trackProgress(state, t);
          return (
            <View key={t} style={styles.row} testID={`parent-track-${t}`}>
              <Text style={styles.rowEmoji}>{TRACK_INFO[t].emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {TRACK_INFO[t].name}：已学 {tp.done}/{tp.total}
                  {tp.next ? ` · 下一课 ${typeof tp.next.title === 'string' ? tp.next.title : ''}` : ' · 全部学完'}
                </Text>
                <Text style={styles.small}>配合 {TRACK_INFO[t].book}</Text>
              </View>
            </View>
          );
        })}
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
                  <Metric
                    label="一次答对率"
                    value={st.accuracy === null ? '—' : `${st.accuracy}%`}
                    testID={`acc-${s}`}
                  />
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
          return (
            <View key={`${x.endedAt}-${i}`} style={styles.row} testID="session-row">
              <Text style={styles.rowEmoji}>{subjectTheme[x.subject].emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{sourceName(x.lessonId)}</Text>
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
        <Text style={styles.small}>练过 2 题以上、一次答对率低于 70%</Text>
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
        <Text style={styles.small}>
          已掌握 {mastered} 道 · 完成复习 {state.reviews.length} 次
        </Text>
        <View style={styles.bookRow}>
          {(['math', 'chinese', 'english'] as const).map((sub) => (
            <Pressable
              key={sub}
              onPress={() => nav.push({ name: 'mistakes', subject: sub })}
              style={[styles.bookBtn, { borderColor: subjectTheme[sub].color }]}
              accessibilityRole="button"
              testID={`parent-mistakes-${sub}`}
            >
              <Text style={[styles.bookBtnText, { color: subjectTheme[sub].color }]}>
                {subjectTheme[sub].emoji} {subjectTheme[sub].name}错题本（{openCount(state, sub)}）
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => nav.push({ name: 'textbooks' })} style={styles.bookBtn} accessibilityRole="button" testID="parent-textbooks">
          <Text style={styles.bookBtnText}>📚 教材资源库</Text>
        </Pressable>
        {mistakes.length === 0 ? <Text style={styles.empty}>暂无错题</Text> : null}
        {mistakes.map((m) => (
          <View key={m.key} style={styles.row} testID="mistake-row">
            <Text style={styles.rowEmoji}>{subjectTheme[m.subject].emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{mistakeLabel(m.lessonId, m.exerciseId)}</Text>
              <Text style={styles.small}>
                {skillLabel(m.skill)} · 答错 {m.wrongCount} 次 · 下次复习{' '}
                {m.srs.nextReviewDay.slice(5).replace('-', '月')}日
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <GradeCard />
      <AppearanceCard />
      <VoiceCheckCard />
      <GameParentCard />
      <AiCard />
      <HiddenCard />

      <Notice text="学习数据只保存在这台设备上。开启 AI 老师后，只发送题目内容和孩子的提问，不上传个人信息。" />

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
        <Text style={[styles.resetText, confirmReset && { color: colors.onAccent }]}>
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

function lessonName(id: string): string {
  const l = getLesson(id);
  return l ? `《${plainText(l.title)}》` : id;
}

function describeSuggestion(s: Suggestion): string {
  switch (s.kind) {
    case 'continue':
      return `继续学完 ${lessonName(s.lessonId)}`;
    case 'review':
      return `完成今日复习（${s.count} 道错题）`;
    case 'practice':
      return `“${skillLabel(s.skill)}”一次答对率 ${s.accuracy}%，建议再练「${sourceName(s.lessonId)}」`;
    case 'weak':
      return `“${skillLabel(s.skill)}”一次答对率 ${s.accuracy}%，建议重学 ${lessonName(s.lessonId)}`;
    case 'new':
      return `学习新课 ${lessonName(s.lessonId)}`;
    case 'more-stars':
      return `再学一次 ${lessonName(s.lessonId)}，争取 3 颗星（目前 ${s.bestStars} 颗）`;
  }
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

const styles = themed(() => StyleSheet.create({
  bookRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginVertical: space.sm },
  bookBtn: { borderWidth: 2, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10, backgroundColor: colors.card },
  bookBtnText: { fontSize: 14, fontWeight: '600' },
  examBtn: {
    marginTop: space.sm,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.parent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examBtnText: { color: colors.onAccent, fontSize: 18, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  metric: { flexBasis: '46%', flexGrow: 1, backgroundColor: colors.parentSoft, borderRadius: radius.md, padding: space.md },
  metricValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  metricLabel: { fontSize: 13, color: colors.textSoft, marginTop: 2 },
  empty: { fontSize: 15, color: colors.textSoft, paddingVertical: space.sm },
  small: { fontSize: 13, color: colors.textSoft, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rowEmoji: { fontSize: 24 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  bad: { fontSize: 15, fontWeight: '600', color: colors.wrong },
  reset: {
    borderWidth: 2,
    borderColor: colors.wrong,
    borderRadius: radius.md,
    padding: space.md,
    alignItems: 'center',
  },
  resetText: { color: colors.wrong, fontWeight: '600', fontSize: 16 },
  cancel: { alignItems: 'center', padding: space.sm },
}));
