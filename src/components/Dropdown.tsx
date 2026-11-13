/**
 * 下拉选择（V4.1）：点一下弹出选项列表，选中后收起。家长中心用（教材资源库）。
 * React Native 没有自带下拉框，这里用 Modal 实现，手机、平板、网页版表现一致。
 */
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { colors, radius, space, themed, type } from '@/theme';

export interface DropdownOption {
  value: string;
  label: string;
  /** 选项下方的小字说明 */
  hint?: string;
  /** 分组标题（从这一项开始显示一个新分组） */
  group?: string;
}

export function Dropdown({
  label,
  value,
  options,
  onChange,
  testID,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
  testID: string;
}) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.box}
        accessibilityRole="button"
        accessibilityLabel={`${label}：${cur?.label ?? '请选择'}`}
        testID={testID}
      >
        <Text style={styles.value} numberOfLines={1}>
          {cur?.label ?? '请选择'}
        </Text>
        <Text style={styles.arrow}>⌄</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.mask} scaleTo={1} onPress={() => setOpen(false)} testID={`${testID}-mask`}>
          <Pressable style={styles.sheet} scaleTo={1} onPress={() => undefined}>
            <Text style={styles.title}>{label}</Text>
            <ScrollView style={{ maxHeight: 440 }}>
              {options.map((o) => (
                <View key={o.value}>
                  {o.group ? <Text style={styles.group}>{o.group}</Text> : null}
                  <Pressable
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={[styles.item, o.value === value && styles.itemOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: o.value === value }}
                    testID={`${testID}-opt-${o.value}`}
                  >
                    <Text style={[styles.itemText, o.value === value && styles.itemTextOn]}>
                      {o.value === value ? '✓ ' : ''}
                      {o.label}
                    </Text>
                    {o.hint ? <Text style={styles.hint}>{o.hint}</Text> : null}
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <Pressable onPress={() => setOpen(false)} style={styles.cancel} accessibilityRole="button">
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  label: { ...type.footnote, fontWeight: '600', color: colors.textSoft, marginLeft: 4 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    paddingHorizontal: space.lg,
    backgroundColor: colors.cardAlt,
  },
  value: { flex: 1, ...type.headline, color: colors.text },
  arrow: { fontSize: 20, lineHeight: 20, color: colors.textSoft, marginLeft: 8, marginTop: -8 },
  mask: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: space.xl },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: space.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    boxShadow: '0px 24px 64px rgba(0, 0, 0, 0.18)',
  },
  title: { ...type.title3, color: colors.text, marginBottom: space.md, marginLeft: 4 },
  group: { ...type.footnote, fontWeight: '600', color: colors.textSoft, marginTop: space.md, marginBottom: 6, marginLeft: 4 },
  item: {
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    marginBottom: 2,
  },
  itemOn: { backgroundColor: colors.primarySoft },
  itemText: { ...type.headline, color: colors.text },
  itemTextOn: { color: colors.primary },
  hint: { ...type.caption, color: colors.textSoft, marginTop: 2 },
  cancel: { alignItems: 'center', justifyContent: 'center', minHeight: 52, marginTop: space.sm },
  cancelText: { ...type.headline, color: colors.primary },
}));
