/**
 * 自己作答（V2.9）：用数字键盘填答案，不能靠猜。
 * 支持整数、小数（.）、分数（/）、有余数的除法（“余”键输入 ……）。分数、小数按数值判断，3/4 和 6/8 都算对。
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { VisualView } from '@/components/Figure';
import { DisplayTextView } from '@/components/PinyinText';
import { tapFeedback } from '@/components/ui';
import { zh } from '@/content/zh';
import type { InputExercise as InputData } from '@/lesson/types';
import { colors, MIN_TOUCH, radius, shadow, space, themed } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

/** 把输入或答案换成数值；有余数的除法返回 null（按文字比较） */
function valueOf(s: string): number | null {
  if (s.includes('……')) return null;
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : NaN;
  }
  return s === '' ? NaN : Number(s);
}

/** 判断孩子填的答案对不对（纯函数，供测试） */
export function inputMatches(typed: string, answer: string): boolean {
  const t = typed.trim();
  if (answer.includes('……') || t.includes('……')) return t === answer;
  const a = valueOf(answer);
  const b = valueOf(t);
  return a !== null && b !== null && Number.isFinite(b) && Math.abs(a - b) < 1e-9;
}

/** 根据答案的样子决定显示哪些特殊键 */
export function keysFor(answer: string): string[] {
  const extra: string[] = [];
  if (answer.includes('.')) extra.push('.');
  if (answer.includes('/')) extra.push('/');
  if (answer.includes('……')) extra.push('余');
  if (answer.startsWith('-')) extra.push('-');
  return extra;
}

export function InputExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<InputData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [typed, setTyped] = useState('');
  const extra = keysFor(exercise.answer);

  const press = (k: string) => {
    if (solved) return;
    tapFeedback();
    onFeedback(null);
    if (k === '⌫') return setTyped((s) => (s.endsWith('……') ? s.slice(0, -2) : s.slice(0, -1)));
    if (k === '余') return setTyped((s) => (s && !s.includes('……') ? `${s}……` : s));
    setTyped((s) => (s.length >= 10 ? s : s + k));
  };

  const submit = () => {
    if (solved || typed === '') return;
    if (inputMatches(typed, exercise.answer)) correct();
    else {
      wrong(exercise.wrongHint);
      setTyped('');
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ...extra, '⌫', '0'];
  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      {exercise.stem ? (
        <View style={styles.stem}>
          {exercise.stem.visual ? <VisualView visual={exercise.stem.visual} size={44} figureSize={150} /> : null}
          {exercise.stem.text ? <DisplayTextView text={exercise.stem.text} size={34} /> : null}
        </View>
      ) : null}
      <View style={[styles.display, solved && styles.displayRight]} testID="input-display">
        <Text style={[styles.displayText, !typed && styles.placeholder]}>
          {solved ? exercise.answer : typed || '?'}
        </Text>
      </View>
      <View style={styles.keys}>
        {keys.map((k) => (
          <Pressable
            key={k}
            testID={`num-${k}`}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? '删除' : k === '余' ? '余数' : k}
            onPress={() => press(k)}
            style={({ pressed }) => [styles.key, pressed && styles.pressed]}
          >
            <Text style={styles.keyText}>{k}</Text>
          </Pressable>
        ))}
        <Pressable
          testID="num-ok"
          accessibilityRole="button"
          accessibilityState={{ disabled: solved || typed === '' }}
          onPress={submit}
          style={[styles.key, styles.ok, (solved || typed === '') && { opacity: 0.5 }]}
        >
          <DisplayTextView text={zh('确定', 'què dìng')} size={20} color={colors.onAccent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.md },
  stem: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: space.md },
  display: {
    alignSelf: 'center',
    minWidth: 180,
    minHeight: 60,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  displayRight: { borderColor: colors.correct, backgroundColor: colors.correctSoft },
  displayText: { fontSize: 36, fontWeight: '700', color: colors.text },
  placeholder: { color: colors.textSoft },
  keys: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
    maxWidth: 340,
    alignSelf: 'center',
  },
  key: {
    width: 96,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  ok: { backgroundColor: colors.correct },
  keyText: { fontSize: 26, fontWeight: '700', color: colors.text },
  pressed: { transform: [{ scale: 0.95 }] },
}));
