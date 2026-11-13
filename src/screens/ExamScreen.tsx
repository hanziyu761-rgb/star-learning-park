/**
 * 家长中心 · 试卷生成：选择学科、年级、上下册、单元和题量，随时生成一套试卷，预览并打印（或存成 PDF）。
 */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { editionText, loadBook, unitBadge } from '@/content/bank';
import { DisplayTextView } from '@/components/PinyinText';
import { isParentUnlocked, markParentUnlocked, ParentGate } from '@/components/ParentGate';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { BigButton, Card, SectionTitle } from '@/components/ui';
import { VisualView } from '@/components/Figure';
import { bookIdOf, buildExam, hasBook, newSeed, SIZE_INFO, type Exam, type ExamSize } from '@/exam/build';
import { examHtml } from '@/exam/html';
import { printHtml } from '@/exam/print';
import type { KpSubject } from '@/knowledge/graph';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { formatDateTime } from '@/progress/stats';
import { colors, radius, space } from '@/theme';
import { contentGrade } from '@/progress/grade';

const GRADE_CN = ['', '一', '二', '三', '四', '五', '六'];
const SUBJECTS: { id: KpSubject; name: string }[] = [
  { id: 'math', name: '数学' },
  { id: 'chinese', name: '语文' },
  { id: 'english', name: '英语' },
];
const SIZES: ExamSize[] = [20, 25, 50];
const LETTERS = 'ABCD';

export default function ExamScreen() {
  const { status } = useProgress();
  const nav = useNav();
  const [passed, setPassed] = useState(isParentUnlocked);
  if (status === 'loading') return <LoadingView />;
  return (
    <Screen bg="#F2F1FF" testID="exam-screen">
      <Header title="试卷生成" onBack={nav.back} />
      {passed ? (
        <ExamBody />
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

function Chip({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      testID={testID}
    >
      <Text style={[styles.chipText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

function ExamBody() {
  const { state } = useProgress();
  const [subject, setSubject] = useState<KpSubject>('math');
  const [grade, setGrade] = useState(contentGrade(state.settings.grade));
  const [term, setTerm] = useState<'上' | '下'>('上');
  const [units, setUnits] = useState<string[]>([]);
  const [size, setSize] = useState<ExamSize>(25);
  const [withAnswers, setWithAnswers] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cfgBase = { subject, grade, term };
  const available = hasBook(cfgBase);
  const book = useMemo(() => (available ? loadBook(bookIdOf(cfgBase)) : undefined), [available, subject, grade, term]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setExam(null);
    setUnits([]);
    setError(null);
  };
  const generate = (seed = newSeed()) => {
    try {
      setError(null);
      setExam(buildExam({ subject, grade, term, units, size, seed, hidden: state.hidden }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const print = async () => {
    if (!exam) return;
    setPrinting(true);
    try {
      await printHtml(examHtml(exam, { withAnswers, date: formatDateTime(Date.now()) }));
    } catch (e) {
      setError(`打印没有完成：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={{ gap: space.lg }}>
      <Card>
        <SectionTitle>选择试卷内容</SectionTitle>
        <Text style={styles.label}>学科</Text>
        <View style={styles.chips}>
          {SUBJECTS.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              on={subject === s.id}
              onPress={() => (setSubject(s.id), reset())}
              testID={`exam-subject-${s.id}`}
            />
          ))}
        </View>
        <Text style={styles.label}>年级</Text>
        <View style={styles.chips}>
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <Chip
              key={g}
              label={`${GRADE_CN[g]}年级`}
              on={grade === g}
              onPress={() => (setGrade(g), reset())}
              testID={`exam-grade-${g}`}
            />
          ))}
        </View>
        <Text style={styles.label}>上册 / 下册</Text>
        <View style={styles.chips}>
          {(['上', '下'] as const).map((t) => (
            <Chip
              key={t}
              label={`${t}册`}
              on={term === t}
              onPress={() => (setTerm(t), reset())}
              testID={`exam-term-${t}`}
            />
          ))}
        </View>
        {available && book ? (
          <>
            <Text style={styles.label}>范围</Text>
            <Text style={styles.small} testID="exam-edition">
              单元编排：{editionText(bookIdOf(cfgBase))}
            </Text>
            <View style={styles.chips}>
              <Chip
                label="全册"
                on={units.length === 0}
                onPress={() => (setUnits([]), setExam(null))}
                testID="exam-unit-all"
              />
              {book.units.map((u) => (
                <Chip
                  key={u.id}
                  label={/\d/.test(unitBadge(u)) ? `${u.no}. ${u.title}` : u.title}
                  on={units.includes(u.id)}
                  onPress={() => {
                    setExam(null);
                    setUnits((x) => (x.includes(u.id) ? x.filter((y) => y !== u.id) : [...x, u.id]));
                  }}
                  testID={`exam-unit-${u.no}`}
                />
              ))}
            </View>
            <Text style={styles.label}>题量</Text>
            <View style={styles.chips}>
              {SIZES.map((n) => (
                <Chip
                  key={n}
                  label={`${SIZE_INFO[n].name} ${n} 题（每题 ${100 / n} 分）`}
                  on={size === n}
                  onPress={() => (setSize(n), setExam(null))}
                  testID={`exam-size-${n}`}
                />
              ))}
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.label}>附参考答案</Text>
              <Switch value={withAnswers} onValueChange={setWithAnswers} testID="exam-with-answers" />
            </View>
            <BigButton
              emoji="📝"
              label="生成试卷"
              color={colors.parent}
              onPress={() => generate()}
              testID="exam-generate"
            />
          </>
        ) : (
          <Notice
            text={
              subject === 'english' && grade <= 2
                ? '英语试卷从三年级开始（人教版 PEP 三年级起点）。'
                : `${GRADE_CN[grade]}年级${term}册暂无题目。`
            }
          />
        )}
        <Text style={styles.small}>
          题库题为 AI 生成，未逐题人工审核，打印前请过目
        </Text>
      </Card>

      {error ? <Notice text={error} tone="warn" /> : null}

      {exam ? (
        <Card>
          <View testID="exam-preview">
            <DisplayTextView text={exam.title} size={22} />
            <Text style={styles.small} testID="exam-code">
              试卷编号 {exam.code} · {exam.scopeText} · 共 {exam.sections.reduce((s, x) => s + x.items.length, 0)}{' '}
              题，每题 {exam.perPoint} 分
            </Text>
            <View style={styles.btnRow}>
              <BigButton
                emoji="🖨️"
                label={printing ? '正在打开打印…' : '打印 / 存成 PDF'}
                color={colors.correct}
                size="md"
                onPress={print}
                disabled={printing}
                testID="exam-print"
                style={{ flex: 1 }}
              />
              <BigButton
                emoji="🔄"
                label="换一套"
                color={colors.parent}
                size="md"
                onPress={() => generate()}
                testID="exam-again"
                style={{ flex: 1 }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.label}>预览时显示答案</Text>
              <Switch value={showAnswers} onValueChange={setShowAnswers} testID="exam-show-answers" />
            </View>
            {exam.sections.map((s, si) => (
              <View key={s.kind} style={styles.section} testID={`exam-section-${s.kind}`}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionNo}>{'一二三四'[si]}、</Text>
                  <DisplayTextView text={s.title} size={18} />
                  <Text style={styles.small}>（{s.items.length} 题）</Text>
                </View>
                {s.items.map((it, i) => (
                  <View key={it.id} style={styles.item} testID="exam-item">
                    <View style={styles.itemHead}>
                      <Text style={styles.no}>{i + 1}.</Text>
                      <View style={{ flex: 1, alignItems: 'flex-start', gap: 2 }}>
                        {it.stem.map((t, k) => (
                          <DisplayTextView key={k} text={t} size={16} style={{ textAlign: 'left' }} />
                        ))}
                        {it.stemVisual ? <VisualView visual={it.stemVisual} size={26} figureSize={70} /> : null}
                        {it.options ? (
                          <View style={styles.opts}>
                            {it.options.map((o, k) => (
                              <View key={k} style={styles.opt}>
                                <Text style={styles.optLetter}>
                                  {it.kind === 'order' ? '①②③④⑤⑥⑦⑧'[k] : `${LETTERS[k]}.`}
                                </Text>
                                {o.visual ? <VisualView visual={o.visual} size={20} figureSize={40} /> : null}
                                {o.text !== undefined ? (
                                  <DisplayTextView text={o.text} size={15} style={{ textAlign: 'left' }} />
                                ) : null}
                              </View>
                            ))}
                          </View>
                        ) : null}
                        {showAnswers ? <Text style={styles.answer}>答案：{it.answer}</Text> : null}
                      </View>
                      <Text style={styles.srcTag}>{it.source === 'original' ? '原创' : '题库'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
            <Text style={styles.small}>{exam.sourceNote}</Text>
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: space.sm },
  small: { fontSize: 12, color: colors.textSoft, marginTop: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  chip: {
    paddingHorizontal: space.md,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.parent,
    backgroundColor: '#fff',
    maxWidth: '100%',
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: colors.parent },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.parent },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: space.sm },
  btnRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  section: { marginTop: space.md, gap: space.xs },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  sectionNo: { fontSize: 18, fontWeight: '900', color: colors.text },
  item: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: space.xs },
  itemHead: { flexDirection: 'row', gap: space.xs, alignItems: 'flex-start' },
  no: { fontSize: 16, fontWeight: '800', color: colors.text, minWidth: 26 },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optLetter: { fontSize: 15, fontWeight: '800', color: colors.textSoft },
  answer: { fontSize: 13, fontWeight: '800', color: colors.correct },
  srcTag: {
    fontSize: 11,
    color: colors.textSoft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    paddingHorizontal: 4,
  },
});
