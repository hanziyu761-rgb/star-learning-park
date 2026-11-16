/**
 * 不能打开的功能：盖在页面上的说明（V5.3）。给孩子看的一句话标拼音，给家长看的说明用普通文字。
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PinyinText } from '@/components/PinyinText';
import { Pressable } from '@/components/Tappable';
import { zh } from '@/content/zh';
import { colors, font, radius, space, themed } from '@/theme';
import { PRICE_TEXT, type Gate } from './model';

type Reason = Extract<Gate, { ok: false }>['reason'];

const PARENT_TEXT: Record<Reason, string> = {
  locked: `免费试用已结束。这个功能需要开通会员（${PRICE_TEXT}）。试用结束后，每天仍可免费做 1 套“今日一练”。`,
  'free-used': `今天的免费“今日一练”已经做过了，明天还可以再做 1 套。开通会员（${PRICE_TEXT}）后所有功能都能用。`,
  'need-check': '会员需要联网核对一次（开通后每 7 天至少联网一次）。请连上网络后，在家长中心“会员”里点“联网核对”。',
  revoked: '这台手机的会员已被管理员关闭。如有疑问，请联系管理员。',
};

export function Paywall({ reason, onClose, onParent }: { reason: Reason; onClose: () => void; onParent: () => void }) {
  return (
    <View style={styles.mask} testID="paywall">
      <View style={styles.card}>
        <Text style={styles.emoji}>⭐</Text>
        <PinyinText text={zh('请爸爸妈妈来看看', 'qǐng bà ba mā ma lái kàn kan')} size={font.title} />
        <Text style={styles.parent} testID="paywall-text">
          {PARENT_TEXT[reason]}
        </Text>
        <Pressable onPress={onParent} style={styles.primary} accessibilityRole="button" testID="paywall-parent">
          <Text style={styles.primaryText}>家长中心 · 会员</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.secondary} accessibilityRole="button" testID="paywall-close">
          <Text style={styles.secondaryText}>返回</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    mask: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.scrim,
      justifyContent: 'center',
      alignItems: 'center',
      padding: space.lg,
    },
    card: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: space.xl,
      alignItems: 'center',
      gap: space.md,
    },
    emoji: { fontSize: 48, color: colors.text },
    parent: { fontSize: font.body, lineHeight: 26, color: colors.textSoft, textAlign: 'center' },
    primary: { backgroundColor: colors.parent, borderRadius: radius.round, paddingVertical: 14, paddingHorizontal: space.xl, alignSelf: 'stretch', alignItems: 'center' },
    primaryText: { color: colors.onAccent, fontSize: font.body, fontWeight: '600' },
    secondary: { paddingVertical: 10, paddingHorizontal: space.xl },
    secondaryText: { color: colors.textSoft, fontSize: font.body },
  }),
);
