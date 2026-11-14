import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Pressable } from '@/components/Tappable';
import * as Haptics from 'expo-haptics';
import type { DisplayText, Speakable } from '@/lesson/types';
import { onSpeakingChange, speak } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, shadow, space, themed, type } from '@/theme';
import { DisplayTextView } from './PinyinText';

export function tapFeedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

interface BigButtonProps {
  label?: DisplayText;
  emoji?: string;
  color?: string;
  textColor?: string;
  onPress: () => void;
  disabled?: boolean;
  /** 按下时同时朗读（帮助不识字的孩子） */
  speakOnPress?: Speakable;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
  testID?: string;
  accessibilityLabel?: string;
}

export function BigButton({
  label,
  emoji,
  color = colors.primary,
  textColor = colors.onAccent,
  onPress,
  disabled,
  speakOnPress,
  style,
  size = 'lg',
  testID,
  accessibilityLabel,
}: BigButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof label === 'string' ? label : label?.map((s) => s.char).join(''))}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        tapFeedback();
        if (speakOnPress) speak(speakOnPress);
        onPress();
      }}
      style={({ pressed }) => [
        styles.bigButton,
        size === 'md' && styles.bigButtonMd,
        { backgroundColor: disabled ? colors.disabled : color },
        pressed && styles.pressed,
        style,
      ]}
    >
      {emoji ? <Text style={[styles.btnEmoji, size === 'md' && { fontSize: 24 }]}>{emoji}</Text> : null}
      {label ? <DisplayTextView text={label} size={size === 'lg' ? 24 : 20} color={disabled ? colors.textSoft : textColor} /> : null}
    </Pressable>
  );
}

/** 大喇叭按钮：点击朗读，朗读时有动画状态 */
export function SpeakerButton({
  item,
  size = 72,
  color = colors.primary,
  testID,
}: {
  item: Speakable;
  size?: number;
  color?: string;
  testID?: string;
}) {
  const [active, setActive] = useState(false);
  // 朗读结束时恢复按钮状态
  useEffect(
    () =>
      onSpeakingChange((s) => {
        if (!s) setActive(false);
      }),
    [],
  );
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={item.lang === 'en-US' ? 'Listen' : '听一听'}
      onPress={() => {
        tapFeedback();
        setActive(true);
        speak(item);
      }}
      style={({ pressed }) => [
        styles.speaker,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        (pressed || active) && styles.speakerActive,
      ]}
    >
      <Text style={{ fontSize: size * 0.45 }}>{active ? '🔊' : '🔈'}</Text>
    </Pressable>
  );
}

export function StarBadge({ count, testID }: { count: number; testID?: string }) {
  return (
    <View style={styles.starBadge} testID={testID} accessibilityLabel={`星星 ${count} 颗`}>
      <Text style={styles.starEmoji}>⭐</Text>
      <Text style={styles.starCount}>{count}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Stars({ value, max = 3, size = 28 }: { value: number; max?: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }} accessibilityLabel={`${value} 颗星`}>
      {Array.from({ length: max }, (_, i) => (
        <Text key={i} style={{ fontSize: size, opacity: i < value ? 1 : 0.25 }}>
          ⭐
        </Text>
      ))}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  bigButton: {
    minHeight: MIN_TOUCH + 8,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    ...shadow,
  },
  bigButtonMd: { minHeight: MIN_TOUCH, paddingHorizontal: space.lg },
  pressed: { opacity: 0.92 },
  btnEmoji: { fontSize: 28, color: colors.text },
  speaker: { alignItems: 'center', justifyContent: 'center', ...shadow },
  speakerActive: { transform: [{ scale: 1.08 }] },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    backgroundColor: colors.card,
    borderRadius: radius.round,
    paddingHorizontal: space.md + 2,
    gap: 4,
    ...shadow,
  },
  starEmoji: { fontSize: 20, color: colors.text },
  starCount: { fontSize: 20, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  card: { backgroundColor: colors.card, borderRadius: radius.md, borderCurve: 'continuous', padding: space.xl - 4, ...shadow },
  sectionTitle: { ...type.title3, color: colors.text, marginBottom: space.xs },
}));
