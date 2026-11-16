# 第三方代码与内容声明

## ChinaStudyFree（聪聪学堂）
- 仓库：https://github.com/tanle-mtr/ChinaStudyFree （分析版本 eb2b91a）
- 许可证：MIT License, Copyright (c) 2026 tanle-mtr
- 使用内容：
  - `src/progress/srs.ts`：Leitner 间隔复习算法（移植并改写为纯函数）
  - `src/content/bank/*.json`：小学语文、数学 1–6 年级、英语 3–6 年级题目（经 `tools/import-bank/import.mjs` 转换和自动质检）。原项目说明题目由 AI 基于教材知识点原创生成、非教材原题；**未经人工逐题审核**，APP 内已标注。
  - V5.2 追加 7–9 年级题目（分析版本 d000bef，经 `tools/import-bank/import-junior.mjs` 转换和自动质检，语文、英语题人工抽看后剔除 17 道有错的题）。
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

## 阿里云百炼 CosyVoice（预先录制的朗读声音 + 联网朗读，V2.21 起）
- 服务：阿里云百炼 语音合成 cosyvoice-v3-flash，音色 longhuhu_v3（龙呼呼）。云端服务，不是开源模型，APP 内不包含模型和密钥。
- 使用方式：APP 所有者用自己的百炼账号，经自家 AI 服务（server/ai-worker）批量合成固定朗读内容（`tools/voice/cloud/record.ps1`），
  导入为 `assets/voice/c/`；随机出的题联网时经自家 AI 服务现念。按字数计费，费用由 APP 所有者承担。
- 合成内容的使用（含商用）条件以《阿里云百炼服务协议》和阿里云相关条款为准；正式上架前建议再核对一次。
- V2.16～V2.20 使用的 Kokoro-82M（Apache-2.0）录音已在 V2.21 全部替换，不再随 APP 发布；`tools/voice/generate.py` 保留为历史工具。
- 回听检查用的离线识别模型 sherpa-onnx-paraformer-zh-small（只在开发环境使用，不随 APP 发布）。

## sherpa-onnx 与中文语音识别模型（说话提问，V2.17）
- 识别引擎：sherpa-onnx 1.12.21 安卓库 https://github.com/k2-fsa/sherpa-onnx （Apache License 2.0，允许商用；库内含 onnxruntime，MIT License）
  下载地址：https://huggingface.co/csukuangfj/sherpa-onnx-libs （android/aar/sherpa-onnx-1.12.21.aar）
- 识别模型：streaming-zipformer-small-ctc-zh-int8-2025-04-01（新一代 Kaldi / icefall 训练，Apache License 2.0）
  https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-small-ctc-zh-int8-2025-04-01 （PyTorch 原版 https://huggingface.co/csukuangfj/icefall-streaming-zipformer-small-ctc-zh-2025-04-01 标注 apache-2.0）
- 使用方式：随安卓 APP 打包（`modules/offline-asr`），在手机里离线识别；录音只在内存中处理，不保存、不上传。库和模型由 `tools/asr/fetch.sh` 下载并核对 SHA-256，不提交到 Git。
- 未使用：识别更准的 paraformer-zh-small（来源 ModelScope 达摩院模型，许可证说明不一致，未确认可商用前不使用）。

## CMU 发音词典 CMUdict（单词卡音标，V2.18）
- 来源：Carnegie Mellon University Pronouncing Dictionary（通过 Python 包 cmudict 1.1.3 获取）
- 许可证：BSD 2-Clause 风格许可，Copyright (C) 1993-2015 Carnegie Mellon University. All rights reserved.
- 使用方式：开发时用 `tools/words/phonetics.py` 查词典，把美式读音（ARPAbet）转换成国际音标，生成 `src/words/data/ipa.gen.ts`；APP 内只包含转换后的单词音标，不包含整本词典。
- 许可要求保留版权声明：Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met: 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY "AS IS" AND ANY EXPRESSED OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.

## TweetNaCl.js（会员开通码签名核对，V5.3）
- 来源：https://github.com/dchest/tweetnacl-js （npm 包 tweetnacl 1.0.3）
- 许可证：The Unlicense（公有领域，允许商用，无需署名）
- 使用方式：APP 内用公钥核对会员开通码；管理员开通工具（不随 APP 发布）用私钥生成开通码。

