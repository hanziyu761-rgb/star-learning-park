/**
 * 我的知识小地图（儿童端）：一年级数学的本领按学习顺序排成一条小路，
 * 每个本领用颜色和小图标表示掌握情况。不展示复杂的先修网络。
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { zh } from '@/content/zh';
import { Mascot } from '@/components/Mascot';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Screen } from '@/components/Screen';
import { BigButton, tapFeedback } from '@/components/ui';
import { isStruggling } from '@/knowledge/diagnose';
import { hasGenerator } from '@/knowledge/generators';
import { KNOWLEDGE_POINTS, type KnowledgePoint } from '@/knowledge/graph';
import { computeMastery, type MasteryState } from '@/knowledge/mastery';
import { recommendKps } from '@/knowledge/recommend';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { speak } from '@/speech/speech';
import { colors, radius, shadow, space } from '@/theme';

/** 给孩子看的状态：颜色 + 图标 + 带拼音的短词 */
export const KID_STATE: Record<MasteryState, { icon: string; color: string; bg: string; text: string; py: string }> = {
  'not-started': { icon: '⚪', color: '#9C928A', bg: '#F1EDE7', text: '还没学', py: 'hái méi xué' },
  learning: { icon: '✏️', color: '#E08A1E', bg: '#FFF1D6', text: '在学习', py: 'zài xué xí' },
  emerging: { icon: '🌱', color: '#3BB273', bg: '#E3F7EA', text: '学会了', py: 'xué huì le' },
  'needs-review': { icon: '🔔', color: '#E8505B', bg: '#FDE6E8', text: '要复习', py: 'yào fù xí' },
  stable: { icon: '⭐', color: '#F5A400', bg: '#FFF6CF', text: '真牢固', py: 'zhēn láo gù' },
};

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
  const kps = [...KNOWLEDGE_POINTS].sort((a, b) => a.order - b.order);
  const todo = recommendKps(state, mastery, now, 3).filter((r) => r.kind === 'review' || r.kind === 'diagnose');
  const learned = kps.filter((k) => mastery[k.id].state === 'emerging' || mastery[k.id].state === 'stable').length;

  const open = (k: KnowledgePoint) => {
    tapFeedback();
    setSelected(k);
    speak({ text: `${k.kidName}，${KID_STATE[mastery[k.id].state].text}`, lang: 'zh-CN' });
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen bg="#E3F1FC" testID="map-screen">
        <Header title={zh('我的知识小地图', 'wǒ de zhī shi xiǎo dì tú')} onBack={nav.back} />
        <View style={styles.summary}>
          <Mascot size={56} bounce={false} />
          <Text style={styles.summaryText} testID="map-learned">
            一年级数学：学会了 {learned} / {kps.length} 个本领
          </Text>
        </View>

        {todo.length > 0 ? (
          <View style={styles.todo} testID="map-todo">
            <DisplayTextView text={zh('今天要复习的本领', 'jīn tiān yào fù xí de běn lǐng')} size={20} />
            {todo.map((r) => {
              const k = kps.find((x) => x.id === r.kpId)!;
              return (
                <Pressable
                  key={r.kpId}
                  style={styles.todoRow}
                  onPress={() => open(k)}
                  accessibilityRole="button"
                  testID={`todo-${r.kpId}`}
                >
                  <Text style={styles.todoEmoji}>{r.kind === 'diagnose' ? '🔍' : '🔔'}</Text>
                  <DisplayTextView text={zh(k.kidName, k.kidPy)} size={20} />
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
                  <DisplayTextView text={zh(k.kidName, k.kidPy)} size={15} />
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
          <DisplayTextView text={zh(k.kidName, k.kidPy)} size={24} />
          <DisplayTextView text={zh(st.text, st.py)} size={16} color={st.color} />
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="关闭" style={styles.close}>
          <Text style={{ fontSize: 20 }}>✕</Text>
        </Pressable>
      </View>
      {hasGenerator(k.id) ? (
        <>
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
          <Text style={styles.cardNote}>这个本领在“题库闯关”里练习。</Text>
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

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: space.sm,
    ...shadow,
  },
  summaryText: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  todo: {
    backgroundColor: '#FFF8E6',
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.xs,
    borderWidth: 2,
    borderColor: colors.star,
  },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52 },
  todoEmoji: { fontSize: 26 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: space.sm,
  },
  legendItem: { alignItems: 'center' },
  path: { gap: 0 },
  stopRow: { flexDirection: 'row', paddingHorizontal: space.lg },
  connector: { position: 'absolute', top: -18, width: 6, height: 40, backgroundColor: '#B9D8F0', borderRadius: 3 },
  connectorL: { left: '45%', transform: [{ rotate: '35deg' }] },
  connectorR: { right: '45%', transform: [{ rotate: '-35deg' }] },
  stop: {
    width: 150,
    minHeight: 110,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    marginVertical: space.sm,
    ...shadow,
  },
  stopEmoji: { fontSize: 32 },
  badge: { position: 'absolute', top: -10, right: -6, fontSize: 24 },
  termTag: {
    position: 'absolute',
    top: -12,
    left: -4,
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    borderWidth: 3,
    borderColor: colors.parent,
    ...shadow,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cardEmoji: { fontSize: 44 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cardNote: { fontSize: 15, color: colors.textSoft },
});
