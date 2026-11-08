/**
 * 拍照错题页面（V4.1）：家长验证后，选照片 → 识别 → 核对 → 出同类题 → 保存 → 打印。
 * 照片选择和 AI 服务在测试里用模拟函数代替（真实识别需要阿里云百炼，见 docs）。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { markParentUnlocked } from '@/components/ParentGate';
import { createEmptyProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';
import { NavProvider } from '@/nav/Nav';
import PhotoMistakeScreen from '@/screens/PhotoMistakeScreen';

jest.mock('@/components/Mascot', () => ({ Mascot: () => null }));
jest.mock('@/photo/image', () => ({ pickPhoto: jest.fn(async () => ({ ok: true, dataUrl: 'data:image/jpeg;base64,AAAA' })) }));
jest.mock('@/exam/print', () => ({ printHtml: jest.fn(async () => undefined) }));
jest.mock('@/ai/client', () => {
  const actual = jest.requireActual('@/ai/client');
  return { ...actual, aiPhotoAnalyze: jest.fn(), aiPhotoSimilar: jest.fn() };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const client = require('@/ai/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { printHtml } = require('@/exam/print');

async function mount(grade = 1) {
  const s = createEmptyProgress();
  s.settings = { ...s.settings, grade, aiEnabled: true, aiBaseUrl: 'https://ai.example.com' };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  markParentUnlocked();
  const push = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 820 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProgressProvider>
        <NavProvider nav={{ push, back: jest.fn(), home: jest.fn() }}>
          <PhotoMistakeScreen />
        </NavProvider>
      </ProgressProvider>
    </SafeAreaProvider>,
  );
  return push;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

it('数学：识别 → 核对 → 原创程序出 5 道同类题 → 保存 → 打印 → 去练习', async () => {
  client.aiPhotoAnalyze.mockResolvedValue({ subject: 'math', question: '3 + 4 =', childAnswer: '8', correctAnswer: '7', kpId: 'm1.add10', reason: '多数了一个' });
  const push = await mount(1);
  await fireEvent.press(await screen.findByTestId('photo-library'));
  expect(await screen.findByTestId('photo-question')).toBeTruthy();
  const req = client.aiPhotoAnalyze.mock.calls[0][1];
  expect(req.image).toBe('data:image/jpeg;base64,AAAA');
  expect(req.candidates.some((c: { id: string }) => c.id === 'm1.add10')).toBe(true);
  await fireEvent.press(screen.getByTestId('photo-generate'));
  expect((await screen.findAllByTestId('photo-item')).length).toBeGreaterThanOrEqual(1);
  expect(client.aiPhotoSimilar).not.toHaveBeenCalled(); // 数学不用 AI 出题
  await fireEvent.press(screen.getByTestId('photo-save'));
  expect(await screen.findByTestId('photo-detail-question')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('photo-print'));
  await waitFor(() => expect(printHtml).toHaveBeenCalled());
  expect(printHtml.mock.calls[0][0]).toContain('3 + 4 =');
  await fireEvent.press(screen.getByTestId('photo-practice'));
  expect(push).toHaveBeenCalledWith({ name: 'practice', id: 'kp:m1.add10' });
  await waitFor(async () => {
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!);
    expect(saved.photoMistakes).toHaveLength(1);
    expect(JSON.stringify(saved)).not.toContain('base64'); // 照片不保存
  });
});

it('英语：AI 出的同类题标注“AI 生成，未经人工审核”', async () => {
  client.aiPhotoAnalyze.mockResolvedValue({ subject: 'english', question: 'What colour is it?', childAnswer: 'red', correctAnswer: 'blue', kpId: '', reason: '' });
  client.aiPhotoSimilar.mockResolvedValue([{ question: 'The sky is ___.', options: ['red', 'blue', 'green'], answer: 'blue', explain: '天空是蓝色' }]);
  await mount(3);
  await fireEvent.press(await screen.findByTestId('photo-hint-english'));
  await fireEvent.press(screen.getByTestId('photo-library'));
  await fireEvent.press(await screen.findByTestId('photo-generate'));
  expect(await screen.findByTestId('photo-ai-label')).toBeTruthy();
  expect(screen.getByText('The sky is ___.')).toBeTruthy();
  expect(client.aiPhotoSimilar.mock.calls[0][1]).toMatchObject({ subject: 'english', grade: 3, count: 5 });
});

it('识别失败时显示原因，回到首页', async () => {
  client.aiPhotoAnalyze.mockRejectedValue(new client.AiError('SERVER', '星星宝老师暂时休息了', '403 AccessDenied'));
  await mount(1);
  await fireEvent.press(await screen.findByTestId('photo-library'));
  expect(await screen.findByText(/识别没有成功.*403 AccessDenied/)).toBeTruthy();
  expect(screen.getByTestId('photo-library')).toBeTruthy();
});
