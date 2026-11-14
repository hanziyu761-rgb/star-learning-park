/**
 * 单词卡（V2.18）：3D 翻转。正面：英文（分段换色 / 颜色词用本色 / big 特别大……）+ 美式音标 + 喇叭 + 收藏红心；
 * 背面：中文意思、例句、记忆窍门（藏词、拼读家族、别搞混、形状窍门），窍门里的词可以点，点了跳到那张卡。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { DisplayTextView } from '@/components/PinyinText';
import { zh } from '@/content/zh';
import { speak } from '@/speech/speech';
import type { WordCard } from '../catalog';
import { COLOR_WORDS, confusables, families, hiddenWords, LOOK_WORDS, segments, SHAPE_TIPS, type WordLook } from '../tricks';
import { WC_CARD } from './theme';
import { themed } from '@/theme';

const SEG_COLORS = ['#1E7F5C', '#B5621A', '#2F6FD6', '#B83280', '#7A5AF8'];

const LOOK_STYLE: Record<WordLook, TextStyle> = {
  big: { fontSize: 84 },
  small: { fontSize: 26 },
  tall: { transform: [{ scaleY: 1.7 }] },
  fast: { transform: [{ skewX: '-18deg' }], fontStyle: 'italic' },
  long: { transform: [{ scaleX: 1.35 }], letterSpacing: 4 },
  short: { transform: [{ scaleY: 0.6 }] },
  fat: { transform: [{ scaleX: 1.3 }], fontWeight: '700' },
  thin: { transform: [{ scaleX: 0.7 }], fontWeight: '300' },
};

export function sayWord(w: string) {
  speak({ text: w, lang: 'en-US' });
}

/** 正面的大单词：颜色词用本色，其他词按段换色；意思和样子有关的词改变样子 */
export function WordArt({ w, size = 56 }: { w: string; size?: number }) {
  const longCap = Math.floor((560 * size) / 56 / Math.max(w.length, 6));
  const lw = w.toLowerCase();
  const color = COLOR_WORDS[lw];
  const look = LOOK_WORDS[lw];
  const segs = segments(w);
  const base: TextStyle = { fontSize: Math.min(size, Math.max(30, longCap)), fontWeight: '700' };
  const outline: TextStyle | undefined = color?.outline
    ? { textShadowColor: '#4A3A00', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } }
    : undefined;
  return (
    <View style={styles.artRow} testID="wc-word">
      <Text style={[base, look ? LOOK_STYLE[look] : null]} accessibilityLabel={w}>
        {segs.map((s, i) =>
          /^\s+$|^-$/.test(s) ? (
            <Text key={i}>{s === '-' ? '-' : ' '}</Text>
          ) : (
            <Text
              key={i}
              style={[{ color: color ? color.color : SEG_COLORS[i % SEG_COLORS.length] }, outline]}
              testID={`wc-seg-${i}`}
            >
              {s}
              {color && i < segs.length - 1 && !/^\s+$/.test(segs[i + 1]) ? <Text style={styles.segBar}>·</Text> : null}
            </Text>
          ),
        )}
      </Text>
    </View>
  );
}

export function WordCardView({
  card,
  grade,
  flipped,
  onFlip,
  saved,
  onToggleSave,
  times,
  onJump,
  height = 400,
  k = 1,
}: {
  card: WordCard;
  grade: number;
  flipped: boolean;
  onFlip: () => void;
  saved: boolean;
  onToggleSave: () => void;
  times: number;
  onJump: (word: string) => void;
  /** 卡片高度（平板更高） */
  height?: number;
  /** 平板放大系数 */
  k?: number;
}) {
  const [turn] = useState(() => new Animated.Value(flipped ? 1 : 0));
  useEffect(() => {
    Animated.timing(turn, { toValue: flipped ? 1 : 0, duration: 420, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [flipped, turn]);
  const [front, back, frontOpacity, backOpacity] = useMemo(
    () => [
      turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
      turn.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }),
      // 转到一半时把背过去的一面隐藏（有的浏览器、手机对“背面不可见”支持不完整，背面会透出来）
      turn.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] }),
      turn.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1] }),
    ],
    [turn],
  );
  const tip = SHAPE_TIPS[card.w.toLowerCase()];
  const hid = hiddenWords(card.w);
  const fam = families(card, grade);
  const conf = confusables(card.w);

  return (
    <View style={[styles.wrap, { height }]} testID="wc-card">
      {/* 正面 */}
      <Animated.View
        style={[styles.face, styles.front, { opacity: frontOpacity, transform: [{ perspective: 1200 }, { rotateY: front }] }]}
        pointerEvents={flipped ? 'none' : 'auto'}
        testID="wc-front"
        accessibilityElementsHidden={flipped}
        importantForAccessibility={flipped ? 'no-hide-descendants' : 'auto'}
      >
        <TopBar times={times} saved={saved} onToggleSave={onToggleSave} onSpeak={() => sayWord(card.w)} />
        <Pressable style={styles.center} onPress={onFlip} accessibilityRole="button" accessibilityLabel="翻转卡片">
          <WordArt w={card.w} size={Math.round(56 * k)} />
          {card.ipa ? (
            <Text style={styles.ipa} testID="wc-ipa">
              /{card.ipa}/ <Text style={styles.ipaTag}>美式</Text>
            </Text>
          ) : null}
          <Text style={styles.hint}>点卡片翻过来看意思</Text>
        </Pressable>
      </Animated.View>

      {/* 背面 */}
      <Animated.View
        style={[styles.face, styles.backFace, { opacity: backOpacity, transform: [{ perspective: 1200 }, { rotateY: back }] }]}
        pointerEvents={flipped ? 'auto' : 'none'}
        testID="wc-back"
        accessibilityElementsHidden={!flipped}
        importantForAccessibility={flipped ? 'auto' : 'no-hide-descendants'}
      >
        <TopBar times={times} saved={saved} onToggleSave={onToggleSave} onSpeak={() => sayWord(card.w)} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.backBody} nestedScrollEnabled>
          <Pressable onPress={onFlip} accessibilityRole="button" accessibilityLabel="翻回正面">
            <Text style={styles.backWord}>{card.w}</Text>
            <View testID="wc-zh">
              {card.py ? (
                <DisplayTextView text={zh(card.zh, card.py)} size={30} color={WC_CARD.text} />
              ) : (
                <Text style={styles.zh}>{card.zh}</Text>
              )}
            </View>
          </Pressable>
          <Pressable style={styles.example} onPress={() => speak({ text: card.ex, lang: 'en-US' })} accessibilityRole="button" testID="wc-example">
            <Text style={styles.exEn}>🔊 {card.ex}</Text>
            <Text style={styles.exZh}>{card.exZh}</Text>
          </Pressable>

          <View style={styles.tricks} testID="wc-tricks">
            <Text style={styles.tricksTitle}>💡 记忆窍门</Text>
            {tip ? <Text style={styles.trickLine} testID="trick-shape">✏️ {tip}</Text> : null}
            {hid.length ? (
              <View style={styles.trickBlock} testID="trick-hidden">
                <Text style={styles.trickHead}>藏词</Text>
                {hid.map((h) => (
                  <View key={h.word} style={styles.trickRow}>
                    <Text style={styles.trickWord}>
                      {card.w.slice(0, h.start)}
                      <Text style={styles.hidden}>{card.w.slice(h.start, h.start + h.word.length)}</Text>
                      {card.w.slice(h.start + h.word.length)}
                    </Text>
                    <Text style={styles.trickText}> 里藏着 </Text>
                    <WordLink w={h.word} onJump={onJump} />
                  </View>
                ))}
              </View>
            ) : null}
            {fam.map((f) => (
              <View key={f.key} style={styles.trickBlock} testID="trick-family">
                <Text style={styles.trickHead}>
                  拼读家族：{f.label} 读 /{f.sound}/
                </Text>
                <View style={styles.linkWrap}>
                  {f.members.map((m) => (
                    <WordLink key={m.id} w={m.w} onJump={onJump} mark={f.label.replace(/[ _/]/g, '').length <= 3 ? f.label : undefined} />
                  ))}
                </View>
              </View>
            ))}
            {conf.length ? (
              <View style={styles.trickBlock} testID="trick-confuse">
                <Text style={styles.trickHead}>别搞混（只差一个字母）</Text>
                <View style={styles.linkWrap}>
                  {conf.map((c) => (
                    <Pressable
                      key={c.word}
                      onPress={() => onJump(c.word)}
                      style={styles.link}
                      accessibilityRole="button"
                      testID={`trick-word-${c.word}`}
                    >
                      <Text style={styles.linkText}>
                        {c.redIn === 'other'
                          ? [...c.word].map((ch, i) => (
                              <Text key={i} style={i === c.at ? styles.red : null}>
                                {ch}
                              </Text>
                            ))
                          : c.word}
                      </Text>
                      {c.redIn === 'self' ? (
                        <Text style={styles.linkSub}>
                          少了 <Text style={styles.red}>{card.w.toLowerCase()[c.at]}</Text>
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            {!tip && !hid.length && !fam.length && !conf.length ? (
              <Text style={styles.trickText}>这个词没有算出窍门，多读几遍、把每一段拼出来吧。</Text>
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function TopBar({
  times,
  saved,
  onToggleSave,
  onSpeak,
}: {
  times: number;
  saved: boolean;
  onToggleSave: () => void;
  onSpeak: () => void;
}) {
  return (
    <View style={styles.top}>
      <Pressable onPress={onSpeak} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="读单词" testID="wc-speak">
        <Text style={styles.icon}>🔊</Text>
      </Pressable>
      {times > 1 ? (
        <Text style={styles.times} testID="wc-times">
          第 {times} 次出现
        </Text>
      ) : (
        <View />
      )}
      <Pressable
        onPress={onToggleSave}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel={saved ? '从生词本移除' : '加入生词本'}
        accessibilityState={{ selected: saved }}
        testID="wc-heart"
      >
        <Text style={[styles.icon, { color: saved ? WC_CARD.heart : '#9AA5A0' }]}>{saved ? '♥' : '♡'}</Text>
      </Pressable>
    </View>
  );
}

function WordLink({ w, onJump, mark }: { w: string; onJump: (w: string) => void; mark?: string }) {
  // 拼读家族里把这个字母组合标出来（a_e、i_e 这类分开的不标）
  const i = mark && !mark.includes('_') ? w.toLowerCase().indexOf(mark.toLowerCase()) : -1;
  return (
    <Pressable onPress={() => onJump(w)} style={styles.link} accessibilityRole="button" testID={`trick-word-${w}`}>
      <Text style={styles.linkText}>
        {i >= 0 ? (
          <>
            {w.slice(0, i)}
            <Text style={styles.markPart}>{w.slice(i, i + mark!.length)}</Text>
            {w.slice(i + mark!.length)}
          </>
        ) : (
          w
        )}
      </Text>
    </Pressable>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { height: 400, marginHorizontal: 4 },
  face: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28,
    backfaceVisibility: 'hidden',
    padding: 16,
    shadowColor: '#0B2A1F',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  front: { backgroundColor: '#FFFDF7', borderWidth: 4, borderColor: WC_CARD.main },
  backFace: { backgroundColor: WC_CARD.soft, borderWidth: 4, borderColor: WC_CARD.main },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: WC_CARD.line },
  icon: { fontSize: 28 },
  times: { fontSize: 15, fontWeight: '600', color: '#fff', backgroundColor: WC_CARD.accentDark, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  artRow: { minHeight: 110, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segBar: { color: '#B8C4BE' },
  ipa: { fontSize: 22, color: WC_CARD.main, fontWeight: '600' },
  ipaTag: { fontSize: 13, color: WC_CARD.muted },
  hint: { fontSize: 13, color: WC_CARD.muted },
  backBody: { gap: 12, paddingBottom: 8 },
  backWord: { fontSize: 26, fontWeight: '700', color: WC_CARD.main, textAlign: 'center' },
  zh: { fontSize: 30, fontWeight: '600', color: WC_CARD.text, textAlign: 'center' },
  example: { backgroundColor: '#fff', borderRadius: 16, padding: 12, gap: 4 },
  exEn: { fontSize: 18, fontWeight: '700', color: WC_CARD.text },
  exZh: { fontSize: 15, color: WC_CARD.muted },
  tricks: { backgroundColor: '#fff', borderRadius: 16, padding: 12, gap: 8 },
  tricksTitle: { fontSize: 17, fontWeight: '700', color: WC_CARD.accentDark },
  trickBlock: { gap: 6 },
  trickHead: { fontSize: 14, fontWeight: '600', color: WC_CARD.main },
  trickRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  trickWord: { fontSize: 20, fontWeight: '700', color: WC_CARD.text },
  hidden: { fontSize: 26, fontWeight: '700', color: '#B5621A' },
  trickText: { fontSize: 15, color: WC_CARD.text, lineHeight: 21 },
  trickLine: { fontSize: 15, color: WC_CARD.text, lineHeight: 21 },
  linkWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  link: { borderRadius: 14, borderWidth: 2, borderColor: WC_CARD.line, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: WC_CARD.soft, minHeight: 36, justifyContent: 'center' },
  linkText: { fontSize: 17, fontWeight: '700', color: WC_CARD.main },
  linkSub: { fontSize: 12, color: WC_CARD.muted },
  markPart: { color: '#B5621A', fontWeight: '700' },
  red: { color: WC_CARD.heart, fontWeight: '700' },
}));
