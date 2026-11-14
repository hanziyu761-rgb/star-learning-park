/**
 * 家长中心 · 声音设置（V5.1）：全 APP 只用星星宝童声（预先录好 + 阿里云联网现念），不再用手机自带语音。
 * 这里可以调语速、试听。
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { Card, SectionTitle } from '@/components/ui';
import { useProgress } from '@/progress/ProgressContext';
import type { Settings } from '@/progress/model';
import { speak } from '@/speech/speech';
import { colors, radius, space, themed } from '@/theme';
import { APP_VERSION } from '@/version';

const SAMPLE = {
  'zh-CN': '小朋友你好，我们一起来学习吧！',
  'en-US': 'Hello! Let’s learn together.',
} as const;

export function VoiceCheckCard() {
  const { state, dispatch } = useProgress();
  const s = state.settings;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current); // 离开页面时不再朗读
    },
    [],
  );
  /** 等设置生效后再读一句示例 */
  const sampleLater = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => speak({ text: SAMPLE['zh-CN'], lang: 'zh-CN' }), 50);
  };
  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings/set', settings: patch });

  return (
    <Card>
      <View testID="voice-check">
        <SectionTitle>🔊 声音</SectionTitle>
        <Text style={styles.small} testID="voice-gender-note">
          星星宝童声（阿里云）· 需要联网，没网时不出声
        </Text>
        <Text style={styles.label}>语速</Text>
        <View style={styles.row}>
          {(['slow', 'normal'] as const).map((r) => (
            <Pressable
              key={r}
              testID={`voice-rate-${r}`}
              accessibilityRole="button"
              accessibilityState={{ selected: s.speechRate === r }}
              onPress={() => {
                set({ speechRate: r });
                sampleLater();
              }}
              style={[styles.chip, s.speechRate === r && styles.chipOn]}
            >
              <Text style={[styles.chipText, s.speechRate === r && styles.chipTextOn]}>
                {r === 'slow' ? '🐢 慢一点' : '🚶 正常'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <Pressable
            style={styles.btn}
            accessibilityRole="button"
            testID="voice-test-zh"
            onPress={() => speak({ text: SAMPLE['zh-CN'], lang: 'zh-CN' })}
          >
            <Text style={styles.btnText}>试听童声·中文</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            accessibilityRole="button"
            testID="voice-test-en"
            onPress={() => speak({ text: SAMPLE['en-US'], lang: 'en-US' })}
          >
            <Text style={styles.btnText}>试听童声·英语</Text>
          </Pressable>
        </View>

        <View style={styles.splashRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>开机动画</Text>
          </View>
          <Switch value={s.splash} onValueChange={(v) => set({ splash: v })} testID="splash-switch" />
        </View>
        <Text style={styles.version} testID="app-version">
          林亨学习乐园 版本 {APP_VERSION}
        </Text>
      </View>
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  small: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  chip: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: space.md,
    paddingVertical: 8,
  },
  chipOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.text },
  chipTextOn: { color: colors.blue },
  btn: {
    flex: 1,
    backgroundColor: colors.blue,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  btnText: { color: colors.onAccent, fontWeight: '600', fontSize: 15 },
  splashRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  version: { fontSize: 12, color: colors.textSoft, marginTop: space.md, textAlign: 'right' },
}));
