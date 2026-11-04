/**
 * 家长中心：孩子年级、AI 老师开关与连接测试、AI 学习分析、题库屏蔽管理。
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AiError, aiHealth, aiReport, AI_ERROR_TEXT, DEFAULT_AI_BASE_URL } from '@/ai/client';
import { skillLabel } from '@/content';
import { mistakeLabel } from '@/content/resolve';
import { Card, SectionTitle } from '@/components/ui';
import { useProgress } from '@/progress/ProgressContext';
import { openMistakes, weakSkills } from '@/progress/stats';
import { colors, radius, space } from '@/theme';

const GRADE_CN = ['', '一', '二', '三', '四', '五', '六'];

export function GradeCard() {
  const { state, dispatch } = useProgress();
  return (
    <Card>
      <SectionTitle>孩子年级</SectionTitle>
      <Text style={styles.small}>决定“题库闯关”和“口算闯关”显示哪个年级的内容，也会告诉 AI 老师用多简单的话讲解。</Text>
      <View style={styles.chips}>
        {[1, 2, 3, 4, 5, 6].map((g) => (
          <Pressable
            key={g}
            onPress={() => dispatch({ type: 'settings/set', settings: { grade: g } })}
            style={[styles.chip, state.settings.grade === g && styles.chipOn]}
            accessibilityRole="button"
            testID={`grade-${g}`}
          >
            <Text style={[styles.chipText, state.settings.grade === g && { color: '#fff' }]}>{GRADE_CN[g]}年级</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

export function AiCard() {
  const { state, dispatch } = useProgress();
  const { aiEnabled, aiBaseUrl, grade } = state.settings;
  const [url, setUrl] = useState(aiBaseUrl || DEFAULT_AI_BASE_URL);
  const [check, setCheck] = useState<{ loading: boolean; text?: string; ok?: boolean }>({ loading: false });
  const [report, setReport] = useState<{ loading: boolean; text?: string; error?: boolean }>({ loading: false });

  const cfg = { enabled: true, baseUrl: url.trim() };

  const save = () => dispatch({ type: 'settings/set', settings: { aiBaseUrl: url.trim().replace(/\/$/, '') } });

  const test = async () => {
    save();
    setCheck({ loading: true });
    try {
      const h = await aiHealth(cfg);
      setCheck(
        h.llm
          ? { loading: false, ok: true, text: `连接成功：服务正常，模型 ${h.model}` }
          : { loading: false, ok: false, text: '服务能连上，但服务端还没有配置 DeepSeek 密钥。' },
      );
    } catch (e) {
      setCheck({ loading: false, ok: false, text: e instanceof AiError ? e.message : AI_ERROR_TEXT.SERVER });
    }
  };

  const analyze = async () => {
    setReport({ loading: true });
    try {
      const text = await aiReport(
        { enabled: aiEnabled, baseUrl: aiBaseUrl },
        {
          grade,
          weakSkills: weakSkills(state).map((w) => ({ label: skillLabel(w.skill), accuracy: w.accuracy, total: w.total })),
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
      <SectionTitle>AI 老师（星星宝）</SectionTitle>
      <Text style={styles.small}>
        开启后，孩子可以在做题时请星星宝给提示（不直接给答案）、答对后听讲解，也可以在首页“问问星星宝”。AI 使用 DeepSeek
        大模型，只发送题目内容和孩子的提问，不发送任何个人信息；回答可能出错，仅供参考。
      </Text>
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
        {check.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>测试连接</Text>}
      </Pressable>
      {check.text ? (
        <Text style={[styles.small, { color: check.ok ? colors.correct : colors.wrong }]} testID="ai-check-result">
          {check.text}
        </Text>
      ) : null}

      <View style={styles.divider} />
      <Text style={styles.label}>AI 学习分析</Text>
      <Text style={styles.small}>根据薄弱知识点和错题，生成给家长看的分析和在家可以做的建议。</Text>
      <Pressable
        onPress={analyze}
        disabled={!aiEnabled || report.loading}
        style={[styles.btn, !aiEnabled && { backgroundColor: colors.disabled }]}
        accessibilityRole="button"
        testID="ai-report"
      >
        {report.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>生成 AI 学习分析</Text>}
      </Pressable>
      {report.text ? (
        <View style={[styles.reportBox, report.error && { borderColor: colors.wrong }]} testID="ai-report-text">
          <Text style={styles.reportText}>{report.text}</Text>
        </View>
      ) : null}
    </Card>
  );
}

export function HiddenCard() {
  const { state, dispatch } = useProgress();
  if (state.hidden.length === 0) return null;
  return (
    <Card>
      <SectionTitle>已屏蔽的题目</SectionTitle>
      <Text style={styles.small}>孩子或家长在题库中长按“这题有问题”屏蔽了 {state.hidden.length} 道题，它们不会再出现。</Text>
      <Pressable onPress={() => dispatch({ type: 'bank/unhide-all' })} style={styles.btn} accessibilityRole="button" testID="unhide-all">
        <Text style={styles.btnText}>全部恢复</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 13, color: colors.textSoft, marginTop: 2, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  chip: { paddingHorizontal: space.md, minHeight: 44, borderRadius: radius.round, backgroundColor: '#EEEDFB', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.parent },
  chipText: { fontSize: 15, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: space.sm },
  label: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: space.sm },
  input: { minHeight: 48, borderRadius: radius.md, backgroundColor: '#F7F6FF', paddingHorizontal: space.md, fontSize: 15, marginTop: 4 },
  btn: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.parent, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: space.md },
  reportBox: { borderWidth: 2, borderColor: '#D9D6FF', borderRadius: radius.md, padding: space.md, marginTop: space.sm },
  reportText: { fontSize: 15, lineHeight: 23, color: colors.text },
});
