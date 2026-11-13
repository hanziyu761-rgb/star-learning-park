/**
 * 带弹簧手感的 Pressable（V5.0）：按下时轻轻缩小，松开时带一点回弹。
 * 用法和 react-native 的 Pressable 完全一样（全 APP 的 Pressable 都从这里引入）。
 * - `scaleTo`：按下时缩到多大，默认 0.95；遮罩、整页大面板传 1（不缩放）。
 * - 系统打开“减弱动态效果”时不做缩放。
 * - 旧样式里 `pressed && { transform: [{ scale }] }` 的写法会被弹簧动画接管。
 * - `pop`：变成 true 时弹一下（答对）；`shake`：变成 true 时左右轻摇一下（答错）。
 */
import React, { useEffect, useState } from 'react';
import {
  Pressable as RNPressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spring } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export type TappableProps = PressableProps & {
  /** 按下时的缩放比例，默认 0.95；传 1 不缩放 */
  scaleTo?: number;
  /** 变成 true 时弹一下（答对） */
  pop?: boolean;
  /** 变成 true 时左右轻摇（答错） */
  shake?: boolean;
};

type Transform = NonNullable<ViewStyle['transform']>;

export function Pressable({ style, children, onPressIn, onPressOut, scaleTo = 0.95, disabled, pop, shake, ...rest }: TappableProps) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  useEffect(() => {
    if (pop && !reduce) scale.set(withSequence(withSpring(1.08, spring.pop), withSpring(1, spring.release)));
  }, [pop, reduce, scale]);
  useEffect(() => {
    if (shake && !reduce)
      tx.set(
        withSequence(
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 70 }),
          withTiming(-4, { duration: 60 }),
          withSpring(0, spring.release),
        ),
      );
  }, [shake, reduce, tx]);
  const [pressed, setPressed] = useState(false);
  const animate = !disabled && !reduce && scaleTo !== 1;

  const resolve = (p: boolean) =>
    StyleSheet.flatten(typeof style === 'function' ? style({ pressed: p } as PressableStateCallbackType) : style) ?? {};
  // 按下时的其他样式（底色等）照常生效；缩放交给弹簧
  const { transform: _pressedTransform, ...current } = resolve(pressed) as ViewStyle;
  const base = ((pressed ? (resolve(false) as ViewStyle).transform : _pressedTransform) ?? []) as Transform;
  const baseKey = JSON.stringify(base);

  const anim = useAnimatedStyle(
    () => ({ transform: [...(base as Transform), { translateX: tx.get() }, { scale: scale.get() }] as Transform }),
    [baseKey],
  );

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        if (animate) scale.set(withSpring(scaleTo, spring.press));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        if (animate) scale.set(withSpring(1, spring.release));
        onPressOut?.(e);
      }}
      style={[current, anim]}
      {...rest}
    >
      {typeof children === 'function' ? children({ pressed } as PressableStateCallbackType) : children}
    </AnimatedPressable>
  );
}
