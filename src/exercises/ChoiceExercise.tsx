import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DisplayTextView } from '@/components/PinyinText';
import { SpeakerButton, tapFeedback } from '@/components/ui';
import type { ChoiceExercise as ChoiceExerciseData } from '@/lesson/types';
import { speakSequence } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, shadow, space } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

/**
 * 选择题：支持图片选择、数字选择、文字选择和听音选择（有 listen 字段时显示大喇叭）。
 */
export function ChoiceExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<ChoiceExerciseData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  // 听音题：先读题目，再自动播放一次要听的内容
  useEffect(() => {
    if (exercise.listen) speakSequence([exercise.prompt.speak, exercise.listen]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (id: string) => {
    if (solved || wrongIds.includes(id)) return;
    tapFeedback();
    if (id === exercise.answerId) {
      correct();
    } else {
      setWrongIds((w) => [...w, id]);
      wrong(exercise.wrongHint);
    }
  };

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} autoSpeak={!exercise.listen} />

      {exercise.listen ? (
        <View style={styles.listen}>
          <SpeakerButton item={exercise.listen} size={110} testID="listen-button" />
        </View>
      ) : null}

      {exercise.stem ? (
        <View style={styles.stem}>
          {exercise.stem.visual ? (
            <Text style={styles.stemEmoji} accessibilityLabel={`${exercise.stem.visual.count ?? 1} 个`}>
              {exercise.stem.visual.emoji.repeat(exercise.stem.visual.count ?? 1)}
            </Text>
          ) : null}
          {exercise.stem.text ? <DisplayTextView text={exercise.stem.text} size={34} /> : null}
        </View>
      ) : null}

      <View style={styles.options}>
        {exercise.options.map((opt) => {
          const isWrong = wrongIds.includes(opt.id);
          const isRight = solved && opt.id === exercise.answerId;
          return (
            <Pressable
              key={opt.id}
              testID={`option-${opt.id}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isWrong || solved }}
              onPress={() => choose(opt.id)}
              style={({ pressed }) => [
                styles.option,
                isWrong && styles.optionWrong,
                isRight && styles.optionRight,
                pressed && !solved && styles.pressed,
              ]}
            >
              {opt.visual ? (
                <Text style={styles.optEmoji}>{opt.visual.emoji.repeat(opt.visual.count ?? 1)}</Text>
              ) : null}
              {opt.text ? <DisplayTextView text={opt.text} size={opt.visual ? 24 : 40} hidePinyin={exercise.hidePinyin} /> : null}
              {isWrong ? <Text style={styles.mark}>✗</Text> : null}
              {isRight ? <Text style={[styles.mark, { color: colors.correct }]}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  listen: { alignItems: 'center', paddingVertical: space.sm },
  stem: { alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, padding: space.md },
  stemEmoji: { fontSize: 44, textAlign: 'center', letterSpacing: 4 },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  option: {
    minWidth: 130,
    flexBasis: '42%',
    flexGrow: 1,
    minHeight: MIN_TOUCH * 1.6,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    ...shadow,
  },
  optionWrong: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft, opacity: 0.6 },
  optionRight: { borderColor: colors.correct, backgroundColor: colors.correctSoft },
  pressed: { transform: [{ scale: 0.96 }] },
  optEmoji: { fontSize: 52 },
  mark: { position: 'absolute', top: 6, right: 12, fontSize: 26, fontWeight: '900', color: colors.wrong },
});
