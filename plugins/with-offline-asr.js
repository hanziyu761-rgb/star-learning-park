/**
 * Expo 配置插件（V2.17）：让安卓 APP 工程能找到离线语音识别库所在的本地 Maven 仓库
 * （modules/offline-asr/android/maven，由 tools/asr/fetch.sh 下载）。
 * expo prebuild 重新生成 android/ 时会自动加上，不需要手改 android/build.gradle。
 * 同时：不打包识别用不到的两个 sherpa-onnx 库文件；压缩原生库，让安装包小一些（方便用微信发送）。
 */

const PROPS = {
  'expo.useLegacyPackaging': 'true',
  'android.packagingOptions.excludes': '**/libsherpa-onnx-c-api.so,**/libsherpa-onnx-cxx-api.so',
};

function withProps(config) {
  return withGradleProperties(config, (c) => {
    for (const [key, value] of Object.entries(PROPS)) {
      c.modResults = c.modResults.filter((x) => !(x.type === 'property' && x.key === key));
      c.modResults.push({ type: 'property', key, value });
    }
    return c;
  });
}
const { withGradleProperties, withProjectBuildGradle } = require('expo/config-plugins');

const LINE = 'maven { url "$rootDir/../modules/offline-asr/android/maven" } // 离线语音识别（sherpa-onnx）';

module.exports = function withOfflineAsr(config) {
  config = withProps(config);
  return withProjectBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes('modules/offline-asr/android/maven')) {
      c.modResults.contents = c.modResults.contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        (m) => `${m}\n    ${LINE}`,
      );
    }
    return c;
  });
};
