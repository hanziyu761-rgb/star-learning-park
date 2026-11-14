/**
 * 年级（V4.3）：家长可以选一～九年级。
 * 七～九年级（初中）目前只有教材目录，没有初中的课程和练习；按年级取内容的地方（练习、每日挑战、知识地图、试卷、游戏、AI 老师）用六年级的；界面汉字不再标拼音。
 */
export const GRADE_CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const ALL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const MAX_CONTENT_GRADE = 6;

/** 要不要隐藏拼音（V5.1）：家长选了“显示 / 不显示”就按家长的；没选过时小学显示、初中不显示 */
export const pinyinHidden = (s: { grade?: number; pinyin?: 'auto' | 'on' | 'off' }) =>
  s.pinyin === 'off' || (s.pinyin !== 'on' && isJunior(s.grade));

/** 初中：七年级及以上 */
export const isJunior = (grade: number | undefined) => (grade ?? 1) >= 7;

/** 取内容用的年级：初中还没有自己的内容，用六年级的 */
export const contentGrade = (grade: number | undefined) => Math.min(Math.max(grade ?? 1, 1), MAX_CONTENT_GRADE);
