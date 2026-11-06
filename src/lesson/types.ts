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
  /** AI 当场生成的话（V2.18）：家长开启后用云端自然语音朗读，失败时改用手机语音 */
  cloud?: boolean;
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
  /** 代码绘制的图形或钟面；有 figure 时优先显示 figure */
  figure?: Figure;
}

export type ShapeKind = 'circle' | 'triangle' | 'square' | 'rect' | 'rtri' | 'house';

/** 代码绘制的原创图形 */
export type Figure =
  | { type: 'shape'; shape: ShapeKind; color: string; rotation?: number; size?: number }
  | { type: 'clock'; hour: number; minute?: number; size?: number }
  /** 思维挑战题的题图（V2.5）；alt 是给 AI 老师和读屏用的文字说明 */
  | { type: 'puzzle'; puzzle: PuzzleFigure; alt: string; size?: number };

/** 思维挑战题的题图 */
export type PuzzleFigure =
  /** 方格谜题：'' = 空着不用填，'?' = 要填的格，其它为表情符号 */
  | { kind: 'grid'; cells: string[][] }
  /** 天平：每一行左右两边一样重 */
  | { kind: 'balance'; rows: { left: string; leftCount: number; right: string; rightCount: number }[] }
  /** 由小格子拼成的长方形（数长方形 / 正方形） */
  | { kind: 'rects'; rows: number; cols: number; square?: boolean };

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
  /** 答对后显示的讲解（可选） */
  explanation?: string;
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

/** 多选题（V2.11 一题多解）：答案不止一个，全部选出后按“选好了” */
export interface MultiExercise {
  explanation?: string;
  kind: 'multi';
  id: string;
  skill: string;
  prompt: Prompt;
  stem?: { text?: DisplayText };
  options: ChoiceOption[];
  answerIds: string[];
  wrongHint: Prompt;
}

export interface TrueFalseExercise {
  /** 答对后显示的讲解（可选） */
  explanation?: string;
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
  /** 答对后显示的讲解（可选） */
  explanation?: string;
  kind: 'drag-match';
  id: string;
  skill: string;
  prompt: Prompt;
  pairs: DragMatchPair[];
  wrongHint: Prompt;
}

export interface SortExercise {
  /** 答对后显示的讲解（可选） */
  explanation?: string;
  kind: 'sort';
  id: string;
  skill: string;
  prompt: Prompt;
  items: { id: string; text: DisplayText; visual?: Visual }[];
  /** 正确顺序（item id） */
  order: string[];
  wrongHint: Prompt;
}

interface ExerciseBase {
  id: string;
  skill: string;
  prompt: Prompt;
  wrongHint: Prompt;
  /** 答对后显示的讲解（可选） */
  explanation?: string;
}

/** 位置：把会动的小动物拖到格子里的指定位置 */
export interface GridPlaceExercise extends ExerciseBase {
  kind: 'grid-place';
  rows: number;
  cols: number;
  fixed: { row: number; col: number; emoji: string }[];
  mover: string;
  target: { row: number; col: number };
}

/** 位置 / 简单地图：点出指定位置的格子 */
export interface GridTapExercise extends ExerciseBase {
  kind: 'grid-tap';
  rows: number;
  cols: number;
  cells: { row: number; col: number; emoji: string }[];
  target: { row: number; col: number };
}

/** 图形：点出所有符合要求的图形 */
export interface ShapePickExercise extends ExerciseBase {
  kind: 'shape-pick';
  figures: { id: string; visual: Visual }[];
  answerIds: string[];
}

/** 分类：把物品拖进对应的区域 */
export interface BinsExercise extends ExerciseBase {
  kind: 'bins';
  bins: { id: string; label: DisplayText; visual?: Visual }[];
  items: { id: string; visual: Visual; bin: string }[];
}

/** 图形旋转：点一下转 90°，转到和影子一样再放进去 */
export interface RotateExercise extends ExerciseBase {
  kind: 'rotate';
  shape: ShapeKind;
  color: string;
  start: number;
  target: number;
}

/** 拨钟：拖动分针（时针随之转动），拨到指定整时 */
export interface ClockSetExercise extends ExerciseBase {
  kind: 'clock-set';
  scene?: Visual;
  targetHour: number;
  /** 起始时间（从 0:00 起的分钟数） */
  startMinutes: number;
}

/** 找规律：把正确的图形拖进空位 */
export interface PatternExercise extends ExerciseBase {
  kind: 'pattern-fill';
  /** null 表示空位 */
  sequence: (PatternToken | null)[];
  palette: PatternToken[];
  /** 每个空位的正确 token id（按空位顺序） */
  answers: string[];
}

export interface PatternToken {
  id: string;
  visual?: Visual;
  text?: string;
}

/** 自己作答：用数字键盘填答案（V2.9）。answer 例：12、3.5、3/4、7……2 */
export interface InputExercise {
  explanation?: string;
  kind: 'input';
  id: string;
  skill: string;
  prompt: Prompt;
  stem?: { visual?: Visual; text?: DisplayText };
  answer: string;
  wrongHint: Prompt;
}

/** 描红写字：按笔顺一笔一笔描（V2.9）。strokes 为每一笔的折线，坐标 0～100（田字格） */
export interface TraceExercise {
  explanation?: string;
  kind: 'trace';
  id: string;
  skill: string;
  prompt: Prompt;
  char: string;
  strokes: { name: string; points: [number, number][] }[];
  wrongHint: Prompt;
}

export type Exercise =
  | InputExercise
  | TraceExercise
  | ChoiceExercise
  | MultiExercise
  | TrueFalseExercise
  | DragMatchExercise
  | SortExercise
  | GridPlaceExercise
  | GridTapExercise
  | ShapePickExercise
  | BinsExercise
  | RotateExercise
  | ClockSetExercise
  | PatternExercise;

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
  | {
      kind: 'drag-basket';
      id: string;
      title: Prompt;
      emoji: string;
      total: number;
      target: number;
      doneSpeak: Speakable;
    }
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
  /** 中文短文阅读（V2.10）：一段带拼音的短文，可以听整篇 */
  | { kind: 'read-passage'; id: string; title: Prompt; visual: Visual; paragraphs: DisplayText[]; speak: Speakable }
  /** 互动绘本：每页一张图和一句话，点单词可听读 */
  | { kind: 'picture-book'; id: string; title: Prompt; pages: { visual: Visual; text: string; speak: Speakable }[] };

export interface Lesson {
  id: string;
  subject: Subject;
  order: number;
  /** 英语启蒙主线（V2.8）：交流 / 拼读 / 分级阅读 */
  track?: 'talk' | 'phonics' | 'reading' | 'zhread';
  /** 适用年级（V2.14 阅读小屋按年级显示；不填为一年级） */
  grade?: number;
  title: DisplayText;
  /** 给家长看的课程说明 */
  parentSummary: string;
  emoji: string;
  estimatedMinutes: number;
  source: ContentSource;
  sourceNote: string;
  steps: LessonStep[];
}
