/**
 * 单词卡的弹窗（V2.18）：生词本、全部记住的庆祝、“串起来看”关系图。
 */
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WORDBOOK_CLEAR_STREAK, type WordbookEntry } from '@/progress/model';
import { firstCardOf, type WordUnit } from '../catalog';
import { COLOR_WORDS } from '../tricks';
import { sayWord } from './WordCardView';
import { WC } from './theme';

function Sheet({ visible, onClose, title, testID, children }: { visible: boolean; onClose: () => void; title: string; testID: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID={testID}>
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" testID={`${testID}-close`}>
              <Text style={styles.closeText}>关闭</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/* ───────── 生词本 ───────── */
export function WordbookModal({
  visible,
  entries,
  onClose,
  onRemove,
  onDictate,
  onOpen,
}: {
  visible: boolean;
  entries: WordbookEntry[];
  onClose: () => void;
  onRemove: (w: string) => void;
  onDictate: () => void;
  onOpen: (w: string) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={`📒 生词本（${entries.length}）`} testID="wb-modal">
      <Text style={styles.note}>听写时每拼对一次亮一个小圆点，连续拼对 {WORDBOOK_CLEAR_STREAK} 次自动移出。</Text>
      <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 8 }}>
        {entries.length === 0 ? <Text style={styles.empty}>还没有生词。点卡片右上角的 ♡ 就能收藏。</Text> : null}
        {entries.map((e) => {
          const c = firstCardOf(e.w);
          return (
            <View key={e.w} style={styles.row} testID={`wb-item-${e.w}`}>
              <Pressable onPress={() => sayWord(e.w)} style={styles.small} accessibilityRole="button" accessibilityLabel={`读 ${e.w}`}>
                <Text style={{ fontSize: 20 }}>🔊</Text>
              </Pressable>
              <Pressable onPress={() => onOpen(e.w)} style={{ flex: 1 }} accessibilityRole="button" testID={`wb-open-${e.w}`}>
                <Text style={styles.word}>{e.w}</Text>
                {c ? <Text style={styles.zh}>{c.zh}</Text> : null}
              </Pressable>
              <View style={styles.dots} testID={`wb-dots-${e.w}`} accessibilityLabel={`连续拼对 ${e.streak} 次`}>
                {Array.from({ length: WORDBOOK_CLEAR_STREAK }, (_, k) => (
                  <View key={k} style={[styles.dot, k < e.streak && styles.dotOn]} />
                ))}
              </View>
              <Pressable onPress={() => onRemove(e.w)} style={styles.remove} accessibilityRole="button" testID={`wb-remove-${e.w}`}>
                <Text style={styles.removeText}>移除</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <Pressable
        onPress={onDictate}
        disabled={entries.length === 0}
        style={[styles.btn, entries.length === 0 && { opacity: 0.4 }]}
        accessibilityRole="button"
        testID="wb-dictate"
      >
        <Text style={styles.btnText}>✍️ 听写生词本</Text>
      </Pressable>
    </Sheet>
  );
}

/* ───────── 全部记住 ───────── */
export function CelebrateModal({ visible, onAgain, onDictate, onClose }: { visible: boolean; onAgain: () => void; onDictate: () => void; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="🎉 本单元全部记住啦！" testID="celebrate">
      <Text style={styles.party}>🌟🎈🏆🎈🌟</Text>
      <Pressable onPress={onAgain} style={[styles.btn, styles.light]} accessibilityRole="button" testID="celebrate-again">
        <Text style={[styles.btnText, { color: WC.main }]}>🔁 再刷一遍</Text>
      </Pressable>
      <Pressable onPress={onDictate} style={styles.btn} accessibilityRole="button" testID="celebrate-dictate">
        <Text style={styles.btnText}>✍️ 听写本单元</Text>
      </Pressable>
    </Sheet>
  );
}

/* ───────── 串起来看 ───────── */
const GENERATIONS: [string, string[]][] = [
  ['爷爷奶奶、外公外婆', ['grandfather', 'grandmother', 'grandpa', 'grandma']],
  ['爸爸妈妈这一辈', ['father', 'mother', 'dad', 'mom', 'parents', 'uncle', 'aunt', 'man', 'woman']],
  ['我这一辈', ['brother', 'sister', 'cousin', 'baby brother']],
];

export function MapModal({ visible, unit, onClose, onOpen }: { visible: boolean; unit: WordUnit; onClose: () => void; onOpen: (w: string) => void }) {
  const words = [...new Set(unit.cards.map((c) => c.w))];
  const W = ({ w, style }: { w: string; style?: object }) => (
    <Pressable onPress={() => onOpen(w)} style={[styles.node, style]} accessibilityRole="button" testID={`map-word-${w}`}>
      <Text style={styles.nodeText}>{w}</Text>
    </Pressable>
  );
  let body: React.ReactNode;
  if (unit.theme === 'family') {
    const placed = new Set(GENERATIONS.flatMap(([, ws]) => ws));
    const rest = words.filter((w) => !placed.has(w));
    body = (
      <View testID="map-family" style={{ gap: 6 }}>
        {GENERATIONS.map(([label, ws], gi) => {
          const here = ws.filter((w) => words.includes(w));
          if (!here.length) return null;
          return (
            <View key={label} style={{ alignItems: 'center', gap: 4 }}>
              {gi > 0 ? <Text style={styles.branch}>│</Text> : null}
              <Text style={styles.genLabel}>{label}</Text>
              <View style={styles.genRow}>{here.map((w) => <W key={w} w={w} />)}</View>
            </View>
          );
        })}
        {rest.length ? (
          <>
            <Text style={[styles.genLabel, { marginTop: 8 }]}>本单元还有</Text>
            <View style={styles.genRow}>{rest.map((w) => <W key={w} w={w} style={styles.nodeLight} />)}</View>
          </>
        ) : null}
      </View>
    );
  } else if (unit.theme === 'colors') {
    body = (
      <View style={styles.swatches} testID="map-colors">
        {words.map((w) => {
          const c = COLOR_WORDS[w.toLowerCase()];
          return (
            <Pressable key={w} onPress={() => onOpen(w)} style={styles.swatch} accessibilityRole="button" testID={`map-word-${w}`}>
              <View style={[styles.chip, { backgroundColor: c?.color ?? '#ccc' }]} />
              <Text style={styles.nodeText}>{w}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  } else if (unit.theme) {
    // 数字、序数、星期、月份、季节、时间：按顺序排成一条线
    body = (
      <View style={styles.chain} testID="map-sequence">
        {words.map((w, k) => (
          <View key={w} style={styles.chainItem}>
            <W w={w} />
            {k < words.length - 1 ? <Text style={styles.arrow}>→</Text> : null}
          </View>
        ))}
      </View>
    );
  } else {
    body = (
      <View style={{ alignItems: 'center', gap: 10 }} testID="map-cloud">
        <View style={styles.hub}>
          <Text style={styles.hubText}>{unit.title}</Text>
        </View>
        <View style={styles.genRow}>{words.map((w) => <W key={w} w={w} />)}</View>
      </View>
    );
  }
  return (
    <Sheet visible={visible} onClose={onClose} title="🧩 串起来看" testID="map-modal">
      <Text style={styles.note}>点单词，跳到那张卡。</Text>
      <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingVertical: 6 }}>
        {body}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,30,22,0.55)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: WC.bg, borderRadius: 24, padding: 16, gap: 12, maxHeight: '92%', width: '100%', maxWidth: 640, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 21, fontWeight: '900', color: WC.main },
  close: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', borderWidth: 2, borderColor: WC.line },
  closeText: { fontSize: 15, fontWeight: '800', color: WC.main },
  note: { fontSize: 14, color: WC.muted, lineHeight: 20 },
  empty: { fontSize: 16, color: WC.muted, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, padding: 8 },
  small: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: WC.soft },
  word: { fontSize: 20, fontWeight: '900', color: WC.main },
  zh: { fontSize: 14, color: WC.muted },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: WC.accentDark },
  dotOn: { backgroundColor: WC.accent },
  remove: { minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 2, borderColor: WC.heart, justifyContent: 'center' },
  removeText: { color: WC.heart, fontWeight: '800', fontSize: 14 },
  btn: { minHeight: 56, borderRadius: 28, backgroundColor: WC.main, alignItems: 'center', justifyContent: 'center' },
  light: { backgroundColor: '#fff', borderWidth: 3, borderColor: WC.main },
  btnText: { color: '#fff', fontSize: 19, fontWeight: '900' },
  party: { fontSize: 44, textAlign: 'center' },
  node: { borderRadius: 16, backgroundColor: WC.main, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  nodeLight: { backgroundColor: WC.mainLight },
  nodeText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  genLabel: { fontSize: 13, color: WC.muted, fontWeight: '700' },
  genRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  branch: { fontSize: 22, color: WC.line, lineHeight: 24 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  swatch: { width: 96, borderRadius: 16, backgroundColor: WC.main, padding: 6, alignItems: 'center', gap: 6 },
  chip: { width: 80, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
  chain: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  chainItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrow: { fontSize: 20, color: WC.accentDark, fontWeight: '900' },
  hub: { borderRadius: 40, backgroundColor: WC.accent, paddingHorizontal: 18, paddingVertical: 12 },
  hubText: { fontSize: 18, fontWeight: '900', color: WC.text },
});
