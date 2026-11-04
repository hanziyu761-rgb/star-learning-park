/**
 * 做题时的“问问星星宝”：没答对前给提示（不给答案），答对后讲讲为什么。
 * 家长没有开启 AI 老师时，这个组件完全不显示。
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { skillLabel } from '@/content';
import { Mascot } from '@/components/Mascot';
import { SpeakerButton, tapFeedback } from '@/components/ui';
import type { Exercise, Subject } from '@/lesson/types';
import { useProgress } from '@/progress/ProgressContext';
import { speak } from '@/speech/speech';
import { colors, radius, space } from '@/theme';
import { AiError, aiHint, AI_ERROR_TEXT } from './client';
import { describeExercise } from './describe';

export function AskTeacher({ exercise, subject, solved }: { exercise: Exercise; subject: Subject; solved: boolean }) {
  const { state } = useProgress();
  const { aiEnabled, aiBaseUrl, grade } = state.settings;
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<{ text: string; error: boolean } | null>(null);

  if (!aiEnabled) return null;

  const ask = async (mode: 'hint' | 'explain') => {
    tapFeedback();
    setLoading(true);
    setReply(null);
    try {
      const d = describeExercise(exercise);
      const text = await aiHint(
        { enabled: aiEnabled, baseUrl: aiBaseUrl },
        { subject, grade, mode, ...d, knowledgePoint: skillLabel(exercise.skill) },
      );
      setReply({ text, error: false });
      speak({ text, lang: 'zh-CN' });
    } catch (e) {
      const text = e instanceof AiError ? e.message : AI_ERROR_TEXT.SERVER;
      setReply({ text, error: true });
      speak({ text, lang: 'zh-CN' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap} testID="ask-teacher">
      <Pressable
        accessibilityRole="button"
        onPress={() => ask(solved ? 'explain' : 'hint')}
        disabled={loading}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
        testID={solved ? 'ai-explain' : 'ai-hint'}
      >
        <Mascot size={36} bounce={false} />
        <Text style={styles.btnText}>{solved ? '星星宝，为什么呢？' : '星星宝，给我一点提示'}</Text>
        {loading ? <ActivityIndicator color={colors.parent} /> : null}
      </Pressable>
      {reply ? (
        <View style={[styles.bubble, reply.error && styles.bubbleError]} testID="ai-reply">
          <Text style={styles.reply}>{reply.text}</Text>
          {!reply.error ? <SpeakerButton item={{ text: reply.text, lang: 'zh-CN' }} size={40} color={colors.parent} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: space.sm,
    backgroundColor: '#EEEDFB',
    borderRadius: radius.round,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
    minHeight: 52,
  },
  btnText: { fontSize: 17, fontWeight: '800', color: colors.parent },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: '#F7F6FF',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: '#D9D6FF',
    padding: space.md,
  },
  bubbleError: { borderColor: colors.line, backgroundColor: '#FFF8E6' },
  reply: { flex: 1, fontSize: 18, lineHeight: 26, color: colors.text },
});
