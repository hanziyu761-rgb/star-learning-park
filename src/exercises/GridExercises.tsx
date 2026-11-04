/**
 * 位置与方向：
 * - GridPlaceExercise：把小动物拖到指定位置（也可先点小动物再点格子）
 * - GridTapExercise：看简单地图，点出指定的地方
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tapFeedback } from '@/components/ui';
import { DragArea, Draggable, DropZone, justDragged } from '@/drag/DragArea';
import type { GridPlaceExercise as GridPlaceData, GridTapExercise as GridTapData } from '@/lesson/types';
import { colors, radius, shadow, space } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

const cellKey = (r: number, c: number) => `cell-${r}-${c}`;

export function GridPlaceExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<GridPlaceData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [placed, setPlaced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(false);
  const [wrongCell, setWrongCell] = useState<string | null>(null);

  const occupied = (r: number, c: number) => exercise.fixed.some((f) => f.row === r && f.col === c);

  const tryPlace = (zone: string | null): boolean => {
    setDragging(false);
    setSelected(false);
    if (solved || !zone) return false;
    const [, r, c] = zone.split('-').map(Number);
    if (occupied(r, c)) return false; // 有东西的格子放不进去，弹回即可
    if (r === exercise.target.row && c === exercise.target.col) {
      setPlaced(true);
      setWrongCell(null);
      correct();
      return true;
    }
    setWrongCell(zone);
    wrong(exercise.wrongHint);
    return false;
  };

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <DragArea style={styles.area}>
        <View style={styles.grid} testID="grid">
          {Array.from({ length: exercise.rows }, (_, r) => (
            <View key={r} style={styles.row}>
              {Array.from({ length: exercise.cols }, (_, c) => {
                const fixed = exercise.fixed.find((f) => f.row === r && f.col === c);
                const isTarget = placed && r === exercise.target.row && c === exercise.target.col;
                const k = cellKey(r, c);
                const hint = (dragging || selected) && !fixed && !solved;
                return (
                  <DropZone key={c} id={k} style={styles.cellWrap} testID={k}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        if (justDragged()) return;
                        if (selected) tryPlace(k);
                      }}
                      style={[
                        styles.cell,
                        hint && styles.cellHint,
                        wrongCell === k && styles.cellWrong,
                        isTarget && styles.cellRight,
                      ]}
                    >
                      <Text style={styles.cellEmoji}>{fixed ? fixed.emoji : isTarget ? exercise.mover : ''}</Text>
                    </Pressable>
                  </DropZone>
                );
              })}
            </View>
          ))}
        </View>
        {!placed ? (
          <View style={styles.moverRow}>
            <Draggable
              testID="mover"
              onDragStart={() => {
                setDragging(true);
                setWrongCell(null);
              }}
              onDrop={tryPlace}
              disabled={solved}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="拖我到格子里，或点我再点格子"
                onPress={() => {
                  if (justDragged()) return;
                  tapFeedback();
                  setSelected((s) => !s);
                }}
                style={[styles.mover, selected && styles.moverSelected]}
              >
                <Text style={styles.moverEmoji}>{exercise.mover}</Text>
              </Pressable>
            </Draggable>
          </View>
        ) : null}
      </DragArea>
    </View>
  );
}

export function GridTapExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<GridTapData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [wrongCells, setWrongCells] = useState<string[]>([]);

  const tap = (r: number, c: number) => {
    const k = cellKey(r, c);
    if (solved || wrongCells.includes(k)) return;
    tapFeedback();
    if (r === exercise.target.row && c === exercise.target.col) correct();
    else {
      setWrongCells((w) => [...w, k]);
      wrong(exercise.wrongHint);
    }
  };

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <View style={[styles.grid, styles.map]} testID="map">
        {Array.from({ length: exercise.rows }, (_, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: exercise.cols }, (_, c) => {
              const cell = exercise.cells.find((x) => x.row === r && x.col === c);
              const k = cellKey(r, c);
              const right = solved && r === exercise.target.row && c === exercise.target.col;
              return (
                <Pressable
                  key={c}
                  testID={k}
                  accessibilityRole="button"
                  onPress={() => tap(r, c)}
                  style={[
                    styles.cellWrap,
                    styles.cell,
                    styles.mapCell,
                    wrongCells.includes(k) && styles.cellWrong,
                    right && styles.cellRight,
                  ]}
                >
                  <Text style={styles.cellEmoji}>{cell?.emoji ?? ''}</Text>
                  {right ? <Text style={styles.mark}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  area: { flexDirection: 'column-reverse', gap: space.lg },
  grid: { gap: space.xs, alignSelf: 'center', width: '100%', maxWidth: 420 },
  map: { backgroundColor: '#E6F4D9', borderRadius: radius.lg, padding: space.sm },
  row: { flexDirection: 'row', gap: space.xs },
  cellWrap: { flex: 1, aspectRatio: 1 },
  cell: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.line,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCell: { backgroundColor: '#F7FBEF', borderColor: '#CFE3B8' },
  cellHint: { borderColor: colors.parent, borderStyle: 'dashed', backgroundColor: '#F2F1FF' },
  cellWrong: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft },
  cellRight: { borderColor: colors.correct, backgroundColor: colors.correctSoft },
  cellEmoji: { fontSize: 38 },
  mark: { position: 'absolute', top: 2, right: 6, fontSize: 18, fontWeight: '900', color: colors.correct },
  moverRow: { alignItems: 'center', minHeight: 96 },
  mover: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF3C4',
    borderWidth: 4,
    borderColor: colors.star,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  moverSelected: { borderColor: colors.parent, transform: [{ scale: 1.1 }] },
  moverEmoji: { fontSize: 50 },
});
