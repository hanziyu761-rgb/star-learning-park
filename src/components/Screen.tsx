import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DisplayText } from '@/lesson/types';
import { colors, radius, space } from '@/theme';
import { Mascot } from './Mascot';
import { DisplayTextView } from './PinyinText';

export function Screen({
  children,
  bg = colors.bg,
  scroll = true,
  testID,
}: {
  children: React.ReactNode;
  bg?: string;
  scroll?: boolean;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xl };
  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: bg }, pad]} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView style={{ backgroundColor: bg }} contentContainerStyle={[styles.content, pad]} testID={testID}>
      {children}
    </ScrollView>
  );
}

export function Header({ title, onBack, right }: { title: DisplayText; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.back} accessibilityRole="button" accessibilityLabel="返回" testID="back">
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <DisplayTextView text={title} size={26} />
      </View>
      <View style={{ minWidth: 56, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function LoadingView() {
  return (
    <View style={[styles.root, styles.center, { backgroundColor: colors.bg }]} testID="loading">
      <Mascot size={110} />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'warn' }) {
  return (
    <View style={[styles.notice, tone === 'warn' && styles.noticeWarn]} accessibilityRole="alert">
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.lg },
  center: { alignItems: 'center', justifyContent: 'center', gap: space.lg },
  // 平板上内容限制最大宽度并居中
  content: { paddingHorizontal: space.lg, gap: space.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  back: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, fontWeight: '900', color: colors.text },
  notice: { backgroundColor: colors.bgSky, borderRadius: radius.md, padding: space.md },
  noticeWarn: { backgroundColor: colors.wrongSoft },
  noticeText: { fontSize: 15, color: colors.text, lineHeight: 22 },
});
