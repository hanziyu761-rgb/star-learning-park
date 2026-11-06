/**
 * V2.18 星星宝的云端自然语音（阿里云百炼 CosyVoice，经自家 AI 服务）：
 * 只用于 AI 当场生成的话；跟着家长设置的女声 / 男声 / 童声；没开、没网、出错时改用手机语音。
 * 真实合成效果需要在服务端配置百炼密钥后用手机实测。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, waitFor } from '@testing-library/react-native';
import * as Audio from 'expo-audio';
import * as Speech from 'expo-speech';
import React from 'react';
import { AI_VOICE, aiTts } from '@/ai/client';
import { createEmptyProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';
import { hasCloudVoice, setCloudVoice, speak } from '@/speech/speech';

jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { f: {}, m: {}, c: {} } }));

const players = (Audio as unknown as { __players: { src: unknown; play: jest.Mock }[] }).__players;
const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(async () => {
  setCloudVoice(null);
  (global as { fetch?: unknown }).fetch = undefined;
  await AsyncStorage.clear();
});

describe('朗读走云端语音', () => {
  it('AI 的话（cloud）用云端音频播放；课程里的固定内容不走云端', async () => {
    const fetcher = jest.fn(async () => 'https://oss.example/a.mp3');
    setCloudVoice(fetcher);
    const before = players.length;
    speak({ text: '三加四等于七', lang: 'zh-CN', cloud: true });
    await flush();
    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ text: '三加四等于七' }));
    expect(players[players.length - 1].src).toEqual({ uri: 'https://oss.example/a.mp3' });
    expect(players.length).toBe(before + 1);
    (Speech.speak as jest.Mock).mockClear();
    speak({ text: '课程里的话', lang: 'zh-CN' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(Speech.speak).toHaveBeenCalledWith('课程里的话', expect.anything());
  });

  it('云端出错：改用手机语音；没开启：直接用手机语音', async () => {
    setCloudVoice(async () => {
      throw new Error('net');
    });
    (Speech.speak as jest.Mock).mockClear();
    speak({ text: '你真棒', lang: 'zh-CN', cloud: true });
    await flush();
    expect(Speech.speak).toHaveBeenCalledWith('你真棒', expect.anything());
    setCloudVoice(null);
    (Speech.speak as jest.Mock).mockClear();
    speak({ text: '再想想', lang: 'zh-CN', cloud: true });
    expect(Speech.speak).toHaveBeenCalledWith('再想想', expect.anything());
  });

  it('请求服务端 /api/tts：带音色和语速；同一句话不重复请求', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, json: async () => ({ ok: true, url: 'https://oss.example/b.mp3' }) }));
    (global as { fetch?: unknown }).fetch = fetchMock;
    const cfg = { enabled: true, baseUrl: 'https://ai.example.com' };
    expect(await aiTts(cfg, '你好呀', AI_VOICE.child, 'slow')).toBe('https://oss.example/b.mp3');
    expect(await aiTts(cfg, '你好呀', AI_VOICE.child, 'slow')).toBe('https://oss.example/b.mp3');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    expect(url).toBe('https://ai.example.com/api/tts');
    expect(JSON.parse(init.body)).toEqual({ text: '你好呀', voice: 'longhuhu_v3', rate: 'slow' });
  });
});

describe('跟着家长设置', () => {
  async function mount(settings: Record<string, unknown>) {
    const p = createEmptyProgress();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, settings: { ...p.settings, ...settings } }));
    const r = await render(<ProgressProvider>{null}</ProgressProvider>);
    await flush();
    return r;
  }
  it('开启 AI 老师并填了地址：启用云端语音；关掉“自然语音”或 AI 老师：不启用', async () => {
    await mount({ aiEnabled: true, aiBaseUrl: 'https://ai.example.com', voiceGender: 'male' });
    await waitFor(() => expect(hasCloudVoice()).toBe(true));
    const r2 = await mount({ aiEnabled: true, aiBaseUrl: 'https://ai.example.com', aiCloudVoice: false });
    await waitFor(() => expect(hasCloudVoice()).toBe(false));
    r2.unmount();
    await mount({ aiEnabled: false, aiBaseUrl: 'https://ai.example.com' });
    await waitFor(() => expect(hasCloudVoice()).toBe(false));
  });
});
