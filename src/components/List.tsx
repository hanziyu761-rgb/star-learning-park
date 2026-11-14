/**
 * 苹果“设置”式的分组列表（V5.1，家长中心用）：一组圆角卡片，每行左边图标、中间名称、右边数值和箭头（或开关）。
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, space, themed, type } from '@/theme';
import { Pressable } from './Tappable';

export function ListGroup({ children, title, testID }: { children: React.ReactNode; title?: string; testID?: string }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View testID={testID}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.group}>
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={styles.sep} /> : null}
            {r}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export function ListRow({
  icon,
  title,
  detail,
  onPress,
  right,
  testID,
}: {
  icon: string;
  title: string;
  /** 右边的灰色小字（例如“3 道”） */
  detail?: string;
  /** 有 onPress 时整行可点，右边显示箭头 */
  onPress?: () => void;
  /** 右边放开关等控件（没有 onPress 时用） */
  right?: React.ReactNode;
  testID?: string;
}) {
  const body = (
    <>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {detail ? (
        <Text style={styles.detail} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
      {right}
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );
  if (!onPress)
    return (
      <View style={styles.row} testID={testID}>
        {body}
      </View>
    );
  return (
    <Pressable onPress={onPress} scaleTo={0.98} style={styles.row} accessibilityRole="button" accessibilityLabel={title} testID={testID}>
      {body}
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    groupTitle: { ...type.footnote, fontWeight: '600', color: colors.textSoft, marginLeft: space.lg, marginBottom: space.sm },
    group: { backgroundColor: colors.card, borderRadius: radius.md, borderCurve: 'continuous', overflow: 'hidden', ...shadow },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 56 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 60,
      paddingHorizontal: space.lg,
      backgroundColor: colors.card,
    },
    icon: { fontSize: 24, width: 28, textAlign: 'center', color: colors.text },
    title: { ...type.body, flex: 1, color: colors.text },
    detail: { ...type.callout, color: colors.textSoft, maxWidth: '45%' },
    chevron: { fontSize: 26, color: colors.textFaint, marginTop: -2 },
  }),
);
