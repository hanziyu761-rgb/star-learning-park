/**
 * 朗读声音设置。
 * V2.16 起可挑选手机里的声音；V2.21 起只有星星宝童声；
 * V5.1 起完全不用手机自带语音（家长反馈不好听），所以“挑选手机声音”的功能和对应测试一并去掉，
 * 这里只测：童声、语速、试听走云端、开机动画开关、旧记录兼容。
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import React from 'react';
import { createEmptyProgress, parseProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { VoiceCheckCard } from '@/screens/VoiceCheckCard';
import { setCloudVoice } from '@/speech/speech';

// 不带预先录好的录音（录音播放见 clips.test.ts）：试听的句子都走云端童声
jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { f: {}, m: {}, c: {} } }));

afterEach(() => setCloudVoice(null));

describe('旧记录兼容', () => {
  it('旧数据没有声音设置：读入后是童声、慢一点', () => {
    const p = parseProgress(
      JSON.stringify({ ...createEmptyProgress(), settings: { grade: 2, aiEnabled: false, aiBaseUrl: '' } }),
    )!;
    expect(p.settings).toMatchObject({ grade: 2, voiceGender: 'child', speechRate: 'slow', voiceZh: '', voiceEn: '' });
  });
});

describe('声音设置卡片', () => {
  it('只有星星宝童声：不列手机里的声音；试听走云端童声；可调语速；开机动画可以关', async () => {
    await render(
      <ProgressProvider>
        <VoiceCheckCard />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('voice-check')).toBeTruthy());
    // 渲染之后再接上云端（ProgressProvider 会按设置重新接一次）
    const cloud = jest.fn(async () => 'https://oss.example/v.mp3');
    setCloudVoice(cloud);
    expect(screen.getByTestId('voice-gender-note')).toHaveTextContent(/星星宝童声（阿里云）.*没网时不出声/);
    expect(screen.queryByTestId('voice-list-zh-CN')).toBeNull();
    expect(screen.queryByTestId('voice-result')).toBeNull();
    expect(screen.queryByTestId('voice-tip')).toBeNull();
    // 试听：中文、英语都交给云端童声
    await fireEvent.press(screen.getByTestId('voice-test-zh'));
    expect(cloud).toHaveBeenLastCalledWith(expect.objectContaining({ text: '小朋友你好，我们一起来学习吧！', lang: 'zh-CN' }));
    await fireEvent.press(screen.getByTestId('voice-test-en'));
    expect(cloud).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'Hello! Let’s learn together.', lang: 'en-US' }));
    expect(Speech.speak).not.toHaveBeenCalled();
    // 语速
    await fireEvent.press(screen.getByTestId('voice-rate-normal'));
    await waitFor(() => expect(screen.getByTestId('voice-rate-normal').props.accessibilityState.selected).toBe(true));
    // 开机动画开关
    expect(screen.getByTestId('splash-switch').props.value).toBe(true);
    await fireEvent(screen.getByTestId('splash-switch'), 'valueChange', false);
    await waitFor(() => expect(screen.getByTestId('splash-switch').props.value).toBe(false));
  });
});
