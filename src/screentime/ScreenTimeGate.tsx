/**
 * 护眼与学习时长（V5.4）：APP 在前台时计时；该休息或今天用满时盖住页面。
 * 家长做一道乘法题验证后，可以跳过这次休息、再学 15 分钟或今天不限。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { ParentGate } from '@/components/ParentGate';
import { PinyinText } from '@/components/PinyinText';
import { Pressable } from '@/components/Tappable';
import { zh } from '@/content/zh';
import { keyFor } from '@/progress/profiles';
import { useProgress } from '@/progress/ProgressContext';
import { colors, font, radius, space, themed } from '@/theme';
import {
  EXTEND_MIN,
  extend,
  parseScreenTime,
  SCREEN_STORAGE_KEY,
  skipRest,
  status,
  tick,
  unlimitedToday,
  type ScreenTime,
} from './model';

const TICK_MS = 5000;

export function ScreenTimeGate() {
  const { status: loadStatus, state, profiles } = useProgress();
  // 每个孩子单独计时（V5.4 多个孩子）
  const storeKey = keyFor(SCREEN_STORAGE_KEY, profiles.active);
  const limits = { dailyMinutes: state.settings.dailyMinutes ?? 0, breakMinutes: state.settings.breakMinutes ?? 20 };
  const limitsRef = useRef(limits);
  useEffect(() => {
    limitsRef.current = limits;
  });
  const [st, setSt] = useState<ScreenTime | null>(null);
  const stRef = useRef<ScreenTime | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const save = useCallback(
    (s: ScreenTime) => {
      stRef.current = s;
      setSt(s);
      AsyncStorage.setItem(storeKey, JSON.stringify(s)).catch(() => undefined);
    },
    [storeKey],
  );

  useEffect(() => {
    let cancelled = false;
    stRef.current = null;
    AsyncStorage.getItem(storeKey)
      .catch(() => null)
      .then((raw) => {
        if (!cancelled) save(parseScreenTime(raw, Date.now()));
      });
    return () => {
      cancelled = true;
    };
  }, [save, storeKey]);

  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (stRef.current && AppState.currentState !== 'background' && AppState.currentState !== 'inactive')
        save(tick(stRef.current, n, limitsRef.current));
    }, TICK_MS);
    return () => clearInterval(t);
  }, [save]);

  if (loadStatus !== 'ready' || !st) return null;
  const s = status(st, now, limits);
  if (s.kind === 'ok') return null;

  const mm = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  return (
    <View style={styles.mask} testID={`screen-${s.kind}`}>
      <View style={styles.card}>
        <>
          <Text style={styles.emoji}>{s.kind === 'rest' ? '👀' : '🌙'}</Text>
          {s.kind === 'rest' ? (
            <>
              <PinyinText text={zh('该休息啦', 'gāi xiū xi la')} size={font.childLarge} />
              <PinyinText text={zh('看看远处的树', 'kàn kan yuǎn chù de shù')} size={font.child} />
              <Text style={styles.timer} testID="screen-rest-left">
                {mm(s.leftSec)}
              </Text>
            </>
          ) : (
            <>
              <PinyinText text={zh('今天学够了', 'jīn tiān xué gòu le')} size={font.childLarge} />
              <PinyinText text={zh('明天再来', 'míng tiān zài lái')} size={font.child} />
              <Text
                style={styles.parentText}
              >{`今天已经学了 ${s.usedMin} 分钟（家长设的是每天 ${s.limitMin} 分钟）。`}</Text>
            </>
          )}
          <ParentActions kind={s.kind} st={st} now={now} save={save} limits={limits} />
        </>
      </View>
    </View>
  );
}

/** 家长操作：先验证，再选 */
function ParentActions({
  kind,
  st,
  now,
  save,
  limits,
}: {
  kind: 'rest' | 'limit';
  st: ScreenTime;
  now: number;
  save: (s: ScreenTime) => void;
  limits: { dailyMinutes: number; breakMinutes: number };
}) {
  const [step, setStep] = useState<'closed' | 'gate' | 'open'>('closed');
  if (step === 'gate')
    return (
      <View style={{ alignSelf: 'stretch' }}>
        <ParentGate onPass={() => setStep('open')} />
        <Pressable
          onPress={() => setStep('closed')}
          style={styles.link}
          accessibilityRole="button"
          testID="screen-parent-cancel"
        >
          <Text style={styles.linkText}>取消</Text>
        </Pressable>
      </View>
    );
  if (step === 'open')
    return (
      <View style={styles.actions} testID="screen-parent-actions">
        {kind === 'rest' ? (
          <Btn text="跳过这次休息" onPress={() => save(skipRest(st))} testID="screen-skip-rest" />
        ) : (
          <>
            <Btn
              text={`再学 ${EXTEND_MIN} 分钟`}
              onPress={() => save(extend(st, now, limits))}
              testID="screen-extend"
            />
            <Btn text="今天不限" alt onPress={() => save(unlimitedToday(st, now))} testID="screen-unlimited" />
          </>
        )}
        <Text style={styles.small}>每天时长和休息提醒可以在 家长中心 → 设置 → 护眼与学习时长 里改。</Text>
      </View>
    );
  return (
    <Pressable onPress={() => setStep('gate')} style={styles.link} accessibilityRole="button" testID="screen-parent">
      <Text style={styles.linkText}>家长</Text>
    </Pressable>
  );
}

function Btn({ text, onPress, alt, testID }: { text: string; onPress: () => void; alt?: boolean; testID: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, alt && styles.btnAlt]} accessibilityRole="button" testID={testID}>
      <Text style={[styles.btnText, alt && { color: colors.parent }]}>{text}</Text>
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    mask: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.bgSky,
      justifyContent: 'center',
      alignItems: 'center',
      padding: space.lg,
    },
    card: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: space.xl,
      alignItems: 'center',
      gap: space.md,
    },
    emoji: { fontSize: 64, color: colors.text },
    timer: { fontSize: 48, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
    parentText: { fontSize: 15, color: colors.textSoft, textAlign: 'center' },
    actions: { alignSelf: 'stretch', gap: space.sm },
    btn: {
      minHeight: 48,
      borderRadius: radius.md,
      backgroundColor: colors.parent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnAlt: { backgroundColor: colors.parentSoft },
    btnText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
    link: { paddingVertical: space.sm, paddingHorizontal: space.xl, alignSelf: 'center' },
    linkText: { color: colors.textSoft, fontSize: 16 },
    small: { fontSize: 13, color: colors.textSoft, textAlign: 'center' },
  }),
);
