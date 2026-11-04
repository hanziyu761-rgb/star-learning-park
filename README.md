# 星星学习乐园（Star Learning Park）

小学一年级互动学习 APP（数学、语文、英语）。Expo + React Native + TypeScript。

## 在 Windows 电脑上运行

需要先安装 **Node.js 20 或更新版本**（https://nodejs.org 下载 LTS 版，一路“下一步”）。

在 PowerShell 中（把路径换成你解压的位置）：

```powershell
cd D:\star-learning-park
npm install
npx expo start
```

### 用手机预览（最快）
1. 安卓手机安装 **Expo Go**（应用商店或 https://expo.dev/go 下载，需支持 SDK 58）。
2. 手机和电脑连同一个 Wi-Fi。
3. 用 Expo Go 扫描 PowerShell 窗口里的二维码。
4. 如果扫码后连不上，按 Ctrl+C 停止，改用：`npx expo start --tunnel`

### 用电脑浏览器预览
```powershell
npx expo start --web
```

## 单文件 HTML 版（不用安装）

```powershell
npm run build:html
```

生成 `star-learning-park.html`，所有代码都在这一个文件里：
- 电脑上双击即可用 Chrome / Edge 打开；手机上可以用浏览器打开，或上传到 Cloudflare Pages 等静态网站后用链接访问。
- 学习记录保存在该浏览器里（换浏览器或清除浏览器数据会丢失）。
- 发音使用浏览器的语音功能，建议用 Chrome、Edge 或手机自带浏览器的较新版本。

## 打包安卓安装包（APK）

需要一个免费的 Expo 账号（https://expo.dev/signup）。构建在 Expo 云端完成，电脑不需要安装 Android Studio。

```powershell
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

第一次构建时会询问是否创建 EAS 项目、是否自动生成安卓签名密钥，都回答 **Y**（密钥保存在 Expo 账号里，以后更新版本必须用同一个账号）。

完成后命令行会给出下载链接和二维码，手机下载安装即可（安装时需允许“安装未知来源应用”）。

## 检查与测试

```powershell
npm run typecheck
npm run lint
npm test
```

## 文档
- `CLAUDE.md` 长期开发规则
- `docs/PRD.md` 产品需求　`docs/ARCHITECTURE.md` 技术架构
- `docs/DEVELOPMENT_PLAN.md` 开发计划　`docs/TEST_REPORT.md` 测试报告　`docs/CHANGELOG.md` 更新记录
