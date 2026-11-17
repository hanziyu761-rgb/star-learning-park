import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Switch, Text, View } from 'react-native';
import { ListGroup, ListRow } from '@/components/List';
import { GRADE_CN, isJunior, pinyinHidden } from '@/progress/grade';
import { Pressable } from '@/components/Tappable';
import { getLesson, LESSONS, skillLabel } from '@/content';
import { plainText } from '@/content/zh';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { markParentUnlocked, ParentGate } from '@/components/ParentGate';
import { Card, SectionTitle, Stars } from '@/components/ui';
import { openCount } from '@/mistakes/book';
import { useNav } from '@/nav/Nav';
import { MemberCard } from '@/member/MemberCard';
import { mistakeLabel, resolveExercise, sourceName } from '@/content/resolve';
import { suggestNext, type Suggestion } from '@/progress/plan';
import { AiCard, AiReportCard, AppearanceCard, EyeCareCard, GradeCard, HiddenCard } from './ParentSettings';
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
import { colors, radius, shadow, space, subjectTheme, themed } from '@/theme';

/** 家长中心的几页（V5.1 简化）：首页是一个短列表，详细内容各放一页 */
type Section = 'home' | 'report' | 'mistakes' | 'settings';
const SECTION_TITLE: Record<Section, string> = { home: '家长中心', report: '学习报告', mistakes: '错题', settings: '设置' };

export default function ParentScreen() {
  const { status } = useProgress();
  const [passed, setPassed] = useState(false);
  const [section, setSection] = useState<Section>('home');
  const nav = useNav();
  // 在某一页里时，“返回”先回到家长中心首页
  const goBack = () => (section === 'home' ? nav.back() : setSection('home'));
  useEffect(() => {
    if (section === 'home') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSection('home');
      return true;
    });
    return () => sub.remove();
  }, [section]);

  if (status === 'loading') return <LoadingView />;
  return (
    <Screen bg={colors.bg} testID="parent-screen" key={section}>
      <Header title={SECTION_TITLE[section]} onBack={goBack} />
      {!passed ? (
        <ParentGate
          onPass={() => {
            markParentUnlocked();
            setPassed(true);
          }}
        />
      ) : section === 'home' ? (
        <ParentHome open={setSection} />
      ) : section === 'report' ? (
        <ReportPage />
      ) : section === 'mistakes' ? (
        <MistakesPage />
      ) : (
        <SettingsPage />
      )}
    </Screen>
  );
}

/** 首页：总览 + 一个短列表 */
function ParentHome({ open }: { open: (s: Section) => void }) {
  const nav = useNav();
  const { state, dispatch } = useProgress();
  const [now] = useState(() => Date.now());
  const hasData = state.results.length > 0 || state.sessions.length > 0;
  const completedLessons = LESSONS.filter((l) => (state.lessons[l.id]?.completedCount ?? 0) > 0).length;
  const open_ = openMistakes(state).length;
  const showPinyin = !pinyinHidden(state.settings);

  return (
    <View style={{ gap: space.xl }} testID="parent-dashboard">
      {/* 会员（V5.3）：状态、设备号、开通码 */}
      <MemberCard />
      {!hasData ? <Notice text="还没有学习记录" /> : null}

      <View style={styles.grid}>
        <Metric label="累计星星" value={String(state.totalStars)} testID="m-stars" />
        <Metric label="学会的课程" value={`${completedLessons} 节`} testID="m-lessons" />
        <Metric label="今天学习" value={formatDuration(studySecOnDay(state, now))} testID="m-today" />
        <Metric label="近 7 天学习" value={`${activeDaysLast7(state, now)} 天`} testID="m-days" />
      </View>

      <ListGroup>
        <ListRow icon="📊" title="学习报告" onPress={() => open('report')} testID="pc-report" />
        <ListRow icon="📕" title="错题" detail={open_ ? `${open_} 道没掌握` : '没有'} onPress={() => open('mistakes')} testID="pc-mistakes" />
        <ListRow icon="📝" title="生成试卷" onPress={() => nav.push({ name: 'exam' })} testID="exam-entry" />
        <ListRow
          icon="📷"
          title="拍照错题"
          detail={state.photoMistakes.length ? `已存 ${state.photoMistakes.length} 道` : undefined}
          onPress={() => nav.push({ name: 'photo' })}
          testID="photo-entry"
        />
        <ListRow icon="📚" title="教材资源库" onPress={() => nav.push({ name: 'textbooks' })} testID="parent-textbooks" />
      </ListGroup>

      <ListGroup>
        <ListRow
          icon="🔤"
          title="显示拼音"
          right={
            <Switch
              value={showPinyin}
              trackColor={{ true: colors.correct, false: colors.disabled }}
              thumbColor="#FFFFFF"
              onValueChange={(v) => dispatch({ type: 'settings/set', settings: { pinyin: v ? 'on' : 'off' } })}
              testID="pinyin-switch"
            />
          }
          testID="pinyin-row"
        />
        <ListRow icon="⚙️" title="设置" detail={`${GRADE_CN[state.settings.grade] ?? ''}年级`} onPress={() => open('settings')} testID="pc-settings" />
      </ListGroup>
    </View>
  );
}

/** 学习报告：建议、各科情况、知识点、思维训练、英语主线、最近学习、薄弱点、AI 分析 */
function ReportPage() {
  const { state } = useProgress();
  const [now] = useState(() => Date.now());
  const sessions = recentSessions(state, 10);
  const weak = weakSkills(state);
  const hasData = state.results.length > 0 || state.sessions.length > 0;
  const suggestions = suggestNext(state, LESSONS, resolveExercise, now, 3);

  return (
    <View style={{ gap: space.lg }} testID="parent-report">
      <Card>
        <SectionTitle>下一步学习建议</SectionTitle>
        {suggestions.map((sg, i) => (
          <View key={i} style={styles.row} testID="suggestion-row">
            <Text style={styles.rowEmoji}>{['①', '②', '③'][i]}</Text>
            <Text style={[styles.rowTitle, { flex: 1 }]}>{describeSuggestion(sg)}</Text>
          </View>
        ))}
      </Card>

      {SUBJECTS.map((s) => {
        const st = subjectStats(state, s);
        return (
          <Card key={s}>
            <View testID={`stats-${s}`}>
              <SectionTitle>
                {subjectTheme[s].emoji} {subjectTheme[s].name}
              </SectionTitle>
              {st.sessions === 0 && st.exercises === 0 ? (
                <Text style={styles.empty}>还没有学习记录</Text>
              ) : (
                <View style={styles.grid}>
                  <Metric flat label="完成课程" value={`${st.completedLessons} 节`} />
                  <Metric flat label="完成次数" value={`${st.sessions} 次`} />
                  <Metric
                    flat
                    label="一次答对率"
                    value={st.accuracy === null ? '—' : `${st.accuracy}%`}
                    testID={`acc-${s}`}
                  />
                  <Metric flat label="学习时长" value={formatDuration(st.studySec)} />
                </View>
              )}
              {st.lastStudiedAt ? <Text style={styles.small}>最近学习：{formatDateTime(st.lastStudiedAt)}</Text> : null}
            </View>
          </Card>
        );
      })}

      <KnowledgeCard />
      <ThinkingCard />

      {/* 初中（V5.2）不显示一、二年级英语启蒙主线 */}
      {isJunior(state.settings.grade) ? null : (
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
      )}

      <Card>
        <SectionTitle>最近完成的课程</SectionTitle>
        {sessions.length === 0 ? <Text style={styles.empty}>暂无</Text> : null}
        {sessions.map((x, i) => (
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
        ))}
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

      <AiReportCard />
    </View>
  );
}

/** 错题：三科错题本入口 + 还没掌握的错题 */
function MistakesPage() {
  const nav = useNav();
  const { state } = useProgress();
  const mistakes = openMistakes(state);
  const mastered = Object.values(state.mistakes).filter((m) => m.resolved).length;
  return (
    <View style={{ gap: space.lg }} testID="parent-mistakes">
      <ListGroup>
        {(['math', 'chinese', 'english'] as const).map((sub) => (
          <ListRow
            key={sub}
            icon={subjectTheme[sub].emoji}
            title={`${subjectTheme[sub].name}错题本`}
            detail={`${openCount(state, sub)} 道`}
            onPress={() => nav.push({ name: 'mistakes', subject: sub })}
            testID={`parent-mistakes-${sub}`}
          />
        ))}
      </ListGroup>
      <Card>
        <SectionTitle>还没掌握的错题</SectionTitle>
        <Text style={styles.small}>
          已掌握 {mastered} 道 · 完成复习 {state.reviews.length} 次
        </Text>
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
    </View>
  );
}

/** 设置：年级、外观、声音、游戏、AI 老师、屏蔽的题、清除记录 */
function SettingsPage() {
  const { dispatch } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <View style={{ gap: space.lg }} testID="parent-settings">
      <GradeCard />
      <EyeCareCard />
      <AppearanceCard />
      <VoiceCheckCard />
      <GameParentCard />
      <AiCard />
      <HiddenCard />

      <Notice text="学习数据只保存在这台设备上。朗读和 AI 老师只发送要朗读的文字、题目内容和孩子的提问，不上传个人信息。" />

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

function Metric({ label, value, testID, flat }: { label: string; value: string; testID?: string; flat?: boolean }) {
  return (
    <View style={[styles.metric, flat && styles.metricFlat]}>
      <Text style={styles.metricValue} testID={testID}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  metric: { flexBasis: '46%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, borderCurve: 'continuous', padding: space.lg, ...shadow },
  metricFlat: { backgroundColor: colors.cardAlt, boxShadow: 'none', padding: space.md },
  metricValue: { fontSize: 24, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
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
  rowEmoji: { fontSize: 24, color: colors.text },
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
