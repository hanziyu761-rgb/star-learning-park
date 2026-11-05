/**
 * V2.15 真机试用准备：版本号一致、只申请必要权限、声音检查。
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import React from 'react';
import { VoiceCheckCard } from '@/screens/VoiceCheckCard';
import { summarizeVoices } from '@/speech/speech';
import { APP_VERSION } from '@/version';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../app.json');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const eas = require('../eas.json');

describe('打包配置', () => {
  it('APP 内显示的版本号与 app.json 一致；安卓 versionCode 是正整数', () => {
    expect(app.expo.version).toBe(APP_VERSION);
    expect(Number.isInteger(app.expo.android.versionCode) && app.expo.android.versionCode > 0).toBe(true);
  });

  it('儿童 APP 只申请必要权限：屏蔽读写存储、悬浮窗', () => {
    expect(app.expo.android.blockedPermissions).toEqual(
      expect.arrayContaining([
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.SYSTEM_ALERT_WINDOW',
      ]),
    );
  });

  it('试用包是可以直接安装的 APK，上架包是 AAB', () => {
    expect(eas.build.preview.android.buildType).toBe('apk');
    expect(eas.build.preview.distribution).toBe('internal');
    expect(eas.build.production.android.buildType).toBe('app-bundle');
  });
});

describe('声音检查', () => {
  it('按语言识别中文、英语语音（兼容 zh_CN、cmn、en-GB 等写法）', () => {
    expect(summarizeVoices([])).toEqual({ total: 0, zh: false, en: false });
    expect(summarizeVoices([{ language: 'zh_CN' }, { language: 'en-GB' }])).toEqual({ total: 2, zh: true, en: true });
    expect(summarizeVoices([{ language: 'cmn-Hans-CN' }])).toMatchObject({ zh: true, en: false });
  });

  it('没检测到语音时显示设置方法；试听按钮用中文、英语朗读；显示版本号', async () => {
    await render(<VoiceCheckCard />);
    await waitFor(() => expect(screen.getByTestId('voice-tip')).toBeTruthy());
    expect(screen.getByTestId('voice-result').props.children).toContain('没检测到');
    await fireEvent.press(screen.getByTestId('voice-test-zh'));
    expect(Speech.speak).toHaveBeenLastCalledWith('你好，我是星星宝。', expect.objectContaining({ language: 'zh-CN' }));
    await fireEvent.press(screen.getByTestId('voice-test-en'));
    expect(Speech.speak).toHaveBeenLastCalledWith(
      'Hello! Nice to meet you.',
      expect.objectContaining({ language: 'en-US' }),
    );
    expect(screen.getByTestId('app-version').props.children).toContain(APP_VERSION);
  });

  it('两种语音都有时不显示设置提示', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValueOnce([{ language: 'zh-CN' }, { language: 'en-US' }]);
    await render(<VoiceCheckCard />);
    await waitFor(() => expect(screen.getByTestId('voice-result').props.children).toContain('✅ 有'));
    expect(screen.queryByTestId('voice-tip')).toBeNull();
  });
});
