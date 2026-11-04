/**
 * 图形认识：
 * - ShapePickExercise：点出所有指定的图形（多选，点错有提示）
 * - BinsExercise：把物品拖进对应的区域（图形分类、按颜色/形状/用途分类共用）
 * - RotateExercise：点一下转 90°，转到和影子一样再放进去
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ShapeFigure, VisualView } from '@/components/Figure';
import { DisplayTextView } from '@/components/PinyinText';
import { BigButton, tapFeedback } from '@/components/ui';
import { DragArea, Draggable, DropZone, justDragged } from '@/drag/DragArea';
import { zh } from '@/content/zh';
import type {
  BinsExercise as BinsData,
  RotateExercise as RotateData,
  ShapePickExercise as ShapePickData,
} from '@/lesson/types';
import { colors, MIN_TOUCH, radius, shadow, space } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

export function ShapePickExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<ShapePickData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  const tap = (id: string) => {
    if (solved || picked.includes(id) || wrongIds.includes(id)) return;
    tapFeedback();
    if (exercise.answerIds.includes(id)) {
      const next = [...picked, id];
      setPicked(next);
      if (exercise.answerIds.every((a) => next.includes(a))) correct();
    } else {
      setWrongIds((w) => [...w, id]);
      wrong(exercise.wrongHint);
    }
  };

  const left = exercise.answerIds.length - picked.length;
  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <Text style={styles.counter} testID="pick-left">
        {solved ? '全部找到啦！' : `还要找 ${left} 个`}
      </Text>
      <View style={styles.figures}>
        {exercise.figures.map((f) => {
          const ok = picked.includes(f.id);
          const bad = wrongIds.includes(f.id);
          return (
            <Pressable
              key={f.id}
              testID={`fig-${f.id}`}
              accessibilityRole="button"
              onPress={() => tap(f.id)}
              style={[styles.figBtn, ok && styles.figOk, bad && styles.figBad]}
            >
              <VisualView visual={f.visual} figureSize={64} size={44} />
              {ok ? <Text style={[styles.mark, { color: colors.correct }]}>✓</Text> : null}
              {bad ? <Text style={styles.mark}>✗</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function BinsExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<BinsData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [placed, setPlaced] = useState<Record<string, string>>({}); // itemId -> binId
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [wrongBin, setWrongBin] = useState<string | null>(null);

  const tryPlace = (itemId: string, zone: string | null): boolean => {
    setDragging(false);
    setSelected(null);
    if (solved || !zone) return false;
    const binId = zone.replace('bin-', '');
    const item = exercise.items.find((i) => i.id === itemId)!;
    if (item.bin === binId) {
      const next = { ...placed, [itemId]: binId };
      setPlaced(next);
      setWrongBin(null);
      if (Object.keys(next).length === exercise.items.length) correct();
      return true;
    }
    setWrongBin(zone);
    wrong(exercise.wrongHint);
    return false;
  };

  const remaining = exercise.items.filter((i) => !placed[i.id]);
  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <DragArea style={styles.area}>
        <View style={styles.bins}>
          {exercise.bins.map((b) => {
            const z = `bin-${b.id}`;
            const inside = exercise.items.filter((i) => placed[i.id] === b.id);
            return (
              <DropZone key={b.id} id={z} style={styles.binWrap} testID={z}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (justDragged()) return;
                    if (selected) tryPlace(selected, z);
                  }}
                  style={[
                    styles.bin,
                    (dragging || selected) && !solved && styles.binHint,
                    wrongBin === z && styles.binWrong,
                  ]}
                >
                  <View style={styles.binHead}>
                    {b.visual ? <VisualView visual={b.visual} size={26} figureSize={30} /> : null}
                    <DisplayTextView text={b.label} size={17} />
                  </View>
                  <View style={styles.binItems}>
                    {inside.map((i) => (
                      <VisualView key={i.id} visual={i.visual} size={26} figureSize={30} />
                    ))}
                  </View>
                </Pressable>
              </DropZone>
            );
          })}
        </View>
        <View style={styles.items}>
          {remaining.map((i) => (
            <Draggable
              key={i.id}
              testID={`item-${i.id}`}
              onDragStart={() => {
                setDragging(true);
                setWrongBin(null);
              }}
              onDrop={(z) => tryPlace(i.id, z)}
              disabled={solved}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (justDragged()) return;
                  tapFeedback();
                  setSelected((s) => (s === i.id ? null : i.id));
                }}
                style={[styles.item, selected === i.id && styles.itemSelected]}
              >
                <VisualView visual={i.visual} size={40} figureSize={52} />
              </Pressable>
            </Draggable>
          ))}
        </View>
      </DragArea>
    </View>
  );
}

export function RotateExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<RotateData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [rotation, setRotation] = useState(exercise.start);
  const turn = () => {
    if (solved) return;
    tapFeedback();
    setRotation((r) => (r + 90) % 360);
    onFeedback(null);
  };
  const check = () => {
    if (solved) return;
    if ((((rotation - exercise.target) % 360) + 360) % 360 === 0) correct();
    else wrong(exercise.wrongHint);
  };
  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <View style={styles.rotateRow}>
        <View style={styles.rotateBox} testID="rotate-target">
          <ShapeFigure
            shape={exercise.shape}
            color={exercise.color}
            rotation={exercise.target}
            size={110}
            dashed={!solved}
          />
          {solved ? (
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.center}>
                <ShapeFigure shape={exercise.shape} color={exercise.color} rotation={exercise.target} size={110} />
              </View>
            </View>
          ) : null}
          <DisplayTextView text={zh('影子', 'yǐng zi')} size={14} color={colors.textSoft} />
        </View>
        {!solved ? (
          <Pressable
            onPress={turn}
            accessibilityRole="button"
            accessibilityLabel="转一转"
            style={styles.rotateBox}
            testID="rotate-piece"
          >
            <ShapeFigure shape={exercise.shape} color={exercise.color} rotation={rotation} size={110} />
            <Text style={styles.turnHint}>🔄</Text>
          </Pressable>
        ) : null}
      </View>
      {!solved ? (
        <BigButton
          emoji="📥"
          label={zh('放进去', 'fàng jìn qu')}
          color={colors.correct}
          size="md"
          onPress={check}
          testID="rotate-check"
        />
      ) : null}
      <Text style={styles.hidden} testID="rotate-angle">
        {rotation}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  counter: { textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.textSoft },
  figures: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  figBtn: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  figOk: { borderColor: colors.correct, backgroundColor: colors.correctSoft },
  figBad: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft, opacity: 0.6 },
  mark: { position: 'absolute', top: 2, right: 6, fontSize: 20, fontWeight: '900', color: colors.wrong },
  area: { flexDirection: 'column-reverse', gap: space.lg },
  bins: { flexDirection: 'row', gap: space.sm },
  binWrap: { flex: 1 },
  bin: {
    minHeight: 150,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: '#fff',
    padding: space.sm,
    alignItems: 'center',
    gap: space.xs,
  },
  binHint: { borderColor: colors.parent, backgroundColor: '#F2F1FF' },
  binWrong: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft },
  binHead: { alignItems: 'center' },
  binItems: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 },
  items: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm, minHeight: MIN_TOUCH + 12 },
  item: {
    minWidth: 76,
    minHeight: 76,
    borderRadius: radius.md,
    backgroundColor: '#FFF3C4',
    borderWidth: 3,
    borderColor: colors.star,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    ...shadow,
  },
  itemSelected: { borderColor: colors.parent, borderWidth: 5, transform: [{ scale: 1.08 }] },
  rotateRow: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
  rotateBox: {
    width: 140,
    minHeight: 150,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  turnHint: { position: 'absolute', top: 4, right: 8, fontSize: 22 },
  hidden: { height: 0, opacity: 0 },
});
