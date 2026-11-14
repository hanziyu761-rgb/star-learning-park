/**
 * 家长中心 · 游戏乐园（V2.19）：每天最多玩多久（默认 15 分钟）、今天玩了多久、最近 7 天每个游戏的情况。
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { Card, SectionTitle } from '@/components/ui';
import { GAME_MINUTE_CHOICES, GAMES, gameLevel, playedToday } from '@/games/common';
import { useProgress } from '@/progress/ProgressContext';
import { colors, radius, space, themed } from '@/theme';

const WEEK = 7 * 24 * 3600 * 1000;

export function GameParentCard() {
  const { state, dispatch } = useProgress();
  const now = Date.now();
  const limit = state.settings.gameMinutes;
  const used = Math.floor(playedToday(state, now) / 60);
  const recent = state.games.filter((g) => now - g.at < WEEK);
  return (
    <Card>
      <View testID="parent-games">
        <SectionTitle>🎮 游戏乐园</SectionTitle>
        <Text style={styles.small}>
          三个学习游戏：凑数小厨房（数学）、拼音钓鱼（语文）、拼词泡泡（英语）。没有排行榜、抽奖和广告；游戏里做错的题会进错题本。
        </Text>
        <Text style={styles.label}>每天最多玩</Text>
        <View style={styles.row}>
          {GAME_MINUTE_CHOICES.map((m) => (
            <Pressable
              key={m}
              onPress={() => dispatch({ type: 'settings/set', settings: { gameMinutes: m } })}
              style={[styles.chip, limit === m && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: limit === m }}
              testID={`game-limit-${m}`}
            >
              <Text style={[styles.chipText, limit === m && { color: colors.onAccent }]}>{m ? `${m} 分钟` : '不限制'}</Text>
            </Pressable>
          ))}
        </View>
        {limit === 0 ? <Text style={styles.small}>不限制时，玩满 20 分钟会提醒孩子休息眼睛。</Text> : null}
        <Text style={styles.line} testID="parent-games-today">
          今天玩了 {used} 分钟{limit ? ` / ${limit} 分钟` : ''}
        </Text>
        <Text style={styles.label}>最近 7 天</Text>
        {GAMES.map((g) => {
          const mine = recent.filter((r) => r.game === g.id);
          const total = mine.reduce((s, r) => s + r.total, 0);
          const correct = mine.reduce((s, r) => s + r.correct, 0);
          return (
            <Text key={g.id} style={styles.line} testID={`parent-games-${g.id}`}>
              {g.emoji} {g.namePlain}：{mine.length ? `${mine.length} 局，一次做对 ${Math.round((correct / Math.max(1, total)) * 100)}%，现在第 ${gameLevel(state.games, g.id, state.settings.grade)} 档` : '还没玩过'}
            </Text>
          );
        })}
      </View>
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  small: { fontSize: 13, color: colors.textSoft, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: space.md },
  line: { fontSize: 14, color: colors.text, marginTop: space.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  chip: { borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line, paddingHorizontal: space.md, paddingVertical: 8 },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.text },
}));
