#!/usr/bin/env bash
# 下载离线语音识别需要的两样东西（都不提交到 Git），并核对文件指纹：
#   1. sherpa-onnx 安卓库 1.12.21（Apache-2.0，k2-fsa/sherpa-onnx）
#   2. 中文识别模型 streaming-zipformer-small-ctc-zh-int8-2025-04-01（Apache-2.0，icefall / csukuangfj）
# 用法：bash tools/asr/fetch.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
HF=https://huggingface.co
get() { # 地址 目标 指纹
  if [ -f "$2" ] && echo "$3  $2" | sha256sum -c --quiet 2>/dev/null; then echo "已有：$2"; return; fi
  mkdir -p "$(dirname "$2")"
  curl -sSfL -o "$2.part" "$1"
  echo "$3  $2.part" | sha256sum -c --quiet
  mv "$2.part" "$2"; echo "已下载：$2"
}
M=csukuangfj/sherpa-onnx-streaming-zipformer-small-ctc-zh-int8-2025-04-01
A=modules/offline-asr/android
D=$A/maven/com/k2fsa/sherpa/onnx/sherpa-onnx/1.12.21
get "$HF/csukuangfj/sherpa-onnx-libs/resolve/main/android/aar/sherpa-onnx-1.12.21.aar" $D/sherpa-onnx-1.12.21.aar 4ce353cda9ab9e4c2e398dfd45aeb43cca1b5f97279051d354ebcdbd043e74ef
get "$HF/$M/resolve/main/model.int8.onnx" $A/src/main/assets/asr/model.int8.onnx 68c9c943840f7d9cf3e8a4970ba50f404feb5277f611fa82b7e72267786fa84a
get "$HF/$M/resolve/main/tokens.txt" $A/src/main/assets/asr/tokens.txt 6fed8c6c248516f38e7faa19404b57413e8ce259f1cbc1fa4aebc86eac32fdfd
# 本地 Maven 仓库的说明文件（Gradle 打包安卓库时不允许直接引用 .aar 文件）
cat > $D/sherpa-onnx-1.12.21.pom <<'POM'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.k2fsa.sherpa.onnx</groupId>
  <artifactId>sherpa-onnx</artifactId>
  <version>1.12.21</version>
  <packaging>aar</packaging>
  <licenses><license><name>Apache License 2.0</name></license></licenses>
</project>
POM

