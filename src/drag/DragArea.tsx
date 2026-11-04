/**
 * 拖动系统：
 * - <DragArea> 管理一组“放置区”（篮子、配对目标等）。
 * - <DropZone> 注册一个放置区。
 * - <Draggable> 可拖动的物品；松手时根据手指位置判断落在哪个放置区。
 * 判断逻辑在 JS 中完成，放置区是否接收由业务组件决定（返回 true 表示接收）。
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { View, type HostInstance, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type Rect = { x: number; y: number; width: number; height: number };

/**
 * 拖动结束时，部分平台（如网页）还会对同一元素触发一次“点击”。
 * 点击处理函数先调用 justDragged()，刚拖动过就忽略这次点击，避免重复计数。
 */
let lastDragEndAt = 0;
export function justDragged(): boolean {
  return Date.now() - lastDragEndAt < 400;
}

interface DragAreaContextValue {
  register: (id: string, ref: React.RefObject<HostInstance | null>) => () => void;
  /** 返回落点所在的放置区 id（没有命中返回 null） */
  hitTest: (x: number, y: number) => Promise<string | null>;
}

const DragAreaContext = createContext<DragAreaContextValue | null>(null);

function measure(ref: React.RefObject<HostInstance | null>): Promise<Rect | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });
}

export function DragArea({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const zones = useRef(new Map<string, React.RefObject<HostInstance | null>>());

  const register = useCallback((id: string, ref: React.RefObject<HostInstance | null>) => {
    zones.current.set(id, ref);
    return () => {
      zones.current.delete(id);
    };
  }, []);

  const hitTest = useCallback(async (x: number, y: number) => {
    const SLOP = 16; // 放宽判定范围，方便小手操作
    const entries = [...zones.current.entries()];
    const rects = await Promise.all(entries.map(([, ref]) => measure(ref)));
    for (let i = 0; i < entries.length; i++) {
      const r = rects[i];
      if (
        r &&
        x >= r.x - SLOP &&
        x <= r.x + r.width + SLOP &&
        y >= r.y - SLOP &&
        y <= r.y + r.height + SLOP
      ) {
        return entries[i][0];
      }
    }
    return null;
  }, []);

  const value = useMemo(() => ({ register, hitTest }), [register, hitTest]);
  return (
    <DragAreaContext.Provider value={value}>
      <View style={style}>{children}</View>
    </DragAreaContext.Provider>
  );
}

export function DropZone({
  id,
  children,
  style,
  testID,
}: {
  id: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const ctx = useContext(DragAreaContext);
  const ref = useRef<HostInstance>(null);
  useEffect(() => ctx?.register(id, ref), [ctx, id]);
  return (
    <View ref={ref} style={style} collapsable={false} testID={testID}>
      {children}
    </View>
  );
}

interface DraggableProps {
  children: React.ReactNode;
  /** 松手时调用；返回 true 表示被放置区接收（物品消失或由父组件重新布局），false 弹回原位 */
  onDrop: (zoneId: string | null) => boolean;
  onDragStart?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Draggable({ children, onDrop, onDragStart, disabled, style, testID }: DraggableProps) {
  const ctx = useContext(DragAreaContext);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lifted = useSharedValue(0);
  // 始终使用最新的回调，避免手势回调拿到旧的状态
  const onDropRef = useRef(onDrop);
  const onDragStartRef = useRef(onDragStart);
  useEffect(() => {
    onDropRef.current = onDrop;
    onDragStartRef.current = onDragStart;
  });

  const handleEnd = useCallback(
    async (x: number, y: number) => {
      lastDragEndAt = Date.now();
      const zone = ctx ? await ctx.hitTest(x, y) : null;
      lastDragEndAt = Date.now();
      const accepted = onDropRef.current(zone);
      if (accepted) {
        tx.set(0);
        ty.set(0);
      } else {
        tx.set(withSpring(0));
        ty.set(withSpring(0));
      }
      lifted.set(withTiming(0, { duration: 120 }));
    },
    [ctx, tx, ty, lifted],
  );

  const handleStart = useCallback(() => {
    onDragStartRef.current?.();
  }, []);

  const pan = usePanGesture({
    enabled: !disabled,
    minDistance: 2,
    onActivate: () => {
      'worklet';
      lifted.set(withTiming(1, { duration: 120 }));
      scheduleOnRN(handleStart);
    },
    onUpdate: (e) => {
      'worklet';
      tx.set(e.translationX);
      ty.set(e.translationY);
    },
    onDeactivate: (e) => {
      'worklet';
      scheduleOnRN(handleEnd, e.absoluteX, e.absoluteY);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: 1 + lifted.value * 0.15 }],
    zIndex: lifted.value > 0 ? 100 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[style, animatedStyle]} testID={testID}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
