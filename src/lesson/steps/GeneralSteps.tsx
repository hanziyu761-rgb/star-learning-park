import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import Animated, { FadeIn } from 'react-native-reanimated';
import { DisplayTextView } from '@/components/PinyinText';
import { BigButton, SpeakerButton, tapFeedback } from '@/components/ui';
import { PromptHeader } from '@/exercises/common';
import { speak } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, shadow, space, themed } from '@/theme';
import type { StepProps } from './MathSteps';

// ---------------- 点卡片听读 ----------------

export function TeachCardsStep({ step, onDone }: StepProps<'teach-cards'>) {
  const [heard, setHeard] = useState<string[]>([]);
  const all = heard.length === step.cards.length;

  useEffect(() => {
    if (all) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} />
      <View style={styles.cards}>
        {step.cards.map((c) => {
          const done = heard.includes(c.id);
          return (
            <Pressable
              key={c.id}
              testID={`card-${c.id}`}
              accessibilityRole="button"
              onPress={() => {
                tapFeedback();
                speak(c.speak);
                setHeard((h) => (h.includes(c.id) ? h : [...h, c.id]));
              }}
              style={({ pressed }) => [styles.card, done && styles.cardDone, pressed && styles.pressed]}
            >
              <Text style={styles.cardEmoji}>{c.visual.emoji}</Text>
              <DisplayTextView text={c.text} size={typeof c.text === 'string' ? 30 : 40} />
              {c.sub ? <DisplayTextView text={c.sub} size={18} color={colors.textSoft} /> : null}
              <Text style={styles.ear}>{done ? '✅' : '👂'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------- 跟读（不打分） ----------------

export function RepeatStep({ step, onDone }: StepProps<'repeat'>) {
  const [index, setIndex] = useState(0);
  // 记录哪一项已经播放过示范音，播放过才允许继续
  const [listenedIndex, setListenedIndex] = useState(-1);
  const listened = listenedIndex === index;
  const item = step.items[index];
  const finished = index >= step.items.length;

  useEffect(() => {
    if (finished) {
      onDone();
      return;
    }
    const t = setTimeout(() => speak(item.speak, () => setListenedIndex(index)), 600);
    // 若语音引擎没有回调，2.5 秒后也允许继续
    const t2 = setTimeout(() => setListenedIndex(index), 2500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (finished) {
    return (
      <View style={styles.wrap}>
        <PromptHeader prompt={step.title} autoSpeak={false} />
        <View style={styles.repeatCard}>
          <Text style={styles.cardEmoji}>🎉</Text>
          <Text style={styles.enBig}>Great speaking!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} autoSpeak={index === 0} />
      <Animated.View key={item.id} entering={FadeIn} style={styles.repeatCard}>
        <Text style={styles.hugeEmoji}>{item.visual.emoji}</Text>
        <DisplayTextView text={item.text} size={40} />
        <SpeakerButton item={item.speak} size={64} />
      </Animated.View>
      <Text style={styles.progressText}>
        {index + 1} / {step.items.length}
      </Text>
      <BigButton
        emoji="🗣️"
        label="I said it!"
        color={colors.correct}
        disabled={!listened}
        onPress={() => {
          speak({ text: 'Good!', lang: 'en-US' });
          setIndex((i) => i + 1);
        }}
        testID="said-it"
      />
      <Text style={styles.note}>说完后点按钮。录音跟读和发音评分将在后续版本提供。</Text>
    </View>
  );
}

// ---------------- 情境对话 ----------------

export function DialogueStep({ step, onDone }: StepProps<'dialogue'>) {
  const [heard, setHeard] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    if (heard.length === step.lines.length) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heard.length]);

  const playLine = (i: number) => {
    setCurrent(i);
    setHeard((h) => (h.includes(i) ? h : [...h, i]));
    speak(step.lines[i].speak, () => setCurrent((c) => (c === i ? null : c)));
  };

  const playAll = () => {
    tapFeedback();
    setHeard(step.lines.map((_, i) => i));
    // 逐句朗读并高亮当前句
    const playFrom = (i: number) => {
      if (i >= step.lines.length) {
        setCurrent(null);
        return;
      }
      setCurrent(i);
      speak(step.lines[i].speak, () => playFrom(i + 1));
    };
    playFrom(0);
  };

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} />
      <BigButton emoji="▶️" label="Play" color={colors.parent} size="md" onPress={playAll} testID="dialogue-play" />
      <View style={{ gap: space.md }}>
        {step.lines.map((line, i) => {
          const right = i % 2 === 1;
          return (
            <Pressable
              key={i}
              testID={`line-${i}`}
              accessibilityRole="button"
              onPress={() => playLine(i)}
              style={[styles.lineRow, right && { flexDirection: 'row-reverse' }]}
            >
              <Text style={styles.speaker}>{line.speaker}</Text>
              <View
                style={[
                  styles.bubble,
                  right ? styles.bubbleRight : styles.bubbleLeft,
                  current === i && styles.bubbleActive,
                ]}
              >
                <Text style={styles.bubbleText}>{line.text}</Text>
                {heard.includes(i) ? <Text style={styles.tick}>✓</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------- 互动绘本 ----------------

export function PictureBookStep({ step, onDone }: StepProps<'picture-book'>) {
  const [page, setPage] = useState(0);
  const p = step.pages[page];
  const last = page === step.pages.length - 1;

  useEffect(() => {
    const t = setTimeout(() => speak(p.speak), 400);
    if (last) onDone();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} autoSpeak={false} />
      <Animated.View key={page} entering={FadeIn} style={styles.bookPage} testID={`book-page-${page}`}>
        <Text style={styles.hugeEmoji}>{p.visual.emoji.repeat(p.visual.count ?? 1)}</Text>
        {p.text === '' ? (
          <Text style={styles.wordlessHint} testID="wordless-page">
            👀 Look and talk
          </Text>
        ) : null}
        <View style={styles.words}>
          {(p.text ? p.text.split(' ') : []).map((w, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              onPress={() => speak({ text: w.replace(/[.,!?]/g, ''), lang: 'en-US' })}
              style={styles.word}
            >
              <Text style={styles.wordText}>{w}</Text>
            </Pressable>
          ))}
        </View>
        <SpeakerButton item={p.speak} size={56} />
      </Animated.View>
      <View style={styles.pager}>
        <BigButton
          size="md"
          emoji="◀️"
          color={colors.textSoft}
          disabled={page === 0}
          onPress={() => setPage((x) => x - 1)}
          accessibilityLabel="Previous page"
          style={{ flex: 1 }}
        />
        <Text style={styles.progressText}>
          {page + 1} / {step.pages.length}
        </Text>
        <BigButton
          size="md"
          emoji="▶️"
          color={colors.parent}
          disabled={last}
          onPress={() => setPage((x) => x + 1)}
          accessibilityLabel="Next page"
          style={{ flex: 1 }}
          testID="book-next"
        />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.lg },
  cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  card: {
    flexBasis: '42%',
    flexGrow: 1,
    maxWidth: 220,
    minHeight: 170,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.md,
    borderWidth: 3,
    borderColor: colors.line,
    ...shadow,
  },
  cardDone: { borderColor: colors.correct },
  pressed: { transform: [{ scale: 0.96 }] },
  cardEmoji: { fontSize: 54, color: colors.text },
  ear: { position: 'absolute', top: 8, right: 10, fontSize: 20, color: colors.text },
  repeatCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
    gap: space.md,
    ...shadow,
  },
  hugeEmoji: { fontSize: 96, textAlign: 'center', color: colors.text },
  enBig: { fontSize: 32, fontWeight: '600', color: colors.correct },
  progressText: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.textSoft },
  note: { textAlign: 'center', fontSize: 13, color: colors.textSoft },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  speaker: { fontSize: 48, color: colors.text },
  bubble: {
    flexShrink: 1,
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  bubbleLeft: { backgroundColor: colors.card },
  bubbleRight: { backgroundColor: colors.card, borderColor: colors.correct },
  bubbleActive: { borderColor: colors.star, backgroundColor: colors.highlight },
  bubbleText: { fontSize: 24, fontWeight: '700', color: colors.text },
  tick: { position: 'absolute', top: 2, right: 6, color: colors.correct, fontWeight: '700' },
  bookPage: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
    gap: space.lg,
    ...shadow,
  },
  words: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  word: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.bgSky,
    minHeight: 44,
    justifyContent: 'center',
  },
  wordText: { fontSize: 30, fontWeight: '600', color: colors.text },
  wordlessHint: { fontSize: 18, fontWeight: '700', color: colors.textSoft },
  pager: { flexDirection: 'row', alignItems: 'center', gap: space.md },
}));

// ---------------- 中文短文阅读（V2.10） ----------------

export function ReadPassageStep({ step, onDone }: StepProps<'read-passage'>) {
  useEffect(() => {
    onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} />
      <View style={readStyles.page} testID="read-passage">
        <Text style={readStyles.emoji}>{step.visual.emoji}</Text>
        {step.paragraphs.map((p, i) => (
          <View key={i} style={readStyles.para}>
            <DisplayTextView text={p} size={typeof p === 'string' ? 20 : 24} />
          </View>
        ))}
        <SpeakerButton item={step.speak} sequence={step.speakParts} size={56} testID="read-listen" />
      </View>
    </View>
  );
}

const readStyles = themed(() => StyleSheet.create({
  page: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
    alignItems: 'center',
    ...shadow,
  },
  emoji: { fontSize: 56 },
  para: { alignSelf: 'stretch', alignItems: 'flex-start' },
}));
