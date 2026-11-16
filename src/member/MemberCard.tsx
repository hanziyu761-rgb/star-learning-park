/**
 * 家长中心 · 会员（V5.3）：看会员状态、设备号（发给管理员），填开通码，联网核对。
 */
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { Card, SectionTitle } from '@/components/ui';
import { colors, radius, space, themed } from '@/theme';
import { dayNumber, dayToDate, showDeviceId } from './code';
import { useMember } from './MemberContext';
import { OFFLINE_DAYS, PRICE_TEXT, TRIAL_DAYS, type ActivateResult } from './model';

const ERR: Record<Exclude<ActivateResult, { ok: true }>['reason'], string> = {
  format: '开通码不完整或格式不对，请把管理员发来的整串内容复制粘贴进来（以 LH1. 开头）。',
  signature: '开通码核对不通过，请确认是管理员发来的原样内容。',
  device: '这个开通码不是这台手机的（设备号不一样）。请把本页的设备号发给管理员重新开通。',
  expired: '这个开通码已经过期了，请联系管理员续费。',
};

export function MemberCard() {
  const { ready, member, access: a, serverConfigured, activate, checkNow } = useMember();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  if (!ready || !member) return null;

  const status =
    a.kind === 'member'
      ? `会员有效期到 ${dayToDate(a.untilDay!)}`
      : a.kind === 'trial'
        ? `免费试用中，还剩 ${a.trialLeft} 天`
        : a.kind === 'needCheck'
          ? `会员有效期到 ${dayToDate(a.untilDay!)}，但已超过 ${OFFLINE_DAYS} 天没有联网核对，请联网后点“联网核对”`
          : a.kind === 'revoked'
            ? '这台手机的会员已被管理员关闭'
            : '免费试用已结束，未开通会员（每天可免费做 1 套今日一练）';

  const submit = () => {
    const r = activate(code);
    if (!r) return;
    if (r.ok) {
      setCode('');
      setMsg({ ok: true, text: `开通成功！会员有效期到 ${dayToDate(r.state.untilDay!)}。` });
    } else setMsg({ ok: false, text: ERR[r.reason] });
  };

  return (
    <Card>
      <SectionTitle>👑 会员</SectionTitle>
      <Text style={[styles.status, { color: a.full ? colors.correct : colors.wrong }]} testID="member-status">
        {status}
      </Text>
      <Text style={styles.small}>
        {`${PRICE_TEXT}。新安装可以免费试用 ${TRIAL_DAYS} 天，所有功能都能用。开通方法：把下面的设备号发给管理员，付款后管理员会发来开通码，粘贴到下面点“开通”。`}
      </Text>

      <Text style={styles.label}>这台手机的设备号</Text>
      <View style={styles.idRow}>
        <Text style={styles.deviceId} selectable testID="member-device-id">
          {showDeviceId(member.deviceId)}
        </Text>
        <Pressable
          onPress={() => {
            Clipboard.setStringAsync(showDeviceId(member.deviceId)).catch(() => undefined);
            setMsg({ ok: true, text: '设备号已复制，可以粘贴到微信里发给管理员。' });
          }}
          style={styles.smallBtn}
          accessibilityRole="button"
          testID="member-copy-id"
        >
          <Text style={styles.btnText}>复制</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>开通码</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="粘贴管理员发来的开通码（LH1. 开头）"
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        style={styles.input}
        testID="member-code"
      />
      <View style={styles.btnRow}>
        <Pressable
          onPress={async () => {
            const t = await Clipboard.getStringAsync().catch(() => '');
            if (t) setCode(t.trim());
          }}
          style={[styles.btn, styles.btnAlt]}
          accessibilityRole="button"
          testID="member-paste"
        >
          <Text style={styles.btnAltText}>粘贴</Text>
        </Pressable>
        <Pressable onPress={submit} style={styles.btn} accessibilityRole="button" testID="member-activate" disabled={!code.trim()}>
          <Text style={styles.btnText}>开通</Text>
        </Pressable>
      </View>
      {msg ? (
        <Text style={[styles.small, { color: msg.ok ? colors.correct : colors.wrong }]} testID="member-msg">
          {msg.text}
        </Text>
      ) : null}

      {serverConfigured ? (
        <>
          <Pressable
            onPress={async () => {
              setChecking(true);
              const ok = await checkNow();
              setChecking(false);
              setMsg(ok ? { ok: true, text: '已联网核对。' } : { ok: false, text: '联网核对没有成功，请检查网络后再试。' });
            }}
            style={[styles.btn, styles.btnAlt]}
            accessibilityRole="button"
            testID="member-check"
          >
            {checking ? <ActivityIndicator color={colors.parent} /> : <Text style={styles.btnAltText}>联网核对</Text>}
          </Pressable>
          <Text style={styles.small}>
            {`开通后每 ${OFFLINE_DAYS} 天至少联网一次（打开 APP 时自动核对），管理员关闭会员才能生效。只发送设备号，不发送学习记录。`}
            {member.lastCheck ? `最近一次核对：${dayToDate(dayNumber(member.lastCheck))}。` : ''}
          </Text>
        </>
      ) : null}
    </Card>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    status: { fontSize: 17, fontWeight: '600', marginTop: space.xs },
    small: { fontSize: 13, color: colors.textSoft, marginTop: space.xs, lineHeight: 19 },
    label: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: space.md },
    idRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xs },
    deviceId: { fontSize: 28, fontWeight: '700', letterSpacing: 2, color: colors.text, fontVariant: ['tabular-nums'] },
    input: {
      minHeight: 72,
      borderRadius: radius.md,
      backgroundColor: colors.parentSoft,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      fontSize: 14,
      marginTop: 4,
      color: colors.text,
      textAlignVertical: 'top',
    },
    btnRow: { flexDirection: 'row', gap: space.sm },
    btn: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.md,
      backgroundColor: colors.parent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: space.sm,
    },
    btnAlt: { backgroundColor: colors.parentSoft },
    smallBtn: { minHeight: 40, paddingHorizontal: space.lg, borderRadius: radius.round, backgroundColor: colors.parent, justifyContent: 'center' },
    btnText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
    btnAltText: { color: colors.parent, fontSize: 16, fontWeight: '600' },
  }),
);
