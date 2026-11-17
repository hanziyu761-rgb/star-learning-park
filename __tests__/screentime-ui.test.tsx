/** V5.4 护眼画面 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { createEmptyProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { emptyScreenTime, SCREEN_STORAGE_KEY } from '@/screentime/model';
import { ScreenTimeGate } from '@/screentime/ScreenTimeGate';

beforeEach(() => AsyncStorage.clear());

async function passGate() {
  await act(async () => {
    fireEvent.press(screen.getByTestId('screen-parent'));
  });
  await waitFor(() => expect(screen.getByTestId('gate-question')).toBeTruthy());
  const q = screen.getByTestId('gate-question').props.children as unknown[];
  for (const d of String(Number(q[0]) * Number(q[2])))
    await act(async () => {
      fireEvent.press(screen.getByTestId(`key-${d}`));
    });
  await act(async () => {
    fireEvent.press(screen.getByTestId('key-确定'));
  });
}

it('正在休息时盖住页面、显示倒计时；家长验证后可以跳过休息', async () => {
  const now = Date.now();
  await AsyncStorage.setItem(SCREEN_STORAGE_KEY, JSON.stringify({ ...emptyScreenTime(now), restUntil: now + 4 * 60 * 1000, lastTick: now }));
  render(
    <ProgressProvider>
      <ScreenTimeGate />
    </ProgressProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('screen-rest')).toBeTruthy());
  expect(String(screen.getByTestId('screen-rest-left').props.children)).toMatch(/^[34]:\d\d$/);
  await passGate();
  await act(async () => {
    fireEvent.press(screen.getByTestId('screen-skip-rest'));
  });
  expect(screen.queryByTestId('screen-rest')).toBeNull();
});

it('今天用满时显示“今天学够了”，家长可以再学 15 分钟', async () => {
  const now = Date.now();
  await AsyncStorage.setItem(SCREEN_STORAGE_KEY, JSON.stringify({ ...emptyScreenTime(now), usedSec: 40 * 60, lastTick: now }));
  const p = createEmptyProgress();
  p.settings.dailyMinutes = 40;
  await AsyncStorage.setItem('slp.progress.v1', JSON.stringify(p));
  render(
    <ProgressProvider>
      <ScreenTimeGate />
    </ProgressProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('screen-limit')).toBeTruthy());
  await passGate();
  await act(async () => {
    fireEvent.press(screen.getByTestId('screen-extend'));
  });
  expect(screen.queryByTestId('screen-limit')).toBeNull();
});
