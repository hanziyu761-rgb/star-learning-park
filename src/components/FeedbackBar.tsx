import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import type { FeedbackMessage } from '@/lesson/feedback';
import { colors, radius, space, themed } from '@/theme';
import { Mascot } from './Mascot';
import { DisplayTextView } from './PinyinText';

/** 答题反馈条：答对 / 答错提示 */
export function FeedbackBar({ message }: { message: FeedbackMessage | null }) {
  if (!message) return null;
  const bg =
    message.kind === 'correct' ? colors.correctSoft : message.kind === 'wrong' ? colors.wrongSoft : colors.bgSky;
  const fg = message.kind === 'correct' ? colors.correct : message.kind === 'wrong' ? colors.wrong : colors.text;
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(14).stiffness(180)}
      exiting={FadeOut.duration(120)}
      style={[styles.bar, { backgroundColor: bg }]}
      testID={`feedback-${message.kind}`}
      accessibilityLiveRegion="polite"
    >
      <Mascot size={40} mood={message.kind === 'correct' ? 'cheer' : 'think'} bounce={false} />
      <View style={styles.texts}>
        <DisplayTextView text={message.text} size={20} color={fg} />
        {message.hint ? <DisplayTextView text={message.hint.text} size={16} color={colors.text} /> : null}
        {message.note ? (
          <Text style={styles.note} testID="feedback-note">
            {message.note}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  texts: { flex: 1, alignItems: 'center', gap: 2 },
  note: { fontSize: 13, color: colors.textSoft, textAlign: 'center' },
}));
