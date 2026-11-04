import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DisplayTextView } from '@/components/PinyinText';
import { SpeakerButton } from '@/components/ui';
import { praise, retry, type FeedbackLang, type FeedbackMessage } from '@/lesson/feedback';
import type { Prompt } from '@/lesson/types';
import { speak } from '@/speech/speech';
import { colors, font, radius, space } from '@/theme';

export interface ExerciseOutcome {
  firstTryCorrect: boolean;
  attempts: number;
}

export interface ExerciseProps<T> {
  exercise: T;
  lang: FeedbackLang;
  onFeedback: (m: FeedbackMessage | null) => void;
  onSolved: (o: ExerciseOutcome) => void;
}

/**
 * 统一的作答流程：答错给提示并允许重试，答对后报告结果（只报告一次）。
 */
export function useAttempts(
  lang: FeedbackLang,
  onFeedback: (m: FeedbackMessage | null) => void,
  onSolved: (o: ExerciseOutcome) => void,
  explanation?: string,
) {
  const attempts = useRef(0);
  const firstWrong = useRef(false);
  const [solved, setSolved] = useState(false);

  const wrong = useCallback(
    (hint: Prompt) => {
      attempts.current += 1;
      firstWrong.current = true;
      onFeedback(retry(lang, hint));
    },
    [lang, onFeedback],
  );

  const correct = useCallback(() => {
    if (solved) return;
    attempts.current += 1;
    setSolved(true);
    onFeedback({ ...praise(lang), note: explanation });
    onSolved({ firstTryCorrect: !firstWrong.current, attempts: attempts.current });
  }, [solved, lang, onFeedback, onSolved, explanation]);

  return { solved, wrong, correct };
}

/** 题目标题：自动朗读一次，旁边有喇叭可以再听；英语课可点开中文小提示 */
export function PromptHeader({ prompt, autoSpeak = true }: { prompt: Prompt; autoSpeak?: boolean }) {
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    if (autoSpeak) speak(prompt.speak);
    // 只在题目出现时朗读一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.header}>
      <SpeakerButton item={prompt.speak} size={48} />
      <View style={styles.headerText}>
        <DisplayTextView text={prompt.text} size={typeof prompt.text === 'string' ? 24 : 22} />
        {prompt.hintZh ? (
          showHint ? (
            <Text style={styles.hint} testID="hint-zh">
              {prompt.hintZh}
            </Text>
          ) : (
            <Text style={styles.hintToggle} onPress={() => setShowHint(true)} accessibilityRole="button">
              中文提示
            </Text>
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: space.md,
  },
  headerText: { flex: 1, alignItems: 'center' },
  hint: { marginTop: 4, fontSize: font.body, color: colors.textSoft },
  hintToggle: {
    marginTop: 6,
    fontSize: font.small,
    color: colors.parent,
    borderWidth: 1,
    borderColor: colors.parent,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
