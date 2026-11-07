/**
 * V2.16 朗读声音：女声 / 男声、语速、挑选手机里的声音。
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import React from 'react';
import { createEmptyProgress, parseProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { VoiceCheckCard } from '@/screens/VoiceCheckCard';
import {
  guessGender,
  listVoices,
  pickVoice,
  pitchFor,
  setVoicePrefs,
  speak,
  speechOptions,
  type VoicePrefs,
} from '@/speech/speech';

// 这里测手机语音：不带预先录好的录音（录音播放见 clips.test.ts）
jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { f: {}, m: {}, c: {} } }));

const RAW = [
  { identifier: 'cmn-cn-x-ccc-local', name: 'cmn-cn-x-ccc-local', language: 'cmn-CN' },
  { identifier: 'cmn-cn-x-ccd-network', name: 'cmn-cn-x-ccd-network', language: 'cmn-CN' },
  { identifier: 'zh-CN-SMTm00', name: 'zh-CN-SMTm00', language: 'zh-CN' },
  { identifier: 'en-us-x-iom-local', name: 'en-us-x-iom-local', language: 'en-US' },
  { identifier: 'en-us-x-tpf-local', name: 'en-us-x-tpf-local', language: 'en-US' },
  { identifier: 'yue-hk-x-jar-local', name: 'yue-hk-x-jar-local', language: 'yue-HK' },
  { identifier: 'fr-fr-x-abc', name: 'fr', language: 'fr-FR' },
];

describe('声音挑选', () => {
  it('按名字推测男声女声（三星 SMTf/SMTm、谷歌声音代号），推测不出为未知', () => {
    expect(guessGender({ identifier: 'zh-CN-SMTf00' })).toBe('female');
    expect(guessGender({ identifier: 'zh-CN-SMTm00' })).toBe('male');
    expect(guessGender({ identifier: 'cmn-cn-x-ccc-local' })).toBe('female');
    expect(guessGender({ identifier: 'en-us-x-iom-local' })).toBe('male');
    expect(guessGender({ name: 'Google 普通话（中国大陆）' })).toBe('unknown');
    expect(guessGender({ name: 'Microsoft Female Voice' })).toBe('female');
  });

  it('只列普通话和英语（不列粤语、其他语言），离线声音排前面', () => {
    const v = listVoices(RAW);
    expect(v.map((x) => x.id)).toEqual([
      'cmn-cn-x-ccc-local',
      'zh-CN-SMTm00',
      'en-us-x-iom-local',
      'en-us-x-tpf-local',
      'cmn-cn-x-ccd-network',
    ]);
    expect(v.find((x) => x.id === 'cmn-cn-x-ccd-network')?.network).toBe(true);
    expect(pickVoice(v, 'zh-CN', 'male')).toBe('zh-CN-SMTm00');
    expect(pickVoice(v, 'en-US', 'female')).toBe('en-us-x-tpf-local');
    expect(pickVoice([], 'zh-CN', 'male')).toBe('');
  });

  it('语速：慢一点比正常慢；女声音调稍亮；没有男声音色时用低音调模拟', () => {
    const base: VoicePrefs = { gender: 'female', zh: '', en: '', rate: 'slow' };
    const slow = speechOptions({ text: '你好', lang: 'zh-CN' }, base);
    const normal = speechOptions({ text: '你好', lang: 'zh-CN' }, { ...base, rate: 'normal' });
    expect(slow.rate).toBeLessThan(normal.rate);
    expect(pitchFor(base, 'zh-CN')).toBeGreaterThan(1);
    expect(pitchFor({ ...base, gender: 'male' }, 'zh-CN')).toBeLessThan(1);
    expect(pitchFor({ ...base, gender: 'male', zh: 'zh-CN-SMTm00' }, 'zh-CN')).toBe(1);
    expect(speechOptions({ text: 'hi', lang: 'en-US' }, { ...base, en: 'en-us-x-tpf-local' })).toMatchObject({
      voice: 'en-us-x-tpf-local',
      language: 'en-US',
    });
    expect('voice' in slow).toBe(false);
  });

  it('朗读时用家长选的声音', () => {
    setVoicePrefs({ gender: 'male', zh: 'zh-CN-SMTm00', en: '', rate: 'normal' });
    speak({ text: '你好', lang: 'zh-CN' });
    expect(Speech.speak).toHaveBeenLastCalledWith('你好', expect.objectContaining({ voice: 'zh-CN-SMTm00', pitch: 1 }));
    setVoicePrefs({ gender: 'female', zh: '', en: '', rate: 'slow' });
  });

  it('旧数据没有声音设置：读入后是童声（V2.21 起只有童声）、慢一点', () => {
    const p = parseProgress(
      JSON.stringify({ ...createEmptyProgress(), settings: { grade: 2, aiEnabled: false, aiBaseUrl: '' } }),
    )!;
    expect(p.settings).toMatchObject({ grade: 2, voiceGender: 'child', speechRate: 'slow', voiceZh: '', voiceEn: '' });
  });
});

describe('声音设置卡片', () => {
  it('只有童声（没有男女声选项）；可试听童声；没网时的备用手机声音可试听、可指定；开机动画可以关', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue(RAW);
    await render(
      <ProgressProvider>
        <VoiceCheckCard />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('voice-list-zh-CN')).toBeTruthy());
    expect(screen.queryByTestId('voice-gender-female')).toBeNull();
    expect(screen.queryByTestId('voice-gender-male')).toBeNull();
    expect(screen.getByTestId('voice-gender-note')).toHaveTextContent(/星星宝童声/);
    // 试听童声（没有录音、没开联网童声的测试环境里用手机语音）
    await fireEvent.press(screen.getByTestId('voice-test-zh'));
    expect(Speech.speak).toHaveBeenLastCalledWith('小朋友你好，我们一起来学习吧！', expect.objectContaining({ language: 'zh-CN' }));
    // 开机动画开关
    expect(screen.getByTestId('splash-switch').props.value).toBe(true);
    await fireEvent(screen.getByTestId('splash-switch'), 'valueChange', false);
    await waitFor(() => expect(screen.getByTestId('splash-switch').props.value).toBe(false));
    // 试听第 1 个英语声音
    await fireEvent.press(screen.getByTestId('voice-try-en-US-0'));
    expect(Speech.speak).toHaveBeenLastCalledWith(
      'Hello! Let’s learn together.',
      expect.objectContaining({ voice: 'en-us-x-iom-local' }),
    );
    // 指定第 2 个英语声音
    await fireEvent.press(screen.getByTestId('voice-use-en-US-1'));
    await waitFor(() => expect(screen.getByTestId('voice-item-en-US-1')).toHaveTextContent(/正在用/));
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([]);
  });
});
