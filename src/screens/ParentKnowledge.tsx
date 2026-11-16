/**
 * 家长中心 · 知识掌握情况（按家长设置的年级，分数学、语文、英语）
 * 所有结论来自真实练习记录，可展开查看判断依据。
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { Card, SectionTitle } from '@/components/ui';
import { getKp, KNOWLEDGE_POINTS, kpsFor, kpSubject, type KpSubject } from '@/knowledge/graph';
import { computeMastery, countByState, MASTERY_LABEL, type MasteryState } from '@/knowledge/mastery';
import { frequentMistakeTypes, recommendKps, type KpRec } from '@/knowledge/recommend';
import { useProgress } from '@/progress/ProgressContext';
import { formatDateTime } from '@/progress/stats';
import { colors, radius, space, themed } from '@/theme';
import { contentGrade, GRADE_CN } from '@/progress/grade';

const STATE_COLOR: Record<MasteryState, string> = themed(() => ({
  'not-started': colors.textSoft,
  learning: colors.orange,
  emerging: colors.correct,
  'needs-review': colors.wrong,
  stable: colors.starDeep,
}));

const SUBJECT_NAME: Record<KpSubject, string> = { math: '数学', chinese: '语文', english: '英语' };

const REC_TITLE: Record<KpRec['kind'], string> = {
  diagnose: '找原因',
  review: '复习',
  consolidate: '巩固',
  new: '学新知识',
};

export function KnowledgeCard() {
  const { state } = useProgress();
  const [now] = useState(() => Date.now());
  const [openKp, setOpenKp] = useState<string | null>(null);
  const [subject, setSubject] = useState<KpSubject>('math');
  const grade = contentGrade(state.settings.grade);
  const mastery = computeMastery(state, now);
  const gradeKps = kpsFor(subject, grade);
  const counts = countByState(Object.fromEntries(gradeKps.map((k) => [k.id, mastery[k.id]])));
  // 尚未掌握：当前年级及以下（低年级没学好的也要列出）
  const notMastered = KNOWLEDGE_POINTS.filter(
    (k) => kpSubject(k) === subject && k.grade <= grade && ['learning', 'needs-review'].includes(mastery[k.id].state),
  );
  const recs = recommendKps(state, mastery, now, 6, { subject });
  const types = frequentMistakeTypes(state);
  const diags = [...state.diagnoses].reverse().slice(0, 3);

  return (
    <Card>
      <View testID="knowledge-card">
        <SectionTitle>
          知识掌握情况 · {GRADE_CN[grade]}年级{SUBJECT_NAME[subject]}
        </SectionTitle>
        <View style={styles.tabs}>
          {(Object.keys(SUBJECT_NAME) as KpSubject[]).map((x) => (
            <Pressable
              key={x}
              onPress={() => setSubject(x)}
              style={[styles.tab, subject === x && styles.tabOn]}
              accessibilityRole="button"
              testID={`pk-subject-${x}`}
            >
              <Text style={[styles.tabText, subject === x && { color: colors.onAccent }]}>{SUBJECT_NAME[x]}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.small} testID="pk-total">
          共 {gradeKps.length} 个知识点，按真实练习计算 · 知识点为原创，已通过教师审核
        </Text>
        <View style={styles.bar}>
          {(Object.keys(counts) as MasteryState[]).map((s) =>
            counts[s] ? <View key={s} style={{ flex: counts[s], backgroundColor: STATE_COLOR[s] }} /> : null,
          )}
        </View>
        <View style={styles.legend}>
          {(Object.keys(counts) as MasteryState[]).map((s) => (
            <Text key={s} style={[styles.legendText, { color: STATE_COLOR[s] }]} testID={`count-${s}`}>
              ● {MASTERY_LABEL[s]} {counts[s]}
            </Text>
          ))}
        </View>

        <Text style={styles.h}>推荐复习计划</Text>
        {recs.length === 0 ? <Text style={styles.empty}>暂无</Text> : null}
        {recs.map((r) => (
          <View key={`${r.kind}-${r.kpId}`} style={styles.row} testID="kp-rec">
            <Text
              style={[
                styles.tag,
                {
                  backgroundColor:
                    r.kind === 'diagnose'
                      ? colors.parent
                      : r.kind === 'review'
                        ? colors.wrong
                        : r.kind === 'new'
                          ? colors.blue
                          : colors.correct,
                },
              ]}
            >
              {REC_TITLE[r.kind]}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{getKp(r.kpId)?.name}</Text>
              <Text style={styles.small}>{r.reason}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.h}>尚未掌握的知识点</Text>
        {notMastered.length === 0 ? <Text style={styles.empty}>暂无</Text> : null}
        {notMastered.map((k) => {
          const m = mastery[k.id];
          const open = openKp === k.id;
          return (
            <Pressable
              key={k.id}
              onPress={() => setOpenKp(open ? null : k.id)}
              style={styles.row}
              accessibilityRole="button"
              testID="kp-not-mastered"
            >
              <Text style={[styles.dot, { color: STATE_COLOR[m.state] }]}>●</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {k.name} · {MASTERY_LABEL[m.state]}
                </Text>
                <Text style={styles.small}>{open ? m.reasons.join('；') : `${m.reasons[0]}（点开看依据）`}</Text>
                {open
                  ? m.evidence.map((e, i) => (
                      <Text key={i} style={styles.evidence}>
                        {e.correct ? '✓' : '✗'} {formatDateTime(e.at)} · {sourceLabel(e.source, e.lessonId)}
                      </Text>
                    ))
                  : null}
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.h}>前置知识薄弱点（找原因的结果）</Text>
        {diags.length === 0 ? (
          <Text style={styles.empty}>
            暂无
          </Text>
        ) : null}
        {diags.map((d, i) => (
          <View key={i} style={styles.row} testID="diag-row">
            <Text style={styles.dot}>🔍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {formatDateTime(d.at)} · 从「{getKp(d.target)?.name}」查起，做了 {d.questionCount} 题
              </Text>
              <Text style={styles.small}>
                {d.roots.length
                  ? `需要先补：${d.roots.map((r) => getKp(r)?.name).join('、')}`
                  : d.verdicts[d.target] === 'mastered'
                    ? '目标知识点重新测试都答对了，之前的错误可能是粗心或还不熟练'
                    : '没有发现明确的前置薄弱点'}
                {Object.entries(d.verdicts).some(([, v]) => v === 'shaky')
                  ? `；不太稳：${Object.entries(d.verdicts)
                      .filter(([, v]) => v === 'shaky')
                      .map(([k]) => getKp(k)?.name)
                      .join('、')}`
                  : ''}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.h}>经常做错的题型</Text>
        {types.length === 0 ? <Text style={styles.empty}>暂无（同一题型至少错 2 次才会列出）</Text> : null}
        {types.map((t) => (
          <View key={t.label} style={styles.row} testID="mistake-type">
            <Text style={[styles.rowTitle, { flex: 1 }]}>{t.label}</Text>
            <Text style={styles.bad}>
              错 {t.wrong} / {t.total}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function sourceLabel(source: string, lessonId: string): string {
  if (source === 'diagnose') return '找原因';
  if (source === 'review') return '今日复习';
  if (source === 'game' || lessonId.startsWith('game:')) return '游戏乐园';
  if (lessonId.startsWith('kp:')) return '知识点练习';
  if (lessonId.startsWith('mix:')) return '今日一练';
  if (lessonId.startsWith('oral:')) return '口算闯关';
  if (lessonId.startsWith('bank:')) return '题库闯关';
  return '课程';
}

const styles = themed(() => StyleSheet.create({
  tabs: { flexDirection: 'row', gap: space.sm, marginVertical: space.xs },
  tab: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.parent,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: colors.parent },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.parent },
  small: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  bar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: radius.round,
    overflow: 'hidden',
    backgroundColor: colors.line,
    marginTop: space.md,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  legendText: { fontSize: 13, fontWeight: '600', color: colors.text },
  h: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: space.lg, marginBottom: space.xs },
  empty: { fontSize: 14, color: colors.textSoft },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tag: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  dot: { fontSize: 16, marginTop: 1, color: colors.text },
  evidence: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  bad: { fontSize: 14, fontWeight: '600', color: colors.wrong },
}));
