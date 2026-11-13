/* global jest */
// 本地存储：使用官方提供的内存模拟，测试中可以模拟“重启 APP 后重新读取”
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// 语音：测试环境没有发音引擎，记录调用即可
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('expo-audio', () => {
  const players = [];
  const createAudioPlayer = jest.fn((src) => {
    const listeners = [];
    const p = {
      src,
      play: jest.fn(),
      pause: jest.fn(),
      remove: jest.fn(),
      setPlaybackRate: jest.fn(),
      addListener: jest.fn((ev, fn) => listeners.push(fn)),
      finish: () => listeners.forEach((fn) => fn({ didJustFinish: true })),
    };
    players.push(p);
    return p;
  });
  return { createAudioPlayer, __players: players };
});

// 动画（V5.0 起按钮都带弹簧动画）：测试环境没有原生动画引擎（官方测试替身在这里也加载不了），
// 用自写的替身 jest/reanimatedMock.js，动画直接跳到结果，只验证界面和逻辑；真实动画在网页端到端测试和真机上看
jest.mock('react-native-reanimated', () => require('./jest/reanimatedMock'));
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View, BlurTargetView: View };
});
