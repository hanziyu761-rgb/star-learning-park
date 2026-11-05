import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DisplayTextView } from '@/components/PinyinText';
import { BigButton, tapFeedback } from '@/components/ui';
import { zh } from '@/content/zh';
import type { MultiExercise as MultiData } from '@/lesson/types';
import { colors, MIN_TOUCH, radius, shadow, space } from '@/theme';
import { PromptHeader, useAttempts, type ExerciseProps } from './common';

const MISSING = {
  text: zh(
    '选对的都留下了，还有别的答案，再找一找。',
    'xuǎn duì de dōu liú xià le hái yǒu bié de dá àn zài zhǎo yi zhǎo',
  ),
  speak: { text: '选对的都留下了，还有别的答案，再找一找。', lang: 'zh-CN' as const },
};

/**
 * 多选题（V2.11，一题多解）：答案不止一个，点选后按“选好了”。
 * 选错的会被去掉并标出，选对的留下；漏选时提示“还有别的答案”。
 */
export function MultiExercise({ exercise, lang, onFeedback, onSolved }: ExerciseProps<MultiData>) {
  const { solved, wrong, correct } = useAttempts(lang, onFeedback, onSolved, exercise.explanation);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const answers = new Set(exercise.answerIds);

  const toggle = (id: string) => {
    if (solved || wrongIds.includes(id)) return;
    tapFeedback();
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const submit = () => {
    if (solved || picked.length === 0) return;
    const bad = picked.filter((id) => !answers.has(id));
    if (bad.length) {
      setWrongIds((w) => [...w, ...bad]);
      setPicked((p) => p.filter((id) => answers.has(id)));
      wrong(exercise.wrongHint);
    } else if (picked.length < answers.size) {
      wrong(MISSING);
    } else {
      correct();
    }
  };

  return (
    <View style={styles.wrap}>
      <PromptHeader prompt={exercise.prompt} />
      {exercise.stem?.text ? (
        <View style={styles.stem}>
          <DisplayTextView text={exercise.stem.text} size={28} />
        </View>
      ) : null}
      <Text style={styles.badge} testID="multi-badge">
        答案不止一个，全部找出来 ✨
      </Text>
      <View style={styles.options}>
        {exercise.options.map((o) => {
          const on = picked.includes(o.id);
          const bad = wrongIds.includes(o.id);
          const right = solved && answers.has(o.id);
          return (
            <Pressable
              key={o.id}
              testID={`multi-${o.id}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled: bad || solved }}
              aria-checked={on}
              disabled={bad || solved}
              onPress={() => toggle(o.id)}
              style={[styles.option, on && styles.on, bad && styles.bad, right && styles.right]}
            >
              {o.text ? <DisplayTextView text={o.text} size={28} /> : null}
              <Text style={[styles.mark, right && { color: colors.correct }]}>
                {bad ? '✗' : right ? '✓' : on ? '●' : '○'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!solved ? (
        <BigButton
          size="md"
          emoji="✅"
          // 题目不注拼音（三年级起）时按钮也不注
          label={typeof exercise.prompt.text === 'string' ? '选好了' : zh('选好了', 'xuǎn hǎo le')}
          color={colors.correct}
          disabled={picked.length === 0}
          onPress={submit}
          testID="multi-ok"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  stem: { alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, padding: space.md },
  badge: { textAlign: 'center', fontSize: 15, fontWeight: '800', color: colors.textSoft },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  option: {
    flexBasis: '42%',
    flexGrow: 1,
    minHeight: MIN_TOUCH * 1.4,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    ...shadow,
  },
  on: { borderColor: '#4A90D9', backgroundColor: '#EAF3FD' },
  bad: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft, opacity: 0.6 },
  right: { borderColor: colors.correct, backgroundColor: colors.correctSoft },
  mark: { position: 'absolute', top: 4, right: 10, fontSize: 20, fontWeight: '900', color: colors.textSoft },
});
