/**
 * 找规律：把下面的图案/数字拖进空格（也可以先点图案再点空格）。
 * 按空格从左到右依次判断，放对的留在格子里，放错的弹回并提示。
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { VisualView } from '@/components/Figure';
import { tapFeedback } from '@/components/ui';
import { DragArea, Draggable, DropZone, justDragged } from '@/drag/DragArea';
import type { PatternExercise, PatternToken } from '@/lesson/types';
import { colors, radius, shadow, space, themed } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

function Token({ token, size = 40 }: { token: PatternToken; size?: number }) {
  if (token.visual) return <VisualView visual={token.visual} size={size} figureSize={size + 8} />;
  return <Text style={[styles.tokenText, { fontSize: size * 0.8 }]}>{token.text}</Text>;
}

export function PatternFillExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<PatternExercise>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const blanks = exercise.sequence.map((t, i) => (t === null ? i : -1)).filter((i) => i >= 0);
  const [filled, setFilled] = useState<Record<number, string>>({}); // 序列位置 -> token id
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [wrongSlot, setWrongSlot] = useState<number | null>(null);

  const tryFill = (tokenId: string, zone: string | null): boolean => {
    setDragging(false);
    setSelected(null);
    if (solved || !zone) return false;
    const pos = Number(zone.replace('slot-', ''));
    if (filled[pos] !== undefined) return false;
    const k = blanks.indexOf(pos);
    if (k < 0) return false;
    if (exercise.answers[k] === tokenId) {
      const next = { ...filled, [pos]: tokenId };
      setFilled(next);
      setWrongSlot(null);
      onFeedback(null);
      if (blanks.every((b) => next[b] !== undefined)) correct();
      return false; // 调色板里的图案可以重复使用，总是弹回原位
    }
    setWrongSlot(pos);
    wrong(exercise.wrongHint);
    return false;
  };

  const byId = (id: string) => exercise.palette.find((p) => p.id === id)!;

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <DragArea style={styles.area}>
        <View style={styles.seq} testID="pattern-seq">
          {exercise.sequence.map((t, i) => {
            if (t) {
              return (
                <View key={i} style={styles.cell}>
                  <Token token={t} />
                </View>
              );
            }
            const fid = filled[i];
            const z = `slot-${i}`;
            return (
              <DropZone key={i} id={z} testID={z}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="空格"
                  onPress={() => {
                    if (justDragged()) return;
                    if (selected) tryFill(selected, z);
                  }}
                  style={[
                    styles.cell,
                    styles.slot,
                    (dragging || selected) && fid === undefined && !solved && styles.slotHint,
                    wrongSlot === i && styles.slotWrong,
                    fid !== undefined && styles.slotOk,
                  ]}
                >
                  {fid !== undefined ? <Token token={byId(fid)} /> : <Text style={styles.q}>?</Text>}
                </Pressable>
              </DropZone>
            );
          })}
        </View>
        {!solved ? (
          <View style={styles.palette}>
            {exercise.palette.map((p) => (
              <Draggable
                key={p.id}
                testID={`token-${p.id}`}
                onDragStart={() => {
                  setDragging(true);
                  setWrongSlot(null);
                }}
                onDrop={(z) => tryFill(p.id, z)}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (justDragged()) return;
                    tapFeedback();
                    setSelected((s) => (s === p.id ? null : p.id));
                  }}
                  style={[styles.paletteItem, selected === p.id && styles.paletteSelected]}
                >
                  <Token token={p} size={44} />
                </Pressable>
              </Draggable>
            ))}
          </View>
        ) : null}
      </DragArea>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.lg },
  area: { flexDirection: 'column-reverse', gap: space.xl },
  seq: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.xs,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.sm,
    ...shadow,
  },
  cell: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  slot: { borderWidth: 3, borderStyle: 'dashed', borderColor: colors.line, backgroundColor: colors.cardAlt },
  slotHint: { borderColor: colors.parent, backgroundColor: colors.parentSoft },
  slotWrong: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft },
  slotOk: { borderStyle: 'solid', borderColor: colors.correct, backgroundColor: colors.correctSoft },
  q: { fontSize: 28, fontWeight: '700', color: colors.textSoft },
  tokenText: { fontWeight: '700', color: colors.text },
  palette: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  paletteItem: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.highlight,
    borderWidth: 3,
    borderColor: colors.star,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  paletteSelected: { borderColor: colors.parent, borderWidth: 3, transform: [{ scale: 1.08 }] },
}));
