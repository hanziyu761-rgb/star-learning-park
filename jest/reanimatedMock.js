/* global module, require */
/**
 * 测试用的 react-native-reanimated 替身（V5.0）：
 * 官方 mock 在这个版本的 Jest 环境里无法加载，这里只提供 APP 用到的部分；动画直接跳到最终值。
 */
const React = require('react');
const RN = require('react-native');

const last = (...args) => args[args.length - 1];
const useSharedValue = (init) => {
  const ref = React.useRef(null);
  if (!ref.current) {
    const box = { value: init };
    box.get = () => box.value;
    box.set = (v) => {
      box.value = typeof v === 'function' ? v(box.value) : v;
    };
    ref.current = box;
  }
  return ref.current;
};

// 进场 / 退场动画：任意链式调用都返回自己
const builder = () => {
  const b = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? undefined : () => b), apply: () => b });
  return b;
};
const layout = {};
for (const name of [
  'FadeIn', 'FadeOut', 'FadeInDown', 'FadeInUp', 'FadeOutDown', 'FadeOutUp', 'ZoomIn', 'ZoomOut', 'SlideInRight',
  'SlideInLeft', 'SlideOutLeft', 'SlideOutRight', 'SlideInDown', 'SlideInUp', 'BounceIn', 'LinearTransition', 'Layout',
]) layout[name] = builder();

const strip = (Comp) =>
  React.forwardRef(function Animated({ entering, exiting, layout: _l, ...props }, ref) {
    return React.createElement(Comp, { ...props, ref });
  });

const Animated = {
  View: strip(RN.View),
  Text: strip(RN.Text),
  Image: strip(RN.Image),
  ScrollView: strip(RN.ScrollView),
  createAnimatedComponent: (C) => strip(C),
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  ...layout,
  useSharedValue,
  useAnimatedStyle: (fn) => fn(),
  useDerivedValue: (fn) => ({ value: fn(), get: fn }),
  useAnimatedProps: (fn) => fn(),
  useReducedMotion: () => false,
  isSharedValue: (v) => !!v && typeof v === 'object' && typeof v.get === 'function' && 'value' in v,
  useAnimatedRef: () => React.useRef(null),
  withSpring: (v) => v,
  withTiming: (v) => v,
  withDelay: (_d, v) => v,
  withRepeat: (v) => v,
  withSequence: last,
  cancelAnimation: () => undefined,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  interpolate: (x) => x,
  Easing: new Proxy({}, { get: () => () => (t) => t }),
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
};
