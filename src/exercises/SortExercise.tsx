import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DisplayTextView } from '@/components/PinyinText';
import { tapFeedback } from '@/components/ui';
import type { SortExercise as SortData } from '@/lesson/types';
import { colors, MIN_TOUCH, radius, shadow, space } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

/** 简单排序：按顺序依次点击（例如从小到大） */
export function SortExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<SortData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved);
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);

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
            <View key={i} style={[styles.slot, item && styles.slotFilled]}>
              {item ? <DisplayTextView text={item.text} size={30} color={colors.correct} /> : <Text style={styles.slotNo}>{i + 1}</Text>}
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
              style={[styles.item, used && styles.itemUsed, shake === it.id && styles.itemWrong]}
            >
              {it.visual ? <Text style={{ fontSize: 34 }}>{it.visual.emoji.repeat(it.visual.count ?? 1)}</Text> : null}
              <DisplayTextView text={it.text} size={34} color={used ? colors.disabled : colors.text} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  answer: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' },
  slot: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: { borderStyle: 'solid', borderColor: colors.correct, backgroundColor: colors.correctSoft },
  slotNo: { fontSize: 18, color: colors.textSoft },
  items: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  item: {
    minWidth: MIN_TOUCH + 16,
    minHeight: MIN_TOUCH + 16,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    borderWidth: 3,
    borderColor: colors.star,
    ...shadow,
  },
  itemUsed: { opacity: 0.35 },
  itemWrong: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft },
});
