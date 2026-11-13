/**
 * 开机动画（V2.21）：每次打开 APP 播放约 3 秒，点一下就能跳过；家长中心可以关掉。
 * 星星宝从天上落下弹一弹 → 数学、语文、英语三块彩色积木从两边飞进来 → “林亨学习乐园”一个字一个字跳出来，
 * 最后星星宝用童声说欢迎语（声音会接着在首页说完）。
 * 画面全部用原创图形和文字绘制，没有使用第三方图片。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pressable } from '@/components/Tappable';
import { GREETING } from '@/content/greeting';
import { speak } from '@/speech/speech';
import { Mascot } from './Mascot';
import { themed } from '@/theme';

export const SPLASH_MS = 3400;
const TITLE = [
  ['林', 'lín'],
  ['亨', 'hēng'],
  ['学', 'xué'],
  ['习', 'xí'],
  ['乐', 'lè'],
  ['园', 'yuán'],
] as const;
const TITLE_COLORS = ['#E8505B', '#F29F05', '#3BB273', '#4D9DE0', '#7A5AF8', '#E8772E'];
const BLOCKS = [
  { label: '1 2\n3 4', name: '数学', color: '#4D9DE0', from: -1 },
  { label: '文', name: '语文', color: '#E8505B', from: 0 },
  { label: 'abc', name: '英语', color: '#3BB273', from: 1 },
] as const;
const CONFETTI = ['#E8505B', '#F29F05', '#3BB273', '#4D9DE0', '#7A5AF8', '#FFD43B'];

export function SplashIntro({ onDone, voice = true }: { onDone: () => void; voice?: boolean }) {
  const { width, height } = useWindowDimensions();
  const big = Math.min(width, height) >= 600;
  const k = big ? 1.4 : 1;
  const star = useState(() => new Animated.Value(0))[0];
  const blocks = useState(() => BLOCKS.map(() => new Animated.Value(0)))[0];
  const letters = useState(() => TITLE.map(() => new Animated.Value(0)))[0];
  const sub = useState(() => new Animated.Value(0))[0];
  const rays = useState(() => new Animated.Value(0))[0];
  const fall = useState(() => new Animated.Value(0))[0];
  const fade = useState(() => new Animated.Value(1))[0];
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  // 彩纸的位置每次打开随机一次
  const [confetti] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      x: Math.random(),
      delay: Math.random() * 0.5,
      size: 8 + Math.random() * 10,
      color: CONFETTI[i % CONFETTI.length],
      round: i % 3 !== 0,
    })),
  );

  const finish = useMemo(
    () => () => {
      if (done.current) return;
      done.current = true;
      setLeaving(true);
      Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => onDone());
    },
    [fade, onDone],
  );

  useEffect(() => {
    const spring = (v: Animated.Value) => Animated.spring(v, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true });
    const at = (ms: number, a: Animated.CompositeAnimation) => Animated.sequence([Animated.delay(ms), a]);
    Animated.loop(Animated.timing(rays, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.timing(fall, { toValue: 1, duration: 2600, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
    // 时间线：0.0 秒星星落下 → 0.35 秒三块积木 → 0.75 秒六个字依次跳出（约 1.5 秒全部出齐）→ 1.6 秒小标题
    Animated.parallel([
      spring(star),
      ...blocks.map((v, i) => at(350 + i * 120, spring(v))),
      ...letters.map((v, i) => at(750 + i * 90, spring(v))),
      at(1600, Animated.timing(sub, { toValue: 1, duration: 300, useNativeDriver: true })),
    ]).start();
    const talk = setTimeout(() => {
      if (voice) speak(GREETING);
    }, 1500);
    const end = setTimeout(finish, SPLASH_MS);
    return () => {
      clearTimeout(talk);
      clearTimeout(end);
    };
  }, [blocks, fall, finish, letters, rays, star, sub, voice]);

  const spin = rays.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rayLen = Math.max(width, height);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]} testID="splash" pointerEvents={leaving ? 'none' : 'auto'}>
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityRole="button" accessibilityLabel="跳过开机动画" testID="splash-skip">
        {/* 背景：慢慢转动的阳光 */}
        <View style={styles.center} pointerEvents="none">
          <Animated.View style={{ width: rayLen * 1.6, height: rayLen * 1.6, transform: [{ rotate: spin }] }}>
            {Array.from({ length: 12 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.ray,
                  { height: rayLen * 1.6, left: rayLen * 0.8 - 30, transform: [{ rotate: `${i * 15}deg` }] },
                ]}
              />
            ))}
          </Animated.View>
        </View>

        {/* 彩纸 */}
        {confetti.map((c, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: c.x * width,
              top: -20,
              width: c.size,
              height: c.round ? c.size : c.size * 0.5,
              borderRadius: c.round ? c.size : 2,
              backgroundColor: c.color,
              opacity: 0.85,
              transform: [
                {
                  translateY: fall.interpolate({
                    inputRange: [0, c.delay, 1],
                    outputRange: [0, 0, height * (0.7 + c.delay * 0.5)],
                  }),
                },
                { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 540}deg`] }) },
              ],
            }}
          />
        ))}

        <View style={[styles.center, { gap: 18 * k }]} pointerEvents="none">
          {/* 星星宝落下来 */}
          <Animated.View
            style={{
              transform: [
                { translateY: star.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.6, 0] }) },
                { scale: star.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 1.1, 1] }) },
              ],
            }}
          >
            <Mascot size={150 * k} mood="cheer" />
          </Animated.View>

          {/* 三科积木 */}
          <View style={styles.blocks}>
            {BLOCKS.map((b, i) => (
              <Animated.View
                key={b.name}
                style={[
                  styles.block,
                  { backgroundColor: b.color, width: 84 * k, height: 84 * k, borderRadius: 22 * k },
                  {
                    opacity: blocks[i],
                    transform: [
                      { translateX: blocks[i].interpolate({ inputRange: [0, 1], outputRange: [b.from * width * 0.7, 0] }) },
                      { translateY: blocks[i].interpolate({ inputRange: [0, 1], outputRange: [b.from === 0 ? height * 0.4 : 0, 0] }) },
                      { rotate: blocks[i].interpolate({ inputRange: [0, 1], outputRange: [`${b.from * 40 - 20}deg`, `${(i - 1) * 6}deg`] }) },
                    ],
                  },
                ]}
              >
                <Text style={[styles.blockLabel, { fontSize: (b.label.length > 2 ? 22 : 34) * k, lineHeight: (b.label.length > 2 ? 24 : 40) * k }]}>
                  {b.label}
                </Text>
                <Text style={[styles.blockName, { fontSize: 12 * k }]}>{b.name}</Text>
              </Animated.View>
            ))}
          </View>

          {/* 林亨学习乐园 */}
          <View style={styles.title} testID="splash-title">
            {TITLE.map(([c, py], i) => (
              <Animated.View
                key={c}
                style={[
                  styles.letter,
                  {
                    opacity: letters[i],
                    transform: [
                      { scale: letters[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                      { translateY: letters[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                    ],
                  },
                ]}
              >
                <Text style={[styles.py, { fontSize: 13 * k }]}>{py}</Text>
                <Text style={[styles.char, { color: TITLE_COLORS[i], fontSize: 44 * k, lineHeight: 54 * k }]}>{c}</Text>
              </Animated.View>
            ))}
          </View>
          <Animated.Text style={[styles.sub, { opacity: sub, fontSize: 15 * k }]}>数学 · 语文 · 英语　边玩边学</Animated.Text>
        </View>
        <Text style={styles.skip}>点一下跳过</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { backgroundColor: '#FFF7E0', zIndex: 1000, elevation: 1000, overflow: 'hidden' },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ray: { position: 'absolute', top: 0, width: 60, backgroundColor: '#FFE9A8', opacity: 0.55 },
  blocks: { flexDirection: 'row', gap: 14 },
  block: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  blockLabel: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  blockName: { color: '#fff', fontWeight: '600', opacity: 0.95 },
  title: { flexDirection: 'row', gap: 2 },
  letter: { alignItems: 'center' },
  py: { color: '#8A6A50', fontWeight: '700' },
  char: { fontWeight: '700', textShadowColor: '#fff', textShadowRadius: 6 },
  sub: { color: '#8A6A50', fontWeight: '600', letterSpacing: 2 },
  skip: { position: 'absolute', bottom: 36, alignSelf: 'center', color: '#B39A80', fontSize: 13, fontWeight: '700' },
}));
