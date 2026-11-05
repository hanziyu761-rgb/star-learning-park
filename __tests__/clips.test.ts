/**
 * V2.16 预先录好的朗读：编号与生成脚本一致；有录音放录音，没有录音用手机语音。
 */
import * as Speech from 'expo-speech';
import { clipId } from '@/speech/clips';
import { setVoicePrefs, speak } from '@/speech/speech';

jest.mock('@/speech/voiceClips', () => {
  // 与 clipId('zh-CN', '你好') 相同的编号（由 tools/voice/generate.py 的 clip_id 算出）
  const en = (() => {
    // clipId('en-US', 'Hi')
    let h = 0x811c9dc5;
    for (const c of 'en-US|Hi') h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
    return h.toString(16).padStart(8, '0');
  })();
  return {
    CLIP_VOICES: {},
    CLIPS: { f: { '2035680e': 101, [en]: 111 }, m: { '2035680e': 202 }, c: { '2035680e': 303 } },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const audio = require('expo-audio');

describe('录音编号', () => {
  it('与 Python 生成脚本算出的编号相同（含中文、英文、标点）', () => {
    expect(clipId('zh-CN', '你好')).toBe('2035680e');
    expect(clipId('en-US', 'Great job!')).toMatch(/^[0-9a-f]{8}$/);
    expect(clipId('zh-CN', '你好')).not.toBe(clipId('en-US', '你好'));
  });
});

describe('朗读时优先放录音', () => {
  beforeEach(() => {
    (Speech.speak as jest.Mock).mockClear();
    audio.createAudioPlayer.mockClear();
  });

  it('有录音：按选的性别放对应录音，不用手机语音；放完才算读完', () => {
    setVoicePrefs({ gender: 'male', zh: '', en: '', rate: 'slow' });
    const done = jest.fn();
    speak({ text: '你好', lang: 'zh-CN' }, done);
    expect(Speech.speak).not.toHaveBeenCalled();
    expect(audio.createAudioPlayer).toHaveBeenLastCalledWith(202);
    const p = audio.__players.at(-1);
    expect(p.play).toHaveBeenCalled();
    expect(p.setPlaybackRate).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
    p.finish();
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('“正常”语速稍快播放；换女声放女声录音', () => {
    setVoicePrefs({ gender: 'female', zh: '', en: '', rate: 'normal' });
    speak({ text: '你好', lang: 'zh-CN' });
    expect(audio.createAudioPlayer).toHaveBeenLastCalledWith(101);
    expect(audio.__players.at(-1).setPlaybackRate).toHaveBeenCalledWith(1.12);
  });

  it('没有录音的内容（例如题库题）用手机语音；试听某个手机声音时也用手机语音', () => {
    setVoicePrefs({ gender: 'female', zh: '', en: '', rate: 'slow' });
    speak({ text: '一道题库题', lang: 'zh-CN' });
    expect(audio.createAudioPlayer).not.toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    speak({ text: '你好', lang: 'zh-CN' }, undefined, { voice: 'x' });
    expect(Speech.speak).toHaveBeenLastCalledWith('你好', expect.objectContaining({ voice: 'x' }));
  });

  it('童声：中文放童声录音，英语用英语女声录音；手机语音时音调调高', () => {
    setVoicePrefs({ gender: 'child', zh: '', en: '', rate: 'slow' });
    speak({ text: '你好', lang: 'zh-CN' });
    expect(audio.createAudioPlayer).toHaveBeenLastCalledWith(303);
    speak({ text: 'Hi', lang: 'en-US' });
    expect(audio.createAudioPlayer).toHaveBeenLastCalledWith(111);
    speak({ text: '没有录音的句子', lang: 'zh-CN' });
    expect(Speech.speak).toHaveBeenLastCalledWith('没有录音的句子', expect.objectContaining({ pitch: 1.3 }));
  });

  it('新的朗读会停掉正在放的录音', () => {
    speak({ text: '你好', lang: 'zh-CN' });
    const first = audio.__players.at(-1);
    speak({ text: '你好', lang: 'zh-CN' });
    expect(first.pause).toHaveBeenCalled();
    expect(first.remove).toHaveBeenCalled();
  });
});
