/**
 * V5.1 家长中心简化 + 拼音开关 + 只用星星宝童声：
 * - 首页只有总览和一个短列表；学习报告、错题、设置各放一页，“返回”先回到首页
 * - “显示拼音”开关：关掉后全 APP 不标拼音；打开后初中也标；旧记录按“自动”
 * - 没网 / 没设置服务时不出声，屏幕上提示一句（同一种问题 30 秒内只提示一次）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PinyinText } from '@/components/PinyinText';
import { isPinyinOff, setPinyinOff } from '@/components/pinyinMode';
import { SPEECH_PROBLEM_TEXT, SpeechNotice } from '@/components/SpeechNotice';
import { zh } from '@/content/zh';
import { NavProvider } from '@/nav/Nav';
import { pinyinHidden } from '@/progress/grade';
import { createEmptyProgress, parseProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';
import ParentScreen from '@/screens/ParentScreen';
import { setCloudVoice, speak } from '@/speech/speech';

jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { f: {}, m: {}, c: {} } }));
// 手机里没有存过的朗读
jest.mock('@/speech/ttsCache', () => ({ cachedTts: () => null, saveTts: async () => undefined }));

afterEach(async () => {
  setPinyinOff(false);
  setCloudVoice(null);
  await AsyncStorage.clear();
});

const nav = { push: jest.fn(), back: jest.fn(), home: jest.fn() };
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 820 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const Safe = ({ children }: { children: React.ReactNode }) => <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
beforeEach(() => jest.clearAllMocks());

async function openParent(settings: Record<string, unknown> = {}) {
  const p = createEmptyProgress();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, settings: { ...p.settings, ...settings } }));
  await render(
    <Safe>
      <ProgressProvider>
        <NavProvider nav={nav}>
          <ParentScreen />
          <PinyinText text={zh('数学', 'shù xué')} />
        </NavProvider>
      </ProgressProvider>
    </Safe>,
  );
  await waitFor(() => expect(screen.getByTestId('gate-question')).toBeTruthy());
  const [a, b] = String(screen.getByTestId('gate-question').props.children)
    .match(/\d+/g)!
    .map(Number);
  for (const d of String(a * b)) await fireEvent.press(screen.getByTestId(`key-${d}`));
  await fireEvent.press(screen.getByTestId('key-确定'));
  await waitFor(() => expect(screen.getByTestId('parent-dashboard')).toBeTruthy());
}

describe('拼音设置', () => {
  it('自动：小学标、初中不标；家长选了就按家长的；旧记录按自动', () => {
    expect(pinyinHidden({ grade: 1, pinyin: 'auto' })).toBe(false);
    expect(pinyinHidden({ grade: 7, pinyin: 'auto' })).toBe(true);
    expect(pinyinHidden({ grade: 1, pinyin: 'off' })).toBe(true);
    expect(pinyinHidden({ grade: 8, pinyin: 'on' })).toBe(false);
    const old = createEmptyProgress() as unknown as { settings: Record<string, unknown> };
    delete old.settings.pinyin;
    expect(parseProgress(JSON.stringify(old))!.settings.pinyin).toBe('auto');
    old.settings.pinyin = 'sometimes';
    expect(parseProgress(JSON.stringify(old))!.settings.pinyin).toBe('auto');
    old.settings.pinyin = 'off';
    expect(parseProgress(JSON.stringify(old))!.settings.pinyin).toBe('off');
  });
});

describe('家长中心（简化后）', () => {
  it('首页只有总览和短列表；关掉“显示拼音”后全 APP 不标拼音，再打开恢复', async () => {
    await openParent();
    for (const id of ['m-stars', 'pc-report', 'pc-mistakes', 'exam-entry', 'photo-entry', 'parent-textbooks', 'pinyin-switch', 'pc-settings'])
      expect(screen.getByTestId(id)).toBeTruthy();
    // 详细内容不在首页
    expect(screen.queryByTestId('stats-math')).toBeNull();
    expect(screen.queryByTestId('grade-7')).toBeNull();
    expect(screen.queryByTestId('reset')).toBeNull();
    expect(screen.getByTestId('pc-settings')).toHaveTextContent(/一年级/);

    expect(screen.getByText('shù')).toBeTruthy();
    expect(screen.getByTestId('pinyin-switch').props.value).toBe(true);
    await fireEvent(screen.getByTestId('pinyin-switch'), 'valueChange', false);
    await waitFor(() => expect(isPinyinOff()).toBe(true));
    expect(screen.queryByText('shù')).toBeNull();
    expect(screen.getByText('数')).toBeTruthy();
    expect(screen.getByTestId('pinyin-switch').props.value).toBe(false);
    await fireEvent(screen.getByTestId('pinyin-switch'), 'valueChange', true);
    await waitFor(() => expect(screen.getByText('shù')).toBeTruthy());
  });

  it('初中默认不标拼音；家长打开后初中也标', async () => {
    await openParent({ grade: 8 });
    await waitFor(() => expect(isPinyinOff()).toBe(true));
    expect(screen.getByTestId('pinyin-switch').props.value).toBe(false);
    await fireEvent(screen.getByTestId('pinyin-switch'), 'valueChange', true);
    await waitFor(() => expect(isPinyinOff()).toBe(false));
    expect(screen.getByText('shù')).toBeTruthy();
  });

  it('学习报告、错题、设置各一页；“返回”先回到家长中心首页，再返回才离开', async () => {
    await openParent();
    await fireEvent.press(screen.getByTestId('pc-report'));
    await waitFor(() => expect(screen.getByTestId('parent-report')).toBeTruthy());
    for (const id of ['stats-math', 'stats-chinese', 'stats-english', 'knowledge-card', 'parent-track-talk', 'ai-report'])
      expect(screen.getByTestId(id)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('back'));
    await waitFor(() => expect(screen.getByTestId('parent-dashboard')).toBeTruthy());
    expect(nav.back).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('pc-mistakes'));
    await waitFor(() => expect(screen.getByTestId('parent-mistakes-math')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('parent-mistakes-math'));
    expect(nav.push).toHaveBeenLastCalledWith({ name: 'mistakes', subject: 'math' });
    await fireEvent.press(screen.getByTestId('back'));

    await fireEvent.press(screen.getByTestId('pc-settings'));
    await waitFor(() => expect(screen.getByTestId('parent-settings')).toBeTruthy());
    for (const id of ['grade-7', 'appearance', 'voice-check', 'ai-switch', 'ai-voice-try', 'reset'])
      expect(screen.getByTestId(id)).toBeTruthy();
    // 不再有“联网童声朗读”开关（一直用星星宝童声）
    expect(screen.queryByTestId('ai-voice-switch')).toBeNull();
    await fireEvent.press(screen.getByTestId('back'));
    await waitFor(() => expect(screen.getByTestId('parent-dashboard')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('back'));
    expect(nav.back).toHaveBeenCalledTimes(1);
  });

  it('首页入口：试卷、拍照错题、教材资源库', async () => {
    await openParent();
    await fireEvent.press(screen.getByTestId('exam-entry'));
    expect(nav.push).toHaveBeenLastCalledWith({ name: 'exam' });
    await fireEvent.press(screen.getByTestId('photo-entry'));
    expect(nav.push).toHaveBeenLastCalledWith({ name: 'photo' });
    await fireEvent.press(screen.getByTestId('parent-textbooks'));
    expect(nav.push).toHaveBeenLastCalledWith({ name: 'textbooks' });
  });
});

describe('读不出声音时的提示', () => {
  it('没设置服务、没网时各提示一句，3 秒后消失；30 秒内同一种问题不重复提示', async () => {
    await render(
      <Safe>
        <SpeechNotice />
      </Safe>,
    );
    await act(async () => speak({ text: '一道题', lang: 'zh-CN' }));
    expect(screen.getByTestId('speech-notice')).toHaveTextContent(SPEECH_PROBLEM_TEXT['no-service']);
    await waitFor(() => expect(screen.queryByTestId('speech-notice')).toBeNull(), { timeout: 4000 });
    await act(async () => speak({ text: '一道题', lang: 'zh-CN' }));
    expect(screen.queryByTestId('speech-notice')).toBeNull(); // 30 秒内不重复
    setCloudVoice(() => Promise.reject(new Error('net')));
    await act(async () => {
      speak({ text: '第二道题', lang: 'zh-CN' });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(screen.getByTestId('speech-notice')).toHaveTextContent(SPEECH_PROBLEM_TEXT.offline);
  }, 10000);
});
