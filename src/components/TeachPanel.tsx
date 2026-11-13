/**
 * 先教后练（V2.10）：知识点练习前的小讲解，一页一张图示和一句话，可以听。
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DisplayTextView } from '@/components/PinyinText';
import { BigButton, SpeakerButton } from '@/components/ui';
import { zh } from '@/content/zh';
import type { TeachSlide } from '@/knowledge/teach';
import { speak } from '@/speech/speech';
import { colors, radius, space, themed } from '@/theme';

export function TeachPanel({ slides, color, onDone }: { slides: TeachSlide[]; color: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = slides[i];
  const last = i === slides.length - 1;
  // 三年级起的讲解不注拼音，按钮和标题也不注
  const plain = typeof s.text === 'string';
  useEffect(() => {
    speak({ text: s.speak, lang: s.lang ?? 'zh-CN' });
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.wrap} testID="teach-panel">
      <DisplayTextView text={plain ? '先学一学' : zh('先学一学', 'xiān xué yi xué')} size={24} color={color} />
      <View style={styles.card} testID={`teach-slide-${i}`}>
        <Text style={styles.show}>{s.show}</Text>
        <DisplayTextView text={s.text} size={24} />
        <SpeakerButton item={{ text: s.speak, lang: s.lang ?? 'zh-CN' }} size={52} />
      </View>
      <Text style={styles.page}>
        {i + 1} / {slides.length}
      </Text>
      <BigButton
        emoji={last ? '✏️' : '▶️'}
        label={
          last ? (plain ? '开始练习' : zh('开始练习', 'kāi shǐ liàn xí')) : plain ? '下一页' : zh('下一页', 'xià yí yè')
        }
        color={color}
        onPress={() => (last ? onDone() : setI(i + 1))}
        testID={last ? 'teach-start' : 'teach-next'}
      />
      <BigButton
        size="md"
        emoji="⏭️"
        label={plain ? '我会了，直接练习' : zh('我会了，直接练习', 'wǒ huì le zhí jiē liàn xí')}
        color={colors.textSoft}
        onPress={onDone}
        testID="teach-skip"
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: space.md, alignItems: 'stretch' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, alignItems: 'center', gap: space.md },
  show: { fontSize: 44, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 60 },
  page: { textAlign: 'center', color: colors.textSoft, fontWeight: '700' },
}));
