/**
 * 拼词泡泡（V2.19）界面：自动读单词、显示中文；按顺序戳破字母泡泡拼出单词。
 * 戳错的泡泡抖一下、不扣分，这个词算没有一次拼对，并放进生词本。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { DisplayTextView } from '@/components/PinyinText';
import { useLayout } from '@/components/useLayout';
import { ROUND_SIZE } from '@/games/common';
import { acceptsBubble, bubbleExerciseId, bubbleRound } from '@/games/bubble';
import { useProgress } from '@/progress/ProgressContext';
import type { GameProps } from '@/screens/GameScreen';
import { speak } from '@/speech/speech';
import { clickTime } from '@/words/session';
import { gt } from './text';
import { colors, themed } from '@/theme';

/** 主色跟着配色（V5.0）；池塘、泡泡、锅等场景画面保留固定颜色 */
const MAIN_OF = () => colors.parent;
const COLORS = ['#FFD6E0', '#D6F0FF', '#E2FFD6', '#FFF3C4', '#EBDCFF', '#FFE2CC'];
const sayWord = (w: string) => speak({ text: w, lang: 'en-US' });

export function BubbleGame({ level, grade, rand, onAnswer, onFinish }: GameProps) {
  const { dispatch } = useProgress();
  const questions = useMemo(() => bubbleRound(grade, level, rand, ROUND_SIZE), [grade, level, rand]);
  const L = useLayout();
  const [q, setQ] = useState(0);
  const [typed, setTyped] = useState('');
  const [popped, setPopped] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const cur = questions[q];
  const done = !!cur && typed === cur.card.w;

  useEffect(() => {
    if (cur) sayWord(cur.card.w);
  }, [cur]);

  if (!cur) return null;
  const tap = (id: string, letter: string) => {
    if (done || popped.includes(id)) return;
    if (acceptsBubble(cur.card.w, typed, letter)) {
      const t = typed + letter;
      setTyped(t);
      setPopped([...popped, id]);
      if (t === cur.card.w) {
        onAnswer({ exerciseId: bubbleExerciseId(cur.card), correct: !wrong, label: `${cur.card.w}（${cur.card.zh}）` });
        if (wrong) dispatch({ type: 'wordbook/add', w: cur.card.w, now: clickTime() });
        sayWord(cur.card.w);
      }
    } else {
      setWrong(true);
      setShake(id);
      setTimeout(() => setShake((s) => (s === id ? null : s)), 450);
    }
  };
  const next = () => {
    if (q + 1 >= questions.length) return onFinish();
    setQ(q + 1);
    setTyped('');
    setPopped([]);
    setWrong(false);
  };

  return (
    <View style={[styles.root, L.tablet && !L.wide && styles.tabletCol, L.wide && styles.wideRoot]}>
      <View style={[{ gap: 12 }, L.wide && { flex: 1, justifyContent: 'center' }]}>
      <Text style={styles.progress} testID="bubble-progress">
        第 {q + 1} / {questions.length} 个单词
      </Text>
      <View style={styles.card}>
        <Text style={[styles.zh, L.tablet && { fontSize: 44 }]} testID="bubble-zh">
          {cur.card.zh}
        </Text>
        <Pressable onPress={() => sayWord(cur.card.w)} style={styles.listen} accessibilityRole="button" testID="bubble-listen">
          <Text style={{ fontSize: 22 }}>🔊</Text>
          <DisplayTextView text={gt('listen', grade)} size={15} color={MAIN_OF()} />
        </Pressable>
        <View style={styles.slots} testID="bubble-slots">
          {[...cur.card.w].map((c, i) => (
            <View key={i} style={[styles.slot, i < typed.length && styles.slotOn]}>
              <Text style={styles.slotText}>{i < typed.length ? c : ''}</Text>
            </View>
          ))}
        </View>
      </View>
      </View>

      <View style={[{ flex: 1, gap: 12 }, L.wide && { flex: 1.2, justifyContent: 'center' }]}>
      {done ? (
        <View style={{ gap: 12 }}>
          <View style={styles.status} testID="bubble-done">
            <DisplayTextView text={gt('great', grade)} size={22} color={colors.correct} />
            <Text style={styles.word}>{cur.card.w}</Text>
          </View>
          <Pressable onPress={next} style={styles.nextBtn} accessibilityRole="button" testID="bubble-next">
            <DisplayTextView text={q + 1 >= questions.length ? gt('finishedRound', grade) : gt('next', grade)} size={20} color={colors.onAccent} />
          </Pressable>
        </View>
      ) : (
        <>
          <DisplayTextView text={gt('bubbleTip', grade)} size={15} color={colors.textSoft} />
          <View style={styles.sky} testID="bubble-sky">
            {cur.bubbles.map((b, i) =>
              popped.includes(b.id) ? (
                <View key={b.id} style={[styles.bubbleSpace, L.tablet && { width: 92, height: 92 }]} />
              ) : (
                <FloatingBubble key={b.id} big={L.tablet} index={i} letter={b.letter} shaking={shake === b.id} onPress={() => tap(b.id, b.letter)} testID={`bubble-${b.id}`} />
              ),
            )}
          </View>
        </>
      )}
      </View>
    </View>
  );
}

function FloatingBubble({ big, index, letter, shaking, onPress, testID }: { big?: boolean; index: number; letter: string; shaking: boolean; onPress: () => void; testID: string }) {
  const [y] = useState(() => new Animated.Value(0));
  const [sx] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1600 + (index % 4) * 300, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(y, { toValue: 0, duration: 1600 + (index % 4) * 300, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [index, y]);
  useEffect(() => {
    if (!shaking) return;
    Animated.sequence(
      [8, -8, 6, -6, 0].map((v) => Animated.timing(sx, { toValue: v, duration: 70, useNativeDriver: Platform.OS !== 'web' })),
    ).start();
  }, [shaking, sx]);
  const dy = y.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 ? -10 : 10] });
  return (
    <Animated.View style={{ transform: [{ translateY: dy }, { translateX: sx }] }}>
      <Pressable
        onPress={onPress}
        style={[styles.bubble, big && { width: 92, height: 92, borderRadius: 46 }, { backgroundColor: COLORS[index % COLORS.length] }, shaking && styles.bubbleWrong]}
        accessibilityRole="button"
        accessibilityLabel={letter}
        testID={testID}
      >
        <Text style={[styles.bubbleText, big && { fontSize: 44 }]}>{letter}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 14, gap: 12 },
  tabletCol: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  wideRoot: { flexDirection: 'row', gap: 28, paddingHorizontal: 28 },
  progress: { textAlign: 'center', fontSize: 14, color: colors.textSoft, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 24, borderWidth: 3, borderColor: MAIN_OF(), padding: 14, alignItems: 'center', gap: 10 },
  zh: { fontSize: 32, fontWeight: '700', color: colors.text },
  listen: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.parentSoft },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  slot: { width: 36, height: 46, borderBottomWidth: 4, borderColor: colors.line, alignItems: 'center', justifyContent: 'flex-end' },
  slotOn: { borderColor: MAIN_OF() },
  slotText: { fontSize: 32, fontWeight: '700', color: MAIN_OF() },
  sky: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 14, minHeight: 240, paddingVertical: 12 },
  bubble: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#7A5AF8', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  bubbleWrong: { borderColor: colors.wrong },
  bubbleSpace: { width: 72, height: 72 },
  bubbleText: { fontSize: 34, fontWeight: '700', color: '#2B2350' },
  status: { alignItems: 'center', gap: 4 },
  word: { fontSize: 40, fontWeight: '700', color: MAIN_OF() },
  nextBtn: { minHeight: 60, borderRadius: 30, backgroundColor: MAIN_OF(), alignItems: 'center', justifyContent: 'center' },
}));
