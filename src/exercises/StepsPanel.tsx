/**
 * 应用题分步讲解（V5.4）：做错一次或做完以后出现“看分步讲解”，点一下多看一步，自己想下一步再点。
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { speak } from '@/speech/speech';
import { colors, radius, space, themed } from '@/theme';

export function StepsPanel({ steps, color }: { steps: string[]; color: string }) {
  const [shown, setShown] = useState(0);
  const more = () => {
    const n = Math.min(steps.length, shown + 1);
    setShown(n);
    speak({ text: steps[n - 1], lang: 'zh-CN' });
  };
  return (
    <View style={styles.box} testID="steps-panel">
      {shown === 0 ? null : (
        <View style={{ gap: space.xs }}>
          {steps.slice(0, shown).map((s, i) => (
            <Text key={i} style={styles.step} testID={`step-${i}`}>
              <Text style={[styles.num, { color }]}>{`第 ${i + 1} 步　`}</Text>
              {s}
            </Text>
          ))}
        </View>
      )}
      {shown < steps.length ? (
        <Pressable onPress={more} style={[styles.btn, { borderColor: color }]} accessibilityRole="button" testID="steps-next">
          <Text style={[styles.btnText, { color }]}>{shown === 0 ? '🪜 看分步讲解' : `下一步（${shown}/${steps.length}）`}</Text>
        </Pressable>
      ) : (
        <Text style={styles.done}>讲解看完了，再试一试吧！</Text>
      )}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    box: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, gap: space.sm },
    step: { fontSize: 16, lineHeight: 24, color: colors.text },
    num: { fontWeight: '700' },
    btn: { alignSelf: 'flex-start', borderWidth: 2, borderRadius: radius.round, paddingVertical: 8, paddingHorizontal: space.lg },
    btnText: { fontSize: 15, fontWeight: '700' },
    done: { fontSize: 13, color: colors.textSoft },
  }),
);
