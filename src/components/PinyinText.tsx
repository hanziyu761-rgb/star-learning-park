import React from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import type { DisplayText, ZhText } from '@/lesson/types';
import { colors, font } from '@/theme';
import { usePinyinOff } from './pinyinMode';

interface PinyinTextProps {
  text: ZhText;
  size?: number;
  color?: string;
  /** 隐藏拼音（例如认字练习时只看汉字） */
  hidePinyin?: boolean;
  center?: boolean;
  /** 不换行：标题必须排成一排时用（V4.1 首页“我的知识小地图”“今日复习”） */
  nowrap?: boolean;
}

/**
 * 上注音组件：拼音显示在每个汉字正上方。
 * 用于儿童阅读的中文：课程内容、题目和主要操作提示。
 */
export function PinyinText({ text, size = font.child, color = colors.text, hidePinyin: hideProp, center = true, nowrap }: PinyinTextProps) {
  // 初中（七年级及以上）全部不标拼音
  const hidePinyin = usePinyinOff() || hideProp;
  const pySize = Math.max(12, Math.round(size * 0.5));
  const label = text.map((s) => s.char).join('');
  return (
    <View
      style={[styles.row, center && styles.center, nowrap && styles.nowrap]}
      accessible
      accessibilityLabel={label}
      testID="pinyin-text"
    >
      {text.map((seg, i) =>
        seg.py ? (
          <View key={i} style={[styles.seg, { marginHorizontal: Math.max(1, size * 0.06) }]}>
            {!hidePinyin && (
              <Text style={[styles.py, { fontSize: pySize, color }]} allowFontScaling={false}>
                {seg.py}
              </Text>
            )}
            <Text style={[styles.char, { fontSize: size, lineHeight: size * 1.2, color }]} allowFontScaling={false}>
              {seg.char}
            </Text>
          </View>
        ) : (
          <View key={i} style={[styles.seg, styles.punct]}>
            <Text style={[styles.char, { fontSize: size, lineHeight: size * 1.2, color }]} allowFontScaling={false}>
              {seg.char}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}

interface DisplayTextViewProps {
  text: DisplayText;
  size?: number;
  color?: string;
  hidePinyin?: boolean;
  style?: TextStyle;
  nowrap?: boolean;
}

/** 根据内容类型自动选择：英文用普通文字，中文用上注音 */
export function DisplayTextView({ text, size = font.child, color = colors.text, hidePinyin, style, nowrap }: DisplayTextViewProps) {
  if (typeof text === 'string') {
    return (
      <Text style={[styles.en, { fontSize: size, color }, style]} allowFontScaling={false}>
        {text}
      </Text>
    );
  }
  return <PinyinText text={text} size={size} color={color} hidePinyin={hidePinyin} nowrap={nowrap} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  center: { justifyContent: 'center' },
  nowrap: { flexWrap: 'nowrap' },
  seg: { alignItems: 'center', marginHorizontal: 1, marginVertical: 2 },
  punct: { justifyContent: 'flex-end' },
  py: { fontWeight: '500', includeFontPadding: false },
  char: { fontWeight: '700', includeFontPadding: false },
  en: { fontWeight: '700', textAlign: 'center' },
});
