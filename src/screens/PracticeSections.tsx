/**
 * 学科页下方的“口算闯关”和“题库闯关”列表；初中的章节 / 单元 / 语法练习（V5.2）。
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { BANK_SOURCE, bankLessonId, booksFor, editionText, loadBook, unitBadge } from '@/content/bank';
import { oralLessonId, topicsForGrade } from '@/content/oral';
import { ALL_WRITE_SETS, writeLessonId, writeSetGrade } from '@/content/writing';
import { kpLabel, getKp, kpsFor } from '@/knowledge/graph';
import { computeMastery, type MasteryState } from '@/knowledge/mastery';
import { CONTENT_REVIEW, GRAPHICS_GENERATORS, GRAPHICS_KPS } from '@/knowledge/graphics';
import { zh } from '@/content/zh';
import { DisplayTextView } from '@/components/PinyinText';
import { Stars, tapFeedback } from '@/components/ui';
import type { Subject } from '@/lesson/types';
import { useNav } from '@/nav/Nav';
import type { ProgressState } from '@/progress/model';
import { speak } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, shadow, space, subjectTheme, themed } from '@/theme';
import { contentGrade, GRADE_CN, GRADE_PY } from '@/progress/grade';


function doneCount(state: ProgressState, lessonId: string): number {
  return new Set(state.results.filter((r) => r.lessonId === lessonId).map((r) => r.exerciseId)).size;
}

export function OralSection({ state }: { state: ProgressState }) {
  const nav = useNav();
  const topics = topicsForGrade(contentGrade(state.settings.grade));
  return (
    <View style={styles.card} testID="oral-section">
      <DisplayTextView text={zh('口算闯关', 'kǒu suàn chuǎng guān')} size={24} />
      <View style={styles.grid}>
        {topics.map((t) => {
          const id = oralLessonId(t.id);
          const best = state.lessons[id]?.bestStars ?? 0;
          return (
            <Pressable
              key={t.id}
              testID={`oral-${t.id}`}
              accessibilityRole="button"
              onPress={() => {
                tapFeedback();
                speak({ text: t.title, lang: 'zh-CN' });
                nav.push({ name: 'practice', id });
              }}
              style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.96 }] }]}
            >
              <Text style={styles.tileEmoji}>{t.emoji}</Text>
              <DisplayTextView text={t.titlePy ? zh(t.title, t.titlePy) : t.title} size={16} />
              <Stars value={best} size={14} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** 描红写字：按笔顺一笔一笔描（V2.9，原创笔画数据，待教师审核） */
export function WriteSection({ state }: { state: ProgressState }) {
  const nav = useNav();
  return (
    <View style={styles.card} testID="write-section">
      <DisplayTextView text={zh('描红写字', 'miáo hóng xiě zì')} size={24} />
      <View style={styles.grid}>
        {ALL_WRITE_SETS.map((set, i) => {
          // 一年级只显示一年级的 4 组；二年级起 8 组都显示（V2.14）
          if (writeSetGrade(i + 1) > Math.max(1, Math.min(contentGrade(state.settings.grade), 2))) return null;
          const id = writeLessonId(i + 1);
          const best = state.lessons[id]?.bestStars ?? 0;
          return (
            <Pressable
              key={id}
              testID={`write-set-${i + 1}`}
              accessibilityRole="button"
              onPress={() => {
                tapFeedback();
                nav.push({ name: 'practice', id });
              }}
              style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.96 }] }]}
            >
              <Text style={styles.writeChars}>{set.map((c) => c.char).join(' ')}</Text>
              <Text style={styles.meta}>{writeSetGrade(i + 1) === 1 ? '一年级' : '二年级'}</Text>
              <Stars value={best} size={14} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** 图形乐园：位置、图形、钟表、分类、找规律（V2.1 原创互动题，待教师审核） */
export function GraphicsSection({ state }: { state: ProgressState }) {
  const nav = useNav();
  return (
    <View style={styles.card} testID="graphics-section">
      <View style={styles.titleRow}>
        <DisplayTextView text={zh('图形乐园', 'tú xíng lè yuán')} size={24} />
        <View style={[styles.gradePill, { backgroundColor: colors.orangeSoft }]}>
          <Text style={styles.review}>{CONTENT_REVIEW}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {GRAPHICS_KPS.map((kpId) => {
          const k = getKp(kpId)!;
          const id = `kp:${kpId}`;
          const done = doneCount(state, id);
          const total = GRAPHICS_GENERATORS[kpId].sigs.length;
          return (
            <Pressable
              key={kpId}
              testID={`graphics-${kpId}`}
              accessibilityRole="button"
              onPress={() => {
                tapFeedback();
                speak({ text: k.kidName, lang: 'zh-CN' });
                nav.push({ name: 'practice', id });
              }}
              style={({ pressed }) => [styles.tile, styles.gTile, pressed && { transform: [{ scale: 0.96 }] }]}
            >
              <Text style={styles.tileEmoji}>{k.emoji}</Text>
              <DisplayTextView text={kpLabel(k)} size={16} />
              <Text style={styles.unitMeta}>
                已练 {Math.min(done, total)}/{total}
              </Text>
              <Stars value={state.lessons[id]?.bestStars ?? 0} size={14} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function BankSection({ subject, state }: { subject: Subject; state: ProgressState }) {
  const nav = useNav();
  const grade = contentGrade(state.settings.grade);
  const books = booksFor(subject, grade);
  const [openBook, setOpenBook] = useState<string | null>(books[0]?.id ?? null);
  const theme = subjectTheme[subject];
  const total = books.reduce((s, b) => s + b.questions, 0);

  return (
    <View style={styles.card} testID="bank-section">
      <View style={styles.titleRow}>
        <DisplayTextView text={zh('题库闯关', 'tí kù chuǎng guān')} size={24} />
        <View style={[styles.gradePill, { backgroundColor: theme.soft }]}>
          <DisplayTextView
            text={zh(`${GRADE_CN[grade]}年级`, `${GRADE_PY[grade]} nián jí`)}
            size={15}
            color={theme.color}
          />
        </View>
      </View>
      {books.length === 0 ? (
        <Text style={styles.empty} testID="bank-empty">
          {subject === 'english'
            ? '英语题库从三年级开始'
            : `${GRADE_CN[grade]}年级暂无题库。`}
        </Text>
      ) : (
        <>
          <Text style={styles.meta}>
            {total} 题 · {BANK_SOURCE}
          </Text>
          {books.map((b) => {
            const open = openBook === b.id;
            const book = open ? loadBook(b.id) : undefined;
            return (
              <View key={b.id}>
                <Pressable
                  onPress={() => setOpenBook(open ? null : b.id)}
                  style={[styles.bookRow, { borderColor: theme.color }]}
                  accessibilityRole="button"
                  testID={`book-${b.id}`}
                >
                  <DisplayTextView
                    text={zh(`${b.term}册`, b.term === '上' ? 'shàng cè' : 'xià cè')}
                    size={20}
                    color={theme.color}
                  />
                  <Text style={styles.bookMeta} testID={`book-meta-${b.id}`}>
                    {b.units} 个单元 · {b.questions} 题 · {editionText(b.id)}
                  </Text>
                  <Text style={styles.chev}>{open ? '▲' : '▼'}</Text>
                </Pressable>
                {book?.units.map((u) => {
                  const id = bankLessonId(u.id);
                  const done = doneCount(state, id);
                  const best = state.lessons[id]?.bestStars ?? 0;
                  return (
                    <Pressable
                      key={u.id}
                      testID={`unit-${u.id}`}
                      accessibilityRole="button"
                      onPress={() => {
                        tapFeedback();
                        nav.push({ name: 'practice', id });
                      }}
                      style={styles.unitRow}
                    >
                      <Text style={styles.unitNo}>{unitBadge(u)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.unitTitle}>{u.title}</Text>
                        <Text style={styles.unitMeta}>
                          已练 {Math.min(done, u.questions.length)}/{u.questions.length}
                        </Text>
                      </View>
                      <Stars value={best} size={14} />
                      <Text style={[styles.go, { color: theme.color }]}>▶</Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.sm, ...shadow },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gradePill: { borderRadius: radius.round, paddingHorizontal: space.md, paddingVertical: 2 },
  meta: { fontSize: 12, color: colors.textSoft },
  empty: { fontSize: 15, color: colors.textSoft, paddingVertical: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: MIN_TOUCH * 1.6,
    borderRadius: radius.md,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    gap: 2,
  },
  tileEmoji: { fontSize: 28, color: colors.text },
  writeChars: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: 2 },
  gTile: { backgroundColor: colors.orangeSoft, flexBasis: '30%', minWidth: 140 },
  review: { fontSize: 12, fontWeight: '600', color: colors.orange },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: MIN_TOUCH,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    marginTop: space.sm,
  },
  bookMeta: { flex: 1, fontSize: 14, color: colors.textSoft },
  chev: { fontSize: 16, color: colors.textSoft },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: MIN_TOUCH,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: space.sm,
  },
  unitNo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
    color: colors.text,
  },
  unitTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  unitMeta: { fontSize: 12, color: colors.textSoft },
  go: { fontSize: 18, fontWeight: '700', color: colors.text },
}));

const JUNIOR_STATE: Record<MasteryState, string> = {
  'not-started': '没练过',
  learning: '在学',
  emerging: '初步掌握',
  'needs-review': '要复习',
  stable: '已掌握',
};

/**
 * 初中知识点练习（V5.2）：本年级上、下册的全部知识点（数学一章一个、语文一个单元一个、英语一个语法点一个），
 * 点进去先看小讲解再练习。掌握情况来自真实练习记录。
 */
export function JuniorKpSection({ subject, state }: { subject: Subject; state: ProgressState }) {
  const nav = useNav();
  const grade = contentGrade(state.settings.grade);
  const [now] = useState(() => Date.now());
  const mastery = useMemo(() => computeMastery(state, now), [state, now]);
  const theme = subjectTheme[subject];
  const kps = kpsFor(subject, grade);
  if (grade < 7 || kps.length === 0) return null;
  const learned = kps.filter((k) => mastery[k.id]?.state === 'stable').length;
  return (
    <View style={styles.card} testID="junior-kps">
      <View style={styles.titleRow}>
        <Text style={jStyles.jTitle}>{subject === 'english' ? '语法闯关' : subject === 'math' ? '章节练习' : '单元练习'}</Text>
        <View style={[styles.gradePill, { backgroundColor: theme.soft }]}>
          <Text style={[jStyles.jPill, { color: theme.color }]}>{GRADE_CN[grade]}年级</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        掌握 {learned}/{kps.length} · 原创题目（答案{subject === 'math' ? '由程序计算' : '人工编写'}），待教师审核
      </Text>
      {(['上', '下'] as const).map((term) => {
        const list = kps.filter((k) => k.term === term);
        if (!list.length) return null;
        return (
          <View key={term}>
            <Text style={[jStyles.jTerm, { color: theme.color }]}>{term}册</Text>
            {list.map((k) => (
              <Pressable
                key={k.id}
                testID={`jkp-${k.id}`}
                accessibilityRole="button"
                onPress={() => {
                  tapFeedback();
                  nav.push({ name: 'practice', id: `kp:${k.id}` });
                }}
                style={styles.unitRow}
              >
                <Text style={styles.tileEmoji}>{k.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unitTitle}>{k.kidName}</Text>
                  <Text style={styles.unitMeta} numberOfLines={2}>
                    {JUNIOR_STATE[mastery[k.id]?.state ?? 'not-started']} · {k.canDo}
                  </Text>
                </View>
                <Text style={[styles.go, { color: theme.color }]}>▶</Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const jStyles = themed(() => StyleSheet.create({
  jTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  jPill: { fontSize: 15, fontWeight: '600', color: colors.text },
  jTerm: { fontSize: 15, fontWeight: '700', marginTop: space.sm, color: colors.text },
}));
