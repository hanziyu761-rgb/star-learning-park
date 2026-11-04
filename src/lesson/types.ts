/**
 * 课程数据结构。
 * 课程内容（src/content）只描述“教什么”，由课程播放器和练习组件负责“怎么展示”。
 * 新增课程只需要写数据，不需要改界面代码。
 */

export type Subject = 'math' | 'chinese' | 'english';

export type SpeechLang = 'zh-CN' | 'en-US';

/** 需要朗读的一段内容 */
export interface Speakable {
  text: string;
  lang: SpeechLang;
}

/** 一个汉字及其拼音；标点等不注音的字符 py 为空 */
export interface PinyinSeg {
  char: string;
  py?: string;
}

/** 带拼音的中文文本 */
export type ZhText = PinyinSeg[];

/** 显示用文本：英文用普通字符串，中文用带拼音的 ZhText */
export type DisplayText = string | ZhText;

export interface Visual {
  /** 系统表情符号，作为第一版配图；后续可替换为原创插画 */
  emoji: string;
  /** 同一个图需要重复显示时的数量（例如 3 个苹果） */
  count?: number;
}

export interface Prompt {
  text: DisplayText;
  /** 进入题目时自动朗读的内容 */
  speak: Speakable;
  /** 英语课的可选中文小提示（默认不显示，点按钮才显示） */
  hintZh?: string;
}

/** 内容来源标注，见 docs/PRD.md「课程内容规范」 */
export type ContentSource =
  | 'original' // 根据课程标准知识点原创
  | 'verified-textbook' // 已核实与某教材对应
  | 'unverified';

// ---------------- 练习题 ----------------

export interface ChoiceOption {
  id: string;
  visual?: Visual;
  text?: DisplayText;
  speak?: Speakable;
}

export interface ChoiceExercise {
  kind: 'choice';
  id: string;
  skill: string;
  prompt: Prompt;
  /** 题干配图，例如“数一数有几个” */
  stem?: { visual?: Visual; text?: DisplayText };
  /** 听音题：显示大喇叭按钮，点击播放 */
  listen?: Speakable;
  options: ChoiceOption[];
  answerId: string;
  /** 认字题隐藏选项上的拼音，避免孩子只看拼音作答 */
  hidePinyin?: boolean;
  /** 选错时的提示 */
  wrongHint: Prompt;
}

export interface TrueFalseExercise {
  kind: 'truefalse';
  id: string;
  skill: string;
  prompt: Prompt;
  statement: { visual?: Visual; text: DisplayText; speak: Speakable };
  answer: boolean;
  wrongHint: Prompt;
}

export interface DragMatchPair {
  id: string;
  item: { visual?: Visual; text?: DisplayText; speak?: Speakable };
  target: { visual?: Visual; text?: DisplayText; speak?: Speakable };
}

export interface DragMatchExercise {
  kind: 'drag-match';
  id: string;
  skill: string;
  prompt: Prompt;
  pairs: DragMatchPair[];
  wrongHint: Prompt;
}

export interface SortExercise {
  kind: 'sort';
  id: string;
  skill: string;
  prompt: Prompt;
  items: { id: string; text: DisplayText; visual?: Visual }[];
  /** 正确顺序（item id） */
  order: string[];
  wrongHint: Prompt;
}

export type Exercise = ChoiceExercise | TrueFalseExercise | DragMatchExercise | SortExercise;

// ---------------- 课程环节 ----------------

export interface TeachCard {
  id: string;
  visual: Visual;
  text: DisplayText;
  /** 小字说明，例如英语单词的音标替代说明，或汉字组词 */
  sub?: DisplayText;
  speak: Speakable;
}

export type LessonStep =
  /** 可视化演示：物品逐个出现并朗读数数 */
  | { kind: 'count-demo'; id: string; title: Prompt; emoji: string; count: number; numberWords: string[] }
  /** 动手操作：把物品拖进篮子 */
  | { kind: 'drag-basket'; id: string; title: Prompt; emoji: string; total: number; target: number; doneSpeak: Speakable }
  /** 动手操作：两堆合起来（加法），孩子把左右两组都拖进篮子再选择答案 */
  | {
      kind: 'combine';
      id: string;
      skill: string;
      title: Prompt;
      emoji: string;
      left: number;
      right: number;
      choices: number[];
      doneSpeak: Speakable;
    }
  /** 点卡片听读，全部听过才能继续 */
  | { kind: 'teach-cards'; id: string; title: Prompt; cards: TeachCard[] }
  /** 一道练习题 */
  | { kind: 'exercise'; id: string; exercise: Exercise }
  /** 开放式思维题：用两种物品凑出目标数量，答案不唯一 */
  | {
      kind: 'open-build';
      id: string;
      skill: string;
      title: Prompt;
      itemA: { emoji: string; name: Speakable };
      itemB: { emoji: string; name: Speakable };
      target: number;
    }
  /** 跟读：听示范，自己大声说，说完自己点“我说了” —— 不做打分 */
  | { kind: 'repeat'; id: string; title: Prompt; items: TeachCard[] }
  /** 情境对话 */
  | { kind: 'dialogue'; id: string; title: Prompt; lines: { speaker: string; text: string; speak: Speakable }[] }
  /** 互动绘本：每页一张图和一句话，点单词可听读 */
  | { kind: 'picture-book'; id: string; title: Prompt; pages: { visual: Visual; text: string; speak: Speakable }[] };

export interface Lesson {
  id: string;
  subject: Subject;
  order: number;
  title: DisplayText;
  /** 给家长看的课程说明 */
  parentSummary: string;
  emoji: string;
  estimatedMinutes: number;
  source: ContentSource;
  sourceNote: string;
  steps: LessonStep[];
}
