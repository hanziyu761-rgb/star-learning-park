/**
 * 思维挑战题的题图（V2.5，原创绘制）：方格谜题、天平、由小格子拼成的长方形。
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { PuzzleFigure } from '@/lesson/types';
import { colors, radius, space } from '@/theme';

export function PuzzleView({ puzzle, alt }: { puzzle: PuzzleFigure; alt: string }) {
  if (puzzle.kind === 'grid') {
    return (
      <View style={styles.grid} accessibilityLabel={alt} testID="puzzle-grid">
        {puzzle.cells.map((row, r) => (
          <View key={r} style={styles.gridRow}>
            {row.map((c, i) => (
              <View
                key={i}
                style={[styles.cell, c === '?' && styles.cellAsk, c === '' && styles.cellBlank]}
                testID={c === '?' ? 'puzzle-ask' : undefined}
              >
                <Text style={styles.cellText}>{c === '?' ? '❓' : c}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }
  if (puzzle.kind === 'balance') {
    return (
      <View style={{ gap: space.sm }} accessibilityLabel={alt} testID="puzzle-balance">
        {puzzle.rows.map((row, i) => (
          <View key={i} style={styles.balanceRow}>
            <Text style={styles.side}>{row.left.repeat(row.leftCount)}</Text>
            <Text style={styles.scale}>⚖️</Text>
            <Text style={styles.side}>{row.right.repeat(row.rightCount)}</Text>
          </View>
        ))}
      </View>
    );
  }
  // 由小格子拼成的长方形：外框和格线
  const cw = puzzle.square ? 56 : 70;
  const ch = puzzle.square ? 56 : 44;
  const w = puzzle.cols * cw;
  const h = puzzle.rows * ch;
  const cells = [];
  for (let r = 0; r < puzzle.rows; r++)
    for (let c = 0; c < puzzle.cols; c++)
      cells.push(
        <Rect
          key={`${r}-${c}`}
          x={4 + c * cw}
          y={4 + r * ch}
          width={cw}
          height={ch}
          fill="#FFF7E0"
          stroke="#3A2E2A"
          strokeWidth={3}
        />,
      );
  return (
    <View accessibilityLabel={alt} testID="puzzle-rects">
      <Svg width={w + 8} height={h + 8}>
        {cells}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { borderWidth: 3, borderColor: colors.text, borderRadius: radius.sm, overflow: 'hidden' },
  gridRow: { flexDirection: 'row' },
  cell: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#C9BFB4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cellAsk: { backgroundColor: '#FFE9A8' },
  cellBlank: { backgroundColor: '#F4F1EC' },
  cellText: { fontSize: 30 },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: '#FFF7E0',
    borderRadius: radius.md,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  side: { fontSize: 30, minWidth: 40, textAlign: 'center' },
  scale: { fontSize: 30 },
});
