# 技术架构

## 技术栈
| 用途 | 选择 |
|---|---|
| 框架 | Expo SDK 58、React Native 0.88、React 19.3、TypeScript（strict） |
| 路由 | Expo Router（`src/app`，文件即页面） |
| 本地存储 | @react-native-async-storage/async-storage 2.2 |
| 发音 | expo-speech（设备系统 TTS，离线可用） |
| 拖动/动画 | react-native-gesture-handler 3（`usePanGesture` + `GestureDetector`）、react-native-reanimated 4 + react-native-worklets |
| 图形 | react-native-svg（吉祥物） |
| 测试 | Jest（jest-expo）、@testing-library/react-native 14、pinyin-pro（拼音核对） |
| 构建 | EAS Build（`eas.json`：preview 出 APK，production 出 AAB） |

## 页面
```
/                    首页
/subject/[subject]   学科页（math / chinese / english）
/lesson/[id]         课程播放（?resume=1 继续上次）
/parent              家长中心（含验证）
```

## 分层
1. **内容层** `src/content`：课程是纯数据（`Lesson` → `LessonStep[]` → `Exercise`），类型定义见 `src/lesson/types.ts`。
2. **展示层** `src/lesson/LessonPlayer.tsx` 根据 `step.kind` 选择环节组件；练习由 `src/exercises/ExerciseView.tsx` 根据 `exercise.kind` 选择组件。
3. **进度层** `src/progress`：
   - `model.ts`：纯函数 reducer（`lesson/start`、`lesson/step`、`exercise/result`、`lesson/complete`、`reset`）。
   - `storage.ts`：读取时校验，数据损坏时另存备份并从空记录开始；写入串行化。
   - `ProgressContext.tsx`：读取完成前禁止写入，避免覆盖已有进度。
   - `stats.ts`：家长中心和首页统计。

## 数据模型（ProgressState v1）
```ts
{
  version: 1,
  totalStars: number,
  lessons:  { [lessonId]: { startCount, completedCount, bestStars, lastStudiedAt, firstCompletedAt } },
  results:  [{ lessonId, exerciseId, subject, skill, firstTryCorrect, attempts, at }],   // 最多 2000 条
  mistakes: { [lessonId/exerciseId]: { skill, wrongCount, lastWrongAt, resolved } },
  sessions: [{ lessonId, subject, startedAt, endedAt, durationSec, firstTryCorrect, exerciseCount, stars }], // 最多 500 条
  active:   { lessonId, subject, stepIndex, startedAt, updatedAt } | null               // 继续学习
}
```
- 正确率按“第一次作答”计算，重试不掩盖错误；`attempts = 出错次数 + 1`。
- `skill`（知识点）是未来智能复习的基础：可按知识点抽取错题、安排间隔复习。
- 学习时长只统计完成的课程，单次上限 60 分钟。

## 拖动实现
`DragArea` 收集放置区引用；`Draggable` 用 `usePanGesture` 在 UI 线程移动，松手时通过 `scheduleOnRN` 回到 JS，用 `measureInWindow` 判断落点（四周放宽 16px）。被拒绝时弹簧回原位。网页端拖动后会额外触发一次点击，用 `justDragged()` 过滤。所有拖动题同时支持点按完成，照顾操作不熟练的孩子。

## 发音
`speech.ts` 统一打断/排队朗读，中文语速 0.85、英文 0.8。发音质量取决于手机系统语音引擎；部分国产安卓手机需在“设置 → 文字转语音”中安装/启用中文或英文语音包。

## 扩展点
- 新题型：在 `types.ts` 增加 `Exercise` 分支 + 新组件 + `ExerciseView` 一行。
- 真人录音：在 `Speakable` 增加可选 `audio` 资源字段，`speech.ts` 优先播放音频。
- 录音跟读/评分：在 `repeat` 环节接入 expo-audio 录音和语音评测服务。
