/**
 * 下拉选择（V4.1）：点一下弹出选项列表，选中后收起。家长中心用（教材资源库）。
 * React Native 没有自带下拉框，这里用 Modal 实现，手机、平板、网页版表现一致。
 */
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/theme';

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
        <Text style={styles.arrow}>▼</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.mask} onPress={() => setOpen(false)} testID={`${testID}-mask`}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
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
                    <Text style={[styles.itemText, o.value === value && { color: '#fff' }]}>
                      {o.value === value ? '✓ ' : ''}
                      {o.label}
                    </Text>
                    {o.hint ? <Text style={[styles.hint, o.value === value && { color: '#EAF3FC' }]}>{o.hint}</Text> : null}
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

const BLUE = '#4D9DE0';
const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '800', color: colors.textSoft },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: '#fff',
  },
  value: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  arrow: { fontSize: 13, color: BLUE, marginLeft: 8 },
  mask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: space.lg },
  sheet: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.md, maxWidth: 520, width: '100%', alignSelf: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: space.sm },
  group: { fontSize: 13, fontWeight: '800', color: colors.textSoft, marginTop: space.sm, marginBottom: 4 },
  item: { minHeight: 48, justifyContent: 'center', borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 8, marginBottom: 4, backgroundColor: '#F3F7FB' },
  itemOn: { backgroundColor: BLUE },
  itemText: { fontSize: 16, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  cancel: { alignItems: 'center', paddingVertical: space.sm, marginTop: space.xs },
  cancelText: { fontSize: 16, fontWeight: '800', color: BLUE },
});
