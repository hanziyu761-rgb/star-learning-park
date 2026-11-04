/**
 * 学科页下方的“口算闯关”和“题库闯关”列表。
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BANK_SOURCE, bankLessonId, booksFor, editionText, loadBook, unitBadge } from '@/content/bank';
import { oralLessonId, topicsForGrade } from '@/content/oral';
import { kpLabel, getKp } from '@/knowledge/graph';
import { CONTENT_REVIEW, GRAPHICS_GENERATORS, GRAPHICS_KPS } from '@/knowledge/graphics';
import { zh } from '@/content/zh';
import { DisplayTextView } from '@/components/PinyinText';
import { Stars, tapFeedback } from '@/components/ui';
import type { Subject } from '@/lesson/types';
import { useNav } from '@/nav/Nav';
import type { ProgressState } from '@/progress/model';
import { speak } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, shadow, space, subjectTheme } from '@/theme';

const GRADE_CN = ['', '一', '二', '三', '四', '五', '六'];
const GRADE_PY = ['', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù'];

function doneCount(state: ProgressState, lessonId: string): number {
  return new Set(state.results.filter((r) => r.lessonId === lessonId).map((r) => r.exerciseId)).size;
}

export function OralSection({ state }: { state: ProgressState }) {
  const nav = useNav();
  const topics = topicsForGrade(state.settings.grade);
  return (
    <View style={styles.card} testID="oral-section">
      <DisplayTextView text={zh('口算闯关', 'kǒu suàn chuǎng guān')} size={24} />
      <Text style={styles.meta}>每轮 10 题，题目由程序生成，答案保证正确</Text>
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
              <DisplayTextView text={zh(t.title, t.titlePy)} size={16} />
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
        <View style={[styles.gradePill, { backgroundColor: '#FFF1D6' }]}>
          <Text style={styles.review}>{CONTENT_REVIEW}</Text>
        </View>
      </View>
      <Text style={styles.meta}>拖一拖、点一点、拨一拨：位置、图形、钟表、分类、找规律（本项目原创题）</Text>
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
  const grade = state.settings.grade;
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
            ? `${GRADE_CN[grade]}年级暂无英语题库（题库从三年级开始）。可以先学上面的英语课。`
            : `${GRADE_CN[grade]}年级暂无题库。`}
        </Text>
      ) : (
        <>
          <Text style={styles.meta}>
            共 {total} 题 · 年级由家长在家长中心设置 · {BANK_SOURCE}
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

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.lg, gap: space.sm, ...shadow },
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
    backgroundColor: '#E3F1FC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    gap: 2,
  },
  tileEmoji: { fontSize: 28 },
  gTile: { backgroundColor: '#FFF6E0', flexBasis: '30%', minWidth: 140 },
  review: { fontSize: 12, fontWeight: '800', color: '#B26A00' },
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
    fontWeight: '800',
    color: colors.text,
  },
  unitTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  unitMeta: { fontSize: 12, color: colors.textSoft },
  go: { fontSize: 18, fontWeight: '900' },
});
