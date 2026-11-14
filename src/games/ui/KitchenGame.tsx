/**
 * 凑数小厨房（V2.19）界面：点一点（或拖动）食材放进锅里；锅里的食材点一下拿出来。
 * 刚好等于点菜牌上的数 → 做好啦；放多了 → 锅冒烟，这一单算没有一次做对，拿出来一些再凑。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { DisplayTextView } from '@/components/PinyinText';
import { useLayout } from '@/components/useLayout';
import { DragArea, Draggable, DropZone, justDragged } from '@/drag/DragArea';
import { ROUND_SIZE } from '@/games/common';
import { fmt, makeOrder, orderExerciseId, potState, type Ingredient } from '@/games/kitchen';
import type { GameProps } from '@/screens/GameScreen';
import { speak } from '@/speech/speech';
import { gt } from './text';
import { colors, themed } from '@/theme';

/** 主色跟着配色（V5.0）；池塘、泡泡、锅等场景画面保留固定颜色 */
const MAIN_OF = () => colors.orange;
const say = (t: string) => speak({ text: t.replace(/\./g, '点'), lang: 'zh-CN' });

export function KitchenGame({ level, grade, rand, onAnswer, onFinish }: GameProps) {
  const L = useLayout();
  const [q, setQ] = useState(0);
  const order = useMemo(() => makeOrder(level, rand, q), [level, rand, q]);
  const [pot, setPot] = useState<string[]>([]);
  const [smoke, setSmoke] = useState(false);
  const [overflowed, setOverflowed] = useState(false);
  const [done, setDone] = useState(false);
  const target = fmt(order.target, order.scale);

  useEffect(() => {
    say(`我要${target}`);
  }, [target, q]);

  const inPot = pot.map((id) => order.items.find((i) => i.id === id)!).filter(Boolean);
  const put = (it: Ingredient) => {
    if (done || pot.includes(it.id)) return;
    const next = [...inPot, it];
    setPot(next.map((x) => x.id));
    const st = potState(next, order.target);
    if (st === 'over') {
      setSmoke(true);
      setOverflowed(true);
      say('太多啦，拿出来一些');
    } else setSmoke(false);
    if (st === 'exact') {
      setDone(true);
      const expr = next.map((x) => fmt(x.units, order.scale)).join(' + ');
      onAnswer({ exerciseId: orderExerciseId(order), correct: !overflowed, label: `${expr} = ${target}` });
      say(`做好啦！${expr.replace(/\+/g, '加')}等于${target}`);
    }
  };
  const takeOut = (id: string) => {
    if (done) return;
    const next = inPot.filter((x) => x.id !== id);
    setPot(next.map((x) => x.id));
    setSmoke(potState(next, order.target) === 'over');
  };
  const next = () => {
    if (q + 1 >= ROUND_SIZE) return onFinish();
    setQ(q + 1);
    setPot([]);
    setSmoke(false);
    setOverflowed(false);
    setDone(false);
  };

  return (
    <DragArea style={[styles.root, L.tablet && !L.wide && styles.tabletCol, L.wide && styles.wideRoot]}>
      <View style={[{ gap: 10 }, L.wide && { flex: 1, justifyContent: 'center' }]}>
      <Text style={styles.progress} testID="kitchen-progress">
        第 {q + 1} / {ROUND_SIZE} 位客人
      </Text>
      <View style={styles.customerRow}>
        <Text style={[styles.customer, L.tablet && { fontSize: 84 }]}>{order.customer}</Text>
        <Pressable onPress={() => say(`我要${target}`)} style={styles.orderCard} accessibilityRole="button" testID="kitchen-order">
          <DisplayTextView text={gt('iWant', grade)} size={18} />
          <Text style={[styles.target, L.tablet && { fontSize: 60 }]} testID="kitchen-target">
            {target}
          </Text>
        </Pressable>
      </View>

      <DropZone id="pot" style={[styles.pot, L.tablet && { minHeight: 170 }, smoke && styles.potSmoke, done && styles.potDone]} testID="kitchen-pot">
        <Text style={styles.potIcon}>{done ? '🍲' : smoke ? '💨' : '🥘'}</Text>
        <View style={styles.potItems}>
          {inPot.length === 0 ? <DisplayTextView text={gt('tapFood', grade)} size={15} color="#F6E3D3" /> : null}
          {inPot.map((it, i) => (
            <React.Fragment key={it.id}>
              {i > 0 ? <Text style={styles.plus}>+</Text> : null}
              <Pressable onPress={() => takeOut(it.id)} style={styles.potChip} accessibilityRole="button" accessibilityLabel={`拿出 ${fmt(it.units, order.scale)}`} testID={`pot-${it.id}`}>
                <Text style={styles.potChipText}>
                  {it.emoji}
                  {fmt(it.units, order.scale)}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </DropZone>

      <View style={styles.status} testID="kitchen-status">
        {smoke ? <DisplayTextView text={gt('tooMuch', grade)} size={18} color={colors.wrong} /> : null}
        {done ? (
          <Text style={styles.doneText} testID="kitchen-done">
            ✅ {inPot.map((x) => fmt(x.units, order.scale)).join(' + ')} = {target}
          </Text>
        ) : null}
      </View>
      </View>

      <View style={[{ gap: 10 }, L.wide && { flex: 1, justifyContent: 'center' }]}>
      {done ? (
        <Pressable onPress={next} style={styles.nextBtn} accessibilityRole="button" testID="kitchen-next">
          <DisplayTextView text={q + 1 >= ROUND_SIZE ? gt('finishedRound', grade) : gt('nextGuest', grade)} size={20} color={colors.onAccent} />
        </Pressable>
      ) : (
        <View style={styles.shelf}>
          {order.items
            .filter((it) => !pot.includes(it.id))
            .map((it) => (
              <Draggable key={it.id} onDrop={(zone) => (zone === 'pot' ? (put(it), true) : false)} style={[styles.foodWrap, L.wide && { width: '45%' }]}>
                <Pressable
                  onPress={() => !justDragged() && put(it)}
                  style={[styles.food, L.tablet && { minHeight: 120 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${fmt(it.units, order.scale)}`}
                  testID={`food-${it.id}`}
                >
                  <FoodFace it={it} scale={order.scale} />
                </Pressable>
              </Draggable>
            ))}
        </View>
      )}
      </View>
    </DragArea>
  );
}

/** 10 以内用一个个食材表示（方便数），大数和小数直接写数 */
function FoodFace({ it, scale }: { it: Ingredient; scale: number }) {
  if (scale === 1 && it.units <= 10)
    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.foodDots}>{Array.from({ length: it.units }, () => it.emoji).join('')}</Text>
        <Text style={styles.foodNum}>{it.units}</Text>
      </View>
    );
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.foodEmoji}>{it.emoji}</Text>
      <Text style={styles.foodNumBig}>{fmt(it.units, scale)}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 14, gap: 10 },
  tabletCol: { width: '100%', maxWidth: 760, alignSelf: 'center', justifyContent: 'center' },
  wideRoot: { flexDirection: 'row', gap: 28, paddingHorizontal: 28, alignItems: 'stretch' },
  progress: { textAlign: 'center', fontSize: 14, color: colors.textSoft, fontWeight: '700' },
  customerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  customer: { fontSize: 64 },
  orderCard: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 3, borderColor: MAIN_OF(), paddingHorizontal: 18, paddingVertical: 8, alignItems: 'center', minWidth: 120 },
  target: { fontSize: 44, fontWeight: '700', color: MAIN_OF() },
  pot: { minHeight: 120, borderRadius: 60, backgroundColor: '#5B4636', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6 },
  potSmoke: { backgroundColor: '#8E8E8E' },
  potDone: { backgroundColor: '#2E9E4F' },
  potIcon: { fontSize: 40 },
  potItems: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6 },
  plus: { color: '#fff', fontSize: 22, fontWeight: '700' },
  potChip: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  potChipText: { fontSize: 20, fontWeight: '600', color: '#333' },
  status: { minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 24, fontWeight: '700', color: colors.correct },
  nextBtn: { minHeight: 60, borderRadius: 30, backgroundColor: MAIN_OF(), alignItems: 'center', justifyContent: 'center' },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  foodWrap: { width: '30%', minWidth: 96 },
  food: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 2, borderColor: '#F2C9A8', padding: 8, minHeight: 88, alignItems: 'center', justifyContent: 'center' },
  foodDots: { fontSize: 18, textAlign: 'center', lineHeight: 24 },
  foodNum: { fontSize: 16, fontWeight: '600', color: '#8A6A50' },
  foodEmoji: { fontSize: 30 },
  foodNumBig: { fontSize: 26, fontWeight: '700', color: '#333' },
}));
