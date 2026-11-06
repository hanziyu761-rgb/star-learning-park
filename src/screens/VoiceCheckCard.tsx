/**
 * 家长中心 · 声音设置（V2.15 声音检查；V2.16 女声 / 男声、语速、挑选手机里的声音）。
 * APP 用手机自带的“文字转语音”朗读。不同手机的声音不一样：这里列出这台手机的中文、英语声音，家长试听后选孩子喜欢的。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui';
import { useProgress } from '@/progress/ProgressContext';
import type { Settings } from '@/progress/model';
import { getVoices, pickVoice, speak, summarizeVoices, type VoiceInfo } from '@/speech/speech';
import { colors, radius, space } from '@/theme';
import { APP_VERSION } from '@/version';

const SAMPLE = {
  'zh-CN': '小朋友你好，我们一起来学习吧！',
  'en-US': 'Hello! Let’s learn together.',
} as const;
const GENDER_CN = { female: '女声', male: '男声', unknown: '未知' } as const;
const GENDER_NOTE = {
  female: '亲切的老师声音',
  male: '年轻的男老师声音',
  child: '像小伙伴一样的童声（中文课程用童声录音；英语用女声）',
} as const;

export function VoiceCheckCard() {
  const { state, dispatch } = useProgress();
  const s = state.settings;
  const [voices, setVoices] = useState<VoiceInfo[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let alive = true;
    getVoices().then((v) => alive && setVoices(v));
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current); // 离开页面时不再朗读
    };
  }, []);
  /** 等设置生效后再读一句示例 */
  const sampleLater = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => speak({ text: SAMPLE['zh-CN'], lang: 'zh-CN' }), 50);
  };
  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings/set', settings: patch });
  const check = voices ? summarizeVoices(voices.map((v) => ({ language: v.lang }))) : null;
  const mark = (ok: boolean) => (ok ? '✅ 有' : '⚠️ 没检测到');

  const chooseGender = (gender: 'female' | 'male' | 'child') => {
    const vs = voices ?? [];
    // 童声：手机语音用女声调高音调
    const g = gender === 'child' ? 'female' : gender;
    const zh = pickVoice(vs, 'zh-CN', g);
    const en = pickVoice(vs, 'en-US', g);
    set({ voiceGender: gender, voiceZh: zh, voiceEn: en });
    // 用新的设置马上读一句
    sampleLater();
  };

  const list = (lang: VoiceInfo['lang']) => (voices ?? []).filter((v) => v.lang === lang);
  const current = (lang: VoiceInfo['lang']) => (lang === 'zh-CN' ? s.voiceZh : s.voiceEn);

  return (
    <Card>
      <View testID="voice-check">
        <SectionTitle>🔊 声音设置</SectionTitle>
        <Text style={styles.small}>
          APP
          用手机自带的“文字转语音”朗读题目。可以选女声或男声、调慢语速，也可以在下面试听这台手机里的每个声音，选孩子喜欢的。
        </Text>

        <Text style={styles.label}>声音</Text>
        <View style={styles.row}>
          {(['female', 'male', 'child'] as const).map((g) => (
            <Pressable
              key={g}
              testID={`voice-gender-${g}`}
              accessibilityRole="button"
              accessibilityState={{ selected: s.voiceGender === g }}
              onPress={() => chooseGender(g)}
              style={[styles.chip, s.voiceGender === g && styles.chipOn]}
            >
              <Text style={[styles.chipText, s.voiceGender === g && styles.chipTextOn]}>
                {g === 'female' ? '👩 女声' : g === 'male' ? '👨 男声' : '🧒 童声'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.note} testID="voice-gender-note">
          {GENDER_NOTE[s.voiceGender]}。课程、讲解、短文用预先录好的声音；题库等随机出的题用手机语音。
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
                {r === 'slow' ? '🐢 慢一点（推荐低年级）' : '🚶 正常'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.line} testID="voice-result">
          {check === null
            ? '正在检查这台手机的声音……'
            : `中文语音：${mark(check.zh)}　英语语音：${mark(check.en)}（共找到 ${voices!.length} 种）`}
        </Text>
        {s.voiceGender === 'male' && voices && !s.voiceZh ? (
          <Text style={styles.note} testID="voice-male-note">
            这台手机没找到能确定是男声的中文声音，暂时用调低音调的方式模拟男声；可以在下面逐个试听，找到男声后点“用这个”。
          </Text>
        ) : null}

        <View style={styles.row}>
          <Pressable
            style={styles.btn}
            accessibilityRole="button"
            testID="voice-test-zh"
            onPress={() => speak({ text: SAMPLE['zh-CN'], lang: 'zh-CN' })}
          >
            <Text style={styles.btnText}>试听中文</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            accessibilityRole="button"
            testID="voice-test-en"
            onPress={() => speak({ text: SAMPLE['en-US'], lang: 'en-US' })}
          >
            <Text style={styles.btnText}>试听英语</Text>
          </Pressable>
        </View>

        {(['zh-CN', 'en-US'] as const).map((lang) =>
          list(lang).length ? (
            <View key={lang} testID={`voice-list-${lang}`}>
              <Text style={styles.label}>{lang === 'zh-CN' ? '这台手机的中文声音' : '这台手机的英语声音'}</Text>
              {list(lang).map((v, i) => {
                const on = current(lang) === v.id;
                return (
                  <View key={v.id} style={[styles.voice, on && styles.voiceOn]} testID={`voice-item-${lang}-${i}`}>
                    <Text style={styles.voiceName}>
                      声音 {i + 1}
                      {v.gender !== 'unknown' ? ` · 可能是${GENDER_CN[v.gender]}` : ''}
                      {v.network ? ' · 需联网' : ''}
                      {on ? ' · 正在用' : ''}
                    </Text>
                    <Pressable
                      style={styles.small2}
                      accessibilityRole="button"
                      testID={`voice-try-${lang}-${i}`}
                      onPress={() => speak({ text: SAMPLE[lang], lang }, undefined, { voice: v.id })}
                    >
                      <Text style={styles.small2Text}>试听</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.small2, styles.use]}
                      accessibilityRole="button"
                      testID={`voice-use-${lang}-${i}`}
                      onPress={() => set(lang === 'zh-CN' ? { voiceZh: v.id } : { voiceEn: v.id })}
                    >
                      <Text style={[styles.small2Text, { color: '#fff' }]}>用这个</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : null,
        )}

        {check && (!check.zh || !check.en) ? (
          <Text style={styles.tip} testID="voice-tip">
            听不到声音或声音不好听时：打开手机“设置”，搜索“文字转语音”（也可能叫“语音输出”“TTS”），选择一个支持中文和英语的语音引擎，并下载对应的语音包；设置好后重新打开
            APP。
          </Text>
        ) : null}
        <Text style={styles.version} testID="app-version">
          林亨学习乐园 版本 {APP_VERSION}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: space.md },
  line: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: space.md },
  note: { fontSize: 13, color: colors.textSoft, marginTop: space.xs, lineHeight: 19 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  chip: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: space.md,
    paddingVertical: 8,
  },
  chipOn: { borderColor: '#4A90D9', backgroundColor: '#EAF3FD' },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.text },
  chipTextOn: { color: '#1F5FA8' },
  btn: {
    flex: 1,
    backgroundColor: '#4A90D9',
    borderRadius: radius.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.sm,
    marginTop: space.xs,
  },
  voiceOn: { borderColor: '#4A90D9', backgroundColor: '#EAF3FD' },
  voiceName: { flex: 1, fontSize: 14, color: colors.text },
  small2: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#4A90D9',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  small2Text: { fontSize: 13, fontWeight: '700', color: '#1F5FA8' },
  use: { backgroundColor: '#4A90D9' },
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
