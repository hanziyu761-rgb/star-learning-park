/**
 * 错题本（V2.21）：数学、语文、英语各一本。
 * - 还没掌握 / 已经掌握两栏，每道题显示来自哪里、错过几次、最近一次答错的日期
 * - “重做错题”：马上把这一科还没掌握的错题再做一遍（最多 10 道）
 * - “打印错题”：排成 A4 错题单，可选附答案页；互动题注明“请在 APP 里重做”
 * 只来自真实答题记录。
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { resolveExercise, mistakeLabel } from '@/content/resolve';
import { zh } from '@/content/zh';
import { printHtml } from '@/exam/print';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import type { Subject } from '@/lesson/types';
import { entryTitle, kindName, mistakeBook, mistakeBookHtml, printable, SUBJECT_CN, type BookEntry } from '@/mistakes/book';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { formatDateTime } from '@/progress/stats';
import { clickTime } from '@/words/session';
import { colors, radius, space, subjectTheme } from '@/theme';
import { contentGrade } from '@/progress/grade';

const TITLE = {
  math: zh('数学错题本', 'shù xué cuò tí běn'),
  chinese: zh('语文错题本', 'yǔ wén cuò tí běn'),
  english: zh('英语错题本', 'yīng yǔ cuò tí běn'),
};

const day = (ts: number) => {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

export default function MistakesScreen({ subject }: { subject: Subject }) {
  const nav = useNav();
  const { status, state } = useProgress();
  const [tab, setTab] = useState<'open' | 'mastered'>('open');
  const [withAnswers, setWithAnswers] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (status === 'loading') return <LoadingView />;
  const theme = subjectTheme[subject] ?? subjectTheme.math;
  const book = mistakeBook(state, subject, resolveExercise);
  const list = tab === 'open' ? book.open : book.mastered;
  const grade = contentGrade(state.settings.grade);

  const print = async () => {
    setError(null);
    setPrinting(true);
    try {
      await printHtml(mistakeBookHtml(subject, book.open, { grade, withAnswers, date: formatDateTime(clickTime()) }));
    } catch (e) {
      setError(`打印没有完成：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Screen bg={theme.soft} testID="mistakes-screen">
      <Header title={grade <= 2 ? TITLE[subject] : `${SUBJECT_CN[subject]}错题本`} onBack={nav.back} />

      <View style={[styles.summary, { borderColor: theme.color }]}>
        <View style={styles.stat}>
          <Text style={[styles.num, { color: colors.wrong }]} testID="mistakes-open-count">
            {book.open.length}
          </Text>
          <Text style={styles.statLabel}>还没掌握</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.num, { color: colors.correct }]} testID="mistakes-mastered-count">
            {book.mastered.length}
          </Text>
          <Text style={styles.statLabel}>已经掌握</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => nav.push({ name: 'review', subject })}
          disabled={book.open.length === 0}
          style={[styles.action, { backgroundColor: theme.color }, book.open.length === 0 && styles.disabled]}
          accessibilityRole="button"
          testID="mistakes-redo"
        >
          <Text style={styles.actionText}>✏️ 重做错题</Text>
        </Pressable>
        <Pressable
          onPress={print}
          disabled={book.open.length === 0 || printing}
          style={[styles.action, styles.printBtn, book.open.length === 0 && styles.disabled]}
          accessibilityRole="button"
          testID="mistakes-print"
        >
          {printing ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>🖨️ 打印错题</Text>}
        </Pressable>
      </View>
      <View style={styles.answerRow}>
        <Text style={styles.small}>打印附答案</Text>
        <Switch value={withAnswers} onValueChange={setWithAnswers} testID="mistakes-with-answers" />
      </View>
      {error ? <Notice text={error} /> : null}
      {state.photoMistakes.some((m) => m.subject === subject) ? (
        <Pressable onPress={() => nav.push({ name: 'photo' })} accessibilityRole="button" testID="mistakes-photo-link">
          <Text style={styles.small}>
            📷 拍照错题 {state.photoMistakes.filter((m) => m.subject === subject).length} 道 ›
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.tabs}>
        {(['open', 'mastered'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && { backgroundColor: theme.color }]}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === t }}
            testID={`mistakes-tab-${t}`}
          >
            <Text style={[styles.tabText, tab === t && { color: '#fff' }]}>
              {t === 'open' ? `还没掌握（${book.open.length}）` : `已经掌握（${book.mastered.length}）`}
            </Text>
          </Pressable>
        ))}
      </View>

      {list.length === 0 ? (
        <View style={styles.empty} testID="mistakes-empty">
          <Mascot size={100} mood="cheer" />
          {tab === 'open' ? (
            <DisplayTextView text={zh('没有要重做的错题，真棒！', 'méi yǒu yào chóng zuò de cuò tí zhēn bàng')} size={22} />
          ) : null}
        </View>
      ) : (
        list.map((en) => <EntryCard key={en.mistake.key} en={en} color={theme.color} />)
      )}
    </Screen>
  );
}

function EntryCard({ en, color }: { en: BookEntry; color: string }) {
  const m = en.mistake;
  const onPaper = en.exercise ? printable(en.exercise) !== null : false;
  return (
    <View style={[styles.card, { borderLeftColor: m.resolved ? colors.correct : color }]} testID="mistake-entry">
      <Text style={styles.cardTitle} numberOfLines={3}>
        {entryTitle(en, mistakeLabel(m.lessonId, m.exerciseId))}
      </Text>
      <Text style={styles.small}>
        {en.source ? `来自：${en.source} · ` : ''}错过 {m.wrongCount} 次 · 最近 {day(m.lastWrongAt)}
      </Text>
      {en.exercise && !onPaper ? (
        <Text style={[styles.tag, { color }]} testID="mistake-app-only">
          {kindName(en.exercise)} · 只能在 APP 里重做
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 3,
    paddingVertical: space.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  num: { fontSize: 40, fontWeight: '900' },
  statLabel: { fontSize: 15, fontWeight: '800', color: colors.textSoft },
  actions: { flexDirection: 'row', gap: space.md },
  action: { flex: 1, minHeight: 60, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  printBtn: { backgroundColor: '#7A5AF8' },
  disabled: { opacity: 0.4 },
  actionText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  answerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  tabs: { flexDirection: 'row', gap: space.sm, backgroundColor: '#fff', borderRadius: radius.round, padding: 4 },
  tab: { flex: 1, borderRadius: radius.round, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 15, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderLeftWidth: 6,
    padding: space.md,
    gap: 4,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, lineHeight: 24 },
  small: { fontSize: 13, color: colors.textSoft, lineHeight: 19, flexShrink: 1 },
  tag: { fontSize: 12, fontWeight: '800' },
  note: { fontSize: 12, color: '#888', lineHeight: 18 },
});
