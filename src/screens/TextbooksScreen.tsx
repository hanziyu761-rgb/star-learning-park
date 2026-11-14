/**
 * 家长中心 · 教材资源库
 * V4.1 简单视图（默认）：下拉选 科目 → 教材版本 → 年级 → 学期，直接看这一册的单元，能练的单元点一下去练。
 * V4.0 详细资料（点“详细资料”展开，给老师核对用）：按真实数据显示每套教材、每一册的建设情况。
 * - 目录来源：已核实（官方来源）/ 待核实（二手或开源题库）/ 未录入，绝不把待核实算成已核实
 * - 课时、知识点、原创课程、练习题、典型例题按实际数量统计；只有目录的教材不算完整
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { Dropdown } from '@/components/Dropdown';
import { Header, Screen } from '@/components/Screen';
import { hasGenerator } from '@/knowledge/generators';
import { useProgress } from '@/progress/ProgressContext';
import { currentTerm, defaultEdition, editionOptions, gradesOf, pickVolume, unitPracticeId } from '@/textbooks/pick';
import type { Subject } from '@/lesson/types';
import { useNav } from '@/nav/Nav';
import { EDITIONS } from '@/textbooks/editions';
import { completeness, isComplete, summary, volumesFor } from '@/textbooks/registry';
import type { Term, Volume } from '@/textbooks/types';
import { colors, radius, space, themed } from '@/theme';
import { isJunior } from '@/progress/grade';

const SUBJECTS: { id: Subject; name: string }[] = [
  { id: 'chinese', name: '语文' },
  { id: 'math', name: '数学' },
  { id: 'english', name: '英语' },
];
const TOC = themed(() => ({
  verified: { text: '目录已核实', color: colors.correct },
  original: { text: '原创', color: colors.blue },
  pending: { text: '目录待核实', color: colors.orange },
  none: { text: '目录未录入', color: colors.textSoft },
}) as const);
const STATUS = { current: '现行', historical: '历史版本', upcoming: '即将启用', unknown: '状态待核实' } as const;

const CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export default function TextbooksScreen() {
  const nav = useNav();
  const [details, setDetails] = useState(false);
  return (
    <Screen bg={colors.bg} testID="textbooks-screen">
      <Header title="教材资源库" onBack={nav.back} />
      <SimpleView />
      <Pressable onPress={() => setDetails(!details)} style={styles.detailsBtn} accessibilityRole="button" testID="tb-details-toggle">
        <Text style={styles.link}>{details ? '收起详细资料' : '详细资料'}</Text>
      </Pressable>
      {details ? <DetailsView /> : null}
    </Screen>
  );
}

/** 简单视图：四个下拉框 + 这一册的单元 */
function SimpleView() {
  const nav = useNav();
  const { state, dispatch } = useProgress();
  const saved = state.settings.textbookEdition;
  const [subject, setSubject] = useState<Subject>('chinese');
  const editionId = defaultEdition(subject, saved[subject], state.settings.grade);
  const grades = gradesOf(editionId);
  const [grade, setGrade] = useState(state.settings.grade ?? 1);
  const g = grades.includes(grade) ? grade : grades[0];
  const [term, setTerm] = useState<Term>(currentTerm());
  const vol = pickVolume(editionId, g, term);
  const ready = !!vol && vol.tocProvenance === 'verified' && vol.units.length > 0;
  const edName = EDITIONS.find((e) => e.id === editionId)?.name ?? '';

  return (
    <View style={styles.card} testID="tb-simple">
      <Text style={styles.h}>课本</Text>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Dropdown
            label="科目"
            value={subject}
            options={SUBJECTS.map((x) => ({ value: x.id, label: x.name }))}
            onChange={(v) => setSubject(v as Subject)}
            testID="tb-dd-subject"
          />
        </View>
        <View style={styles.cell}>
          <Dropdown
            label="教材版本"
            value={editionId}
            options={editionOptions(subject)}
            onChange={(v) => dispatch({ type: 'settings/set', settings: { textbookEdition: { ...saved, [subject]: v } } })}
            testID="tb-dd-edition"
          />
        </View>
        <View style={styles.cell}>
          <Dropdown
            label="年级"
            value={String(g)}
            options={grades.map((x) => ({ value: String(x), label: `${CN[x]}年级` }))}
            onChange={(v) => setGrade(Number(v))}
            testID="tb-dd-grade"
          />
        </View>
        <View style={styles.cell}>
          <Dropdown
            label="学期"
            value={term}
            options={[
              { value: '上', label: '上册', hint: '秋季学期（9 月开学）' },
              { value: '下', label: '下册', hint: '春季学期（2～3 月开学）' },
            ]}
            onChange={(v) => setTerm(v as Term)}
            testID="tb-dd-term"
          />
        </View>
      </View>

      <View style={styles.bookHead}>
        <Text style={styles.bookTitle} testID="tb-book-title">
          {edName} · {CN[g]}年级{term}册
        </Text>
        {vol && ready ? <Text style={[styles.tag, styles.ok]}>目录已核对</Text> : null}
        {vol && ready && !vol.revision ? <Text style={styles.tag}>未修订版（平台现有）</Text> : null}
      </View>

      {!ready ? (
        <Text style={styles.notice} testID="tb-not-ready">
          {vol
            ? '这一册的目录还没有对照官方电子课本核对，暂时不显示单元。'
            : '这套书目前没有这一册的资料。'}
        </Text>
      ) : (
        <View style={{ gap: 2 }} testID="tb-units">
          {vol!.units.map((u) => {
            const pid = unitPracticeId(u, hasGenerator);
            return (
              <View key={u.id} style={styles.uRow} testID="tb-unit">
                <View style={{ flex: 1 }}>
                  <Text style={styles.uTitle}>
                    {u.title}
                    {u.page ? <Text style={styles.uPage}>　第 {u.page} 页</Text> : null}
                  </Text>
                  {u.lessons.length ? (
                    <Text style={styles.uLessons} numberOfLines={3}>
                      {u.lessons.map((l) => l.title).join('、')}
                    </Text>
                  ) : null}
                </View>
                {pid ? (
                  <Pressable onPress={() => nav.push({ name: 'practice', id: pid })} style={styles.goBtn} accessibilityRole="button" testID="tb-unit-practice">
                    <Text style={styles.goText}>去练习</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
          <Text style={styles.small}>
            {vol!.units.some((u) => unitPracticeId(u, hasGenerator))
              ? '练习题是原创或开源题库题，不是课本原题'
              : isJunior(vol!.grade)
                ? '初中英语练习按语法项目编排（没有对应到课本单元），在英语乐园和知识地图里练'
                : '这一册目前只有目录，还没有配套练习'}
          </Text>
        </View>
      )}
    </View>
  );
}

/** V4.0 详细资料：每套教材、每一册的建设情况（给老师核对用） */
function DetailsView() {
  const [subject, setSubject] = useState<Subject>('chinese');
  const [grade, setGrade] = useState(0);
  const s = summary();
  const editions = EDITIONS.filter((e) => e.subject === subject);

  return (
    <>
      <View style={styles.card} testID="textbooks-summary">
        <Text style={styles.h}>目前的真实情况</Text>
        <Text style={styles.p}>
          登记教材版本 {s.editions} 套；教材册次 {s.volumes} 册（目录已核实 {s.verifiedVolumes} 册）；现有题库 {s.bankVolumes} 册（旧版单元，目录待核实）。
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
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
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
    </>
  );
}

function VolumeRow({ v }: { v: Volume }) {
  const [open, setOpen] = useState(false);
  const c = completeness(v);
  const toc = TOC[c.tocProvenance];
  const done = isComplete(c, v);
  return (
    <View style={styles.vol} testID={`tb-vol-${v.id}`}>
      <View style={styles.row}>
        <Text style={styles.volName}>
          {v.grade}年级{v.term}册 {v.id.startsWith('bank.') ? '· 旧版单元（题库）' : v.revision ? `· ${v.revision} 修订版` : '· 未修订版（平台现有）'}
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
      {v.units.length ? (
        <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" testID={`tb-open-${v.id}`}>
          <Text style={styles.link}>{open ? '收起目录' : `查看目录（${v.units.length} 个单元）`}</Text>
        </Pressable>
      ) : null}
      {open ? (
        <View style={styles.toc} testID={`tb-tocview-${v.id}`}>
          {v.sources[0] ? (
            <Text style={styles.small}>
              来源：{v.sources[0].title}（{v.sources[0].kind === 'official' ? '官方' : '二手'}，核对 {v.sources[0].checkedAt}）
            </Text>
          ) : null}
          {v.units.map((u) => (
            <View key={u.id} style={{ gap: 2 }}>
              <Text style={styles.unit}>
                {u.title}
                {u.note ? `（${u.note}）` : ''}
                {u.page ? `　…… ${u.page}` : ''}
              </Text>
              {u.lessons.map((l) => (
                <Text key={l.id} style={styles.lesson}>
                  {l.no ? `${l.no}${l.starred ? '*' : ''}　` : '◎　'}
                  {l.title}
                  {l.parts ? `（${l.parts.join('、')}）` : ''}
                  {l.page ? `　…… ${l.page}` : ''}
                  {l.note ? `　【${l.note}】` : ''}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Chip({ on, text, onPress, testID }: { on: boolean; text: string; onPress: () => void; testID: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }} testID={testID}>
      <Text style={[styles.chipText, on && { color: colors.onAccent }]}>{text}</Text>
    </Pressable>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, gap: 6 },
  h: { fontSize: 17, fontWeight: '700', color: colors.text },
  p: { fontSize: 14, color: colors.text, lineHeight: 21 },
  small: { fontSize: 12, color: colors.textSoft, lineHeight: 18 },
  todo: { fontSize: 12, color: colors.orange, lineHeight: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  tag: { fontSize: 11, fontWeight: '600', color: colors.textSoft, borderWidth: 1, borderColor: colors.disabled, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  ok: { color: colors.correct, borderColor: colors.correct },
  wait: { color: colors.orange, borderColor: colors.orange },
  pri: { color: colors.parent, borderColor: colors.parent },
  vol: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, marginTop: 4, gap: 2 },
  volName: { fontSize: 14, fontWeight: '600', color: colors.text },
  link: { fontSize: 13, fontWeight: '600', color: colors.blue, paddingVertical: 4 },
  toc: { backgroundColor: colors.cardAlt, borderRadius: radius.md, padding: space.sm, gap: 8 },
  unit: { fontSize: 14, fontWeight: '700', color: colors.correct },
  lesson: { fontSize: 13, color: colors.text, paddingLeft: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.round, borderWidth: 2, borderColor: colors.blue, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.blue },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.blue },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  cell: { flexGrow: 1, flexBasis: 140 },
  bookHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: space.md },
  bookTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  notice: { fontSize: 15, color: colors.orange, backgroundColor: colors.orangeSoft, borderRadius: radius.md, padding: space.sm, lineHeight: 22, marginTop: space.xs },
  uRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  uTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  uPage: { fontSize: 12, fontWeight: '400', color: colors.textSoft },
  uLessons: { fontSize: 13, color: colors.textSoft, marginTop: 2, lineHeight: 19 },
  goBtn: { backgroundColor: colors.blue, borderRadius: radius.md, paddingHorizontal: 12, minHeight: 40, justifyContent: 'center' },
  goText: { fontSize: 14, fontWeight: '700', color: colors.onAccent },
  detailsBtn: { alignItems: 'center', paddingVertical: space.sm },
}));
