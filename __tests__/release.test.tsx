/**
 * V2.15 真机试用准备：版本号一致、只申请必要权限、显示版本号。
 */
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ProgressProvider } from '@/progress/ProgressContext';
import { VoiceCheckCard } from '@/screens/VoiceCheckCard';
import { APP_VERSION } from '@/version';

jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { f: {}, m: {}, c: {} } }));

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

describe('声音设置卡片显示版本号', () => {
  // V5.1 起不用手机语音，“检查手机里有没有中文、英语语音”的功能已去掉（试听走云端童声，见 voice.test.tsx）
  it('显示当前版本号', async () => {
    await render(
      <ProgressProvider>
        <VoiceCheckCard />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('app-version')).toBeTruthy());
    expect(screen.getByTestId('app-version').props.children).toContain(APP_VERSION);
  });
});
