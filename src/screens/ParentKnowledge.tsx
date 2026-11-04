/**
 * 家长中心 · 知识掌握情况（一年级数学知识图谱）
 * 所有结论来自真实练习记录，可展开查看判断依据。
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui';
import { getKp, KNOWLEDGE_POINTS } from '@/knowledge/graph';
import { computeMastery, countByState, MASTERY_LABEL, type MasteryState } from '@/knowledge/mastery';
import { frequentMistakeTypes, recommendKps, type KpRec } from '@/knowledge/recommend';
import { useProgress } from '@/progress/ProgressContext';
import { formatDateTime } from '@/progress/stats';
import { colors, radius, space } from '@/theme';

const STATE_COLOR: Record<MasteryState, string> = {
  'not-started': '#9C928A',
  learning: '#E08A1E',
  emerging: '#3BB273',
  'needs-review': '#E8505B',
  stable: '#F5A400',
};

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
  const mastery = computeMastery(state, now);
  const counts = countByState(mastery);
  const notMastered = KNOWLEDGE_POINTS.filter((k) => ['learning', 'needs-review'].includes(mastery[k.id].state));
  const recs = recommendKps(state, mastery, now, 6);
  const types = frequentMistakeTypes(state);
  const diags = [...state.diagnoses].reverse().slice(0, 3);

  return (
    <Card>
      <View testID="knowledge-card">
        <SectionTitle>知识掌握情况 · 一年级数学</SectionTitle>
        <Text style={styles.small}>
          共 {KNOWLEDGE_POINTS.length} 个知识点。掌握状态按真实练习计算：最近 5
          题的第一次答对率、练习次数、练习天数和距今时间。知识点及其先后关系为本项目原创，尚未经一线教师审核。
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
                          ? '#4D9DE0'
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
            还没有做过“找原因”。孩子在某个知识点反复出错时，知识小地图上会出现“找找原因”。
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
  if (lessonId.startsWith('kp:')) return '知识点练习';
  if (lessonId.startsWith('oral:')) return '口算闯关';
  if (lessonId.startsWith('bank:')) return '题库闯关';
  return '课程';
}

const styles = StyleSheet.create({
  small: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  bar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: radius.round,
    overflow: 'hidden',
    backgroundColor: '#EEE',
    marginTop: space.md,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  legendText: { fontSize: 13, fontWeight: '800' },
  h: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: space.lg, marginBottom: space.xs },
  empty: { fontSize: 14, color: colors.textSoft },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  tag: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  rowTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  dot: { fontSize: 16, marginTop: 1 },
  evidence: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  bad: { fontSize: 14, fontWeight: '800', color: colors.wrong },
});
