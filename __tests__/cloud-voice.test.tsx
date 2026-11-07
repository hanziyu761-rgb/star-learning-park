/**
 * 云端童声（阿里云百炼 CosyVoice 龙呼呼，经自家 AI 服务）：
 * V2.18 只用于星星宝的话；V2.21 起所有没有预录的句子都用它，念过的存在手机里；没开、没网、出错时改用手机语音。
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

jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { c: { '548a266d': 99 } } }));
// 手机里的缓存：用内存代替文件
const mockSaved = new Map<string, string>();
jest.mock('@/speech/ttsCache', () => ({
  cachedTts: (id: string) => mockSaved.get(id) ?? null,
  saveTts: async (id: string, url: string) => {
    mockSaved.set(id, `file:///cache/tts/${id}.mp3#${url.length}`);
  },
}));

const players = (Audio as unknown as { __players: { src: unknown; play: jest.Mock }[] }).__players;
const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(async () => {
  setCloudVoice(null);
  (global as { fetch?: unknown }).fetch = undefined;
  await AsyncStorage.clear();
});

describe('朗读走云端语音', () => {
  it('预录过的句子放录音；没预录的随机题用云端童声，念过一次存进手机，下次不再请求', async () => {
    const fetcher = jest.fn(async () => 'https://oss.example/a.mp3');
    setCloudVoice(fetcher);
    // 预录过的（首页问候语）：放录音，不请求云端
    speak({ text: '你好，欢迎来到林亨学习乐园！今天想学什么？点一点下面的大按钮吧。', lang: 'zh-CN' });
    expect(players[players.length - 1].src).toBe(99);
    expect(fetcher).not.toHaveBeenCalled();
    // 随机出的题：云端童声
    speak({ text: '三加四等于几？', lang: 'zh-CN' });
    await flush();
    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ text: '三加四等于几？' }));
    expect(players[players.length - 1].src).toEqual({ uri: 'https://oss.example/a.mp3' });
    await flush();
    // 第二次：直接放手机里存的，不再请求
    speak({ text: '三加四等于几？', lang: 'zh-CN' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((players[players.length - 1].src as { uri: string }).uri).toMatch(/^file:\/\/\/cache\/tts\//);
    // 星星宝的回答（cloud）：每次都现念，不存
    speak({ text: '你真聪明', lang: 'zh-CN', cloud: true });
    await flush();
    speak({ text: '你真聪明', lang: 'zh-CN', cloud: true });
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(Speech.speak).not.toHaveBeenCalled();
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
    expect(await aiTts(cfg, '你好呀', AI_VOICE, 'slow')).toBe('https://oss.example/b.mp3');
    expect(await aiTts(cfg, '你好呀', AI_VOICE, 'slow')).toBe('https://oss.example/b.mp3');
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
  it('“联网童声朗读”开着就用云端童声（不需要先开 AI 老师）；关掉就不用；旧记录里的女声 / 男声改成童声', async () => {
    await mount({ aiEnabled: false, aiBaseUrl: 'https://ai.example.com', voiceGender: 'male' });
    await waitFor(() => expect(hasCloudVoice()).toBe(true));
    const r2 = await mount({ aiEnabled: true, aiBaseUrl: 'https://ai.example.com', aiCloudVoice: false });
    await waitFor(() => expect(hasCloudVoice()).toBe(false));
    r2.unmount();
  });
});
