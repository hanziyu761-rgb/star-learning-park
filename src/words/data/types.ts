/** 单词卡原始数据：一个单元一段文字，每行“单词|中文意思|例句|例句中文” */
export type UnitTheme = 'family' | 'colors' | 'numbers' | 'days' | 'months' | 'seasons' | 'ordinals' | 'time';

export interface RawUnit {
  id: string;
  grade: number;
  /** 例如“三年级上册”；启蒙单元为“启蒙” */
  book: string;
  title: string;
  theme?: UnitTheme;
  lines: string;
}
