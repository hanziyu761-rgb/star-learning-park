/**
 * 家长中心 · 教材资源库（V4.0）：按真实数据显示每套教材、每一册的建设情况。
 * - 目录来源：已核实（官方来源）/ 待核实（二手或开源题库）/ 未录入，绝不把待核实算成已核实
 * - 课时、知识点、原创课程、练习题、典型例题按实际数量统计；只有目录的教材不算完整
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '@/components/Screen';
import type { Subject } from '@/lesson/types';
import { useNav } from '@/nav/Nav';
import { EDITIONS } from '@/textbooks/editions';
import { completeness, isComplete, summary, volumesFor } from '@/textbooks/registry';
import type { Volume } from '@/textbooks/types';
import { colors, radius, space } from '@/theme';

const SUBJECTS: { id: Subject; name: string }[] = [
  { id: 'chinese', name: '语文' },
  { id: 'math', name: '数学' },
  { id: 'english', name: '英语' },
];
const TOC = {
  verified: { text: '目录已核实', color: '#2E8B57' },
  original: { text: '原创', color: '#4D9DE0' },
  pending: { text: '目录待核实', color: '#D9822B' },
  none: { text: '目录未录入', color: '#999' },
} as const;
const STATUS = { current: '现行', historical: '历史版本', upcoming: '即将启用', unknown: '状态待核实' } as const;

export default function TextbooksScreen() {
  const nav = useNav();
  const [subject, setSubject] = useState<Subject>('chinese');
  const [grade, setGrade] = useState(0);
  const s = summary();
  const editions = EDITIONS.filter((e) => e.subject === subject);

  return (
    <Screen bg="#F6F8FB" testID="textbooks-screen">
      <Header title="教材资源库" onBack={nav.back} />
      <View style={styles.card} testID="textbooks-summary">
        <Text style={styles.h}>目前的真实情况</Text>
        <Text style={styles.p}>
          登记教材版本 {s.editions} 套；新版教材册次 {s.volumes} 册（目录已核实 {s.verifiedVolumes} 册）；现有题库 {s.bankVolumes} 册（旧版单元，目录待核实）。
          已核实的课时目录 {s.lessons.verified} 条。
        </Text>
        <Text style={styles.small}>
          “已核实”只算与官方来源（出版社、国家中小学智慧教育平台电子课本、教育部门文件）逐条核对过的目录；二手资料和开源题库一律算“待核实”。
        </Text>
      </View>

      <View style={styles.chips}>
        {SUBJECTS.map((x) => (
          <Chip key={x.id} on={subject === x.id} text={x.name} onPress={() => setSubject(x.id)} testID={`tb-subject-${x.id}`} />
        ))}
      </View>
      <View style={styles.chips}>
        {[0, 1, 2, 3, 4, 5, 6].map((g) => (
          <Chip key={g} on={grade === g} text={g ? `${g}年级` : '全部'} onPress={() => setGrade(g)} testID={`tb-grade-${g}`} />
        ))}
      </View>

      {editions.map((e) => {
        const vols = volumesFor({ editionId: e.id, grade: grade || undefined });
        return (
          <View key={e.id} style={styles.card} testID={`tb-edition-${e.id}`}>
            <View style={styles.row}>
              <Text style={styles.h}>{e.name}</Text>
              <Text style={styles.tag}>{e.publisher}</Text>
              <Text style={[styles.tag, e.status === 'current' ? styles.ok : styles.wait]}>{STATUS[e.status]}</Text>
              {e.priority === 1 ? <Text style={[styles.tag, styles.pri]}>优先</Text> : null}
            </View>
            <Text style={styles.small}>{e.statusNote}</Text>
            {vols.length === 0 ? <Text style={styles.small}>还没有这套教材的册次数据。</Text> : vols.map((v) => <VolumeRow key={v.id} v={v} />)}
          </View>
        );
      })}
    </Screen>
  );
}

function VolumeRow({ v }: { v: Volume }) {
  const c = completeness(v);
  const toc = TOC[c.tocProvenance];
  const done = isComplete(c, v);
  return (
    <View style={styles.vol} testID={`tb-vol-${v.id}`}>
      <View style={styles.row}>
        <Text style={styles.volName}>
          {v.grade}年级{v.term}册 {v.revision ? `· ${v.revision} 修订版` : '· 旧版单元（题库）'}
        </Text>
        <Text style={[styles.tag, { color: toc.color, borderColor: toc.color }]} testID={`tb-toc-${v.id}`}>
          {toc.text}
        </Text>
        <Text style={styles.tag}>{STATUS[v.status]}</Text>
        {done ? <Text style={[styles.tag, styles.ok]}>完整</Text> : null}
      </View>
      <Text style={styles.small} testID={`tb-stat-${v.id}`}>
        单元 {c.units} · 已核实课时 {c.lessons.verified} · 待核实课时 {c.lessons.pending} · 知识点 {c.kps} · 原创课程 {c.courses} · 练习题 {c.exercises} · 例题 {c.examples}
      </Text>
      <Text style={styles.todo}>待补充：{c.todo.join('；')}</Text>
    </View>
  );
}

function Chip({ on, text, onPress, testID }: { on: boolean; text: string; onPress: () => void; testID: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }} testID={testID}>
      <Text style={[styles.chipText, on && { color: '#fff' }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.md, gap: 6 },
  h: { fontSize: 17, fontWeight: '900', color: colors.text },
  p: { fontSize: 14, color: colors.text, lineHeight: 21 },
  small: { fontSize: 12, color: colors.textSoft, lineHeight: 18 },
  todo: { fontSize: 12, color: '#B0603A', lineHeight: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  tag: { fontSize: 11, fontWeight: '800', color: colors.textSoft, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  ok: { color: '#2E8B57', borderColor: '#2E8B57' },
  wait: { color: '#D9822B', borderColor: '#D9822B' },
  pri: { color: '#7A5AF8', borderColor: '#7A5AF8' },
  vol: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 8, marginTop: 4, gap: 2 },
  volName: { fontSize: 14, fontWeight: '800', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.round, borderWidth: 2, borderColor: '#4D9DE0', paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#fff' },
  chipOn: { backgroundColor: '#4D9DE0' },
  chipText: { fontSize: 14, fontWeight: '800', color: '#4D9DE0' },
});
