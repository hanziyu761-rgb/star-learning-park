// 网页版、单文件 HTML 版用的空清单（不带录音文件）。安卓/苹果 APP 用 voiceClips.native.ts（tools/voice/generate.py 生成）。
export const CLIP_VOICES = { zhF: '', zhM: '', zhC: '', enF: '', enM: '' };
export const CLIPS: Record<'f' | 'm' | 'c', Record<string, number>> = { f: {}, m: {}, c: {} };
