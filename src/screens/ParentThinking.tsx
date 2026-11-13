/**
 * 家长中心 · 思维能力（V2.5）
 * 来自真实记录：每日挑战的作答、练习中答对后孩子自己选的思路。是做题情况统计，不是心理或智力测评。
 */
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui';
import { useProgress } from '@/progress/ProgressContext';
import { challengeLevel, LEVEL_NAME } from '@/thinking/adaptive';
import { THINK_DIMS } from '@/thinking/dims';
import { MIN_SAMPLES, thinkingProfile } from '@/thinking/profile';
import { STRATEGIES } from '@/thinking/strategies';
import { colors, radius, space } from '@/theme';

const SUBJECT_CN = { math: '数学', chinese: '语文', english: '英语' } as const;

export function ThinkingCard() {
  const { state, dispatch } = useProgress();
  const [now] = useState(() => Date.now());
  const p = thinkingProfile(state, now);
  const empty = p.challengeDays === 0 && p.strategies.length === 0;

  return (
    <Card>
      <View testID="pt-section">
        <SectionTitle>🧠 思维能力</SectionTitle>
        <Text style={styles.note}>
          真实做题记录，不是心理或智力测评 · 题目为原创，待教师审核
        </Text>
        <View style={styles.adaptRow}>
          <Text style={[styles.dimName, { flex: 1 }]}>挑战难度跟着孩子调整</Text>
          <Switch
            value={state.settings.adaptiveChallenge !== false}
            onValueChange={(v) => dispatch({ type: 'settings/set', settings: { adaptiveChallenge: v } })}
            testID="pt-adaptive-switch"
          />
        </View>
        <Text style={styles.dimStat} testID="pt-levels">
          {state.settings.adaptiveChallenge === false
            ? `已关闭：三科都按家长设的${state.settings.grade}年级出题。`
            : (['math', 'chinese', 'english'] as const)
                .map((s) => {
                  const a = challengeLevel(state, s);
                  const arrow = a.change === 'up' ? '（难一档）' : a.change === 'down' ? '（容易一档）' : '';
                  return `${SUBJECT_CN[s]}：${LEVEL_NAME[a.level]}${arrow}`;
                })
                .join('；') +
              '。这一科最近 5 道一次答对 4 道以上就难一档，最多答对 1 道就容易一档，只在年级上下一档内调整。'}
        </Text>
        {empty ? (
          <Text style={styles.empty} testID="pt-empty">
            还没有记录
          </Text>
        ) : (
          <>
            <Text style={styles.line} testID="pt-days">
              每日挑战：做过 {p.challengeDays} 天{p.streak > 1 ? `，已连续 ${p.streak} 天` : ''}
              {p.doneToday ? '（今天已完成）' : ''}
            </Text>
            <Text style={styles.dimStat} testID="pt-subjects">
              按学科：
              {p.subjects
                .map((x) => `${SUBJECT_CN[x.subject]} ${x.tried} 道（一次答对 ${x.firstTryCorrect}）`)
                .join('，')}
            </Text>

            {p.dims.map((d) => {
              const info = THINK_DIMS.find((x) => x.id === d.dim)!;
              return (
                <View key={d.dim} style={styles.dim} testID={`pt-dim-${d.dim}`}>
                  <Text style={styles.dimName}>
                    {info.emoji} {info.name}
                  </Text>
                  <Text style={styles.dimDesc}>{info.desc}</Text>
                  <Text style={styles.dimStat}>
                    {d.tried === 0 ? '还没做过这类题' : `做了 ${d.tried} 道，一次答对 ${d.firstTryCorrect} 道`}
                  </Text>
                </View>
              );
            })}
            <Text style={[styles.dimName, { marginTop: space.md }]}>🔟 计算方法（孩子自己选的思路）</Text>
            {p.strategies.length === 0 ? (
              <Text style={styles.dimStat}>还没有记录：数学练习中每答对几道题，会问一次“你是怎么想的”。</Text>
            ) : (
              p.strategies.map((s) => (
                <View key={s.kp} style={styles.dim} testID={`pt-strategy-${s.kp}`}>
                  <Text style={styles.dimStat}>
                    {s.kpName} · 共 {s.total} 次：
                    {s.counts.map((c) => `${STRATEGIES[c.id]?.speak ?? c.id} ${c.count}`).join('、')}
                  </Text>
                  {s.advice ? (
                    <Text style={styles.advice} testID="pt-advice">
                      {s.advice}
                    </Text>
                  ) : s.total < MIN_SAMPLES ? (
                    <Text style={styles.dimDesc}>记录还少（少于 {MIN_SAMPLES} 次），先不下结论。</Text>
                  ) : null}
                </View>
              ))
            )}
            <Text style={styles.note}>思路是孩子自己点选的，可能和实际想法有出入，可以请孩子讲给你听。</Text>
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  adaptRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.sm },
  note: { fontSize: 13, color: colors.textSoft, marginTop: space.xs, lineHeight: 19 },
  empty: { fontSize: 15, color: colors.text, marginTop: space.sm, lineHeight: 22 },
  line: { fontSize: 15, color: colors.text, marginTop: space.sm, fontWeight: '700' },
  dim: { marginTop: space.sm, padding: space.sm, backgroundColor: '#F7F5FF', borderRadius: radius.md, gap: 2 },
  dimName: { fontSize: 16, fontWeight: '800', color: colors.text },
  dimDesc: { fontSize: 13, color: colors.textSoft },
  dimStat: { fontSize: 15, color: colors.text },
  advice: { fontSize: 14, color: colors.parent, fontWeight: '700', marginTop: 2 },
});
