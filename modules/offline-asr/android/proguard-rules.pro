# 离线语音识别：sherpa-onnx 的 C++ 代码按类名、字段名读取这些 Kotlin 配置类（JNI GetFieldID），
# 发布版开启了 R8 混淆，必须原样保留，否则开始说话时就会出错（V4.1.3 修复）。
-keep class com.k2fsa.sherpa.onnx.** { *; }
