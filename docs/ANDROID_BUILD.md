# 安卓安装包（APK）打包与真机测试

> 适用版本：2.15.1。图文版指南（含测试清单表格，可直接填写结果）在 claude.ai 的文档「星星学习乐园 安卓安装包打包与真机测试指南」。
> 云端工作区访问不到 Google 的安卓 SDK 下载源，安装包需要在自己的电脑上用 Expo 云打包生成。

## 打包配置（已准备好）

- `eas.json`：`preview` = 可直接安装的 APK（内部试用），`production` = 上架用的 AAB。
- `app.json`：版本 2.15.1，`versionCode` 2（每次给试用者发新包都要加 1）；包名 `com.starlearningpark.app`。
- 权限：只保留联网（AI 老师）和振动（点击反馈）；读写存储、悬浮窗已用 `blockedPermissions` 屏蔽（儿童 APP 只申请必要权限）。
- 已在工作区用 `npx expo prebuild --platform android` 验证能生成安卓原生工程（生成后已删除，`android/` 不提交）。

## 方法一：在云端工作区直接打包（2.15.1 已用此方法打出试用 APK）

需要在 claude.ai「设置 → 功能 → 额外允许的域名」放行：`dl.google.com`、`maven.google.com`、`repo.maven.apache.org`、`services.gradle.org`、`plugins.gradle.org`、`plugins-artifacts.gradle.org`、`repo.reactnative.dev`。

- 安卓 SDK：platform 37.0、build-tools 37.0.0、NDK 27.1.12297006；JDK 17（apt 安装）
- （V2.17 起）先运行 `bash tools/asr/fetch.sh` 下载离线语音识别的库和模型（约 64MB，不提交到 Git）
- `npx expo prebuild --platform android --clean` 后，`./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`（约 32 分钟，2 核）
- Maven Central 偶尔返回 429（请求太多）：用本机缓存代理自动重试（Gradle init 脚本把 Maven Central 和插件仓库指向 127.0.0.1）
- 产物为测试签名（Android Debug 证书）的 APK，约 49 MB，只适合内部试用；上架需正式签名
- V5.2.0（2026-11-14）实际做法：环境放行 dl.google.com、huggingface.co、us.aws.cdn.hf.co 等；安卓 SDK 用命令行工具装 platforms;android-37.0、build-tools 37.0.0、NDK 27.1.12297006；JDK 17 用 Temurin 压缩包解压到用户目录（核对官方 SHA-256），编译时指定 `-Dorg.gradle.java.installations.paths`；Maven Central 和 Gradle 插件仓库限流严重（会回 429，偶尔回 404），用本机缓存代理（遇 429/404 退避重试、成功的文件缓存）+ Gradle init 脚本把仓库指向它，jitpack 不放行就让代理直接回“没有”；只打 arm64：`-PreactNativeArchitectures=arm64-v8a`，约 20 分钟，APK 约 75 MB

## 方法二：Expo 云打包（在自己电脑上）
- （V2.17 起）云打包前也要先运行 `bash tools/asr/fetch.sh`；`.easignore` 已设置为会把下载的库和模型一起上传。

1. 注册 https://expo.dev 账号；安装 Node.js（LTS 版）。
2. 解压源代码包，在文件夹里打开命令行，依次输入：
   ```bash
   npm install
   npx eas-cli login          # 只在自己的电脑上输入 Expo 账号和密码
   npx eas-cli build -p android --profile preview
   ```
   第一次会问是否创建 EAS 项目、是否生成签名密钥，都选 Yes（密钥由 Expo 保管，以后更新要用同一个，不要删除项目）。
3. 10～20 分钟后得到下载链接和二维码，用手机浏览器下载安装（允许“安装未知来源应用”）。

## 真机测试重点

1. **声音**：家长中心 →“声音检查”，看有没有中文、英语语音，并点“试听中文”“试听英语”。很多国产手机没有装对应语音，朗读会没声音。
2. 安装启动、拖动、描红、键盘填数、讲解与阅读、每日挑战（多选）、记录保存、切换年级、试卷打印、旧手机流畅度。
3. AI 老师服务还没部署，默认关闭，首页不显示“问星星宝”。

发现问题时截图，并记下手机品牌型号、安卓版本、操作步骤。
