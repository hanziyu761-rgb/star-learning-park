/**
 * 家长中心：孩子年级、AI 老师开关与连接测试、AI 学习分析、题库屏蔽管理。
 */
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { AiError, aiHealth, aiReport, AI_ERROR_TEXT, DEFAULT_AI_BASE_URL } from '@/ai/client';
import { skillLabel } from '@/content';
import { mistakeLabel } from '@/content/resolve';
import { Card, SectionTitle } from '@/components/ui';
import { useProgress } from '@/progress/ProgressContext';
import { getAsr } from '@/speech/asr';
import { speak } from '@/speech/speech';
import { openMistakes, weakSkills } from '@/progress/stats';
import { colors, radius, space, themed } from '@/theme';
import { ALL_GRADES, GRADE_CN, isJunior, pinyinHidden } from '@/progress/grade';
import { Segmented } from '@/components/Segmented';


export function GradeCard() {
  const { state, dispatch } = useProgress();
  return (
    <Card>
      <SectionTitle>孩子年级</SectionTitle>
      <View style={styles.chips}>
        {ALL_GRADES.map((g) => (
          <Pressable
            key={g}
            onPress={() => dispatch({ type: 'settings/set', settings: { grade: g } })}
            style={[styles.chip, state.settings.grade === g && styles.chipOn]}
            accessibilityRole="button"
            testID={`grade-${g}`}
          >
            <Text style={[styles.chipText, state.settings.grade === g && { color: colors.onAccent }]}>{GRADE_CN[g]}年级</Text>
          </Pressable>
        ))}
      </View>
      {isJunior(state.settings.grade) ? (
        <Text style={styles.gradeNote} testID="grade-junior-note">
          {`初中：${pinyinHidden(state.settings) ? '不标拼音' : '标拼音（家长打开了拼音）'}。初中的知识点练习、题库、每日挑战、口算、阅读、单词卡、试卷按七～九年级出题（原创，已通过教师审核）。`}
        </Text>
      ) : null}
    </Card>
  );
}

/** 外观（V5.0）：跟随手机 / 浅色 / 深色 */
export function AppearanceCard() {
  const { state, dispatch } = useProgress();
  return (
    <Card>
      <SectionTitle>外观</SectionTitle>
      <Segmented
        testID="appearance"
        value={state.settings.appearance}
        onChange={(v) => dispatch({ type: 'settings/set', settings: { appearance: v } })}
        options={[
          { value: 'system', label: '跟随手机' },
          { value: 'light', label: '浅色' },
          { value: 'dark', label: '深色' },
        ]}
      />
    </Card>
  );
}

export function AiCard() {
  const { state, dispatch } = useProgress();
  const { aiEnabled, aiBaseUrl, voiceInput } = state.settings;
  const asr = getAsr();
  const [micNote, setMicNote] = useState('');
  const [url, setUrl] = useState(aiBaseUrl || DEFAULT_AI_BASE_URL);
  const [check, setCheck] = useState<{ loading: boolean; text?: string; ok?: boolean }>({ loading: false });

  const cfg = { enabled: true, baseUrl: url.trim() };

  const save = () => dispatch({ type: 'settings/set', settings: { aiBaseUrl: url.trim().replace(/\/$/, '') } });

  const test = async () => {
    save();
    setCheck({ loading: true });
    try {
      const h = await aiHealth(cfg);
      setCheck(
        h.llm
          ? {
              loading: false,
              ok: true,
              text: `连接成功：服务正常，模型 ${h.model}。${h.tts ? '自然语音已开通。' : '朗读声音还没开通（服务端没有配置阿里云百炼密钥），现在题目读不出声音。'}`,
            }
          : { loading: false, ok: false, text: '服务能连上，但服务端还没有配置 DeepSeek 密钥。' },
      );
    } catch (e) {
      setCheck({ loading: false, ok: false, text: e instanceof AiError ? e.message : AI_ERROR_TEXT.SERVER });
    }
  };

  return (
    <Card>
      <SectionTitle>AI 老师（星星宝）</SectionTitle>
      <Text style={styles.small}>只发送题目内容和孩子的提问，不发送个人信息；回答可能出错。</Text>
      <View style={styles.row}>
        <Text style={styles.label}>开启 AI 老师</Text>
        <Switch
          value={aiEnabled}
          onValueChange={(v) => {
            save();
            dispatch({ type: 'settings/set', settings: { aiEnabled: v } });
          }}
          testID="ai-switch"
        />
      </View>
      {asr ? (
        <View testID="voice-input-setting">
          <View style={styles.row}>
            <Text style={[styles.label, { flex: 1 }]}>允许孩子说话提问</Text>
            <Switch
              value={voiceInput}
              onValueChange={async (v) => {
                setMicNote('');
                if (v) {
                  const p = await asr.requestPermission().catch(() => ({ granted: false }));
                  if (!p.granted) {
                    setMicNote('没有得到麦克风权限。可以在手机“设置 → 应用 → 林亨学习乐园 → 权限”里允许麦克风后再打开。');
                    return;
                  }
                }
                dispatch({ type: 'settings/set', settings: { voiceInput: v } });
              }}
              testID="voice-input-switch"
            />
          </View>
          <Text style={styles.small}>声音在手机里识别成文字，不保存、不上传。只识别普通话。</Text>
          {micNote ? <Text style={[styles.small, { color: colors.wrong }]}>{micNote}</Text> : null}
        </View>
      ) : null}
      <Text style={styles.label}>AI 服务地址</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        onBlur={save}
        placeholder="例如 https://ai.你的域名.com"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        testID="ai-url"
      />
      <Pressable onPress={test} style={styles.btn} accessibilityRole="button" testID="ai-test">
        {check.loading ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.btnText}>测试连接</Text>}
      </Pressable>
      {check.text ? (
        <Text style={[styles.small, { color: check.ok ? colors.correct : colors.wrong }]} testID="ai-check-result">
          {check.text}
        </Text>
      ) : null}

      <Text style={styles.small}>题目朗读也用这个服务（阿里云星星宝童声）：只发送要朗读的文字，按字数计费。</Text>
      <Pressable
        onPress={() => speak({ text: '小朋友你好，我是星星宝！有不会的题就来问我吧。', lang: 'zh-CN', cloud: true })}
        style={styles.btn}
        accessibilityRole="button"
        testID="ai-voice-try"
      >
        <Text style={styles.btnText}>试听星星宝的声音</Text>
      </Pressable>

    </Card>
  );
}

export function HiddenCard() {
  const { state, dispatch } = useProgress();
  if (state.hidden.length === 0) return null;
  return (
    <Card>
      <SectionTitle>已屏蔽的题目</SectionTitle>
      <Text style={styles.small}>
        {state.hidden.length} 道
      </Text>
      <Pressable
        onPress={() => dispatch({ type: 'bank/unhide-all' })}
        style={styles.btn}
        accessibilityRole="button"
        testID="unhide-all"
      >
        <Text style={styles.btnText}>全部恢复</Text>
      </Pressable>
    </Card>
  );
}

/** AI 学习分析（V5.1 从 AI 老师设置里移到“学习报告”） */
export function AiReportCard() {
  const { state } = useProgress();
  const { aiEnabled, aiBaseUrl, grade } = state.settings;
  const [report, setReport] = useState<{ loading: boolean; text?: string; error?: boolean }>({ loading: false });

  const analyze = async () => {
    setReport({ loading: true });
    try {
      const text = await aiReport(
        { enabled: aiEnabled, baseUrl: aiBaseUrl },
        {
          grade,
          weakSkills: weakSkills(state).map((w) => ({
            label: skillLabel(w.skill),
            accuracy: w.accuracy,
            total: w.total,
          })),
          mistakes: openMistakes(state)
            .slice(0, 8)
            .map((m) => mistakeLabel(m.lessonId, m.exerciseId).slice(0, 100)),
        },
      );
      setReport({ loading: false, text });
    } catch (e) {
      setReport({ loading: false, error: true, text: e instanceof AiError ? e.message : AI_ERROR_TEXT.SERVER });
    }
  };

  return (
    <Card>
      <SectionTitle>AI 学习分析</SectionTitle>
      {!aiEnabled ? <Text style={styles.small}>在“设置 → AI 老师”里开启后可用</Text> : null}
      <Pressable
        onPress={analyze}
        disabled={!aiEnabled || report.loading}
        style={[styles.btn, !aiEnabled && { opacity: 0.4 }]}
        accessibilityRole="button"
        testID="ai-report"
      >
        {report.loading ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.btnText}>生成 AI 学习分析</Text>}
      </Pressable>
      {report.text ? (
        <View style={[styles.reportBox, report.error && { borderColor: colors.wrong }]} testID="ai-report-text">
          <Text style={styles.reportText}>{report.text}</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  small: { fontSize: 13, color: colors.textSoft, marginTop: 2, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  chip: {
    paddingHorizontal: space.md,
    minHeight: 44,
    borderRadius: radius.round,
    backgroundColor: colors.parentSoft,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.parent },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.text },
  gradeNote: { fontSize: 13, color: colors.textSoft, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: space.sm },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: space.sm },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.parentSoft,
    paddingHorizontal: space.md,
    fontSize: 15,
    marginTop: 4, color: colors.text },
  btn: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.parent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  btnText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space.md },
  reportBox: {
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.sm,
  },
  reportText: { fontSize: 15, lineHeight: 23, color: colors.text },
}));
