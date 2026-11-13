/**
 * 玩一局游戏（V2.19）：开始前检查今天的时长上限；每道题的结果记进错题本和知识点掌握度（来源：游戏）；
 * 结束时按一次做对的题数给星星，难度下一局自动调整。
 */
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DisplayTextView } from '@/components/PinyinText';
import { LoadingView } from '@/components/Screen';
import { BubbleGame } from '@/games/ui/BubbleGame';
import { FishGame } from '@/games/ui/FishGame';
import { KitchenGame } from '@/games/ui/KitchenGame';
import { gt } from '@/games/ui/text';
import { canStartGame, GAME_BY_ID, gameLevel, playedToday, ROUND_SIZE, starsFor } from '@/games/common';
import { BUBBLE_LESSON } from '@/games/bubble';
import { FISH_LESSON } from '@/games/fish';
import { KITCHEN_LESSON } from '@/games/kitchen';
import { useNav } from '@/nav/Nav';
import type { GameId } from '@/progress/model';
import { useProgress } from '@/progress/ProgressContext';
import { stopSpeaking } from '@/speech/speech';
import { clickTime } from '@/words/session';
import { contentGrade } from '@/progress/grade';
import { colors, themed } from '@/theme';

const LESSON: Record<GameId, string> = { kitchen: KITCHEN_LESSON, fish: FISH_LESSON, bubble: BUBBLE_LESSON };
export const GAME_BG: Record<GameId, string> = { kitchen: '#FFF3E0', fish: '#E3F4FB', bubble: '#F1ECFF' };
export const GAME_MAIN: Record<GameId, string> = themed(() => ({ kitchen: colors.orange, fish: colors.blue, bubble: colors.parent }));

export interface GameAnswer {
  exerciseId: string;
  correct: boolean;
  /** 显示在结束页“还要再练”里 */
  label: string;
}
export interface GameProps {
  level: number;
  grade: number;
  rand: () => number;
  onAnswer: (a: GameAnswer) => void;
  onFinish: () => void;
}

const isGame = (v: unknown): v is GameId => v === 'kitchen' || v === 'fish' || v === 'bubble';

export default function GameScreen({ id }: { id: string | undefined }) {
  const { status } = useProgress();
  if (status === 'loading') return <LoadingView />;
  return isGame(id) ? <GamePlay key={id} game={id} /> : <LoadingView />;
}

function GamePlay({ game }: { game: GameId }) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useProgress();
  const grade = contentGrade(state.settings.grade);
  const info = GAME_BY_ID[game];
  // 每一局开始时定下难度档和开始时间（玩完后下一局重新计算）
  const [round, setRound] = useState(() => ({ n: 0, level: gameLevel(state.games, game, grade), startedAt: clickTime() }));
  const [phase, setPhase] = useState<'play' | 'done' | 'rest'>(() => (canStartGame(state, clickTime()) ? 'play' : 'rest'));
  const [usedMin, setUsedMin] = useState(() => Math.floor(playedToday(state, clickTime()) / 60));
  const level = round.level;
  const answers = useRef<GameAnswer[]>([]);
  const [summary, setSummary] = useState<{ stars: number; correct: number; total: number; wrong: string[] } | null>(null);
  const rand = Math.random;

  const onAnswer = (a: GameAnswer) => {
    answers.current.push(a);
    dispatch({
      type: 'exercise/result',
      lessonId: LESSON[game],
      exerciseId: a.exerciseId,
      subject: info.subject,
      skill: `game.${game}`,
      firstTryCorrect: a.correct,
      attempts: a.correct ? 1 : 2,
      now: clickTime(),
      source: 'game',
    });
  };
  const onFinish = () => {
    const now = clickTime();
    const total = answers.current.length;
    const correct = answers.current.filter((a) => a.correct).length;
    const stars = starsFor(correct, total);
    dispatch({
      type: 'game/complete',
      record: { game, at: now, sec: (now - round.startedAt) / 1000, stars, correct, total, level },
    });
    setUsedMin(Math.floor((playedToday(state, now) + (now - round.startedAt) / 1000) / 60));
    setSummary({ stars, correct, total, wrong: answers.current.filter((a) => !a.correct).map((a) => a.label) });
    stopSpeaking();
    setPhase('done');
  };
  const playAgain = () => {
    answers.current = [];
    setSummary(null);
    const now = clickTime();
    if (!canStartGame(state, now)) {
      setPhase('rest');
      return;
    }
    setRound((r) => ({ n: r.n + 1, level: gameLevel(state.games, game, grade), startedAt: now }));
    setPhase('play');
  };

  const limit = state.settings.gameMinutes;
  const props: GameProps = { level, grade, rand, onAnswer, onFinish };

  return (
    <View style={[styles.root, { backgroundColor: GAME_BG[game], paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6 }]} testID={`game-${game}`}>
      <View style={styles.top}>
        <Pressable
          onPress={() => {
            stopSpeaking();
            nav.back();
          }}
          style={styles.exit}
          accessibilityRole="button"
          accessibilityLabel="退出"
          testID="game-exit"
        >
          <Text style={styles.exitText}>✕</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <DisplayTextView text={grade >= 3 ? info.namePlain : info.name} size={22} />
        </View>
        <Text style={[styles.level, { color: GAME_MAIN[game] }]} testID="game-level">
          第 {level} 档
        </Text>
      </View>

      {phase === 'play' ? (
        <View style={{ flex: 1 }} key={round.n}>
          {game === 'kitchen' ? <KitchenGame {...props} /> : game === 'fish' ? <FishGame {...props} /> : <BubbleGame {...props} />}
        </View>
      ) : phase === 'done' && summary ? (
        <ScrollView contentContainerStyle={styles.summary} testID="game-summary">
          <DisplayTextView text={gt('finishedRound', grade)} size={28} />
          <Text style={styles.stars} testID="game-stars">
            {'⭐'.repeat(summary.stars)}
            {'☆'.repeat(3 - summary.stars)}
          </Text>
          <Text style={styles.score} testID="game-score">
            一次做对 {summary.correct} / {summary.total}
          </Text>
          {summary.wrong.length ? (
            <View style={styles.wrongBox}>
              <Text style={styles.wrongTitle}>还要再练：</Text>
              {summary.wrong.map((w, i) => (
                <Text key={i} style={styles.wrongItem}>
                  · {w}
                </Text>
              ))}
            </View>
          ) : null}
          {limit && usedMin >= limit ? (
            <View style={styles.restNote} testID="game-limit-reached">
              <DisplayTextView text={gt('rest', grade)} size={20} />
            </View>
          ) : (
            <Pressable onPress={playAgain} style={[styles.btn, { backgroundColor: GAME_MAIN[game] }]} accessibilityRole="button" testID="game-again">
              <DisplayTextView text={gt('again', grade)} size={22} color={colors.onAccent} />
            </Pressable>
          )}
          {!limit && usedMin >= 20 ? (
            <View style={styles.restNote} testID="game-rest-eyes">
              <DisplayTextView text={gt('restEyes', grade)} size={18} />
            </View>
          ) : null}
          <Pressable onPress={nav.back} style={[styles.btn, styles.light]} accessibilityRole="button" testID="game-back">
            <DisplayTextView text={gt('back', grade)} size={20} />
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.summary} testID="game-rest">
          <Text style={{ fontSize: 64 }}>🌙</Text>
          <DisplayTextView text={gt('rest', grade)} size={24} />
          <Text style={styles.score}>
            今天已经玩了 {usedMin} 分钟（爸爸妈妈设的是每天 {limit} 分钟）
          </Text>
          <Pressable onPress={nav.back} style={[styles.btn, styles.light]} accessibilityRole="button" testID="game-back">
            <DisplayTextView text={gt('back', grade)} size={20} />
          </Pressable>
        </View>
      )}
      <Text style={styles.round} testID="game-round-size">
        每局 {ROUND_SIZE} 题
      </Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, minHeight: 56 },
  exit: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  exitText: { fontSize: 22, fontWeight: '700', color: '#555' },
  level: { fontSize: 14, fontWeight: '600', minWidth: 48, textAlign: 'right' },
  summary: { padding: 20, gap: 16, alignItems: 'center', width: '100%', maxWidth: 640, alignSelf: 'center' },
  stars: { fontSize: 48, color: '#F2B705' },
  score: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center' },
  wrongBox: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: 18, padding: 14, gap: 4 },
  wrongTitle: { fontSize: 14, color: '#666' },
  wrongItem: { fontSize: 18, fontWeight: '700', color: '#333' },
  btn: { alignSelf: 'stretch', minHeight: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  light: { backgroundColor: colors.card },
  restNote: { backgroundColor: colors.card, borderRadius: 18, padding: 14, alignSelf: 'stretch', alignItems: 'center' },
  round: { textAlign: 'center', fontSize: 12, color: '#888' },
}));
