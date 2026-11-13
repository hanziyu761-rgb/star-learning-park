/**
 * 答对后“你是怎么想的？”：孩子选一个思路（没有对错），记入学习记录，家长中心可看到。
 * 不选也可以直接点“继续”。
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { DisplayTextView } from '@/components/PinyinText';
import { zh } from '@/content/zh';
import { useProgress } from '@/progress/ProgressContext';
import { speak } from '@/speech/speech';
import { colors, radius, space, themed } from '@/theme';
import { strategyOptions } from './strategies';

export function StrategyAsk({ kp, lessonId, exerciseId }: { kp: string; lessonId: string; exerciseId: string }) {
  const { dispatch } = useProgress();
  const [chosen, setChosen] = useState<string | null>(null);
  const options = strategyOptions(kp);
  if (!options.length) return null;

  return (
    <View style={styles.card} testID="strategy-ask">
      <DisplayTextView text={zh('你是怎么想的？', 'nǐ shì zěn me xiǎng de')} size={22} color={colors.parent} />
      <DisplayTextView
        text={zh('选一个就好，没有对错', 'xuǎn yí gè jiù hǎo méi yǒu duì cuò')}
        size={15}
        color={colors.textSoft}
      />
      <View style={styles.opts}>
        {options.map((o) => {
          const on = chosen === o.id;
          return (
            <Pressable
              key={o.id}
              testID={`strategy-${o.id}`}
              accessibilityRole="button"
              disabled={chosen !== null}
              onPress={() => {
                setChosen(o.id);
                speak({ text: o.speak, lang: 'zh-CN' });
                dispatch({
                  type: 'strategy/choose',
                  record: { at: Date.now(), kp, lessonId, exerciseId, choice: o.id },
                });
              }}
              style={[styles.opt, on && styles.optOn, chosen !== null && !on && styles.optDim]}
            >
              <Text style={styles.emoji}>{o.emoji}</Text>
              <DisplayTextView text={o.text} size={18} color={on ? colors.onAccent : colors.text} />
            </Pressable>
          );
        })}
      </View>
      {chosen ? (
        <View testID="strategy-done">
          <DisplayTextView text={zh('收到！', 'shōu dào')} size={18} color={colors.correct} />
        </View>
      ) : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.line,
  },
  opts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: 56,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.parentSoft,
  },
  optOn: { backgroundColor: colors.parent },
  optDim: { opacity: 0.45 },
  emoji: { fontSize: 24 },
}));
