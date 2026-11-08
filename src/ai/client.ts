/**
 * AI 老师客户端：只调用“星星 AI 服务”（server/ai-worker），APP 内不保存任何大模型密钥。
 * 发送的内容只有：科目、年级、题目文字、孩子的问题；不发送名字、设备号等身份信息。
 */
import type { Subject } from '@/lesson/types';

export type AiErrorCode =
  | 'NOT_CONFIGURED' // 家长没有填写服务地址
  | 'DISABLED' // 家长没有开启
  | 'NETWORK' // 网络不通或超时
  | 'RATE_LIMITED'
  | 'LLM_NOT_CONFIGURED' // 服务端没有配置 DeepSeek 密钥
  | 'PHOTO_NOT_CONFIGURED' // 服务端没有配置阿里云百炼密钥（拍照错题）
  | 'SERVER';

export class AiError extends Error {
  constructor(
    public code: AiErrorCode,
    message: string,
    /** 服务端带回的原因（例如百炼返回的错误码），给家长或开发者排查用，不含密钥 */
    public detail?: string,
  ) {
    super(message);
  }
}

/** 构建时可通过环境变量预设服务地址（不是密钥，可以公开） */
export const DEFAULT_AI_BASE_URL = (process.env.EXPO_PUBLIC_AI_BASE_URL ?? '').replace(/\/$/, '');

export const AI_ERROR_TEXT: Record<AiErrorCode, string> = {
  NOT_CONFIGURED: '还没有设置 AI 老师，请爸爸妈妈在家长中心设置。',
  DISABLED: 'AI 老师还没有打开，请爸爸妈妈在家长中心打开。',
  NETWORK: '星星宝老师连不上网络，等一会儿再试试吧。',
  RATE_LIMITED: '问得太快啦，休息一下再问吧。',
  LLM_NOT_CONFIGURED: 'AI 老师还没准备好（服务端未配置），请爸爸妈妈检查设置。',
  PHOTO_NOT_CONFIGURED: '照片识别还没准备好：AI 服务上还没有配置阿里云百炼密钥。',
  SERVER: '星星宝老师暂时休息了，等一会儿再试试吧。',
};

export interface AiConfig {
  enabled: boolean;
  baseUrl: string;
}

async function call<T>(cfg: AiConfig, path: string, body?: unknown, timeoutMs = 20000): Promise<T> {
  if (!cfg.enabled) throw new AiError('DISABLED', AI_ERROR_TEXT.DISABLED);
  const base = (cfg.baseUrl || DEFAULT_AI_BASE_URL).replace(/\/$/, '');
  if (!base) throw new AiError('NOT_CONFIGURED', AI_ERROR_TEXT.NOT_CONFIGURED);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch {
    throw new AiError('NETWORK', AI_ERROR_TEXT.NETWORK);
  } finally {
    clearTimeout(timer);
  }
  let data: { ok?: boolean; code?: string } & Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new AiError('SERVER', AI_ERROR_TEXT.SERVER);
  }
  if (!res.ok || !data.ok) {
    if (data.code === 'RATE_LIMITED') throw new AiError('RATE_LIMITED', AI_ERROR_TEXT.RATE_LIMITED);
    if (data.code === 'LLM_NOT_CONFIGURED') throw new AiError('LLM_NOT_CONFIGURED', AI_ERROR_TEXT.LLM_NOT_CONFIGURED);
    if (data.code === 'PHOTO_NOT_CONFIGURED') throw new AiError('PHOTO_NOT_CONFIGURED', AI_ERROR_TEXT.PHOTO_NOT_CONFIGURED);
    if (data.code === 'PHOTO_GEN_INVALID' || data.code === 'TOO_LARGE' || data.code === 'BAD_REQUEST')
      throw new AiError('SERVER', typeof data.error === 'string' ? data.error : AI_ERROR_TEXT.SERVER);
    const up = data.upstream as { status?: number; detail?: string } | undefined;
    throw new AiError('SERVER', AI_ERROR_TEXT.SERVER, up ? `${up.status ?? ''} ${up.detail ?? ''}`.trim() : undefined);
  }
  return data as T;
}

export async function aiHealth(cfg: AiConfig): Promise<{ llm: boolean; model: string; tts?: boolean; photo?: boolean; vlModel?: string }> {
  return call(cfg, '/api/health', undefined, 8000);
}

export async function aiHint(
  cfg: AiConfig,
  req: {
    subject: Subject;
    grade: number;
    mode: 'hint' | 'explain';
    question: string;
    options?: string[];
    answer?: string;
    knowledgePoint?: string;
  },
): Promise<string> {
  return (await call<{ text: string }>(cfg, '/api/tutor/hint', req)).text;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function aiChat(cfg: AiConfig, req: { subject: Subject; grade: number; messages: ChatMessage[] }): Promise<string> {
  return (await call<{ text: string }>(cfg, '/api/tutor/chat', { ...req, messages: req.messages.slice(-6) })).text;
}

export async function aiReport(
  cfg: AiConfig,
  req: { grade: number; weakSkills: { label: string; accuracy: number; total: number }[]; mistakes: string[] },
): Promise<string> {
  return (await call<{ text: string }>(cfg, '/api/tutor/report', req, 30000)).text;
}

/** 星星宝童声（阿里云百炼 CosyVoice 龙呼呼，中英文都能读）：V2.21 起全 APP 只用这一个声音 */
export const AI_VOICE = 'longhuhu_v3';

const ttsCache = new Map<string, { url: string; until: number }>();
/** 把星星宝要说的话合成为语音，返回音频地址（24 小时有效）；同一句话 23 小时内不重复请求 */
export async function aiTts(cfg: AiConfig, text: string, voice: string, rate: 'slow' | 'normal'): Promise<string> {
  const key = `${voice}|${rate}|${text}`;
  const hit = ttsCache.get(key);
  if (hit && hit.until > Date.now()) return hit.url;
  const { url } = await call<{ url: string }>(cfg, '/api/tts', { text: text.slice(0, 300), voice, rate }, 15000);
  ttsCache.set(key, { url, until: Date.now() + 23 * 3600 * 1000 });
  return url;
}

// ---------------- 拍照错题（V4.1） ----------------

export interface PhotoAnalysis {
  subject: 'math' | 'chinese' | 'english';
  question: string;
  childAnswer: string;
  correctAnswer: string;
  /** 候选知识点中的一个，或空 */
  kpId: string;
  reason: string;
}

/** 把压缩后的错题照片（data:image/jpeg;base64,…）交给自家 AI 服务识别；照片不在服务端保存 */
export async function aiPhotoAnalyze(
  cfg: AiConfig,
  req: { image: string; grade: number; subject?: Subject; candidates: { id: string; name: string }[] },
): Promise<PhotoAnalysis> {
  return call<PhotoAnalysis>(cfg, '/api/photo/analyze', req, 60000);
}

export interface PhotoSimilarItem {
  question: string;
  options: string[];
  answer: string;
  explain: string;
}

/** 语文、英语：请 AI 出同类选择题（数学由 APP 原创出题程序出） */
export async function aiPhotoSimilar(
  cfg: AiConfig,
  req: { subject: 'chinese' | 'english'; grade: number; question: string; knowledgePoint?: string; count: number },
): Promise<PhotoSimilarItem[]> {
  return (await call<{ items: PhotoSimilarItem[] }>(cfg, '/api/photo/similar', req, 45000)).items;
}
