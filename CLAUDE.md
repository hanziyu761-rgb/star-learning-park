# 星星学习乐园 — 长期开发规则

面向中国小学一年级（6–7 岁）儿童的互动学习 APP。Expo SDK 58 + React Native + TypeScript + Expo Router。
项目所有者不懂编程：汇报时用中文、讲清楚结果，不要只贴代码。

## 必须遵守

0. **第三方内容许可**：cn-math-taxonomy 为 CC BY-NC 4.0，未取得授权前不得复制其数据或代码；ChinaStudyFree、EduAgent 为 MIT，使用时保留声明（THIRD_PARTY_NOTICES.md）。

1. **不做假功能**：没有真实实现的能力（语音识别、发音评分、AI 对话等）必须明确标注为“后续版本”，不能用随机分数或固定回复冒充。
2. **不造假数据**：家长中心、首页统计只能来自真实学习记录（`src/progress`）。
3. **内容准确**：
   - 中文必须用 `zh('汉字', '拼音')` 写拼音，逐字人工填写，带声调符号；“一、不”按实际变调注音，轻声不标调。
   - `__tests__/content.test.ts` 会用 pinyin-pro 词库逐字核对所有课程和界面文字；词库判断错误时，只能在 `ACCEPTED` 中按“汉字:我们的拼音:词库拼音”登记并写明理由。
   - 课程标注来源 `source` / `sourceNote`：原创 / 已核实教材对应 / 未核实。不得把未核实的题目写成某教材原题。
   - 英语课题目指令用英文，中文只放在可选的 `hintZh` 小提示中。
4. **不破坏已有数据**：修改 `ProgressState` 结构时必须在 `parseProgress` 中写迁移，并补测试；存储键 `slp.progress.v1`。
5. **检查不能作弊**：不得通过关闭规则、跳过或删除测试来让检查通过。

## 每次改动后运行

```bash
npm run typecheck   # TypeScript 类型检查
npm run lint        # ESLint
npm test            # Jest 单元/组件测试
npx expo export --platform android --output-dir dist-android   # 验证安卓包能编译
```

网页端到端验收（需要 Python + Playwright）：先 `npx expo export --platform web`，在 dist 目录起静态服务（端口 8081），再运行 `python tools/e2e/acceptance.py` 与 `python tools/e2e/full_lessons.py`。

## 教师审核表

`npm run review:export` 导出一～六年级内容审核表（每个年级一份 Excel）到 `review-out/`（构建产物，不提交）。题库自动核查在 `__tests__/bank-audit.test.ts`，不得为通过检查而放宽验算规则。

## 单文件 HTML 版

`npm run build:html` 生成 `star-learning-park.html`。改动页面后要同时验证 APP 版和 HTML 版。

## 依赖安装

- 优先 `npx expo install <包名>`（自动选择与 SDK 匹配的版本）。
- 若网络访问不到 Expo API，可查 `node_modules/expo/bundledNativeModules.json` 中的版本号后用 npm 安装同一版本。

## 代码结构

```
src/app/            Expo Router 路由（只做参数读取，转给 src/screens）
src/screens/        页面：首页、学科页、课程页、家长中心（跳转只用 useNav()，不要直接用 router）
src/nav/            跳转抽象；src/single/ 单文件 HTML 版入口（内存页面栈）
src/thinking/       思维训练：每日挑战题（challenges.ts 数学、challengesLang.ts 语文和英语、challengesUpper.ts + contentUpper.ts 三～六年级、registry.ts 总表/分档/三科轮换）、答对后选思路、家长中心统计
src/knowledge/      知识图谱（原创）：一年级数学 graph.ts + curriculum/（二～六年级数学、一～六年级语文、三～六年级英语）、映射、题目生成器（genUpper.ts 二～六年级数学）、掌握度、诊断、推荐
src/ai/             AI 老师客户端（只连自家服务，无密钥）
server/ai-worker/   AI 老师服务（Cloudflare Worker + DeepSeek）
src/content/        课程数据（只写数据，不写界面）；zh.ts 拼音工具；index.ts 课程目录与知识点名称；bank/edition.ts 新版教材单元编排（V2.4：一年级）
src/lesson/         课程数据类型、课程播放器、各类环节（演示、拖动、跟读、对话、绘本）、反馈语
src/exercises/      可复用练习组件：选择、正误判断、拖动配对、排序；V2.1 图形互动：拖到方格、地图点选、点选图形、分类篮、旋转、拨钟、找规律
src/drag/           拖动与放置区（gesture-handler + reanimated）
src/progress/       学习记录：数据模型（纯函数）、本地存储、统计、React Context
src/speech/         发音（expo-speech，设备系统语音引擎）
src/components/     通用界面组件：上注音、按钮、吉祥物、反馈条、家长验证
src/theme.ts        统一配色、字号、圆角、间距
docs/               PRD、架构、开发计划、测试报告、更新记录
```

## 新增一节课

1. 在 `src/content/<学科>.ts` 写一个 `Lesson` 对象（可参考现有样板课），题型复用已有组件。
2. 新知识点在 `src/content/index.ts` 的 `SKILL_LABELS` 中加中文名称。
3. 加入 `LESSONS` 列表，运行全部检查。

## 提交

每完成一个稳定阶段做一次 Git 提交，提交说明用中文写清楚改了什么。不提交密钥、签名文件（.jks/.keystore）和构建产物。
