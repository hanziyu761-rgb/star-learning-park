import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { getLesson, LESSONS } from '@/content';
import { plainText, zh } from '@/content/zh';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, SpeakerButton, StarBadge, tapFeedback } from '@/components/ui';
import type { DisplayText, Subject } from '@/lesson/types';
import { GREETING } from '@/content/greeting';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { resolveExercise } from '@/content/resolve';
import { reviewQueue } from '@/progress/plan';
import { thinkingProfile } from '@/thinking/profile';
import { recommendedSubject } from '@/thinking/registry';
import { dayKey } from '@/progress/srs';
import { computeMastery } from '@/knowledge/mastery';
import { recommendKps } from '@/knowledge/recommend';
import { nextUp } from '@/progress/nextUp';
import { completedSubjectToday, isSameLocalDay, SUBJECTS } from '@/progress/stats';
import { speak } from '@/speech/speech';
import { colors, radius, shadow, space, subjectTheme } from '@/theme';

const SUBJECT_LABEL: Record<Subject, { text: ReturnType<typeof zh>; say: string }> = {
  math: { text: zh('数学', 'shù xué'), say: '数学' },
  chinese: { text: zh('语文', 'yǔ wén'), say: '语文' },
  english: { text: zh('英语', 'yīng yǔ'), say: '英语' },
};

/** 首页功能小方块：图标 + 名字（点了先读名字再进入） */
function Tile({
  testID,
  emoji,
  text,
  say,
  color,
  onPress,
  children,
}: {
  testID: string;
  emoji: string;
  text: DisplayText;
  say: string;
  color: string;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={say}
      onPress={() => {
        tapFeedback();
        speak({ text: say, lang: 'zh-CN' });
        onPress();
      }}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <Text style={styles.tileEmoji}>{emoji}</Text>
      <DisplayTextView text={text} size={19} color={color} nowrap />
      {children}
    </Pressable>
  );
}

export default function HomeScreen() {
  // 特别窄的手机（宽度 < 350）问候语字小一点，免得“！”单独掉到下一行
  const narrow = useWindowDimensions().width < 350;
  const nav = useNav();
  const { status, state, loadProblem, saveFailed } = useProgress();
  // 打开首页时的时间，用于判断“今天”的任务
  const [now] = useState(() => Date.now());
  if (status === 'loading') return <LoadingView />;

  const active = state.active ? getLesson(state.active.lessonId) : undefined;
  const completedLessons = LESSONS.filter((l) => (state.lessons[l.id]?.completedCount ?? 0) > 0).length;
  // 今日复习：有到期错题时出现；今天复习过且已清空则显示完成
  const reviewCount = reviewQueue(state, resolveExercise, now).length;
  const thinking = thinkingProfile(state, now);
  const reviewedToday = state.reviews.some((r) => isSameLocalDay(r.at, now));
  const showReview = reviewCount > 0 || reviewedToday;
  const todayDone =
    SUBJECTS.filter((s) => completedSubjectToday(state, s, now)).length + (showReview && reviewCount === 0 ? 1 : 0);
  const todayTotal = SUBJECTS.length + (showReview ? 1 : 0);
  // 知识小地图上需要复习 / 找原因的本领数
  const mapTodo = recommendKps(state, computeMastery(state, now), now, 10).filter(
    (r) => r.kind === 'review' || r.kind === 'diagnose',
  ).length;

  return (
    <Screen testID="home">
      {/* 顶部：吉祥物、问候、星星；点问候语或小喇叭都会读出来 */}
      <View style={styles.top}>
        <Mascot size={narrow ? 60 : 72} />
        <Pressable
          style={{ flex: 1, alignItems: 'flex-start' }}
          onPress={() => speak(GREETING)}
          accessibilityRole="button"
          accessibilityLabel={GREETING.text}
          testID="home-greeting"
        >
          <DisplayTextView text={zh('你好，', 'nǐ hǎo')} size={narrow ? 22 : 26} />
        </Pressable>
        <SpeakerButton item={GREETING} size={narrow ? 40 : 46} color={colors.parent} testID="home-greeting-speak" />
        <StarBadge count={state.totalStars} testID="total-stars" />
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
            nav.push({ name: 'lesson', id: active.id, resume: true });
          }}
          style={[styles.continue, { borderColor: subjectTheme[active.subject].color }]}
        >
          <Text style={styles.continueEmoji}>{active.emoji}</Text>
          <View style={{ flex: 1 }}>
            <DisplayTextView
              text={zh('继续学习', 'jì xù xué xí')}
              size={22}
              color={subjectTheme[active.subject].color}
            />
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
              nav.push({ name: 'subject', subject: s });
            }}
            style={({ pressed }) => [
              styles.subject,
              { backgroundColor: subjectTheme[s].color },
              pressed && styles.pressed,
            ]}
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
            {todayDone}/{todayTotal}
          </Text>
        </View>
        {showReview ? (
          <Pressable
            testID="task-review"
            accessibilityRole="button"
            onPress={() => {
              tapFeedback();
              speak({ text: '今日复习', lang: 'zh-CN' });
              nav.push({ name: 'review' });
            }}
            style={styles.task}
          >
            <Text style={styles.taskEmoji}>{reviewCount === 0 ? '✅' : '🔁'}</Text>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6 }}>
              <DisplayTextView text={zh('今日复习', 'jīn rì fù xí')} size={20} nowrap />
              {reviewCount > 0 ? (
                <Text style={styles.badge} testID="review-count">
                  {reviewCount}
                </Text>
              ) : null}
            </View>
            <DisplayTextView
              text={reviewCount === 0 ? zh('完成', 'wán chéng') : zh('去复习', 'qù fù xí')}
              size={16}
              color={reviewCount === 0 ? colors.correct : colors.primary}
            />
          </Pressable>
        ) : null}
        {SUBJECTS.map((s) => {
          const next = nextUp(state, s, now);
          const done = completedSubjectToday(state, s, now);
          return (
            <Pressable
              key={s}
              testID={`task-${s}`}
              accessibilityRole="button"
              onPress={() => next && nav.push(next.route)}
              style={styles.task}
            >
              <Text style={styles.taskEmoji}>{done ? '✅' : (next?.emoji ?? subjectTheme[s].emoji)}</Text>
              <View style={{ flex: 1 }}>
                <DisplayTextView text={next ? next.title : SUBJECT_LABEL[s].text} size={20} />
              </View>
              <Text style={[styles.go, { color: subjectTheme[s].color }]}>›</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 功能入口：2×2 小方块（V4.2 去掉说明文字，靠图标和名字） */}
      <View style={styles.tiles}>
        <Tile testID="map-entry" emoji="🗺️" text={zh('知识地图', 'zhī shi dì tú')} say="我的知识小地图" color={subjectTheme.math.color} onPress={() => nav.push({ name: 'map' })}>
          {mapTodo > 0 ? (
            <Text style={styles.badge} testID="map-todo-count">
              {mapTodo}
            </Text>
          ) : null}
        </Tile>
        <Tile testID="challenge-entry" emoji={thinking.doneToday ? '✅' : '🧩'} text={zh('每日挑战', 'měi rì tiǎo zhàn')} say="每日挑战" color="#E07A2E" onPress={() => nav.push({ name: 'challenge' })}>
          <Text style={styles.tileNote} testID="challenge-status">
            {thinking.doneToday
              ? `今天完成了${thinking.streak > 1 ? ` · 连续 ${thinking.streak} 天` : ''}`
              : `今天推荐${{ math: '数学', chinese: '语文', english: '英语' }[recommendedSubject(dayKey(now))]}`}
          </Text>
        </Tile>
        <Tile testID="games-entry" emoji="🎮" text={zh('游戏乐园', 'yóu xì lè yuán')} say="游戏乐园" color="#E8772E" onPress={() => nav.push({ name: 'games' })} />
        {/* 星星宝（AI 老师）：家长没开启时也显示入口，点了去家长中心开启（V4.2：平板上找不到入口） */}
        {state.settings.aiEnabled ? (
          <Tile testID="teacher-entry" emoji="⭐" text={zh('问星星宝', 'wèn xīng xing bǎo')} say="问问星星宝" color={colors.parent} onPress={() => nav.push({ name: 'teacher' })} />
        ) : (
          <Tile testID="teacher-setup" emoji="⭐" text={zh('问星星宝', 'wèn xīng xing bǎo')} say="请爸爸妈妈在家长中心打开星星宝" color={colors.parent} onPress={() => nav.push({ name: 'parent' })}>
            <Text style={styles.tileNote}>🔒 家长开启</Text>
          </Tile>
        )}
      </View>

      {/* 学习进度 */}
      <View style={styles.panel} testID="progress-panel">
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${(completedLessons / LESSONS.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText} testID="lessons-completed">
          {completedLessons} / {LESSONS.length} 节课
        </Text>
      </View>

      {/* 家长入口 */}
      <BigButton
        size="md"
        emoji="🔒"
        label="家长中心"
        color={colors.parent}
        onPress={() => nav.push({ name: 'parent' })}
        testID="parent-entry"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: 116,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...shadow,
  },
  tileEmoji: { fontSize: 38 },
  tileNote: { fontSize: 12, color: colors.textSoft },
  go: { fontSize: 30, fontWeight: '900' },
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
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  taskEmoji: { fontSize: 30 },
  badge: {
    minWidth: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: colors.wrong,
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    textAlign: 'center',
    overflow: 'hidden',
  },
  barBg: { height: 18, borderRadius: radius.round, backgroundColor: '#F3E9D2', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.star, borderRadius: radius.round },
  progressText: { fontSize: 16, color: colors.textSoft, fontWeight: '700' },
});
