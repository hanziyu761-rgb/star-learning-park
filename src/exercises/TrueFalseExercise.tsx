import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { plainText, zh } from '@/content/zh';
import { VisualView } from '@/components/Figure';
import { DisplayTextView } from '@/components/PinyinText';
import { SpeakerButton, tapFeedback } from '@/components/ui';
import type { TrueFalseExercise as TrueFalseData } from '@/lesson/types';
import { colors, MIN_TOUCH, radius, shadow, space, themed } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

/** 正误判断：看图听句子，判断对还是不对 */
export function TrueFalseExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<TrueFalseData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [tried, setTried] = useState<boolean[]>([]);

  const choose = (value: boolean) => {
    if (solved || tried.includes(value)) return;
    tapFeedback();
    if (value === exercise.answer) correct();
    else {
      setTried((t) => [...t, value]);
      wrong(exercise.wrongHint);
    }
  };

  const yes = lang === 'en' ? 'Yes' : zh('对', 'duì');
  const no = lang === 'en' ? 'No' : zh('不对', 'bú duì');

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      <View style={styles.statement}>
        {exercise.statement.visual ? (
          exercise.statement.visual.figure ? (
            <VisualView visual={exercise.statement.visual} figureSize={80} />
          ) : (
            <Text style={styles.emoji}>
              {exercise.statement.visual.emoji.repeat(exercise.statement.visual.count ?? 1)}
            </Text>
          )
        ) : null}
        <View style={styles.sentence}>
          <DisplayTextView text={exercise.statement.text} size={30} />
          <SpeakerButton item={exercise.statement.speak} size={52} color={colors.parent} />
        </View>
      </View>
      <View style={styles.row}>
        {[true, false].map((v) => {
          const isWrong = tried.includes(v);
          const isRight = solved && v === exercise.answer;
          return (
            <Pressable
              key={String(v)}
              testID={v ? 'tf-true' : 'tf-false'}
              accessibilityRole="button"
              accessibilityLabel={plainText(v ? yes : no)}
              onPress={() => choose(v)}
              pop={isRight}
              shake={isWrong}
              style={[
                styles.btn,
                { backgroundColor: v ? colors.correctSoft : colors.wrongSoft },
                isWrong && { opacity: 0.4 },
                isRight && { borderColor: colors.correct, borderWidth: 3 },
              ]}
            >
              <Text style={styles.btnIcon}>{v ? '✅' : '❌'}</Text>
              <DisplayTextView text={v ? yes : no} size={22} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.lg },
  statement: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    alignItems: 'center',
    gap: space.md,
    ...shadow,
  },
  emoji: { fontSize: 80, color: colors.text },
  sentence: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: space.lg, justifyContent: 'center' },
  btn: {
    flex: 1,
    minHeight: MIN_TOUCH * 1.6,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadow,
  },
  btnIcon: { fontSize: 40, color: colors.text },
}));
