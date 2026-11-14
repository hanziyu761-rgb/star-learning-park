/**
 * 我的知识小地图（儿童端）：选择学科和年级（默认是家长设置的年级），本领按学习顺序排成一条小路，
 * 每个本领用颜色和小图标表示掌握情况。不展示复杂的先修网络。
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { zh } from '@/content/zh';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Screen } from '@/components/Screen';
import { BigButton, tapFeedback } from '@/components/ui';
import { isStruggling } from '@/knowledge/diagnose';
import { hasGenerator, hasOriginalGenerator } from '@/knowledge/generators';
import { getKp, kpLabel, kpsFor, kpSubject, type KnowledgePoint, type KpSubject } from '@/knowledge/graph';
import { computeMastery, type MasteryState } from '@/knowledge/mastery';
import { recommendKps } from '@/knowledge/recommend';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { speak } from '@/speech/speech';
import { colors, radius, shadow, space, themed } from '@/theme';
import { contentGrade, GRADE_CN, GRADE_PY } from '@/progress/grade';

/** 给孩子看的状态：颜色 + 图标 + 带拼音的短词 */
export const KID_STATE: Record<MasteryState, { icon: string; color: string; bg: string; text: string; py: string }> = themed(() => ({
  'not-started': { icon: '⚪', color: colors.textSoft, bg: colors.cardAlt, text: '还没学', py: 'hái méi xué' },
  learning: { icon: '✏️', color: colors.orange, bg: colors.orangeSoft, text: '在学习', py: 'zài xué xí' },
  emerging: { icon: '🌱', color: colors.correct, bg: colors.correctSoft, text: '学会了', py: 'xué huì le' },
  'needs-review': { icon: '🔔', color: colors.wrong, bg: colors.wrongSoft, text: '要复习', py: 'yào fù xí' },
  stable: { icon: '⭐', color: colors.starDeep, bg: colors.highlight, text: '真牢固', py: 'zhēn láo gù' },
}));

export default function KnowledgeMapScreen() {
  const { status } = useProgress();
  if (status === 'loading') return <LoadingView />;
  return <MapBody />;
}

function MapBody() {
  const nav = useNav();
  const { state } = useProgress();
  const [now] = useState(() => Date.now());
  const mastery = computeMastery(state, now);
  const [selected, setSelected] = useState<KnowledgePoint | null>(null);
  const [subject, setSubject] = useState<KpSubject>('math');
  const [grade, setGrade] = useState(contentGrade(state.settings.grade));
  const kps = kpsFor(subject, grade);
  const todo = recommendKps(state, mastery, now, 3, { grade, subject }).filter(
    (r) => r.kind === 'review' || r.kind === 'diagnose',
  );
  const learned = kps.filter((k) => mastery[k.id].state === 'emerging' || mastery[k.id].state === 'stable').length;

  const open = (k: KnowledgePoint) => {
    tapFeedback();
    setSelected(k);
    if (kpSubject(k) === 'english') speak({ text: k.kidName, lang: 'en-US' });
    else speak({ text: `${k.kidName}，${KID_STATE[mastery[k.id].state].text}`, lang: 'zh-CN' });
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen bg={colors.blueSoft} testID="map-screen">
        <Header title={zh('我的知识小地图', 'wǒ de zhī shi xiǎo dì tú')} onBack={nav.back} />
        <View style={styles.summary}>
          <Mascot size={56} bounce={false} />
          <Text style={styles.summaryText} testID="map-learned">
            {GRADE_CN[grade]}年级{SUBJECTS.find((x) => x.id === subject)!.name}：学会了 {learned} / {kps.length} 个本领
          </Text>
        </View>

        <View style={styles.tabs}>
          {SUBJECTS.map((x) => (
            <Pressable
              key={x.id}
              onPress={() => {
                tapFeedback();
                setSelected(null);
                setSubject(x.id);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: subject === x.id }}
              testID={`map-subject-${x.id}`}
              style={[styles.tab, subject === x.id && styles.tabOn]}
            >
              <DisplayTextView text={zh(x.name, x.py)} size={18} color={subject === x.id ? colors.onAccent : colors.text} />
            </Pressable>
          ))}
        </View>
        <View style={styles.gradeRow}>
          <Pressable
            onPress={() => {
              setSelected(null);
              setGrade((g) => Math.max(1, g - 1));
            }}
            disabled={grade <= 1}
            style={[styles.gradeBtn, grade <= 1 && { opacity: 0.3 }]}
            accessibilityRole="button"
            accessibilityLabel="上一个年级"
            testID="map-grade-prev"
          >
            <Text style={styles.gradeArrow}>◀</Text>
          </Pressable>
          <View testID="map-grade-label">
            <DisplayTextView text={zh(`${GRADE_CN[grade]}年级`, `${GRADE_PY[grade]} nián jí`)} size={20} />
          </View>
          <Pressable
            onPress={() => {
              setSelected(null);
              setGrade((g) => Math.min(9, g + 1));
            }}
            disabled={grade >= 9}
            style={[styles.gradeBtn, grade >= 9 && { opacity: 0.3 }]}
            accessibilityRole="button"
            accessibilityLabel="下一个年级"
            testID="map-grade-next"
          >
            <Text style={styles.gradeArrow}>▶</Text>
          </Pressable>
        </View>
        {kps.length === 0 ? (
          <Text style={styles.emptyNote} testID="map-empty">
            英语从三年级开始
          </Text>
        ) : null}

        {todo.length > 0 ? (
          <View style={styles.todo} testID="map-todo">
            <DisplayTextView text={zh('今天要复习的本领', 'jīn tiān yào fù xí de běn lǐng')} size={20} />
            {todo.map((r) => {
              const k = getKp(r.kpId)!; // 可能是低年级的知识点
              return (
                <Pressable
                  key={r.kpId}
                  style={styles.todoRow}
                  onPress={() => open(k)}
                  accessibilityRole="button"
                  testID={`todo-${r.kpId}`}
                >
                  <Text style={styles.todoEmoji}>{r.kind === 'diagnose' ? '🔍' : '🔔'}</Text>
                  <DisplayTextView text={kpLabel(k)} size={20} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.legend}>
          {(Object.keys(KID_STATE) as MasteryState[]).map((s) => (
            <View key={s} style={styles.legendItem}>
              <Text>{KID_STATE[s].icon}</Text>
              <DisplayTextView text={zh(KID_STATE[s].text, KID_STATE[s].py)} size={12} color={KID_STATE[s].color} />
            </View>
          ))}
        </View>

        {/* 蜿蜒的小路：左右交替排列 */}
        <View style={styles.path}>
          {kps.map((k, i) => {
            const st = KID_STATE[mastery[k.id].state];
            const left = i % 2 === 0;
            return (
              <View key={k.id} style={[styles.stopRow, { justifyContent: left ? 'flex-start' : 'flex-end' }]}>
                {i > 0 ? <View style={[styles.connector, left ? styles.connectorL : styles.connectorR]} /> : null}
                <Pressable
                  onPress={() => open(k)}
                  accessibilityRole="button"
                  accessibilityLabel={`${k.kidName}，${st.text}`}
                  testID={`kp-${k.id}`}
                  style={({ pressed }) => [
                    styles.stop,
                    { borderColor: st.color, backgroundColor: st.bg },
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <Text style={styles.stopEmoji}>{k.emoji}</Text>
                  <DisplayTextView text={kpLabel(k)} size={15} />
                  <Text style={styles.badge}>{st.icon}</Text>
                  {k.term === '下' && i > 0 && kps[i - 1].term === '上' ? (
                    <Text style={styles.termTag}>下册</Text>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </Screen>
      {/* 点开的本领卡片浮在屏幕下方，孩子不用滚动去找 */}
      {selected ? (
        <View style={styles.overlay}>
          <KpCard
            k={selected}
            state={mastery[selected.id].state}
            struggling={isStruggling(mastery[selected.id])}
            onClose={() => setSelected(null)}
          />
        </View>
      ) : null}
    </View>
  );
}

function KpCard({
  k,
  state,
  struggling,
  onClose,
}: {
  k: KnowledgePoint;
  state: MasteryState;
  struggling: boolean;
  onClose: () => void;
}) {
  const nav = useNav();
  const st = KID_STATE[state];
  return (
    <View style={styles.card} testID="kp-card">
      <View style={styles.cardHead}>
        <Text style={styles.cardEmoji}>{k.emoji}</Text>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <DisplayTextView text={kpLabel(k)} size={24} />
          <DisplayTextView text={zh(st.text, st.py)} size={16} color={st.color} />
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="关闭" style={styles.close}>
          <Text style={{ fontSize: 20 }}>✕</Text>
        </Pressable>
      </View>
      {hasGenerator(k.id) ? (
        <>
          {!hasOriginalGenerator(k.id) ? (
            <Text style={styles.cardNote}>题库题 · AI 生成，未逐题人工审核</Text>
          ) : null}
          <BigButton
            emoji="✏️"
            label={zh('练一练', 'liàn yi liàn')}
            color={colors.primary}
            onPress={() => nav.push({ name: 'practice', id: `kp:${k.id}` })}
            testID="kp-practice"
          />
          {struggling ? (
            <BigButton
              emoji="🔍"
              label={zh('找找原因', 'zhǎo zhao yuán yīn')}
              color={colors.parent}
              size="md"
              onPress={() => nav.push({ name: 'diagnose', kp: k.id })}
              testID="kp-diagnose"
            />
          ) : null}
        </>
      ) : (
        <>
          <BigButton
            emoji="📚"
            label={zh('去数学乐园', 'qù shù xué lè yuán')}
            color={colors.primary}
            size="md"
            onPress={() => nav.push({ name: 'subject', subject: 'math' })}
          />
        </>
      )}
    </View>
  );
}

const SUBJECTS: { id: KpSubject; name: string; py: string }[] = [
  { id: 'math', name: '数学', py: 'shù xué' },
  { id: 'chinese', name: '语文', py: 'yǔ wén' },
  { id: 'english', name: '英语', py: 'yīng yǔ' },
];

const styles = themed(() => StyleSheet.create({
  tabs: { flexDirection: 'row', gap: space.sm },
  tab: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  tabOn: { backgroundColor: colors.parent },
  gradeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.lg },
  gradeBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  gradeArrow: { fontSize: 22, color: colors.parent },
  emptyNote: { fontSize: 15, color: colors.textSoft, textAlign: 'center', padding: space.md },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.sm,
    ...shadow,
  },
  summaryText: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.text },
  todo: {
    backgroundColor: colors.orangeSoft,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.xs,
    borderWidth: 2,
    borderColor: colors.star,
  },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52 },
  todoEmoji: { fontSize: 26, color: colors.text },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.sm,
  },
  legendItem: { alignItems: 'center' },
  path: { gap: 0 },
  stopRow: { flexDirection: 'row', paddingHorizontal: space.lg },
  connector: { position: 'absolute', top: -18, width: 6, height: 40, backgroundColor: colors.line, borderRadius: 3 },
  connectorL: { left: '45%', transform: [{ rotate: '35deg' }] },
  connectorR: { right: '45%', transform: [{ rotate: '-35deg' }] },
  stop: {
    width: 150,
    minHeight: 110,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    marginVertical: space.sm,
    ...shadow,
  },
  stopEmoji: { fontSize: 32, color: colors.text },
  badge: { position: 'absolute', top: -10, right: -6, fontSize: 24, color: colors.text },
  termTag: {
    position: 'absolute',
    top: -12,
    left: -4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onAccent,
    backgroundColor: colors.parent,
    paddingHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.xl,
    maxWidth: 560,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    borderWidth: 3,
    borderColor: colors.parent,
    ...shadow,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cardEmoji: { fontSize: 44, color: colors.text },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cardNote: { fontSize: 15, color: colors.textSoft },
}));
