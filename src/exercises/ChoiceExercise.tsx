import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { VisualView } from '@/components/Figure';
import { DisplayTextView } from '@/components/PinyinText';
import { SpeakerButton, tapFeedback } from '@/components/ui';
import type { ChoiceExercise as ChoiceExerciseData } from '@/lesson/types';
import { speakSequence } from '@/speech/speech';
import { colors, MIN_TOUCH, radius, shadow, space, themed } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

/**
 * 选择题：支持图片选择、数字选择、文字选择和听音选择（有 listen 字段时显示大喇叭）。
 */
/** 第二次选错后选项暂停的时间 */
export const COOLDOWN_MS = 1500;

const textLength = (t: string | { char: string }[]) =>
  typeof t === 'string' ? (t.match(/[\p{L}\p{N}]/gu) ?? []).length : t.length;

/** 题干文字较长（短文、线索）时字小一些 */
function stemSize(t: string | { char: string }[]): number {
  // 只数文字和数字（表情符号不算），图案题保持大字
  const n = typeof t === 'string' ? (t.match(/[\p{L}\p{N}]/gu) ?? []).length : t.length;
  return n > 40 ? 20 : n > 16 ? 24 : 34;
}

export function ChoiceExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<ChoiceExerciseData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  // 防止乱点：同一题选错第二次起，选项暂停 1.5 秒，先看提示再选（V2.9）
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (!locked) return;
    const t = setTimeout(() => setLocked(false), COOLDOWN_MS);
    return () => clearTimeout(t);
  }, [locked]);

  // 听音题：先读题目，再自动播放一次要听的内容
  useEffect(() => {
    if (exercise.listen) speakSequence([exercise.prompt.speak, exercise.listen]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (id: string) => {
    if (solved || locked || wrongIds.includes(id)) return;
    tapFeedback();
    if (id === exercise.answerId) {
      correct();
    } else {
      if (wrongIds.length >= 1) setLocked(true);
      setWrongIds((w) => [...w, id]);
      wrong(exercise.wrongHint);
    }
  };

  // 选项是句子（病句、阅读题等）时，一个选项占一行、字小一些
  const longOptions = exercise.options.some((o) => o.text !== undefined && textLength(o.text) > 6);
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
          {exercise.stem.visual?.figure ? (
            <VisualView visual={exercise.stem.visual} figureSize={170} />
          ) : exercise.stem.visual ? (
            <Text style={styles.stemEmoji} accessibilityLabel={`${exercise.stem.visual.count ?? 1} 个`}>
              {exercise.stem.visual.emoji.repeat(exercise.stem.visual.count ?? 1)}
            </Text>
          ) : null}
          {exercise.stem.text ? (
            <DisplayTextView text={exercise.stem.text} size={stemSize(exercise.stem.text)} />
          ) : null}
        </View>
      ) : null}

      {locked ? (
        <Text style={styles.cooldown} testID="choice-cooldown">
          先读一读提示，想一想再选 🤔
        </Text>
      ) : null}
      <View style={styles.options}>
        {exercise.options.map((opt) => {
          const long = longOptions;
          const isWrong = wrongIds.includes(opt.id);
          const isRight = solved && opt.id === exercise.answerId;
          return (
            <Pressable
              key={opt.id}
              testID={`option-${opt.id}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isWrong || solved || locked }}
              disabled={isWrong || solved || locked}
              pop={isRight}
              shake={isWrong}
              onPress={() => choose(opt.id)}
              style={({ pressed }) => [
                styles.option,
                long && styles.optionLong,
                isWrong && styles.optionWrong,
                isRight && styles.optionRight,
                pressed && !solved && styles.pressed,
              ]}
            >
              {opt.visual ? (
                opt.visual.figure ? (
                  <VisualView visual={opt.visual} figureSize={96} />
                ) : (
                  <Text style={styles.optEmoji}>{opt.visual.emoji.repeat(opt.visual.count ?? 1)}</Text>
                )
              ) : null}
              {opt.text ? (
                <DisplayTextView
                  text={opt.text}
                  size={long ? 20 : opt.visual ? 24 : 40}
                  hidePinyin={exercise.hidePinyin}
                />
              ) : null}
              {isWrong ? <Text style={styles.mark}>✗</Text> : null}
              {isRight ? <Text style={[styles.mark, { color: colors.correct }]}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.lg },
  listen: { alignItems: 'center', paddingVertical: space.sm },
  stem: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: space.md },
  stemEmoji: { fontSize: 44, textAlign: 'center', letterSpacing: 4, color: colors.text },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  option: {
    minWidth: 130,
    flexBasis: '42%',
    flexGrow: 1,
    minHeight: MIN_TOUCH * 1.6,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    ...shadow,
  },
  optionLong: { flexBasis: '100%', minHeight: MIN_TOUCH, paddingHorizontal: space.md },
  optionWrong: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft, opacity: 0.6 },
  optionRight: { borderColor: colors.correct, backgroundColor: colors.correctSoft },
  pressed: { transform: [{ scale: 0.96 }] },
  optEmoji: { fontSize: 52, color: colors.text },
  cooldown: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: colors.textSoft },
  mark: { position: 'absolute', top: 6, right: 12, fontSize: 26, fontWeight: '700', color: colors.wrong },
}));
