/**
 * 描红写字（V2.9）：在田字格里按笔顺一笔一笔描。
 * 当前这一笔标出起点（红点）和方向；描完一笔，程序检查起点、终点、经过的拐点和方向，对了才进入下一笔。
 * 笔画数据为本项目按规范笔顺绘制的简化折线（不是字体轮廓），只检查笔顺和方向，不评判字写得好不好看。
 */
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { DisplayTextView } from '@/components/PinyinText';
import { zh } from '@/content/zh';
import type { TraceExercise as TraceData } from '@/lesson/types';
import { colors, radius, space, themed } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

const SIZE = 280;
const K = SIZE / 100;
type Pt = [number, number];

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** 判断一次描写是否符合这一笔（坐标 0～100，纯函数，供测试） */
export function checkStroke(drawn: Pt[], stroke: Pt[], tol = 20): 'ok' | 'reversed' | 'off' {
  if (drawn.length < 2) return 'off';
  const start = drawn[0];
  const end = drawn[drawn.length - 1];
  const s = stroke[0];
  const e = stroke[stroke.length - 1];
  const len = stroke.slice(1).reduce((t, p, i) => t + dist(p, stroke[i]), 0);
  const drawnLen = drawn.slice(1).reduce((t, p, i) => t + dist(p, drawn[i]), 0);
  if (dist(start, e) < tol && dist(end, s) < tol && dist(start, s) >= tol) return 'reversed';
  if (dist(start, s) >= tol || dist(end, e) >= tol) return 'off';
  if (drawnLen < len * 0.5) return 'off';
  // 折笔：要经过每个拐点
  for (const corner of stroke.slice(1, -1)) if (Math.min(...drawn.map((p) => dist(p, corner))) >= tol) return 'off';
  return 'ok';
}

const STROKE_PY: Record<string, string> = {
  横: 'héng',
  竖: 'shù',
  撇: 'piě',
  捺: 'nà',
  点: 'diǎn',
  提: 'tí',
  横折: 'héng zhé',
  竖折: 'shù zhé',
};

export function TraceExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<TraceData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [done, setDone] = useState(0);
  const [live, setLive] = useState<Pt[]>([]);
  const pts = useRef<Pt[]>([]);
  const doneRef = useRef(0);
  const current = exercise.strokes[done];

  const finish = () => {
    const stroke = exercise.strokes[doneRef.current];
    const drawn = pts.current.map(([x, y]) => [x / K, y / K] as Pt);
    pts.current = [];
    setLive([]);
    if (!stroke) return;
    const r = checkStroke(drawn, stroke.points);
    if (r === 'ok') {
      onFeedback(null);
      doneRef.current += 1;
      setDone(doneRef.current);
      if (doneRef.current === exercise.strokes.length) correct();
    } else {
      wrong(
        r === 'reversed'
          ? {
              text: zh('方向反了，要从红点开始写。', 'fāng xiàng fǎn le yào cóng hóng diǎn kāi shǐ xiě'),
              speak: { text: '方向反了，要从红点开始写。', lang: 'zh-CN' },
            }
          : exercise.wrongHint,
      );
    }
  };

  const pan = usePanGesture({
    enabled: !solved,
    minDistance: 0,
    runOnJS: true,
    onBegin: (e) => {
      pts.current = [[e.x, e.y]];
      setLive(pts.current);
    },
    onUpdate: (e) => {
      pts.current = [...pts.current, [e.x, e.y]];
      if (pts.current.length % 2 === 0) setLive(pts.current);
    },
    onFinalize: finish,
  });

  const line = (p: Pt[]) => p.map(([x, y]) => `${x * K},${y * K}`).join(' ');
  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <View style={styles.info}>
        {current ? (
          <View style={styles.row} testID="trace-step">
            <Text style={styles.stepText}>
              第 {done + 1} 笔 / 共 {exercise.strokes.length} 笔：
            </Text>
            <DisplayTextView text={zh(current.name, STROKE_PY[current.name] ?? '')} size={22} color={colors.wrong} />
          </View>
        ) : (
          <Text style={styles.stepText} testID="trace-done">
            写好了！笔顺：{exercise.strokes.map((s) => s.name).join(' → ')}
          </Text>
        )}
      </View>
      <GestureDetector gesture={pan}>
        <View style={styles.canvas} testID="trace-canvas" collapsable={false}>
          <Svg width={SIZE} height={SIZE}>
            <Rect x={1} y={1} width={SIZE - 2} height={SIZE - 2} fill="#FFFDF5" stroke="#E07A5F" strokeWidth={2} />
            <Line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke="#F3B8A8" strokeDasharray="6 6" />
            <Line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} stroke="#F3B8A8" strokeDasharray="6 6" />
            {exercise.strokes.map((s, i) => (
              <Polyline
                key={i}
                points={line(s.points)}
                fill="none"
                stroke={i < done ? colors.text : i === done ? '#F6C8C0' : '#E8E2DA'}
                strokeWidth={i < done ? 16 : 20}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {current ? (
              <>
                <Circle cx={current.points[0][0] * K} cy={current.points[0][1] * K} r={11} fill={colors.wrong} />
                <Circle
                  cx={current.points[current.points.length - 1][0] * K}
                  cy={current.points[current.points.length - 1][1] * K}
                  r={6}
                  fill="none"
                  stroke={colors.wrong}
                  strokeWidth={3}
                />
              </>
            ) : null}
            {live.length > 1 ? (
              <Polyline
                points={live.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke={colors.parent}
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        </View>
      </GestureDetector>
      <Text style={styles.note}>从红点开始，顺着浅红色的笔画写到小圆圈。</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.md, alignItems: 'stretch' },
  info: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  stepText: { fontSize: 16, fontWeight: '600', color: colors.text },
  canvas: { alignSelf: 'center', width: SIZE, height: SIZE, borderRadius: radius.sm, overflow: 'hidden' },
  note: { textAlign: 'center', fontSize: 13, color: colors.textSoft },
}));
