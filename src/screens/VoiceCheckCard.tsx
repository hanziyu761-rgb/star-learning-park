/**
 * 家长中心 · 声音检查（V2.15，真机试用前准备）：
 * APP 用手机自带的“文字转语音”朗读。很多手机没有装中文或英文语音，朗读会没有声音，这里检查并给出设置方法。
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui';
import { checkVoices, speak, type VoiceCheck } from '@/speech/speech';
import { colors, radius, space } from '@/theme';
import { APP_VERSION } from '@/version';

export function VoiceCheckCard() {
  const [check, setCheck] = useState<VoiceCheck | null>(null);
  useEffect(() => {
    let alive = true;
    checkVoices().then((c) => alive && setCheck(c));
    return () => {
      alive = false;
    };
  }, []);
  const mark = (ok: boolean) => (ok ? '✅ 有' : '⚠️ 没检测到');
  return (
    <Card>
      <View testID="voice-check">
        <SectionTitle>🔊 声音检查</SectionTitle>
        <Text style={styles.small}>
          APP 用手机自带的“文字转语音”朗读题目。下面检查这台手机有没有中文、英语语音（部分手机检测不准，请点按钮试听）。
        </Text>
        <Text style={styles.line} testID="voice-result">
          {check === null
            ? '正在检查……'
            : `中文语音：${mark(check.zh)}　英语语音：${mark(check.en)}（共找到 ${check.total} 种语音）`}
        </Text>
        <View style={styles.row}>
          <Pressable
            style={styles.btn}
            accessibilityRole="button"
            testID="voice-test-zh"
            onPress={() => speak({ text: '你好，我是星星宝。', lang: 'zh-CN' })}
          >
            <Text style={styles.btnText}>试听中文</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            accessibilityRole="button"
            testID="voice-test-en"
            onPress={() => speak({ text: 'Hello! Nice to meet you.', lang: 'en-US' })}
          >
            <Text style={styles.btnText}>试听英语</Text>
          </Pressable>
        </View>
        {check && (!check.zh || !check.en) ? (
          <Text style={styles.tip} testID="voice-tip">
            听不到声音时：打开手机“设置”，搜索“文字转语音”（也可能叫“语音输出”“TTS”），选择一个支持中文和英语的语音引擎，并下载对应的语音包；设置好后重新打开
            APP。
          </Text>
        ) : null}
        <Text style={styles.version} testID="app-version">
          星星学习乐园 版本 {APP_VERSION}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  line: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: space.sm },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  btn: {
    flex: 1,
    backgroundColor: '#4A90D9',
    borderRadius: radius.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  tip: {
    fontSize: 13,
    color: colors.text,
    backgroundColor: '#FFF4CC',
    borderRadius: radius.md,
    padding: space.sm,
    marginTop: space.sm,
    lineHeight: 19,
  },
  version: { fontSize: 12, color: colors.textSoft, marginTop: space.md, textAlign: 'right' },
});
