/**
 * 云端童声（阿里云百炼 CosyVoice 龙呼呼，经自家 AI 服务）：
 * V2.18 只用于星星宝的话；V2.21 起所有没有预录的句子都用它，念过的存在手机里。
 * V5.1 起不再用手机语音：没网、没设置服务、出错时不出声，并发出“朗读出问题”通知（页面上提示一句）。
 * 真实合成效果需要在服务端配置百炼密钥后用手机实测。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, waitFor } from '@testing-library/react-native';
import * as Audio from 'expo-audio';
import React from 'react';
import { AI_VOICE, aiTts } from '@/ai/client';
import { createEmptyProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';
import * as Speech from 'expo-speech';
import { CLOUD_WAIT_MS, hasCloudVoice, onSpeechProblem, onSpeakingChange, setCloudVoice, speak, type SpeechProblem } from '@/speech/speech';

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

  it('云端出错、没设置服务、太久没回应：不用手机语音，不出声；提示一句，朗读照常结束（课程不卡住）', async () => {
    const problems: SpeechProblem[] = [];
    const off = onSpeechProblem((p) => problems.push(p));
    const speaking: boolean[] = [];
    const off2 = onSpeakingChange((v) => speaking.push(v));
    const done = jest.fn();
    setCloudVoice(async () => {
      throw new Error('net');
    });
    speak({ text: '你真棒', lang: 'zh-CN', cloud: true }, done);
    await flush();
    expect(problems).toEqual(['offline']);
    expect(done).toHaveBeenCalledTimes(1);
    expect(speaking[speaking.length - 1]).toBe(false);

    setCloudVoice(null);
    speak({ text: '再想想', lang: 'zh-CN', cloud: true }, done);
    expect(problems).toEqual(['offline', 'no-service']);
    expect(done).toHaveBeenCalledTimes(2);

    jest.useFakeTimers();
    setCloudVoice(() => new Promise<string>(() => undefined)); // 一直不回应
    speak({ text: '慢慢来', lang: 'zh-CN', cloud: true }, done);
    jest.advanceTimersByTime(CLOUD_WAIT_MS - 1);
    expect(done).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1);
    expect(problems).toEqual(['offline', 'no-service', 'offline']);
    expect(done).toHaveBeenCalledTimes(3);
    jest.useRealTimers();

    expect(Speech.speak).not.toHaveBeenCalled(); // 手机语音一次都没用
    off();
    off2();
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
  it('设置了 AI 服务地址就用云端童声（不需要先开 AI 老师）；V5.1 起旧记录里关掉的“联网童声”也照样用；没有地址就没有', async () => {
    await mount({ aiEnabled: false, aiBaseUrl: 'https://ai.example.com', voiceGender: 'male' });
    await waitFor(() => expect(hasCloudVoice()).toBe(true));
    const r2 = await mount({ aiEnabled: true, aiBaseUrl: 'https://ai.example.com', aiCloudVoice: false });
    await waitFor(() => expect(hasCloudVoice()).toBe(true));
    r2.unmount();
    const r3 = await mount({ aiBaseUrl: '' });
    await waitFor(() => expect(hasCloudVoice()).toBe(false));
    r3.unmount();
  });
});
