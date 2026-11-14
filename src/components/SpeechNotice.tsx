/**
 * 朗读出问题时的提示（V5.1）：不再用手机自带语音后，没网或没设置 AI 服务就读不出声音，
 * 在屏幕顶部浮出一句话，3 秒后消失；同一种问题 30 秒内只提示一次，不反复打扰。
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onSpeechProblem, type SpeechProblem } from '@/speech/speech';
import { colors, radius, shadow, space, themed, type } from '@/theme';
import { Glass } from './Glass';

export const SPEECH_PROBLEM_TEXT: Record<SpeechProblem, string> = {
  offline: '🔇 没连上网络，暂时听不到朗读',
  'no-service': '🔇 还没设置朗读服务（家长中心 → 设置）',
};
const SHOW_MS = 3000;
const QUIET_MS = 30_000;

export function SpeechNotice() {
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState<SpeechProblem | null>(null);
  const last = useRef<Partial<Record<SpeechProblem, number>>>({});
  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    const off = onSpeechProblem((p) => {
      const now = Date.now();
      if (now - (last.current[p] ?? -Infinity) < QUIET_MS) return;
      last.current[p] = now;
      setShown(p);
      if (hide) clearTimeout(hide);
      hide = setTimeout(() => setShown(null), SHOW_MS);
    });
    return () => {
      off();
      if (hide) clearTimeout(hide);
    };
  }, []);
  if (!shown) return null;
  return (
    <View style={[styles.wrap, { top: insets.top + space.sm }]} pointerEvents="none">
      <Animated.View entering={FadeInUp.springify().damping(16)} exiting={FadeOutUp.duration(160)}>
        <Glass style={styles.pill} testID="speech-notice">
          <Text style={styles.text} accessibilityRole="alert">
            {SPEECH_PROBLEM_TEXT[shown]}
          </Text>
        </Glass>
      </Animated.View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
    pill: { borderRadius: radius.round, overflow: 'hidden', paddingVertical: space.md, paddingHorizontal: space.xl, ...shadow },
    text: { ...type.subhead, fontWeight: '600', color: colors.text },
  }),
);
