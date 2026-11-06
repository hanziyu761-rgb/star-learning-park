/**
 * 听写（V2.18）：每题自动读单词、显示中文，孩子拼写后提交，马上判断对错；错了显示正确拼写。
 * 拼写方式：大字母按键（默认）或普通输入框，可以切换。拼错的词自动加入生词本；
 * 生词本里的词拼对一次亮一个小圆点，亮满 3 个自动移出。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useProgress } from '@/progress/ProgressContext';
import type { WordCard } from '../catalog';
import { isCorrectSpelling, letterTiles, needsSpaceKey, pickDictation } from '../dictation';
import { sayWord, WordArt } from './WordCardView';
import { WC } from './theme';

type Mode = 'tiles' | 'input';

/** 父组件只在需要听写时渲染它（每次打开都是新的一轮） */
export function DictationModal({
  title,
  pool,
  onClose,
  rand = Math.random,
}: {
  title: string;
  pool: WordCard[];
  onClose: () => void;
  rand?: () => number;
}) {
  const { dispatch } = useProgress();
  // 每次打开（父组件重新挂载这个弹窗）抽一次题
  const [items] = useState<WordCard[]>(() => pickDictation(pool, rand));
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [used, setUsed] = useState<number[]>([]);
  const [mode, setMode] = useState<Mode>('tiles');
  const [result, setResult] = useState<null | boolean>(null);
  const [score, setScore] = useState<{ right: number; wrong: string[] }>({ right: 0, wrong: [] });

  const card = items[i];
  const tiles = useMemo(() => (card ? letterTiles(card.w, rand) : []), [card, rand]);
  useEffect(() => {
    if (card) sayWord(card.w);
  }, [card]);

  const finished = items.length > 0 && i >= items.length;

  const submit = () => {
    if (!card || result !== null) return;
    const ok = isCorrectSpelling(answer, card.w);
    setResult(ok);
    dispatch({ type: 'wordbook/dictation', w: card.w, correct: ok, now: Date.now() });
    setScore((s) => (ok ? { ...s, right: s.right + 1 } : { ...s, wrong: [...s.wrong, card.w] }));
  };
  const next = () => {
    setI((x) => x + 1);
    setAnswer('');
    setUsed([]);
    setResult(null);
  };
  const tap = (k: number) => {
    if (result !== null || used.includes(k)) return;
    setUsed((u) => [...u, k]);
    setAnswer((a) => a + tiles[k]);
  };
  const backspace = () => {
    if (result !== null || !answer) return;
    if (answer.endsWith(' ')) setAnswer((a) => a.slice(0, -1));
    else {
      setUsed((u) => u.slice(0, -1));
      setAnswer((a) => a.slice(0, -1));
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.root} testID="dict-modal">
        <View style={styles.head}>
          <Text style={styles.title}>✍️ {title}</Text>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" testID="dict-close">
            <Text style={styles.closeText}>关闭</Text>
          </Pressable>
        </View>
        {items.length === 0 ? (
          <Text style={styles.empty}>没有可以听写的单词。</Text>
        ) : finished ? (
          <ScrollView contentContainerStyle={styles.body} testID="dict-summary">
            <Text style={styles.big}>
              拼对 {score.right} / {items.length}
            </Text>
            {score.wrong.length ? (
              <>
                <Text style={styles.label}>拼错的词已经放进生词本：</Text>
                <View style={styles.wrapRow}>
                  {score.wrong.map((w) => (
                    <Text key={w} style={styles.wrongWord}>
                      {w}
                    </Text>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.label}>全部拼对，太棒了！🎉</Text>
            )}
            <Pressable onPress={onClose} style={[styles.btn, styles.primary]} accessibilityRole="button" testID="dict-done">
              <Text style={styles.btnTextLight}>完成</Text>
            </Pressable>
          </ScrollView>
        ) : card ? (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.progress} testID="dict-progress">
              第 {i + 1} / {items.length} 题
            </Text>
            <View style={styles.promptRow}>
              <Pressable onPress={() => sayWord(card.w)} style={styles.speak} accessibilityRole="button" accessibilityLabel="再听一遍" testID="dict-speak">
                <Text style={{ fontSize: 34 }}>🔊</Text>
              </Pressable>
              <Text style={styles.zh} testID="dict-zh">
                {card.zh}
              </Text>
            </View>

            <View style={[styles.answerBox, result === true && styles.okBox, result === false && styles.badBox]} testID="dict-answer">
              <Text style={styles.answerText}>{answer || ' '}</Text>
            </View>

            {result === null ? (
              <>
                <View style={styles.modeRow}>
                  {(['tiles', 'input'] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setMode(m);
                        setAnswer('');
                        setUsed([]);
                      }}
                      style={[styles.mode, mode === m && styles.modeOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: mode === m }}
                      testID={`dict-mode-${m}`}
                    >
                      <Text style={[styles.modeText, mode === m && { color: '#fff' }]}>{m === 'tiles' ? '🔤 字母按键' : '⌨️ 输入框'}</Text>
                    </Pressable>
                  ))}
                </View>
                {mode === 'tiles' ? (
                  <View style={styles.tiles}>
                    {tiles.map((t, k) => (
                      <Pressable
                        key={k}
                        onPress={() => tap(k)}
                        disabled={used.includes(k)}
                        style={[styles.tile, used.includes(k) && styles.tileUsed]}
                        accessibilityRole="button"
                        accessibilityLabel={t}
                        testID={`dict-tile-${k}`}
                      >
                        <Text style={styles.tileText}>{t}</Text>
                      </Pressable>
                    ))}
                    {needsSpaceKey(card.w) ? (
                      <Pressable onPress={() => setAnswer((a) => a + ' ')} style={[styles.tile, styles.wide]} accessibilityRole="button" testID="dict-space">
                        <Text style={styles.tileSmall}>空格</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={backspace} style={[styles.tile, styles.wide]} accessibilityRole="button" testID="dict-back">
                      <Text style={styles.tileSmall}>⌫ 删除</Text>
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    value={answer}
                    onChangeText={setAnswer}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="在这里拼写"
                    style={styles.input}
                    onSubmitEditing={submit}
                    testID="dict-input"
                  />
                )}
                <Pressable
                  onPress={submit}
                  disabled={!answer.trim()}
                  style={[styles.btn, styles.primary, !answer.trim() && { opacity: 0.45 }]}
                  accessibilityRole="button"
                  testID="dict-submit"
                >
                  <Text style={styles.btnTextLight}>提交</Text>
                </Pressable>
              </>
            ) : (
              <View style={{ gap: 12 }} testID="dict-result">
                {result ? (
                  <Text style={[styles.verdict, { color: WC.ok }]}>✔ 拼对了！</Text>
                ) : (
                  <>
                    <Text style={[styles.verdict, { color: WC.heart }]}>✘ 再记一记，正确拼写是：</Text>
                    <View style={styles.correctBox} testID="dict-correct">
                      <WordArt w={card.w} size={44} />
                    </View>
                    <Text style={styles.label}>已经放进生词本。</Text>
                  </>
                )}
                <Pressable onPress={next} style={[styles.btn, styles.primary]} accessibilityRole="button" testID="dict-next">
                  <Text style={styles.btnTextLight}>{i + 1 < items.length ? '下一题' : '看成绩'}</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WC.bg, paddingTop: 24 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: WC.main, flex: 1 },
  close: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', borderWidth: 2, borderColor: WC.line },
  closeText: { fontSize: 16, fontWeight: '800', color: WC.main },
  empty: { padding: 24, fontSize: 18, color: WC.muted },
  body: { padding: 16, gap: 14 },
  progress: { fontSize: 15, color: WC.muted, fontWeight: '700' },
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  speak: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: WC.main },
  zh: { flex: 1, fontSize: 30, fontWeight: '900', color: WC.text },
  answerBox: { minHeight: 72, borderRadius: 18, borderWidth: 3, borderColor: WC.line, backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 16 },
  okBox: { borderColor: WC.ok, backgroundColor: '#EAF7EE' },
  badBox: { borderColor: WC.heart, backgroundColor: '#FDECEC' },
  answerText: { fontSize: 36, fontWeight: '800', color: WC.text, letterSpacing: 2 },
  modeRow: { flexDirection: 'row', gap: 10 },
  mode: { flex: 1, minHeight: 44, borderRadius: 22, borderWidth: 2, borderColor: WC.main, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  modeOn: { backgroundColor: WC.main },
  modeText: { fontSize: 15, fontWeight: '800', color: WC.main },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  tile: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#fff', borderWidth: 3, borderColor: WC.main, alignItems: 'center', justifyContent: 'center' },
  tileUsed: { opacity: 0.25 },
  wide: { width: 124 },
  tileText: { fontSize: 30, fontWeight: '900', color: WC.main },
  tileSmall: { fontSize: 17, fontWeight: '800', color: WC.main },
  input: { minHeight: 60, borderRadius: 16, borderWidth: 3, borderColor: WC.main, backgroundColor: '#fff', fontSize: 28, paddingHorizontal: 14 },
  btn: { minHeight: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primary: { backgroundColor: WC.main },
  btnTextLight: { color: '#fff', fontSize: 19, fontWeight: '900' },
  verdict: { fontSize: 24, fontWeight: '900' },
  correctBox: { backgroundColor: '#fff', borderRadius: 18, padding: 8 },
  label: { fontSize: 16, color: WC.text },
  big: { fontSize: 40, fontWeight: '900', color: WC.main, textAlign: 'center' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wrongWord: { fontSize: 20, fontWeight: '800', color: WC.heart, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, overflow: 'hidden' },
});
