/**
 * 星星 AI 老师服务（Cloudflare Worker，也可在 Node 中运行）
 *
 * - 大模型：DeepSeek（OpenAI 兼容接口），密钥只存在服务端环境变量 DEEPSEEK_API_KEY 中
 * - 面向 6–12 岁儿童：严格的系统提示、输入去除个人信息、输出过滤与长度限制
 * - 不保存任何对话内容；日志只记录接口名与耗时
 *
 * 接口（全部 JSON）：
 *   GET  /api/health               服务与模型是否可用
 *   POST /api/tutor/hint           做题提示（不给答案）/ 答对后讲解
 *   POST /api/tutor/chat           问问星星宝（学习问答、英语陪练）
 *   POST /api/tutor/report         给家长的错题分析与学习建议
 *   POST /api/tts                  把星星宝要说的话合成为自然的语音（阿里云百炼 CosyVoice，V2.18；密钥 DASHSCOPE_API_KEY）
 *   POST /api/photo/analyze        家长拍错题：识别题目、孩子的答案和知识点（阿里云百炼通义千问 VL；照片不保存）
 *   POST /api/photo/similar        语文、英语按错题出同类选择题（DeepSeek；标注“AI 生成，未经人工审核”）
 *
 * 参考：ChinaStudyFree apps/server（MIT）的 OpenAI 兼容调用与未配置时返回 501 的降级方式。
 */

export const DEFAULT_MODEL = 'deepseek-flash';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

// ---------------- 儿童安全 ----------------

/** 去除可能的个人信息：手机号、身份证号、邮箱、门牌地址、QQ/微信号 */
export function scrubPersonalInfo(text) {
  return String(text ?? '')
    .replace(/\b1[3-9]\d{9}\b/g, '[已隐藏]')
    .replace(/\b\d{17}[\dXx]\b/g, '[已隐藏]')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[已隐藏]')
    .replace(/(微信|qq|QQ)\s*[:：号]?\s*[\w-]{5,}/g, '$1[已隐藏]')
    .replace(/[一-龥]{2,}(路|街|巷|弄)\d+号/g, '[已隐藏]');
}

const BLOCKED_OUTPUT = /自杀|自残|杀人|色情|裸|赌博|毒品|血腥|恐怖袭击|枪支|约会|恋爱|微信号|加我|联系方式|地址是/;

/** 孩子说出危险或难过的情况时，不让模型自由发挥，直接给出固定的关心回复 */
const DISTRESS_INPUT = /不想活|想死|自杀|有人打我|被打|被欺负|离家出走|陌生人.*(带|叫)我|好害怕/;
export const DISTRESS_REPLY =
  '听起来你遇到了让你难过或害怕的事。请马上告诉爸爸妈妈、老师或者你信任的大人，他们会帮助你。你很勇敢，说出来就对了！';

export const FALLBACK_REPLY = '这个问题星星宝回答不好，我们去问问爸爸妈妈或老师吧！';

export function cleanOutput(text, maxLen = 160) {
  let t = String(text ?? '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*#>`_~]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  if (!t || BLOCKED_OUTPUT.test(t)) return FALLBACK_REPLY;
  if (Array.from(t).length > maxLen) t = Array.from(t).slice(0, maxLen).join('').replace(/[，,、；;]?$/, '') + '…';
  return t;
}

const GRADE_CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
/** 学段（V5.2）：七～九年级是初中 */
const stage = (grade) => (grade >= 7 ? '初中' : '小学');
const SUBJECT_CN = { math: '数学', chinese: '语文', english: '英语' };

function persona(grade) {
  const g = GRADE_CN[grade] || '一';
  return (
    `你是“星星宝”，一位温柔耐心的${grade >= 7 ? '初中' : '小学'}老师，正在辅导一位${g}年级的${grade >= 7 ? '同学' : '小朋友'}。` +
    '规则：1. 用小朋友听得懂的简单短句，每句不超过 15 个字，总共不超过 80 个字；' +
    '2. 多鼓励，不批评，不说“错了”而说“再想想”；' +
    '3. 只聊学习和健康积极的话题，别的话题温柔地带回学习；' +
    '4. 绝不询问或记录名字、学校、住址、电话、照片等个人信息；' +
    '5. 不使用表情符号以外的特殊格式，不用 Markdown；' +
    '6. 涉及安全、身体不舒服、难过的事，请小朋友告诉爸爸妈妈或老师。'
  );
}

// ---------------- 输入校验 ----------------

class BadRequest extends Error {}

function str(v, max, name, required = true) {
  if (v === undefined || v === null || v === '') {
    if (required) throw new BadRequest(`缺少 ${name}`);
    return '';
  }
  const s = scrubPersonalInfo(String(v)).trim();
  if (Array.from(s).length > max) throw new BadRequest(`${name} 太长`);
  return s;
}

function subjectOf(v) {
  if (!['math', 'chinese', 'english'].includes(v)) throw new BadRequest('subject 不合法');
  return v;
}

/** 年级：V5.2 起 APP 另外发 gradeFull（真实年级 1～9）；只有 grade 时按 1～6 */
function gradeOf(v, full) {
  const f = Number(full);
  if (Number.isInteger(f) && f >= 1 && f <= 9) return f;
  const g = Number(v);
  return Number.isInteger(g) && g >= 1 && g <= 6 ? g : 1;
}

// ---------------- 大模型调用 ----------------

export class LLMNotConfigured extends Error {}

async function callLLM(env, messages, { maxTokens = 300, temperature = 0.6 } = {}) {
  if (!env.DEEPSEEK_API_KEY) throw new LLMNotConfigured('DEEPSEEK_API_KEY 未配置');
  const fetchImpl = env.__fetch ?? fetch; // 测试时注入
  const res = await fetchImpl(env.DEEPSEEK_BASE_URL || DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL || DEFAULT_MODEL,
      messages,
      thinking: { type: 'disabled' }, // 儿童问答不需要长推理，降低延迟与费用
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`DeepSeek ${res.status}`);
    err.status = res.status;
    err.detail = body.slice(0, 200);
    throw err;
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  if (choice?.finish_reason === 'content_filter') return FALLBACK_REPLY;
  return choice?.message?.content ?? '';
}

// ---------------- 语音合成（阿里云百炼 CosyVoice，非实时 HTTP 接口） ----------------

export const DEFAULT_TTS_MODEL = 'cosyvoice-v3-flash';
const DEFAULT_TTS_URL = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer';
/** 允许的音色（APP 只能从这里选）：童声女孩、童声男孩、亲切女声、阳光男声 */
export const TTS_VOICES = ['longhuhu_v3', 'longniuniu_v3', 'longxing_v3', 'longanyang'];
const TTS_MAX = 300;
const ttsCache = new Map(); // 同一句话 23 小时内不重复合成（音频地址 24 小时有效）

export class TTSNotConfigured extends Error {}

export async function handleTts(body, env) {
  if (!env.DASHSCOPE_API_KEY) throw new TTSNotConfigured('DASHSCOPE_API_KEY 未配置');
  const text = String(body.text ?? '')
    .replace(/[*#>`_~]/g, '')
    .trim()
    .slice(0, TTS_MAX);
  if (!text) throw new BadRequest('缺少 text');
  const voice = TTS_VOICES.includes(body.voice) ? body.voice : TTS_VOICES[0];
  const rate = body.rate === 'slow' ? 0.9 : 1.0;
  const key = `${voice}|${rate}|${text}`;
  const hit = ttsCache.get(key);
  if (hit && hit.until > Date.now()) return { url: hit.url, cached: true };
  const fetchImpl = env.__fetch ?? fetch;
  const res = await fetchImpl(env.DASHSCOPE_TTS_URL || DEFAULT_TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DASHSCOPE_API_KEY}` },
    body: JSON.stringify({
      model: env.TTS_MODEL || DEFAULT_TTS_MODEL,
      input: { text, voice, format: 'mp3', sample_rate: 24000, rate },
    }),
  });
  if (!res.ok) {
    const err = new Error(`TTS ${res.status}`);
    err.status = res.status;
    err.detail = (await res.text().catch(() => '')).slice(0, 200);
    throw err;
  }
  const data = await res.json();
  // 百炼返回的音频地址是 http://（阿里云对象存储），安卓正式版不允许播放 http，改成 https（对象存储两种都支持）
  const raw = data?.output?.audio?.url;
  const url = typeof raw === 'string' ? raw.replace(/^http:\/\//, 'https://') : raw;
  if (typeof url !== 'string' || !/^https:\/\//.test(url)) {
    const err = new Error('TTS 没有返回音频地址');
    err.status = 502;
    // 只带回结构（长字符串截断），方便对照文档排查
    err.detail = `TTS 没有返回音频地址：${JSON.stringify(data, (k, v) => (typeof v === 'string' && v.length > 60 ? `${v.slice(0, 60)}…(${v.length})` : v)).slice(0, 400)}`;
    throw err;
  }
  if (ttsCache.size > 3000) ttsCache.clear();
  ttsCache.set(key, { url, until: Date.now() + 23 * 3600 * 1000 });
  return { url };
}
export function _resetTtsCache() {
  ttsCache.clear();
}

// ---------------- 频率限制（每个 Worker 实例内存级，尽力而为） ----------------

const buckets = new Map();
export function rateLimited(key, limitPerMinute, now = Date.now()) {
  const windowStart = now - 60_000;
  const arr = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (arr.length >= limitPerMinute) {
    buckets.set(key, arr);
    return true;
  }
  arr.push(now);
  buckets.set(key, arr);
  return false;
}
export function _resetRateLimit() {
  buckets.clear();
}

// ---------------- 业务接口 ----------------

/** 做题提示：mode=hint 不给答案；mode=explain 答对后讲解 */
export async function handleHint(body, env) {
  const subject = subjectOf(body.subject);
  const grade = gradeOf(body.grade, body.gradeFull);
  const mode = body.mode === 'explain' ? 'explain' : 'hint';
  const question = str(body.question, 300, 'question');
  const options = Array.isArray(body.options) ? body.options.slice(0, 6).map((o, i) => str(o, 60, `options[${i}]`)) : [];
  const answer = str(body.answer, 60, 'answer', mode === 'explain');
  const kp = str(body.knowledgePoint, 40, 'knowledgePoint', false);

  const sys =
    persona(grade) +
    (mode === 'hint'
      ? '现在小朋友在做题时请求提示。只给思路或一个类比的小例子，引导他自己想出来；绝对不要说出答案，也不要说出哪个选项是对的。'
      : '小朋友已经答对了，请用一两句话讲清楚为什么，再鼓励一句。') +
    (subject === 'english' ? '这是英语题，可以中文讲解，英文单词保持原样。' : '');
  const user =
    `科目：${SUBJECT_CN[subject]}。${kp ? `知识点：${kp}。` : ''}题目：${question}` +
    (options.length ? `。选项：${options.join(' / ')}` : '') +
    (mode === 'explain' ? `。正确答案：${answer}` : '');
  let text = cleanOutput(await callLLM(env, [{ role: 'system', content: sys }, { role: 'user', content: user }], { maxTokens: 200 }));

  // 提示模式的双重保险：如果模型仍然说出了正确答案，换成固定的引导语
  if (mode === 'hint' && body.answer) {
    const ans = String(body.answer).trim();
    if (ans && ans.length >= 1 && containsAnswer(text, ans)) {
      text = '先别着急，把题目再慢慢读一遍，想一想题目问的是什么。你一定可以的！';
    }
  }
  return { text };
}

function containsAnswer(text, ans) {
  if (/^\d+$/.test(ans)) return new RegExp(`(^|[^\\d])${ans}([^\\d]|$)`).test(text) && /答案|等于|是\s*\d/.test(text);
  if (ans === '对' || ans === '错' || ans === 'true' || ans === 'false') return /答案是|是对的|是错的|说得对|说得不对/.test(text);
  return text.includes(ans);
}

/** 问问星星宝：最多 6 轮上下文，每句不超过 100 字 */
export async function handleChat(body, env) {
  const subject = ['math', 'chinese', 'english'].includes(body.subject) ? body.subject : 'math';
  const grade = gradeOf(body.grade, body.gradeFull);
  const msgs = Array.isArray(body.messages) ? body.messages.slice(-6) : [];
  if (msgs.length === 0) throw new BadRequest('缺少 messages');
  const history = msgs.map((m, i) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: str(m.content, 100, `messages[${i}]`),
  }));
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  if (lastUser && DISTRESS_INPUT.test(lastUser.content)) return { text: DISTRESS_REPLY, safety: 'distress' };

  const sys =
    persona(grade) +
    `现在是自由提问时间，当前科目：${SUBJECT_CN[subject]}。` +
    (subject === 'english'
      ? '如果小朋友想练英语，用非常简单的英语短句回答（每句不超过 8 个词），后面用括号附上中文意思，并提一个简单的问题让他用英语回答。不要给发音打分。'
      : '如果是数学题，先问他会怎么想，给一步提示，不要直接给最终答案。');
  const text = cleanOutput(await callLLM(env, [{ role: 'system', content: sys }, ...history], { maxTokens: 250, temperature: 0.7 }));
  return { text };
}

/** 给家长的学习分析：只接收知识点名称、正确率和错题题干，不接收任何个人信息 */
export async function handleReport(body, env) {
  const grade = gradeOf(body.grade, body.gradeFull);
  const weak = Array.isArray(body.weakSkills) ? body.weakSkills.slice(0, 8) : [];
  const mistakes = Array.isArray(body.mistakes) ? body.mistakes.slice(0, 8) : [];
  if (weak.length === 0 && mistakes.length === 0) {
    return { text: '目前没有明显的薄弱知识点，继续保持每天 15–20 分钟的学习节奏就很好。' };
  }
  const lines = [
    ...weak.map((w, i) => `- ${str(w.label, 40, `weakSkills[${i}].label`)}：一次答对率 ${Number(w.accuracy) || 0}%（${Number(w.total) || 0} 题）`),
    ...mistakes.map((m, i) => `- 错题：${str(m, 120, `mistakes[${i}]`)}`),
  ];
  const sys =
    `你是${stage(grade)}${GRADE_CN[grade]}年级的教研老师，正在给家长写学习分析。` +
    '要求：中文，不超过 200 字；先用一句话概括孩子的薄弱点和可能原因，再给 3 条家长在家就能做的具体建议（每条一行，以“1.”开头）；语气积极，不贴标签，不制造焦虑；不使用 Markdown。';
  const text = cleanOutput(
    await callLLM(env, [{ role: 'system', content: sys }, { role: 'user', content: `孩子最近的练习情况：\n${lines.join('\n')}` }], {
      maxTokens: 400,
      temperature: 0.5,
    }),
    260,
  );
  return { text };
}

// ---------------- 拍照错题（V4.1：家长拍错题 → 识别题目 → 出同类题） ----------------
//
// 照片只在这一次请求里转给阿里云百炼的视觉模型（通义千问 VL，OpenAI 兼容接口），
// 服务端不保存、不写日志；返回的文字同样去除个人信息。

export const DEFAULT_VL_MODEL = 'qwen3-vl-plus';
const DEFAULT_VL_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
/** 照片大小上限（base64 字符数，约 1.3 MB 图片）；APP 端先压缩到 1280 像素以内 */
export const PHOTO_MAX_CHARS = 1_800_000;

export class PhotoNotConfigured extends Error {}

function imageOf(v) {
  const s = String(v ?? '');
  if (!s) throw new BadRequest('缺少 image');
  if (s.length > PHOTO_MAX_CHARS) throw new BadRequest('照片太大');
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(s)) throw new BadRequest('image 格式不对');
  return s;
}

/** 从模型回复里取出第一个 JSON 对象或数组（模型偶尔会在前后加说明或 ``` 包裹） */
export function extractJson(text) {
  const t = String(text ?? '').replace(/```(?:json)?/g, '');
  const start = t.search(/[[{]/);
  if (start < 0) return null;
  const open = t[start];
  const close = open === '{' ? '}' : ']';
  const end = t.lastIndexOf(close);
  if (end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** 模型返回的文字：去个人信息、去 Markdown、截断；含不良内容时返回空 */
function safeText(v, max) {
  // 只去掉 Markdown 的 * # `；保留 _（英语填空 ___）和 > <（数学比较大小）
  const t = scrubPersonalInfo(String(v ?? ''))
    .replace(/[*#`]/g, '')
    .trim();
  if (BLOCKED_OUTPUT.test(t)) return '';
  return Array.from(t).slice(0, max).join('');
}

async function callVL(env, messages) {
  if (!env.DASHSCOPE_API_KEY) throw new PhotoNotConfigured('DASHSCOPE_API_KEY 未配置');
  const fetchImpl = env.__fetch ?? fetch;
  const res = await fetchImpl(env.DASHSCOPE_VL_URL || DEFAULT_VL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DASHSCOPE_API_KEY}` },
    body: JSON.stringify({
      model: env.DASHSCOPE_VL_MODEL || DEFAULT_VL_MODEL,
      messages,
      enable_thinking: false,
      max_tokens: 800,
      temperature: 0.1,
      stream: false,
    }),
  });
  if (!res.ok) {
    const err = new Error(`VL ${res.status}`);
    err.status = res.status;
    err.detail = (await res.text().catch(() => '')).slice(0, 300);
    throw err;
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

/**
 * 识别一张错题照片。
 * 入参：image（data:image/jpeg;base64,…）、grade、subject（家长选的科目，可空）、
 *       candidates（APP 按科目和年级给出的知识点候选 [{id,name}]，最多 120 个；模型只能从中选）
 * 返回：subject、question（题目文字）、childAnswer（孩子写的答案）、correctAnswer（模型认为的正确答案，可能不准）、
 *       kpId（候选中的一个，或空）、reason（为什么错）
 */
export async function handlePhotoAnalyze(body, env) {
  const image = imageOf(body.image);
  const grade = gradeOf(body.grade, body.gradeFull);
  const hinted = ['math', 'chinese', 'english'].includes(body.subject) ? body.subject : '';
  const candidates = (Array.isArray(body.candidates) ? body.candidates.slice(0, 120) : [])
    .map((c, i) => ({ id: str(c?.id, 60, `candidates[${i}].id`), name: str(c?.name, 40, `candidates[${i}].name`) }));
  const ids = new Set(candidates.map((c) => c.id));

  const sys =
    `你是${stage(grade)}${GRADE_CN[grade]}年级的教研老师，帮家长分析孩子做错的一道题。照片里可能有几道题，只看孩子做错（有红叉、圈出或明显写错）的那一道；看不出哪道错时取第一道。` +
    '只输出一个 JSON 对象，不要任何说明，字段：' +
    '{"subject":"math|chinese|english","question":"题目原文（照抄，不超过200字）","childAnswer":"孩子写的答案，看不清写空","correctAnswer":"正确答案","kpId":"从候选知识点里选最贴切的一个 id，都不合适写空","reason":"一句话说明可能错在哪里（不超过60字）"}。' +
    '不要写出照片里出现的姓名、学校、班级、电话等个人信息。照片里不是题目时，question 写空。';
  const user =
    (hinted ? `家长说这是${SUBJECT_CN[hinted]}题。` : '') +
    (candidates.length ? `候选知识点：${candidates.map((c) => `${c.id}=${c.name}`).join('；')}` : '没有候选知识点，kpId 写空。');

  const raw = await callVL(env, [
    { role: 'system', content: sys },
    { role: 'user', content: [{ type: 'image_url', image_url: { url: image } }, { type: 'text', text: user }] },
  ]);
  const obj = extractJson(raw);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    const err = new Error('识别结果不是 JSON');
    err.status = 502;
    err.detail = '识别结果格式不对，请重拍或换一张清楚的照片';
    throw err;
  }
  const subject = ['math', 'chinese', 'english'].includes(obj.subject) ? obj.subject : hinted || 'math';
  const kpId = typeof obj.kpId === 'string' && ids.has(obj.kpId) ? obj.kpId : '';
  return {
    subject,
    question: safeText(obj.question, 200),
    childAnswer: safeText(obj.childAnswer, 60),
    correctAnswer: safeText(obj.correctAnswer, 60),
    kpId,
    reason: safeText(obj.reason, 80),
  };
}

/**
 * 语文、英语出同类题（数学由 APP 的原创出题程序出，答案由程序保证）。
 * 入参：subject（chinese|english）、grade、question（家长确认后的原题）、knowledgePoint（知识点名称）、count（1–5）
 * 返回：items [{question, options, answer, explain}]；只保留结构正确的题（2–4 个不同选项、答案在选项里）
 */
export async function handlePhotoSimilar(body, env) {
  if (!['chinese', 'english'].includes(body.subject)) throw new BadRequest('subject 只能是 chinese 或 english');
  const subject = body.subject;
  const grade = gradeOf(body.grade, body.gradeFull);
  const question = str(body.question, 300, 'question');
  const kp = str(body.knowledgePoint, 40, 'knowledgePoint', false);
  const count = Math.min(5, Math.max(1, Number(body.count) || 5));
  const sys =
    `你是${stage(grade)}${GRADE_CN[grade]}年级${SUBJECT_CN[subject]}老师，要根据一道孩子做错的题，出 ${count} 道考查同一知识点的选择题。` +
    '要求：难度和原题相当；题目不要照抄原题；每题 3 个选项，只有 1 个正确；内容健康积极；' +
    (subject === 'english' ? '题目和选项用英文，explain 用中文；' : '用简体中文；') +
    '只输出 JSON 数组，不要任何说明：[{"question":"题目","options":["A","B","C"],"answer":"与正确选项完全相同的文字","explain":"一句话讲解（不超过40字）"}]。';
  const user = `${kp ? `知识点：${kp}。` : ''}原题：${question}`;
  const raw = await callLLM(env, [{ role: 'system', content: sys }, { role: 'user', content: user }], { maxTokens: 1200, temperature: 0.7 });
  const arr = extractJson(raw);
  const items = (Array.isArray(arr) ? arr : [])
    .map((it) => {
      const q = safeText(it?.question, 120);
      const options = Array.isArray(it?.options) ? it.options.slice(0, 4).map((o) => safeText(o, 40)) : [];
      const answer = safeText(it?.answer, 40);
      const explain = safeText(it?.explain, 60);
      const unique = new Set(options).size === options.length;
      if (!q || options.length < 2 || options.some((o) => !o) || !unique || !options.includes(answer)) return null;
      return { question: q, options, answer, explain };
    })
    .filter(Boolean)
    .slice(0, count);
  if (items.length === 0) {
    const err = new Error('没有结构正确的题');
    err.status = 502;
    err.genInvalid = true;
    err.detail = '这次没有出好题，请再试一次';
    throw err;
  }
  return { items, generatedBy: 'ai', reviewed: false };
}

// ---------------- HTTP 入口 ----------------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS } });
}

const ROUTES = {
  '/api/tutor/hint': handleHint,
  '/api/tutor/chat': handleChat,
  '/api/tutor/report': handleReport,
  '/api/tts': handleTts,
  '/api/photo/analyze': handlePhotoAnalyze,
  '/api/photo/similar': handlePhotoSimilar,
};

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({
        ok: true,
        llm: !!env.DEEPSEEK_API_KEY,
        model: env.DEEPSEEK_MODEL || DEFAULT_MODEL,
        tts: !!env.DASHSCOPE_API_KEY,
        photo: !!env.DASHSCOPE_API_KEY,
        vlModel: env.DASHSCOPE_VL_MODEL || DEFAULT_VL_MODEL,
      });
    }
    const handler = ROUTES[url.pathname];
    if (!handler || request.method !== 'POST') return json({ ok: false, error: '接口不存在', code: 'NOT_FOUND' }, 404);

    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local';
    // 朗读（/api/tts）单独计数：全 APP 统一童声后，随机出的题目每句都要合成，比提问频繁得多（V2.21）
    const isTts = url.pathname === '/api/tts';
    // 拍照错题单独计数，次数更少（识别照片费用比文字高）
    const isPhoto = url.pathname.startsWith('/api/photo/');
    const limit = isTts
      ? Number(env.TTS_RATE_LIMIT_PER_MINUTE) || 90
      : isPhoto
        ? Number(env.PHOTO_RATE_LIMIT_PER_MINUTE) || 6
        : Number(env.RATE_LIMIT_PER_MINUTE) || 20;
    const bucket = isTts ? `tts:${ip}` : isPhoto ? `photo:${ip}` : ip;
    if (rateLimited(bucket, limit)) return json({ ok: false, error: '请求太频繁，休息一下再问吧', code: 'RATE_LIMITED' }, 429);

    let body;
    try {
      const raw = await request.text();
      // 只有识别照片的接口允许大请求体
      const maxBody = url.pathname === '/api/photo/analyze' ? PHOTO_MAX_CHARS + 20000 : 8000;
      if (raw.length > maxBody) return json({ ok: false, error: '请求太大', code: 'TOO_LARGE' }, 413);
      body = JSON.parse(raw || '{}');
    } catch {
      return json({ ok: false, error: '请求格式错误', code: 'BAD_JSON' }, 400);
    }
    const started = Date.now();
    try {
      const result = await handler(body, env);
      console.log(JSON.stringify({ route: url.pathname, ms: Date.now() - started, ok: true }));
      return json({ ok: true, ...result });
    } catch (e) {
      if (e instanceof BadRequest) return json({ ok: false, error: e.message, code: 'BAD_REQUEST' }, 400);
      if (e instanceof LLMNotConfigured) return json({ ok: false, error: 'AI 服务未配置', code: 'LLM_NOT_CONFIGURED' }, 501);
      if (e instanceof TTSNotConfigured) return json({ ok: false, error: '语音合成未配置', code: 'TTS_NOT_CONFIGURED' }, 501);
      if (e instanceof PhotoNotConfigured) return json({ ok: false, error: '照片识别未配置', code: 'PHOTO_NOT_CONFIGURED' }, 501);
      if (url.pathname === '/api/photo/analyze') {
        // 日志不记录照片和识别内容，只记录状态
        console.log(JSON.stringify({ route: url.pathname, ms: Date.now() - started, ok: false, status: e.status ?? 500 }));
        return json({ ok: false, error: '照片识别暂时不可用', code: 'PHOTO_ERROR', upstream: { status: e.status ?? 500, detail: e.detail ?? e.message } }, 502);
      }
      if (e.genInvalid) {
        return json({ ok: false, error: e.detail, code: 'PHOTO_GEN_INVALID' }, 502);
      }
      if (url.pathname === '/api/tts') {
        console.log(JSON.stringify({ route: url.pathname, ms: Date.now() - started, ok: false, status: e.status ?? 500, detail: e.detail }));
        // 把百炼返回的错误原因（错误码和说明，不含密钥）带回去，方便家长或开发者排查
        return json({ ok: false, error: '语音合成暂时不可用', code: 'TTS_ERROR', upstream: { status: e.status ?? 500, detail: e.detail ?? e.message } }, 502);
      }
      console.log(JSON.stringify({ route: url.pathname, ms: Date.now() - started, ok: false, status: e.status ?? 500 }));
      const code = e.status === 402 ? 'LLM_NO_BALANCE' : e.status === 401 ? 'LLM_BAD_KEY' : e.status === 429 ? 'LLM_BUSY' : 'LLM_ERROR';
      return json({ ok: false, error: 'AI 老师暂时不可用', code }, 502);
    }
  },
};
