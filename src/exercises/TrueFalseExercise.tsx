import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { plainText, zh } from '@/content/zh';
import { DisplayTextView } from '@/components/PinyinText';
import { SpeakerButton, tapFeedback } from '@/components/ui';
import type { TrueFalseExercise as TrueFalseData } from '@/lesson/types';
import { colors, MIN_TOUCH, radius, shadow, space } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

/** 正误判断：看图听句子，判断对还是不对 */
export function TrueFalseExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<TrueFalseData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved);
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
          <Text style={styles.emoji}>{exercise.statement.visual.emoji.repeat(exercise.statement.visual.count ?? 1)}</Text>
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
              style={[
                styles.btn,
                { backgroundColor: v ? colors.correctSoft : colors.wrongSoft },
                isWrong && { opacity: 0.4 },
                isRight && { borderColor: colors.correct, borderWidth: 5 },
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

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  statement: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.lg, alignItems: 'center', gap: space.md, ...shadow },
  emoji: { fontSize: 80 },
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
  btnIcon: { fontSize: 40 },
});
