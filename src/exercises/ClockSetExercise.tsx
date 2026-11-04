/**
 * 认识钟表：拨钟到整时。
 * - 在钟面上拖动：靠近中心、对着时针开始拖 → 拨时针（按整时吸附）；其他位置 → 拨分针（5 分钟吸附）。
 * - 拨分针时时针跟着走（分针转一圈，时针走一大格），保证两针关系和真钟一样。
 * - 另有「时针 +1 / −1」「分针 +5 / −5」大按钮，方便手指不灵活的孩子，也供自动化测试使用。
 */
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { ClockFace, VisualView } from '@/components/Figure';
import { DisplayTextView } from '@/components/PinyinText';
import { BigButton, tapFeedback } from '@/components/ui';
import { zh } from '@/content/zh';
import type { ClockSetExercise as ClockSetData } from '@/lesson/types';
import { colors, radius, shadow, space } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

const DAY = 12 * 60;
const norm = (m: number) => ((m % DAY) + DAY) % DAY;

/** 纯函数：把一次拖动的角度换算成新的总分钟数（供测试） */
export function dragMinuteHand(total: number, angleDeg: number): number {
  const prevMin = norm(total) % 60;
  const newMin = (Math.round(angleDeg / 30) * 5) % 60; // 5 分钟一格
  let delta = newMin - prevMin;
  if (delta > 30) delta -= 60; // 逆时针跨过 12
  if (delta < -30) delta += 60; // 顺时针跨过 12
  return norm(total + delta);
}

export function dragHourHand(total: number, angleDeg: number): number {
  const minute = norm(total) % 60;
  const h = ((Math.round(angleDeg / 30 - minute / 60) % 12) + 12) % 12;
  return norm(h * 60 + minute);
}

export const clockParts = (total: number) => {
  const t = norm(total);
  const h = Math.floor(t / 60);
  return { hour: h === 0 ? 12 : h, minute: t % 60 };
};

const SIZE = 240;

export function ClockSetExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<ClockSetData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [total, setTotal] = useState(norm(exercise.startMinutes));
  const [active, setActive] = useState<'hour' | 'minute' | null>(null);
  const totalRef = useRef(total);
  const mode = useRef<'hour' | 'minute'>('minute');

  const update = (t: number) => {
    totalRef.current = t;
    setTotal(t);
  };

  const angleAt = (x: number, y: number) => {
    const dx = x - SIZE / 2;
    const dy = y - SIZE / 2;
    return { angle: ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360, dist: Math.hypot(dx, dy) };
  };

  const pan = usePanGesture({
    enabled: !solved,
    minDistance: 1,
    runOnJS: true,
    onBegin: (e) => {
      const { angle, dist } = angleAt(e.x, e.y);
      const t = norm(totalRef.current);
      const hourAngle = ((Math.floor(t / 60) % 12) + (t % 60) / 60) * 30;
      const diff = Math.abs(((angle - hourAngle + 540) % 360) - 180);
      mode.current = dist < SIZE * 0.3 && diff < 35 ? 'hour' : 'minute';
      setActive(mode.current);
      onFeedback(null);
    },
    onUpdate: (e) => {
      const { angle, dist } = angleAt(e.x, e.y);
      if (dist < 12) return; // 太靠近中心，角度不稳定
      const next =
        mode.current === 'hour' ? dragHourHand(totalRef.current, angle) : dragMinuteHand(totalRef.current, angle);
      if (next !== totalRef.current) update(next);
    },
    onFinalize: () => setActive(null),
  });

  const step = (d: number) => {
    if (solved) return;
    tapFeedback();
    onFeedback(null);
    update(norm(totalRef.current + d));
  };

  const check = () => {
    if (solved) return;
    const { hour, minute } = clockParts(totalRef.current);
    const target = exercise.targetHour % 12 === 0 ? 12 : exercise.targetHour % 12;
    if (minute === 0 && hour === target) correct();
    else if (minute !== 0)
      wrong({
        text: zh('整时的时候，分针要指着十二。', 'zhěng shí de shí hou fēn zhēn yào zhǐ zhe shí èr'),
        speak: { text: '整时的时候，分针要指着十二。', lang: 'zh-CN' },
      });
    else
      wrong({
        text: zh(`看看短短的时针，要指着${target}。`, 'kàn kan duǎn duǎn de shí zhēn yào zhǐ zhe'),
        speak: { text: `看看短短的时针，要指着${target}。`, lang: 'zh-CN' },
      });
  };

  const { hour, minute } = clockParts(total);
  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      {exercise.scene ? (
        <View style={styles.scene}>
          <VisualView visual={exercise.scene} size={56} />
        </View>
      ) : null}
      <View style={styles.clockRow}>
        <GestureDetector gesture={pan}>
          <View style={[styles.clock, active && styles.clockActive]} testID="clock-face" collapsable={false}>
            <ClockFace hour={hour} minute={minute} size={SIZE} highlight={solved} />
          </View>
        </GestureDetector>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#E8505B' }]} />
          <DisplayTextView text={zh('短的是时针', 'duǎn de shì shí zhēn')} size={16} color="#E8505B" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#4D9DE0' }]} />
          <DisplayTextView text={zh('长的是分针', 'cháng de shì fēn zhēn')} size={16} color="#4D9DE0" />
        </View>
      </View>
      {!solved ? (
        <>
          <View style={styles.btnRow}>
            <BigButton
              size="md"
              emoji="⏪"
              label={zh('时针', 'shí zhēn')}
              color="#E8505B"
              onPress={() => step(-60)}
              testID="clock-hour-minus"
              accessibilityLabel="时针退一格"
            />
            <BigButton
              size="md"
              emoji="⏩"
              label={zh('时针', 'shí zhēn')}
              color="#E8505B"
              onPress={() => step(60)}
              testID="clock-hour-plus"
              accessibilityLabel="时针进一格"
            />
          </View>
          <View style={styles.btnRow}>
            <BigButton
              size="md"
              emoji="◀️"
              label={zh('分针', 'fēn zhēn')}
              color="#4D9DE0"
              onPress={() => step(-5)}
              testID="clock-minute-minus"
              accessibilityLabel="分针退5分"
            />
            <BigButton
              size="md"
              emoji="▶️"
              label={zh('分针', 'fēn zhēn')}
              color="#4D9DE0"
              onPress={() => step(5)}
              testID="clock-minute-plus"
              accessibilityLabel="分针进5分"
            />
          </View>
          <BigButton
            emoji="✅"
            label={zh('拨好了', 'bō hǎo le')}
            color={colors.correct}
            size="md"
            onPress={check}
            testID="clock-check"
          />
        </>
      ) : null}
      {/* 供自动化测试读取当前钟面时间（孩子看不到，避免直接看数字作答） */}
      <Text style={styles.hidden} testID="clock-value">
        {`${hour}:${String(minute).padStart(2, '0')}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  scene: { alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, padding: space.sm },
  clockRow: { alignItems: 'center' },
  clock: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, ...shadow, backgroundColor: '#fff' },
  clockActive: { transform: [{ scale: 1.03 }] },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: space.lg },
  legendItem: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, marginBottom: 6 },
  btnRow: { flexDirection: 'row', gap: space.sm, justifyContent: 'center' },
  hidden: { height: 0, opacity: 0 },
});
