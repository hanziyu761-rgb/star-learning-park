/**
 * 英语单词卡（V2.18）：墨绿主色；上方按年级、单元筛选；大卡片 3D 翻转；进度条“本单元已记住几/总数”；
 * 记住了 / 没记住（隔 3 张再出现，自动收进生词本）；生词本弹窗；听写；“串起来看”关系图。
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, LoadingView } from '@/components/Screen';
import { useLayout } from '@/components/useLayout';
import { zh } from '@/content/zh';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { CARD_BY_ID, firstCardOf, UNIT_BY_ID, WORD_UNITS, type WordCard } from '@/words/catalog';
import { clickTime, current, forget, isDone, jumpTo, randomNext, remember, startRound, timesShown, type Round } from '@/words/session';
import { cardForWord } from '@/words/tricks';
import { DictationModal } from '@/words/ui/DictationModal';
import { WC } from '@/words/ui/theme';
import { WordCardView } from '@/words/ui/WordCardView';
import { CelebrateModal, MapModal, WordbookModal } from '@/words/ui/WordModals';
import { contentGrade } from '@/progress/grade';
import { colors, themed } from '@/theme';

const BOOKS: { g: number; label: string }[] = [
  { g: 1, label: '启蒙' },
  { g: 3, label: '三年级' },
  { g: 4, label: '四年级' },
  { g: 5, label: '五年级' },
  { g: 6, label: '六年级' },
];

const unitsOf = (g: number) => WORD_UNITS.filter((u) => (g === 1 ? u.book === '启蒙' : u.grade === g));

export default function WordCardsScreen() {
  const { status } = useProgress();
  if (status === 'loading') return <LoadingView />;
  return <WordCards />;
}

function WordCards() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const L = useLayout();
  const { state, dispatch } = useProgress();
  const startGrade = contentGrade(state.settings.grade) <= 2 ? 1 : contentGrade(state.settings.grade);
  const [grade, setGrade] = useState(startGrade);
  const [unitId, setUnitId] = useState(unitsOf(startGrade)[0].id);
  const unit = UNIT_BY_ID.get(unitId)!;
  const [round, setRound] = useState<Round>(() => startRound(unit.cards.map((c) => c.id)));
  const [flipped, setFlipped] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [celebrateClosed, setCelebrateClosed] = useState(false);
  const [dictation, setDictation] = useState<null | { title: string; pool: WordCard[] }>(null);

  const cardId = current(round);
  const card = cardId ? CARD_BY_ID.get(cardId) : undefined;
  const saved = !!card && state.wordbook.some((e) => e.w === card.w);
  const done = isDone(round);

  const openUnit = (id: string, focus?: string) => {
    const u = UNIT_BY_ID.get(id)!;
    setUnitId(id);
    const r = startRound(u.cards.map((c) => c.id));
    setRound(focus ? jumpTo(r, focus) : r);
    setFlipped(false);
    setCelebrateClosed(false);
  };
  const chooseGrade = (g: number) => {
    setGrade(g);
    openUnit(unitsOf(g)[0].id);
  };
  const step = (f: (r: Round) => Round) => {
    setRound(f);
    setFlipped(false);
  };
  const jumpToWord = (w: string) => {
    const target = card ? cardForWord(w, card) : firstCardOf(w);
    if (!target) return;
    setShowBook(false);
    setShowMap(false);
    if (target.unitId !== unitId) {
      const g = UNIT_BY_ID.get(target.unitId)!;
      setGrade(g.book === '启蒙' ? 1 : g.grade);
      openUnit(target.unitId, target.id);
    } else step((r) => jumpTo(r, target.id));
  };
  const wordbookCards = useMemo(
    () => state.wordbook.map((e) => firstCardOf(e.w)).filter((c): c is WordCard => !!c),
    [state.wordbook],
  );

  const toggleSave = () => {
    if (!card) return;
    if (saved) dispatch({ type: 'wordbook/remove', w: card.w });
    else dispatch({ type: 'wordbook/add', w: card.w, now: clickTime() });
  };
  const forgetCard = () => {
    if (!card) return;
    dispatch({ type: 'wordbook/add', w: card.w, now: clickTime() });
    step(forget);
  };

  const pct = round.total ? round.remembered.length / round.total : 0;
  // 卡片高度：手机 400；平板竖屏 520；平板横屏按屏幕高度
  const cardHeight = L.wide ? Math.max(360, Math.min(L.height - 250, 560)) : L.tablet ? 520 : 400;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]} testID="wc-screen">
      <ScrollView contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 24, maxWidth: L.wide ? 1280 : L.tablet ? 760 : undefined }]}>
        <Header title={zh('单词卡', 'dān cí kǎ')} onBack={nav.back} />

        {/* 年级 */}
        <View style={styles.books}>
          {BOOKS.map((b) => (
            <Pressable
              key={b.g}
              onPress={() => chooseGrade(b.g)}
              style={[styles.book, grade === b.g && styles.bookOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: grade === b.g }}
              testID={`wc-grade-${b.g}`}
            >
              <Text style={[styles.bookText, grade === b.g && { color: colors.onAccent }]}>{b.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* 单元标签 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitBar} contentContainerStyle={styles.units}>
          {unitsOf(grade).map((u) => (
            <Pressable
              key={u.id}
              onPress={() => openUnit(u.id)}
              style={[styles.unit, u.id === unitId && styles.unitOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: u.id === unitId }}
              testID={`wc-unit-${u.id}`}
            >
              {u.book !== '启蒙' ? <Text style={[styles.unitBook, u.id === unitId && { color: '#DDEBE2' }]}>{u.book.slice(-2)}</Text> : null}
              <Text style={[styles.unitText, u.id === unitId && { color: colors.onAccent }]} numberOfLines={1}>
                {u.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {L.wide ? (
          // 平板横屏：左边卡片，右边进度和按钮
          <View style={styles.wideRow}>
            <View style={{ flex: 1.25 }}>
        {/* 卡片 */}
        {card ? (
          <WordCardView
            key={card.id}
            card={card}
            grade={grade}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            saved={saved}
            onToggleSave={toggleSave}
            times={timesShown(round, card.id)}
            onJump={jumpToWord}
            height={cardHeight}
            k={L.k}
          />
        ) : (
          <View style={[styles.doneCard, { height: cardHeight }]} testID="wc-all-done">
            <Text style={styles.doneText}>🎉 本单元全部记住啦！</Text>
            <Pressable onPress={() => openUnit(unitId)} style={styles.primary} accessibilityRole="button" testID="wc-again">
              <Text style={styles.primaryText}>🔁 再刷一遍</Text>
            </Pressable>
          </View>
        )}

            </View>
            <View style={{ flex: 1, gap: 14 }}>
        {/* 进度条 + 串起来看 */}
        <View style={styles.progressRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.progressText} testID="wc-progress">
              本单元已记住 {round.remembered.length}/{round.total}
            </Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
            </View>
          </View>
          <Pressable onPress={() => setShowMap(true)} style={styles.mapBtn} accessibilityRole="button" testID="wc-map">
            <Text style={styles.mapText}>🧩 串起来看</Text>
          </Pressable>
        </View>

        {/* 翻到背面后：没记住 / 记住了 */}
        {card && flipped ? (
          <View style={styles.judgeRow}>
            <Pressable
              onPress={forgetCard}
              style={[styles.judge, styles.forget]}
              accessibilityRole="button"
              testID="wc-forget"
            >
              <Text style={styles.judgeText}>😣 没记住</Text>
            </Pressable>
            <Pressable onPress={() => step(remember)} style={[styles.judge, styles.remember]} accessibilityRole="button" testID="wc-remember">
              <Text style={styles.judgeText}>😀 记住了</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable onPress={() => card && setFlipped((f) => !f)} disabled={!card} style={styles.action} accessibilityRole="button" testID="wc-flip">
            <Text style={styles.actionText}>翻转卡片</Text>
          </Pressable>
          <Pressable
            onPress={() => step((r) => randomNext(r, Math.random))}
            disabled={!card || round.queue.length <= 1}
            style={[styles.action, (!card || round.queue.length <= 1) && { opacity: 0.45 }]}
            accessibilityRole="button"
            testID="wc-random"
          >
            <Text style={styles.actionText}>随机下一个</Text>
          </Pressable>
          <Pressable onPress={() => setShowBook(true)} style={styles.action} accessibilityRole="button" testID="wc-book">
            <Text style={styles.actionText}>查看生词本{state.wordbook.length ? `（${state.wordbook.length}）` : ''}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setDictation({ title: `听写 · ${unit.title}`, pool: unit.cards })}
          style={styles.primary}
          accessibilityRole="button"
          testID="wc-dictation"
        >
          <Text style={styles.primaryText}>✍️ 听写</Text>
        </Pressable>
        <Text style={styles.source} testID="wc-source">
          {unit.source === 'original' ? '' : '单词表未逐一核对课本原书 · '}音标由程序生成（美式）
        </Text>
            </View>
          </View>
        ) : (
          <>
        {/* 进度条 + 串起来看 */}
        <View style={styles.progressRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.progressText} testID="wc-progress">
              本单元已记住 {round.remembered.length}/{round.total}
            </Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
            </View>
          </View>
          <Pressable onPress={() => setShowMap(true)} style={styles.mapBtn} accessibilityRole="button" testID="wc-map">
            <Text style={styles.mapText}>🧩 串起来看</Text>
          </Pressable>
        </View>

        {/* 卡片 */}
        {card ? (
          <WordCardView
            key={card.id}
            card={card}
            grade={grade}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            saved={saved}
            onToggleSave={toggleSave}
            times={timesShown(round, card.id)}
            onJump={jumpToWord}
            height={cardHeight}
            k={L.k}
          />
        ) : (
          <View style={[styles.doneCard, { height: cardHeight }]} testID="wc-all-done">
            <Text style={styles.doneText}>🎉 本单元全部记住啦！</Text>
            <Pressable onPress={() => openUnit(unitId)} style={styles.primary} accessibilityRole="button" testID="wc-again">
              <Text style={styles.primaryText}>🔁 再刷一遍</Text>
            </Pressable>
          </View>
        )}

        {/* 翻到背面后：没记住 / 记住了 */}
        {card && flipped ? (
          <View style={styles.judgeRow}>
            <Pressable
              onPress={forgetCard}
              style={[styles.judge, styles.forget]}
              accessibilityRole="button"
              testID="wc-forget"
            >
              <Text style={styles.judgeText}>😣 没记住</Text>
            </Pressable>
            <Pressable onPress={() => step(remember)} style={[styles.judge, styles.remember]} accessibilityRole="button" testID="wc-remember">
              <Text style={styles.judgeText}>😀 记住了</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable onPress={() => card && setFlipped((f) => !f)} disabled={!card} style={styles.action} accessibilityRole="button" testID="wc-flip">
            <Text style={styles.actionText}>翻转卡片</Text>
          </Pressable>
          <Pressable
            onPress={() => step((r) => randomNext(r, Math.random))}
            disabled={!card || round.queue.length <= 1}
            style={[styles.action, (!card || round.queue.length <= 1) && { opacity: 0.45 }]}
            accessibilityRole="button"
            testID="wc-random"
          >
            <Text style={styles.actionText}>随机下一个</Text>
          </Pressable>
          <Pressable onPress={() => setShowBook(true)} style={styles.action} accessibilityRole="button" testID="wc-book">
            <Text style={styles.actionText}>查看生词本{state.wordbook.length ? `（${state.wordbook.length}）` : ''}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setDictation({ title: `听写 · ${unit.title}`, pool: unit.cards })}
          style={styles.primary}
          accessibilityRole="button"
          testID="wc-dictation"
        >
          <Text style={styles.primaryText}>✍️ 听写</Text>
        </Pressable>
        <Text style={styles.source} testID="wc-source">
          {unit.source === 'original' ? '' : '单词表未逐一核对课本原书 · '}音标由程序生成（美式）
        </Text>
          </>
        )}
      </ScrollView>

      <WordbookModal
        visible={showBook}
        entries={state.wordbook}
        onClose={() => setShowBook(false)}
        onRemove={(w) => dispatch({ type: 'wordbook/remove', w })}
        onDictate={() => {
          setShowBook(false);
          setDictation({ title: '听写生词本', pool: wordbookCards });
        }}
        onOpen={jumpToWord}
      />
      <MapModal visible={showMap} unit={unit} onClose={() => setShowMap(false)} onOpen={jumpToWord} />
      <CelebrateModal
        visible={done && !celebrateClosed && !dictation}
        onClose={() => setCelebrateClosed(true)}
        onAgain={() => openUnit(unitId)}
        onDictate={() => {
          setCelebrateClosed(true);
          setDictation({ title: `听写 · ${unit.title}`, pool: unit.cards });
        }}
      />
      {dictation ? <DictationModal title={dictation.title} pool={dictation.pool} onClose={() => setDictation(null)} /> : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: WC.bg },
  page: { paddingHorizontal: 16, gap: 14, width: '100%', alignSelf: 'center' },
  wideRow: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  books: { flexDirection: 'row', gap: 6 },
  book: { flex: 1, alignItems: 'center', minHeight: 44, paddingHorizontal: 2, borderRadius: 22, borderWidth: 2, borderColor: WC.mainText, backgroundColor: colors.card, justifyContent: 'center' },
  bookOn: { backgroundColor: WC.main },
  bookText: { fontSize: 15, fontWeight: '600', color: WC.mainText },
  unitBar: { flexGrow: 0, flexShrink: 0, marginHorizontal: -16 },
  units: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  unit: { minHeight: 48, maxWidth: 220, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: WC.line, justifyContent: 'center' },
  unitOn: { backgroundColor: WC.main, borderColor: WC.mainText },
  unitBook: { fontSize: 11, color: WC.muted, fontWeight: '700' },
  unitText: { fontSize: 15, fontWeight: '600', color: WC.mainText },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressText: { fontSize: 15, fontWeight: '600', color: WC.mainText },
  bar: { height: 14, borderRadius: 7, backgroundColor: '#D9E6DE', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: WC.accent, borderRadius: 7 },
  mapBtn: { minHeight: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: WC.accent, justifyContent: 'center' },
  mapText: { fontSize: 15, fontWeight: '700', color: WC.text },
  judgeRow: { flexDirection: 'row', gap: 12 },
  judge: { flex: 1, minHeight: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  forget: { backgroundColor: '#F28B82' },
  remember: { backgroundColor: WC.ok },
  judgeText: { color: colors.onAccent, fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { flexGrow: 1, flexBasis: 96, minHeight: 52, borderRadius: 18, backgroundColor: colors.card, borderWidth: 2, borderColor: WC.mainText, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  actionText: { fontSize: 16, fontWeight: '600', color: WC.mainText, textAlign: 'center' },
  primary: { minHeight: 56, borderRadius: 28, backgroundColor: WC.main, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: colors.onAccent, fontSize: 18, fontWeight: '700' },
  doneCard: { height: 400, borderRadius: 28, backgroundColor: WC.soft, borderWidth: 3, borderColor: WC.mainText, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 },
  doneText: { fontSize: 26, fontWeight: '700', color: WC.mainText },
  source: { fontSize: 12, color: WC.muted, lineHeight: 18 },
}));
