/**
 * 游戏乐园（V2.19）：三个学科各一个游戏。显示今天玩了多久、还能玩多久；到了家长设的时长上限就不能再开新局。
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { DisplayTextView } from '@/components/PinyinText';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { canStartGame, GAMES, gameLevel, playedToday } from '@/games/common';
import { gt } from '@/games/ui/text';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { GAME_BG, GAME_MAIN } from './GameScreen';
import { contentGrade } from '@/progress/grade';
import { colors, themed } from '@/theme';

export default function GamesScreen() {
  const nav = useNav();
  const { status, state } = useProgress();
  const [now] = useState(() => Date.now());
  if (status === 'loading') return <LoadingView />;
  const grade = contentGrade(state.settings.grade);
  const used = Math.floor(playedToday(state, now) / 60);
  const limit = state.settings.gameMinutes;
  const can = canStartGame(state, now);

  return (
    <Screen bg={colors.bg} testID="games-screen">
      <Header title={gt('hub', grade)} onBack={nav.back} />
      <Text style={styles.time} testID="games-time">
        {limit ? `${used} / ${limit} 分钟` : `${used} 分钟`}
      </Text>
      {!can ? (
        <View testID="games-locked">
          <Notice text="今天玩够啦，明天再来吧！" />
        </View>
      ) : null}
      {GAMES.map((g) => {
        const mine = state.games.filter((r) => r.game === g.id);
        const best = mine.reduce((m, r) => Math.max(m, r.stars), 0);
        return (
          <Pressable
            key={g.id}
            onPress={() => nav.push({ name: 'game', id: g.id })}
            disabled={!can}
            style={[styles.card, { backgroundColor: GAME_BG[g.id], borderColor: GAME_MAIN[g.id] }, !can && { opacity: 0.5 }]}
            accessibilityRole="button"
            testID={`games-start-${g.id}`}
          >
            <Text style={styles.emoji}>{g.emoji}</Text>
            <View style={{ flex: 1, gap: 4 }}>
              <DisplayTextView text={grade >= 3 ? g.namePlain : g.name} size={24} />
              <Text style={[styles.meta, { color: GAME_MAIN[g.id] }]} testID={`games-meta-${g.id}`}>
                第 {gameLevel(state.games, g.id, grade)} 档{best ? ` · ${'⭐'.repeat(best)}` : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  time: { fontSize: 15, fontWeight: '600', color: colors.textSoft, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 24, borderWidth: 3, padding: 16, minHeight: 120 },
  emoji: { fontSize: 52, color: colors.text },
  intro: { fontSize: 14, color: colors.text, lineHeight: 20 },
  meta: { fontSize: 13, fontWeight: '600', color: colors.text },
  note: { fontSize: 12, color: colors.textSoft, lineHeight: 18 },
}));
