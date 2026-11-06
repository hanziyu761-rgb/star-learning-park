/**
 * V2.17 说话提问：离线语音识别（安卓原生模块用测试替身代替，真机识别效果需在手机上验证）。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavProvider } from '@/nav/Nav';
import { createEmptyProgress, parseProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';
import { AiCard } from '@/screens/ParentSettings';
import TeacherScreen from '@/screens/TeacherScreen';
import { _setAsrForTest, fixAsrText, getAsr, type AsrNative } from '@/speech/asr';

jest.mock('@/components/Mascot', () => ({ Mascot: () => null }));
jest.mock('@/ai/client', () => {
  const actual = jest.requireActual('@/ai/client');
  return { ...actual, aiChat: jest.fn(async () => '三加四等于七，你真棒！') };
});
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { aiChat } = require('@/ai/client') as { aiChat: jest.Mock };

type Cb = (e: { text?: string; reason?: string; message?: string }) => void;
function fakeAsr(granted = true) {
  const listeners: Record<string, Cb[]> = {};
  const m = {
    isAvailable: () => true,
    getPermission: jest.fn(async () => ({ granted })),
    requestPermission: jest.fn(async () => ({ granted })),
    start: jest.fn(async () => undefined),
    stop: jest.fn(async () => undefined),
    cancel: jest.fn(async () => undefined),
    addListener: (ev: string, cb: Cb) => {
      (listeners[ev] ??= []).push(cb);
      return { remove: () => (listeners[ev] = listeners[ev].filter((x) => x !== cb)) };
    },
    emit: (ev: string, e: Parameters<Cb>[0]) => listeners[ev]?.forEach((cb) => cb(e)),
  };
  return m;
}

async function renderTeacher(settings: Partial<ReturnType<typeof createEmptyProgress>['settings']>) {
  const p = createEmptyProgress();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...p, settings: { ...p.settings, aiEnabled: true, aiBaseUrl: 'https://ai.example.com', ...settings } }),
  );
  await render(
    <SafeAreaProvider
      initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 820 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}
    >
      <ProgressProvider>
        <NavProvider nav={{ push: jest.fn(), back: jest.fn(), home: jest.fn() }}>
          <TeacherScreen />
        </NavProvider>
      </ProgressProvider>
    </SafeAreaProvider>,
  );
  await screen.findByTestId('teacher-screen');
}

afterEach(async () => {
  _setAsrForTest(undefined);
  aiChat.mockClear();
  await AsyncStorage.clear();
});

describe('识别结果纠错', () => {
  it('把数字中间、“等于”后面的同音字改回来（实测模型常见错误）', () => {
    expect(fixAsrText('三家四等于己')).toBe('三加四等于几');
    expect(fixAsrText('三价四等于级')).toBe('三加四等于几');
    expect(fixAsrText('八家七等于多少')).toBe('八加七等于多少');
    expect(fixAsrText('十检六是多少')).toBe('十减六是多少');
    expect(fixAsrText('3成4等于几')).toBe('3乘4等于几');
    expect(fixAsrText('九比五多级')).toBe('九比五多几');
    expect(fixAsrText('三甲四等于急')).toBe('三加四等于几');
    expect(fixAsrText('一个星期有己天')).toBe('一个星期有己天'); // 不紧挨标点或结尾，不乱改
    expect(fixAsrText('我家有三只猫')).toBe('我家有三只猫'); // “家”前后不是数字
    expect(fixAsrText('城市 里 有 什么')).toBe('城市里有什么');
  });
});

describe('说话提问', () => {
  it('网页版、测试环境没有原生识别模块：不显示话筒，也不显示家长开关', async () => {
    expect(getAsr()).toBeNull();
    await renderTeacher({ voiceInput: true });
    expect(screen.queryByTestId('voice-mic')).toBeNull();
  });

  it('旧数据读入时默认关闭说话提问', () => {
    const p = parseProgress(JSON.stringify({ ...createEmptyProgress(), settings: { grade: 1, aiEnabled: true, aiBaseUrl: '' } }))!;
    expect(p.settings.voiceInput).toBe(false);
  });

  it('家长没开：不显示话筒', async () => {
    _setAsrForTest(fakeAsr() as unknown as AsrNative);
    await renderTeacher({ voiceInput: false });
    expect(screen.queryByTestId('voice-mic')).toBeNull();
  });

  it('点话筒开始听，边说边出字；说完后纠正同音字并发给星星宝', async () => {
    const asr = fakeAsr();
    _setAsrForTest(asr as unknown as AsrNative);
    await renderTeacher({ voiceInput: true });
    await fireEvent.press(screen.getByTestId('voice-mic'));
    await waitFor(() => expect(asr.start).toHaveBeenCalledWith(15));
    expect(screen.getByTestId('voice-mic')).toHaveTextContent(/说完了/);
    await act(async () => asr.emit('onPartial', { text: '三家四' }));
    expect(screen.getByTestId('voice-partial')).toHaveTextContent('三加四');
    await act(async () => asr.emit('onFinal', { text: '三家四等于己', reason: 'speech-end' }));
    await waitFor(() => expect(aiChat).toHaveBeenCalled());
    expect(aiChat.mock.calls[0][1].messages).toEqual([{ role: 'user', content: '三加四等于几' }]);
    expect(await screen.findByText('三加四等于七，你真棒！')).toBeTruthy();
    expect(screen.getByTestId('voice-mic')).toHaveTextContent(/点我说话/);
  });

  it('没听清：提示再说一次，不发送', async () => {
    const asr = fakeAsr();
    _setAsrForTest(asr as unknown as AsrNative);
    await renderTeacher({ voiceInput: true });
    await fireEvent.press(screen.getByTestId('voice-mic'));
    await waitFor(() => expect(asr.start).toHaveBeenCalled());
    await act(async () => asr.emit('onFinal', { text: '', reason: 'no-speech' }));
    expect(screen.getByTestId('voice-problem')).toHaveTextContent(/没听清/);
    expect(aiChat).not.toHaveBeenCalled();
  });

  it('孩子点“说完了”就停止；没有麦克风权限时提示家长去设置', async () => {
    const asr = fakeAsr();
    _setAsrForTest(asr as unknown as AsrNative);
    await renderTeacher({ voiceInput: true });
    await fireEvent.press(screen.getByTestId('voice-mic'));
    await waitFor(() => expect(screen.getByTestId('voice-mic')).toHaveTextContent(/说完了/));
    await fireEvent.press(screen.getByTestId('voice-mic'));
    expect(asr.stop).toHaveBeenCalled();

    const denied = fakeAsr(false);
    _setAsrForTest(denied as unknown as AsrNative);
    screen.unmount();
    await renderTeacher({ voiceInput: true });
    await fireEvent.press(screen.getByTestId('voice-mic'));
    await waitFor(() => expect(screen.getByTestId('voice-problem')).toHaveTextContent(/允许麦克风/));
    expect(denied.start).not.toHaveBeenCalled();
  });

  it('家长中心：打开开关先申请麦克风权限，得到权限才保存', async () => {
    const denied = fakeAsr(false);
    _setAsrForTest(denied as unknown as AsrNative);
    await render(
      <ProgressProvider>
        <AiCard />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('voice-input-switch')).toBeTruthy());
    await fireEvent(screen.getByTestId('voice-input-switch'), 'valueChange', true);
    await waitFor(() => expect(denied.requestPermission).toHaveBeenCalled());
    expect(screen.getByTestId('voice-input-switch').props.value).toBe(false);
    expect(screen.getByTestId('voice-input-setting')).toHaveTextContent(/没有得到麦克风权限/);
    screen.unmount();

    _setAsrForTest(fakeAsr(true) as unknown as AsrNative);
    await render(
      <ProgressProvider>
        <AiCard />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('voice-input-switch')).toBeTruthy());
    await fireEvent(screen.getByTestId('voice-input-switch'), 'valueChange', true);
    await waitFor(() => expect(screen.getByTestId('voice-input-switch').props.value).toBe(true));
  });
});
