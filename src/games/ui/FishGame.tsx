/**
 * 拼音钓鱼（V2.19）界面：上方是要读的字（一、二年级会朗读这个字），水里的鱼背着拼音，点鱼就是“钓”。
 * 钓对 → 鱼跳进小桶；钓错 → 鱼游走，再找一找（这一题算没有一次做对）。
 * 三年级起是多音字：显示整句话、这个字标红；答题前不朗读（朗读会把答案说出来），答对后再读整句。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { DisplayTextView } from '@/components/PinyinText';
import { useLayout } from '@/components/useLayout';
import { ROUND_SIZE } from '@/games/common';
import { fishRound } from '@/games/fish';
import type { GameProps } from '@/screens/GameScreen';
import { speak } from '@/speech/speech';
import { gt } from './text';
import { colors, themed } from '@/theme';

/** 主色跟着配色（V5.0）；池塘、泡泡、锅等场景画面保留固定颜色 */
const MAIN_OF = () => colors.blue;
const FISH = ['🐟', '🐠', '🐡', '🐟'];

export function FishGame({ level, grade, rand, onAnswer, onFinish }: GameProps) {
  const questions = useMemo(() => fishRound(level, rand, ROUND_SIZE), [level, rand]);
  const L = useLayout();
  const [q, setQ] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [caught, setCaught] = useState(false);
  const cur = questions[q];

  useEffect(() => {
    if (cur && !cur.sentence) speak({ text: cur.char, lang: 'zh-CN' });
  }, [cur]);

  if (!cur) return null;
  const tap = (py: string) => {
    if (caught || missed.includes(py)) return;
    if (py === cur.answer) {
      setCaught(true);
      onAnswer({
        exerciseId: cur.id,
        correct: missed.length === 0,
        label: cur.sentence ? `${cur.sentence}（${cur.char}：${cur.answer}）` : `${cur.char}：${cur.answer}`,
      });
      speak({ text: cur.sentence ?? cur.char, lang: 'zh-CN' });
    } else {
      setMissed([...missed, py]);
      speak({ text: '再找一找', lang: 'zh-CN' });
    }
  };
  const next = () => {
    if (q + 1 >= questions.length) return onFinish();
    setQ(q + 1);
    setMissed([]);
    setCaught(false);
  };

  return (
    <View style={[styles.root, L.tablet && !L.wide && styles.tabletCol, L.wide && styles.wideRoot]}>
      <View style={[{ gap: 12 }, L.wide && { flex: 1, justifyContent: 'center' }]}>
      <Text style={styles.progress} testID="fish-progress">
        第 {q + 1} / {questions.length} 题
      </Text>
      <Pressable
        style={[styles.card, L.wide && { paddingVertical: 28 }]}
        onPress={() => (cur.sentence ? caught && speak({ text: cur.sentence, lang: 'zh-CN' }) : speak({ text: cur.char, lang: 'zh-CN' }))}
        accessibilityRole="button"
        testID="fish-prompt"
      >
        {cur.sentence ? (
          <Text style={[styles.sentence, L.tablet && { fontSize: 38, lineHeight: 54 }]} testID="fish-sentence">
            {[...cur.sentence].map((c, i) => (
              <Text key={i} style={i === cur.at ? styles.target : null}>
                {c}
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={[styles.char, L.tablet && { fontSize: 110 }]} testID="fish-char">
            {cur.char}
          </Text>
        )}
        <DisplayTextView text={cur.sentence ? `红色的“${cur.char}”在这里怎么读？` : gt('fishTip', grade)} size={16} color={colors.textSoft} />
        {!cur.sentence ? <Text style={styles.speakHint}>🔊 点这里再听一遍</Text> : null}
      </Pressable>
      {L.wide ? (
        <>
      <View style={styles.status} testID="fish-status">
        {caught ? (
          <DisplayTextView text={gt('caught', grade)} size={22} color={colors.correct} />
        ) : missed.length ? (
          <DisplayTextView text={gt('swimAway', grade)} size={18} color={colors.wrong} />
        ) : null}
      </View>
      {caught ? (
        <Pressable onPress={next} style={styles.nextBtn} accessibilityRole="button" testID="fish-next">
          <DisplayTextView text={q + 1 >= questions.length ? gt('finishedRound', grade) : gt('next', grade)} size={20} color={colors.onAccent} />
        </Pressable>
      ) : null}
        </>
      ) : null}
      </View>
      <View style={[{ flex: 1, gap: 12 }, L.wide && { flex: 1.2 }]}>
      <View style={styles.pond} testID="fish-pond">
        {cur.options.map((py, i) => (
          <SwimmingFish
            key={`${q}-${py}`}
            index={i}
            py={py}
            emoji={FISH[i % FISH.length]}
            state={caught && py === cur.answer ? 'caught' : missed.includes(py) ? 'gone' : 'swim'}
            onPress={() => tap(py)}
          />
        ))}
      </View>
      {!L.wide ? (
        <>
      <View style={styles.status} testID="fish-status">
        {caught ? (
          <DisplayTextView text={gt('caught', grade)} size={22} color={colors.correct} />
        ) : missed.length ? (
          <DisplayTextView text={gt('swimAway', grade)} size={18} color={colors.wrong} />
        ) : null}
      </View>
      {caught ? (
        <Pressable onPress={next} style={styles.nextBtn} accessibilityRole="button" testID="fish-next">
          <DisplayTextView text={q + 1 >= questions.length ? gt('finishedRound', grade) : gt('next', grade)} size={20} color={colors.onAccent} />
        </Pressable>
      ) : null}
        </>
      ) : null}
      </View>
    </View>
  );
}

function SwimmingFish({
  index,
  py,
  emoji,
  state,
  onPress,
}: {
  index: number;
  py: string;
  emoji: string;
  state: 'swim' | 'caught' | 'gone';
  onPress: () => void;
}) {
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (state !== 'swim') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: 2200 + index * 400, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(x, { toValue: 0, duration: 2200 + index * 400, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, index, x]);
  const shift = x.interpolate({ inputRange: [0, 1], outputRange: [index % 2 ? 18 : -18, index % 2 ? -18 : 18] });
  return (
    <Animated.View style={[styles.fishWrap, { transform: [{ translateX: shift }] }, state === 'gone' && { opacity: 0.25 }]}>
      <Pressable
        onPress={onPress}
        disabled={state !== 'swim'}
        style={[styles.fish, state === 'caught' && styles.fishCaught]}
        accessibilityRole="button"
        accessibilityLabel={py}
        testID={`fish-${py}`}
      >
        <Text style={styles.fishEmoji}>{state === 'caught' ? '🪣' : emoji}</Text>
        <Text style={styles.fishPy}>{py}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 14, gap: 12 },
  tabletCol: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  wideRoot: { flexDirection: 'row', gap: 28, paddingHorizontal: 28 },
  progress: { textAlign: 'center', fontSize: 14, color: colors.textSoft, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 24, borderWidth: 3, borderColor: MAIN_OF(), padding: 14, alignItems: 'center', gap: 6 },
  char: { fontSize: 72, fontWeight: '700', color: colors.text },
  sentence: { fontSize: 30, fontWeight: '600', color: colors.text, textAlign: 'center', lineHeight: 42 },
  target: { color: colors.wrong, fontSize: 38 },
  speakHint: { fontSize: 13, color: colors.textSoft },
  pond: { flex: 1, backgroundColor: '#7EC8E3', borderRadius: 28, padding: 12, justifyContent: 'space-around', minHeight: 260 },
  fishWrap: { alignItems: 'center' },
  fish: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 28, paddingHorizontal: 18, minHeight: 56 },
  fishCaught: { backgroundColor: '#C8F0D2' },
  fishEmoji: { fontSize: 32 },
  fishPy: { fontSize: 28, fontWeight: '600', color: '#0F4C6B', minWidth: 80, textAlign: 'center' },
  status: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { minHeight: 60, borderRadius: 30, backgroundColor: MAIN_OF(), alignItems: 'center', justifyContent: 'center' },
}));
