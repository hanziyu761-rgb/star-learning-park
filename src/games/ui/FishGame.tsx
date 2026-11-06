/**
 * 拼音钓鱼（V2.19）界面：上方是要读的字（一、二年级会朗读这个字），水里的鱼背着拼音，点鱼就是“钓”。
 * 钓对 → 鱼跳进小桶；钓错 → 鱼游走，再找一找（这一题算没有一次做对）。
 * 三年级起是多音字：显示整句话、这个字标红；答题前不朗读（朗读会把答案说出来），答对后再读整句。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DisplayTextView } from '@/components/PinyinText';
import { ROUND_SIZE } from '@/games/common';
import { fishRound } from '@/games/fish';
import type { GameProps } from '@/screens/GameScreen';
import { speak } from '@/speech/speech';
import { gt } from './text';

const MAIN = '#1C7FB5';
const FISH = ['🐟', '🐠', '🐡', '🐟'];

export function FishGame({ level, grade, rand, onAnswer, onFinish }: GameProps) {
  const questions = useMemo(() => fishRound(level, rand, ROUND_SIZE), [level, rand]);
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
    <View style={styles.root}>
      <Text style={styles.progress} testID="fish-progress">
        第 {q + 1} / {questions.length} 题
      </Text>
      <Pressable
        style={styles.card}
        onPress={() => (cur.sentence ? caught && speak({ text: cur.sentence, lang: 'zh-CN' }) : speak({ text: cur.char, lang: 'zh-CN' }))}
        accessibilityRole="button"
        testID="fish-prompt"
      >
        {cur.sentence ? (
          <Text style={styles.sentence} testID="fish-sentence">
            {[...cur.sentence].map((c, i) => (
              <Text key={i} style={i === cur.at ? styles.target : null}>
                {c}
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={styles.char} testID="fish-char">
            {cur.char}
          </Text>
        )}
        <DisplayTextView text={cur.sentence ? `红色的“${cur.char}”在这里怎么读？` : gt('fishTip', grade)} size={16} color="#3A6B85" />
        {!cur.sentence ? <Text style={styles.speakHint}>🔊 点这里再听一遍</Text> : null}
      </Pressable>

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

      <View style={styles.status} testID="fish-status">
        {caught ? (
          <DisplayTextView text={gt('caught', grade)} size={22} color="#2E9E4F" />
        ) : missed.length ? (
          <DisplayTextView text={gt('swimAway', grade)} size={18} color="#C0392B" />
        ) : null}
      </View>
      {caught ? (
        <Pressable onPress={next} style={styles.nextBtn} accessibilityRole="button" testID="fish-next">
          <DisplayTextView text={q + 1 >= questions.length ? gt('finishedRound', grade) : gt('next', grade)} size={20} color="#fff" />
        </Pressable>
      ) : null}
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

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 14, gap: 12 },
  progress: { textAlign: 'center', fontSize: 14, color: '#3A6B85', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 3, borderColor: MAIN, padding: 14, alignItems: 'center', gap: 6 },
  char: { fontSize: 72, fontWeight: '900', color: '#1B2B34' },
  sentence: { fontSize: 30, fontWeight: '800', color: '#1B2B34', textAlign: 'center', lineHeight: 42 },
  target: { color: '#E53935', fontSize: 38 },
  speakHint: { fontSize: 13, color: '#6A8FA3' },
  pond: { flex: 1, backgroundColor: '#7EC8E3', borderRadius: 28, padding: 12, justifyContent: 'space-around', minHeight: 260 },
  fishWrap: { alignItems: 'center' },
  fish: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 28, paddingHorizontal: 18, minHeight: 56 },
  fishCaught: { backgroundColor: '#C8F0D2' },
  fishEmoji: { fontSize: 32 },
  fishPy: { fontSize: 28, fontWeight: '800', color: '#0F4C6B', minWidth: 80, textAlign: 'center' },
  status: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { minHeight: 60, borderRadius: 30, backgroundColor: MAIN, alignItems: 'center', justifyContent: 'center' },
});
