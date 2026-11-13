/**
 * 分段选择（V5.0，苹果式 Segmented Control）：白色滑块跟着选项用弹簧滑动。
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, shadow, spring, themed, type } from '@/theme';
import { Pressable } from './Tappable';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  testID: string;
}) {
  const [w, setW] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const seg = w > 0 ? (w - 8) / options.length : 0;
  const x = useSharedValue(index * seg);
  useEffect(() => {
    x.set(withSpring(index * seg, { damping: 20, stiffness: spring.release.stiffness + 60 }));
  }, [index, seg, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return (
    <View style={styles.track} onLayout={(e) => setW(e.nativeEvent.layout.width)} testID={testID} accessibilityRole="radiogroup">
      {seg > 0 ? <Animated.View style={[styles.knob, { width: seg }, knob]} /> : null}
      {options.map((o) => (
        <Pressable
          key={o.value}
          style={styles.item}
          scaleTo={0.97}
          onPress={() => onChange(o.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: o.value === value }}
          testID={`${testID}-${o.value}`}
        >
          <Text style={[styles.text, o.value === value && styles.textOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    track: { flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: radius.sm, padding: 4, minHeight: 52 },
    knob: { position: 'absolute', top: 4, bottom: 4, left: 4, backgroundColor: colors.card, borderRadius: radius.sm - 4, ...shadow },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
    text: { ...type.subhead, fontWeight: '600', color: colors.textSoft },
    textOn: { color: colors.text },
  }),
);
