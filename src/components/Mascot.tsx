import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export type MascotMood = 'happy' | 'cheer' | 'think';

/**
 * 原创吉祥物“星星宝”：代码绘制的星星角色，不使用任何第三方形象。
 */
export function Mascot({ size = 96, mood = 'happy', bounce = true }: { size?: number; mood?: MascotMood; bounce?: boolean }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!bounce) return;
    y.value = withRepeat(withSequence(withTiming(-6, { duration: 700 }), withTiming(0, { duration: 700 })), -1);
  }, [bounce, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View style={style} accessibilityLabel="星星宝">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36 Z"
          fill="#FFC531"
          stroke="#F5A400"
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {/* 眼睛 */}
        {mood === 'think' ? (
          <>
            <Path d="M38 50 h8" stroke="#3A2E2A" strokeWidth={4} strokeLinecap="round" />
            <Path d="M56 50 h8" stroke="#3A2E2A" strokeWidth={4} strokeLinecap="round" />
          </>
        ) : (
          <>
            <Circle cx={42} cy={50} r={4.5} fill="#3A2E2A" />
            <Circle cx={60} cy={50} r={4.5} fill="#3A2E2A" />
            <Circle cx={43.5} cy={48.5} r={1.5} fill="#fff" />
            <Circle cx={61.5} cy={48.5} r={1.5} fill="#fff" />
          </>
        )}
        {/* 脸蛋 */}
        <Ellipse cx={35} cy={60} rx={5} ry={3} fill="#FF9A8B" opacity={0.8} />
        <Ellipse cx={67} cy={60} rx={5} ry={3} fill="#FF9A8B" opacity={0.8} />
        {/* 嘴巴 */}
        {mood === 'cheer' ? (
          <Path d="M43 60 Q51 72 59 60 Z" fill="#E8505B" stroke="#3A2E2A" strokeWidth={2.5} strokeLinejoin="round" />
        ) : mood === 'think' ? (
          <Path d="M46 63 Q51 60 56 63" stroke="#3A2E2A" strokeWidth={3} fill="none" strokeLinecap="round" />
        ) : (
          <Path d="M44 60 Q51 67 58 60" stroke="#3A2E2A" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
      </Svg>
    </Animated.View>
  );
}
