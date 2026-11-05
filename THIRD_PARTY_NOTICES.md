# 第三方代码与内容声明

## ChinaStudyFree（聪聪学堂）
- 仓库：https://github.com/tanle-mtr/ChinaStudyFree （分析版本 eb2b91a）
- 许可证：MIT License, Copyright (c) 2026 tanle-mtr
- 使用内容：
  - `src/progress/srs.ts`：Leitner 间隔复习算法（移植并改写为纯函数）
  - `src/content/bank/*.json`：小学语文、数学 1–6 年级、英语 3–6 年级题目（经 `tools/import-bank/import.mjs` 转换和自动质检）。原项目说明题目由 AI 基于教材知识点原创生成、非教材原题；**未经人工逐题审核**，APP 内已标注。
  - `server/ai-worker`：参考其 OpenAI 兼容调用方式与“未配置返回 501、前端降级”的设计（代码重写）
- 未使用：EdgeTTS 免费语音方案（逆向调用微软服务，存在合规风险）、教材 PDF、演示签名密钥。

MIT License 全文：

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## EduAgent
- 仓库：https://github.com/StudentTraineeCenter/edu-agent （分析版本 77c9ee5）
- 许可证：MIT License, Copyright (c) 2025 Student Trainee Center
- 使用内容：`src/progress/plan.ts` 借鉴其学习计划规则（按知识点统计正确率，低于 70% 判为薄弱）；未复制代码。

## Kokoro-82M（预先录制的朗读声音，V2.16）
- 模型：https://huggingface.co/hexgrad/Kokoro-82M （v1.0，ONNX 版来自 https://github.com/thewh1teagle/kokoro-onnx 发布的模型文件）
- 许可证：Apache License 2.0（允许商用）
- 使用内容：在开发环境用 `tools/voice/generate.py` 把课程、讲解、短文等固定朗读内容生成音频，放在 `assets/voice/`；APP 内不包含模型本身。
  使用的声音：中文女声 zf_xiaoxiao、中文男声 zm_yunxi、中文童声 zm_yunxia、英语女声 af_heart、英语男声 am_puck。
- 生成工具（只在开发环境使用，不随 APP 发布）：kokoro-onnx（MIT）、misaki（Apache-2.0，中文拼音转音标）、jieba（MIT）、pypinyin（MIT）、cn2an（MIT）。
