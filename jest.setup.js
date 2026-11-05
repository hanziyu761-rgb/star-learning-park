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
