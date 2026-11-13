import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { zh } from '@/content/zh';
import { DisplayTextView } from '@/components/PinyinText';
import { BigButton, tapFeedback } from '@/components/ui';
import { DragArea, Draggable, DropZone, justDragged } from '@/drag/DragArea';
import { PromptHeader, useAttempts, type ExerciseOutcome } from '@/exercises/common';
import type { FeedbackMessage } from '@/lesson/feedback';
import type { LessonStep, Speakable } from '@/lesson/types';
import { speak, speakSequence, stopSpeaking } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, shadow, space, themed } from '@/theme';

type StepOf<K extends LessonStep['kind']> = Extract<LessonStep, { kind: K }>;

export interface StepProps<K extends LessonStep['kind']> {
  step: StepOf<K>;
  onFeedback: (m: FeedbackMessage | null) => void;
  /** 环节完成；有 outcome 时会写入练习记录 */
  onDone: (outcome?: ExerciseOutcome) => void;
}

const NUM_ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const zhNum = (n: number): Speakable => ({ text: NUM_ZH[n] ?? String(n), lang: 'zh-CN' });

// ---------------- 可视化演示：一个一个数 ----------------

export function CountDemoStep({ step, onDone }: StepProps<'count-demo'>) {
  const [shown, setShown] = useState(0);
  const [run, setRun] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    speak(step.title.speak);
    for (let i = 1; i <= step.count; i++) {
      timers.current.push(
        setTimeout(() => {
          setShown(i);
          speak({ text: step.numberWords[i - 1] ?? String(i), lang: 'zh-CN' });
          if (i === step.count) onDone();
        }, 1600 + (i - 1) * 1100),
      );
    }
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} autoSpeak={false} />
      <View style={styles.stage} testID="count-demo">
        <View style={styles.itemsRow}>
          {Array.from({ length: shown }, (_, i) => (
            <Animated.View key={`${run}-${i}`} entering={ZoomIn.springify()} style={styles.demoItem}>
              <Text style={styles.bigEmoji}>{step.emoji}</Text>
              <Text style={styles.itemNo}>{i + 1}</Text>
            </Animated.View>
          ))}
        </View>
        <Text style={styles.bigNumber} testID="count-number">
          {shown}
        </Text>
      </View>
      <BigButton
        size="md"
        emoji="🔁"
        label={zh('再看一遍', 'zài kàn yí biàn')}
        color={colors.parent}
        onPress={() => {
          setShown(0);
          setRun((r) => r + 1);
        }}
      />
    </View>
  );
}

// ---------------- 动手操作：拖进篮子 ----------------

export function DragBasketStep({ step, onDone }: StepProps<'drag-basket'>) {
  const [inBasket, setInBasket] = useState(0);
  const finished = inBasket >= step.target;

  const drop = useCallback(
    (zone: string | null) => {
      if (zone !== 'basket' || finished) return false;
      const n = inBasket + 1;
      setInBasket(n);
      if (n >= step.target) {
        speakSequence([zhNum(n), step.doneSpeak]);
        onDone();
      } else {
        speak(zhNum(n));
      }
      return true;
    },
    [finished, inBasket, onDone, step.doneSpeak, step.target],
  );

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} />
      <DragArea style={styles.dragArea}>
        <DropZone id="basket" style={[styles.basket, finished && styles.basketDone]} testID="basket">
          <Text style={styles.basketEmoji}>🧺</Text>
          <Text style={styles.basketItems}>{step.emoji.repeat(inBasket)}</Text>
          <Text style={styles.basketCount} testID="basket-count">
            {inBasket}
          </Text>
        </DropZone>
        <View style={styles.pile}>
          {Array.from({ length: step.total - inBasket }, (_, i) => (
            <Draggable key={`${inBasket}-${i}`} onDrop={drop} disabled={finished} testID={`apple-${i}`}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="拖到篮子里，或点一下放进去"
                onPress={() => {
                  if (justDragged()) return;
                  tapFeedback();
                  drop('basket');
                }}
                style={styles.pileItem}
              >
                <Text style={styles.bigEmoji}>{step.emoji}</Text>
              </Pressable>
            </Draggable>
          ))}
        </View>
      </DragArea>
    </View>
  );
}

// ---------------- 合起来：加法 ----------------

export function CombineStep({ step, onDone, onFeedback }: StepProps<'combine'>) {
  const [leftLeft, setLeftLeft] = useState(step.left);
  const [rightLeft, setRightLeft] = useState(step.right);
  const inBasket = step.left - leftLeft + (step.right - rightLeft);
  const total = step.left + step.right;
  const allIn = inBasket === total;
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const { solved, wrong, correct } = useAttempts('zh', onFeedback, (o) => onDone(o));

  useEffect(() => {
    if (allIn) speak({ text: '篮子里一共有几个？', lang: 'zh-CN' });
  }, [allIn]);

  const dropFrom = (side: 'L' | 'R') => (zone: string | null) => {
    if (zone !== 'basket') return false;
    if (side === 'L') setLeftLeft((n) => Math.max(0, n - 1));
    else setRightLeft((n) => Math.max(0, n - 1));
    speak(zhNum(inBasket + 1));
    return true;
  };

  const choose = (n: number) => {
    if (solved || wrongChoices.includes(n)) return;
    tapFeedback();
    if (n === total) {
      correct();
      speakSequence([{ text: `${NUM_ZH[step.left]}加${NUM_ZH[step.right]}等于${NUM_ZH[total]}`, lang: 'zh-CN' }, step.doneSpeak]);
    } else {
      setWrongChoices((w) => [...w, n]);
      wrong({
        text: zh('数一数篮子里的苹果', 'shǔ yi shǔ lán zi lǐ de píng guǒ'),
        speak: { text: '数一数篮子里的苹果', lang: 'zh-CN' },
      });
    }
  };

  const plate = (count: number, side: 'L' | 'R', bg: string) => (
    <View style={[styles.plate, { backgroundColor: bg }]}>
      {Array.from({ length: count }, (_, i) => (
        <Draggable key={`${side}-${count}-${i}`} onDrop={dropFrom(side)} testID={`combine-${side}-${i}`}>
          <Pressable
            onPress={() => !justDragged() && dropFrom(side)('basket')}
            style={styles.plateItem}
            accessibilityRole="button"
          >
            <Text style={styles.midEmoji}>{step.emoji}</Text>
          </Pressable>
        </Draggable>
      ))}
    </View>
  );

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} />
      <View style={styles.equation}>
        <Text style={styles.eqText}>
          {step.left} + {step.right} = {solved ? total : '?'}
        </Text>
      </View>
      <DragArea style={styles.dragArea}>
        <DropZone id="basket" style={[styles.basket, allIn && styles.basketDone]} testID="basket">
          <Text style={styles.basketEmoji}>🧺</Text>
          <Text style={styles.basketItems}>{step.emoji.repeat(inBasket)}</Text>
        </DropZone>
        <View style={styles.plates}>
          {plate(leftLeft, 'L', colors.wrongSoft)}
          <Text style={styles.plus}>+</Text>
          {plate(rightLeft, 'R', colors.blueSoft)}
        </View>
      </DragArea>
      {allIn ? (
        <View style={styles.numRow}>
          {step.choices.map((n) => (
            <Pressable
              key={n}
              testID={`num-${n}`}
              accessibilityRole="button"
              onPress={() => choose(n)}
              style={[
                styles.numBtn,
                wrongChoices.includes(n) && styles.numWrong,
                solved && n === total && styles.numRight,
              ]}
            >
              <Text style={styles.numText}>{n}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------- 开放式思维题：凑数 ----------------

export function OpenBuildStep({ step, onDone, onFeedback }: StepProps<'open-build'>) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const firstCheck = useRef(true);
  const reported = useRef(false);
  const count = a + b;

  useEffect(() => () => stopSpeaking(), []);

  const add = (which: 'A' | 'B') => (zone: string | null) => {
    if (zone !== 'plate' || count >= step.target) return false;
    if (which === 'A') setA((n) => n + 1);
    else setB((n) => n + 1);
    speak(zhNum(count + 1));
    onFeedback(null);
    return true;
  };

  const check = () => {
    tapFeedback();
    if (count !== step.target) {
      firstCheck.current = false;
      onFeedback({
        kind: 'wrong',
        text: zh(`盘子里要正好${step.target}个`, 'pán zi lǐ yào zhèng hǎo gè'),
      });
      speak({ text: `盘子里要正好${step.target}个水果`, lang: 'zh-CN' });
      return;
    }
    const key = `${a}-${b}`;
    if (found.includes(key)) {
      onFeedback({ kind: 'info', text: zh('这种已经找到了，换一种试试', 'zhè zhǒng yǐ jīng zhǎo dào le huàn yì zhǒng shì shi') });
      speak({ text: '这种已经找到了，换一种试试', lang: 'zh-CN' });
      return;
    }
    setFound((f) => [...f, key]);
    // 数量用阿拉伯数字交给语音引擎，引擎会按“两个”等正确量词读法朗读
    const say = `${a}个${step.itemA.name.text}，${b}个${step.itemB.name.text}，合起来是${step.target}个。`;
    speakSequence([
      { text: say, lang: 'zh-CN' },
      { text: '你真会动脑筋！还有别的放法吗？', lang: 'zh-CN' },
    ]);
    onFeedback({ kind: 'correct', text: zh('你真会动脑筋！', 'nǐ zhēn huì dòng nǎo jīn') });
    if (!reported.current) {
      reported.current = true;
      onDone({ firstTryCorrect: firstCheck.current, attempts: firstCheck.current ? 1 : 2 });
    }
  };

  const clear = () => {
    setA(0);
    setB(0);
    onFeedback(null);
  };

  const pile = (emoji: string, which: 'A' | 'B') => (
    <View style={styles.source}>
      <Draggable key={`${which}-${count}`} onDrop={add(which)} disabled={count >= step.target} testID={`pile-${which}`}>
        <Pressable onPress={() => !justDragged() && add(which)('plate')} style={styles.sourceBtn} accessibilityRole="button">
          <Text style={styles.bigEmoji}>{emoji}</Text>
        </Pressable>
      </Draggable>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={step.title} />
      <DragArea style={styles.dragArea}>
        <DropZone id="plate" style={styles.bigPlate} testID="plate">
          <View style={styles.slots}>
            {Array.from({ length: step.target }, (_, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  // 点盘子里的水果可以拿出来
                  if (i < a) setA((n) => n - 1);
                  else if (i < a + b) setB((n) => n - 1);
                }}
                style={styles.slotCell}
              >
                <Text style={styles.midEmoji}>{i < a ? step.itemA.emoji : i < a + b ? step.itemB.emoji : ''}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.plateCount} testID="plate-count">
            {count} / {step.target}
          </Text>
        </DropZone>
        <View style={styles.sources}>
          {pile(step.itemA.emoji, 'A')}
          {pile(step.itemB.emoji, 'B')}
        </View>
      </DragArea>
      <View style={styles.btnRow}>
        <BigButton size="md" emoji="🧹" label={zh('清空', 'qīng kōng')} color={colors.textSoft} onPress={clear} style={{ flex: 1 }} />
        <BigButton size="md" emoji="✔️" label={zh('检查', 'jiǎn chá')} color={colors.correct} onPress={check} style={{ flex: 1 }} testID="open-check" />
      </View>
      {found.length > 0 ? (
        <View style={styles.found} testID="found-list">
          <DisplayTextView text={zh(`已经找到${found.length}种：`, 'yǐ jīng zhǎo dào zhǒng')} size={18} />
          {found.map((k) => {
            const [x, y] = k.split('-').map(Number);
            return (
              <Text key={k} style={styles.foundRow}>
                {step.itemA.emoji.repeat(x) || '—'} + {step.itemB.emoji.repeat(y) || '—'}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.lg },
  stage: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, minHeight: 220, alignItems: 'center', ...shadow },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm, minHeight: 90 },
  demoItem: { alignItems: 'center' },
  itemNo: { fontSize: 18, fontWeight: '600', color: colors.textSoft },
  bigEmoji: { fontSize: 52 },
  midEmoji: { fontSize: 36 },
  bigNumber: { fontSize: 84, fontWeight: '700', color: colors.primary },
  dragArea: { flexDirection: 'column-reverse', gap: space.lg },
  basket: {
    minHeight: 170,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.star,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.md,
  },
  basketDone: { borderStyle: 'solid', borderColor: colors.correct, backgroundColor: colors.correctSoft },
  basketEmoji: { fontSize: 56 },
  basketItems: { fontSize: 32, textAlign: 'center' },
  basketCount: { fontSize: 40, fontWeight: '700', color: colors.primary },
  pile: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md, minHeight: 80 },
  pileItem: { width: MIN_TOUCH + 12, height: MIN_TOUCH + 12, alignItems: 'center', justifyContent: 'center' },
  equation: { alignItems: 'center' },
  eqText: { fontSize: 44, fontWeight: '700', color: colors.text, letterSpacing: 2 },
  plates: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  plate: {
    flex: 1,
    minHeight: 110,
    borderRadius: radius.round,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
  },
  plateItem: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 40, fontWeight: '700', color: colors.text },
  numRow: { flexDirection: 'row', justifyContent: 'center', gap: space.md, flexWrap: 'wrap' },
  numBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.star,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  numWrong: { opacity: 0.35, borderColor: colors.wrong },
  numRight: { borderColor: colors.correct, backgroundColor: colors.correctSoft },
  numText: { fontSize: 36, fontWeight: '700', color: colors.text },
  bigPlate: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, alignItems: 'center', ...shadow },
  slots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  slotCell: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateCount: { marginTop: space.sm, fontSize: 24, fontWeight: '600', color: colors.primary },
  sources: { flexDirection: 'row', justifyContent: 'space-around' },
  source: { alignItems: 'center' },
  sourceBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.star,
  },
  btnRow: { flexDirection: 'row', gap: space.md },
  found: { backgroundColor: colors.correctSoft, borderRadius: radius.md, padding: space.md, gap: 4, alignItems: 'center' },
  foundRow: { fontSize: 26 },
}));
