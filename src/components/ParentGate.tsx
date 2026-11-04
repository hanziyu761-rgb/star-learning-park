import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TOUCH, radius, space } from '@/theme';

/** 生成一道一年级孩子还不会的乘法题，作为家长验证 */
export function makeGateQuestion(rand: () => number = Math.random) {
  const a = 6 + Math.floor(rand() * 4); // 6–9
  const b = 6 + Math.floor(rand() * 4);
  return { a, b, answer: a * b };
}

export function ParentGate({ onPass, rand }: { onPass: () => void; rand?: () => number }) {
  const [q, setQ] = useState(() => makeGateQuestion(rand));
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const press = (d: string) => {
    setError(false);
    const next = (input + d).slice(0, 3);
    setInput(next);
  };
  const submit = () => {
    if (Number(input) === q.answer) onPass();
    else {
      setError(true);
      setInput('');
      setQ(makeGateQuestion(rand));
    }
  };

  return (
    <View style={styles.gate} testID="parent-gate">
      <Text style={styles.gateTitle}>家长验证</Text>
      <Text style={styles.gateDesc}>请回答下面的问题，进入家长中心</Text>
      <Text style={styles.gateQ} testID="gate-question">
        {q.a} × {q.b} = {input || '?'}
      </Text>
      {error ? <Text style={styles.gateError}>答案不对，请再试一次</Text> : null}
      <View style={styles.keys}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '确定'].map((k) => (
          <Pressable
            key={k}
            testID={`key-${k}`}
            accessibilityRole="button"
            onPress={() => (k === '⌫' ? setInput((s) => s.slice(0, -1)) : k === '确定' ? submit() : press(k))}
            style={[styles.key, k === '确定' && { backgroundColor: colors.parent }]}
          >
            <Text style={[styles.keyText, k === '确定' && { color: '#fff', fontSize: 18 }]}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: { backgroundColor: '#fff', borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.md },
  gateTitle: { fontSize: 24, fontWeight: '900', color: colors.parent },
  gateDesc: { fontSize: 15, color: colors.textSoft },
  gateQ: { fontSize: 40, fontWeight: '900', color: colors.text },
  gateError: { color: colors.wrong, fontSize: 15 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm, maxWidth: 280 },
  key: {
    width: 80,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: '#EEEDFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 26, fontWeight: '800', color: colors.text },
});
