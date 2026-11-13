import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { DisplayTextView } from '@/components/PinyinText';
import { tapFeedback } from '@/components/ui';
import { plainText } from '@/content/zh';
import type { SortExercise as SortData } from '@/lesson/types';
import { colors, MIN_TOUCH, radius, shadow, space, themed } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

/** 简单排序：按顺序依次点击（例如从小到大） */
export function SortExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<SortData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  // 排句子或短语（中文 4 个字以上）：答案格和选项都占一整行，字小一些，避免超出屏幕
  const long = exercise.items.some((it) => {
    const t = plainText(it.text);
    return /\p{Script=Han}/u.test(t) && t.length > 3;
  });

  const tap = (id: string) => {
    if (solved || picked.includes(id)) return;
    tapFeedback();
    const expected = exercise.order[picked.length];
    if (id === expected) {
      const next = [...picked, id];
      setPicked(next);
      setShake(null);
      if (next.length === exercise.order.length) correct();
    } else {
      setShake(id);
      wrong(exercise.wrongHint);
    }
  };

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <View style={styles.answer} testID="sort-answer">
        {exercise.order.map((_, i) => {
          const item = exercise.items.find((it) => it.id === picked[i]);
          return (
            <View key={i} style={[styles.slot, long && styles.slotLong, item && styles.slotFilled]}>
              {item ? (
                <DisplayTextView text={item.text} size={long ? 20 : 30} color={colors.correct} />
              ) : (
                <Text style={styles.slotNo}>{i + 1}</Text>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.items}>
        {exercise.items.map((it) => {
          const used = picked.includes(it.id);
          return (
            <Pressable
              key={it.id}
              testID={`sort-${it.id}`}
              accessibilityRole="button"
              onPress={() => tap(it.id)}
              style={[
                styles.item,
                long && styles.itemLong,
                used && styles.itemUsed,
                shake === it.id && styles.itemWrong,
              ]}
            >
              {it.visual ? <Text style={{ fontSize: 34 }}>{it.visual.emoji.repeat(it.visual.count ?? 1)}</Text> : null}
              <DisplayTextView text={it.text} size={long ? 24 : 34} color={used ? colors.disabled : colors.text} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.lg },
  answer: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' },
  slot: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLong: { width: '100%', height: undefined, minHeight: 56, paddingHorizontal: space.sm, paddingVertical: 4 },
  slotFilled: { borderStyle: 'solid', borderColor: colors.correct, backgroundColor: colors.correctSoft },
  slotNo: { fontSize: 18, color: colors.textSoft },
  items: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  item: {
    minWidth: MIN_TOUCH + 16,
    minHeight: MIN_TOUCH + 16,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    borderWidth: 3,
    borderColor: colors.star,
    ...shadow,
  },
  itemLong: { width: '100%' },
  itemUsed: { opacity: 0.35 },
  itemWrong: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft },
}));
