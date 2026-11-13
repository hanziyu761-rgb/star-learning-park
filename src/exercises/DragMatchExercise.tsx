import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { DisplayTextView } from '@/components/PinyinText';
import { tapFeedback } from '@/components/ui';
import { DragArea, Draggable, DropZone, justDragged } from '@/drag/DragArea';
import type { DragMatchExercise as DragMatchData } from '@/lesson/types';
import { speak } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, shadow, space, themed } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

/**
 * 拖动配对：把上面的卡片拖到下面对应的位置。
 * 为方便小手操作，也支持“先点卡片、再点位置”的方式完成配对。
 */
export function DragMatchExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<DragMatchData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [placed, setPlaced] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // 卡片打乱顺序显示（按 id 固定打乱，保证每次一致、可测试）
  const [itemsOrder] = useState(() => [...exercise.pairs].sort((a, b) => (a.id < b.id ? 1 : -1)));

  const tryPlace = (itemId: string, zoneId: string | null): boolean => {
    if (solved || zoneId === null) return false;
    const targetPairId = zoneId.replace('target-', '');
    if (placed.includes(targetPairId)) return false;
    if (targetPairId === itemId) {
      const next = [...placed, itemId];
      setPlaced(next);
      setSelected(null);
      const pair = exercise.pairs.find((p) => p.id === itemId);
      if (next.length === exercise.pairs.length) correct();
      else if (pair?.target.speak) speak(pair.target.speak);
      return true;
    }
    setSelected(null);
    wrong(exercise.wrongHint);
    return false;
  };

  const remaining = itemsOrder.filter((p) => !placed.includes(p.id));

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <DragArea style={styles.area}>
        {/* 目标放在前面渲染、视觉上在下方，保证拖动的卡片显示在目标上层 */}
        <View style={styles.targets}>
          {exercise.pairs.map((p) => {
            const done = placed.includes(p.id);
            return (
              <DropZone
                key={p.id}
                id={`target-${p.id}`}
                // 所有目标排成一行，保证小屏手机上拖动时目标都在屏幕内
                style={[styles.targetWrap, { flexBasis: `${Math.floor(100 / exercise.pairs.length) - 3}%` }]}
                testID={`target-${p.id}`}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (justDragged()) return;
                    if (p.target.speak && !selected) speak(p.target.speak);
                    if (selected) tryPlace(selected, `target-${p.id}`);
                  }}
                  style={[styles.target, done && styles.targetDone, selected && !done && styles.targetReady]}
                >
                  {p.target.visual ? (
                    <Text style={[styles.emoji, (p.target.visual.count ?? 1) > 2 && styles.manyEmoji]}>
                      {p.target.visual.emoji.repeat(p.target.visual.count ?? 1)}
                    </Text>
                  ) : null}
                  {p.target.text ? <DisplayTextView text={p.target.text} size={22} /> : null}
                  {done ? (
                    <View style={styles.placedItem}>
                      {p.item.visual ? <Text style={styles.smallEmoji}>{p.item.visual.emoji}</Text> : null}
                      {p.item.text ? <DisplayTextView text={p.item.text} size={24} color={colors.correct} /> : null}
                    </View>
                  ) : (
                    <View style={styles.slot} />
                  )}
                </Pressable>
              </DropZone>
            );
          })}
        </View>

        <View style={styles.items}>
          {remaining.map((p) => (
            <Draggable
              key={p.id}
              testID={`drag-${p.id}`}
              onDragStart={() => setSelected(null)}
              onDrop={(zone) => tryPlace(p.id, zone)}
              disabled={solved}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (justDragged()) return;
                  tapFeedback();
                  if (p.item.speak) speak(p.item.speak);
                  setSelected((s) => (s === p.id ? null : p.id));
                }}
                style={[styles.item, selected === p.id && styles.itemSelected]}
              >
                {p.item.visual ? <Text style={styles.emoji}>{p.item.visual.emoji}</Text> : null}
                {p.item.text ? <DisplayTextView text={p.item.text} size={30} /> : null}
              </Pressable>
            </Draggable>
          ))}
        </View>
      </DragArea>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.lg },
  area: { flexDirection: 'column-reverse', gap: space.xl },
  items: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.md,
    minHeight: MIN_TOUCH * 1.5,
  },
  item: {
    minWidth: 72,
    minHeight: 72,
    backgroundColor: colors.highlight,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.star,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    ...shadow,
  },
  itemSelected: { borderColor: colors.parent, borderWidth: 3, transform: [{ scale: 1.08 }] },
  targets: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
  targetWrap: { flexGrow: 1 },
  target: {
    minHeight: 120,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    gap: 4,
  },
  targetReady: { borderColor: colors.parent },
  targetDone: { borderStyle: 'solid', borderColor: colors.correct, backgroundColor: colors.correctSoft },
  slot: { width: 40, height: 32, borderRadius: 10, backgroundColor: colors.cardAlt },
  placedItem: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 34, textAlign: 'center' },
  smallEmoji: { fontSize: 28 },
  manyEmoji: { fontSize: 20, lineHeight: 26 },
}));
