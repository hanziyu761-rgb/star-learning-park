import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { DisplayText } from '@/lesson/types';
import { colors, radius, shadow, space, themed, type as typo } from '@/theme';
import { Glass } from './Glass';
import { Mascot } from './Mascot';
import { DisplayTextView } from './PinyinText';
import { Pressable } from './Tappable';

/** 平板上内容的最大宽度 */
const MAX_W = 760;

/**
 * 页面外框（V5.0）：
 * - 第一个子元素是 <Header> 时，导航栏固定在顶部，内容从毛玻璃导航栏下面滑过（苹果式）。
 * - 内容区左右留白 20，平板上居中、最宽 760。
 */
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
  const [headerH, setHeaderH] = useState(72);
  const items = React.Children.toArray(children);
  const first = items[0];
  const hasHeader = scroll && React.isValidElement(first) && first.type === Header;
  const body = hasHeader ? items.slice(1) : items;

  if (!scroll) {
    return (
      <View
        style={[styles.root, { backgroundColor: bg, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xl }]}
        testID={testID}
      >
        {children}
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: bg }} testID={testID}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (hasHeader ? headerH : insets.top) + space.lg,
            paddingBottom: insets.bottom + space.xxxl,
          },
        ]}
      >
        {body}
      </ScrollView>
      {hasHeader ? (
        <Glass style={[styles.bar, { paddingTop: insets.top }]} pointerEvents="box-none">
          <View style={styles.barInner} onLayout={(e) => setHeaderH(e.nativeEvent.layout.height + insets.top)} pointerEvents="box-none">
            {first}
          </View>
          <View style={styles.barLine} />
        </Glass>
      ) : null}
    </View>
  );
}

/** 返回箭头（苹果式细箭头） */
function Chevron({ color }: { color: string }) {
  return (
    <Svg width={14} height={22} viewBox="0 0 14 22">
      <Path d="M11 2 L3 11 L11 20" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function Header({ title, onBack, right }: { title: DisplayText; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.back} accessibilityRole="button" accessibilityLabel="返回" testID="back">
        <Chevron color={colors.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <DisplayTextView text={title} size={24} />
      </View>
      <View style={{ minWidth: 56, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function LoadingView() {
  return (
    <View style={[styles.root, styles.center, { backgroundColor: colors.bg }]} testID="loading">
      <Mascot size={110} />
      <ActivityIndicator size="large" color={colors.textSoft} />
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

const styles = themed(() =>
  StyleSheet.create({
    root: { flex: 1, paddingHorizontal: space.xl - 4 },
    center: { alignItems: 'center', justifyContent: 'center', gap: space.lg },
    content: { paddingHorizontal: space.xl - 4, gap: space.xl, width: '100%', maxWidth: MAX_W, alignSelf: 'center' },
    bar: { position: 'absolute', top: 0, left: 0, right: 0 },
    barInner: { width: '100%', maxWidth: MAX_W, alignSelf: 'center', paddingHorizontal: space.xl - 4, paddingVertical: space.sm },
    barLine: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
    header: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56 },
    back: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: 3,
      ...shadow,
    },
    notice: { backgroundColor: colors.bgSky, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.lg },
    noticeWarn: { backgroundColor: colors.wrongSoft },
    noticeText: { ...typo.subhead, color: colors.text, lineHeight: 22 },
  }),
);
