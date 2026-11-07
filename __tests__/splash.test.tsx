/**
 * V2.21 开机动画：每次打开只放一次，可以跳过，家长可以关掉。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SplashGate } from '@/components/SplashGate';
import { ProgressProvider } from '@/progress/ProgressContext';

jest.mock('@/components/Mascot', () => ({ Mascot: () => null }));

describe('开机动画', () => {
  afterEach(() => AsyncStorage.clear());
  it('打开时播放，点一下跳过；之后不再出现', async () => {
    const r = await render(
      <ProgressProvider>
        <SplashGate />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('splash-title')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('splash-skip'));
    await waitFor(() => expect(screen.queryByTestId('splash')).toBeNull());
    r.unmount();
    // 同一次打开里再进来：不再播放
    await render(
      <ProgressProvider>
        <SplashGate />
      </ProgressProvider>,
    );
    await act(async () => {
      await new Promise((res) => setTimeout(res, 50));
    });
    expect(screen.queryByTestId('splash')).toBeNull();
    expect(screen.queryByTestId('splash-cover')).toBeNull();
  });
});
