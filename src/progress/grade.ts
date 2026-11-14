/**
 * 年级（V4.3）：家长可以选一～九年级。
 * V5.2 起七～九年级（初中）有自己的知识点、练习、题库、每日挑战、口算、阅读、单词卡和试卷，按年级取内容的地方直接用初中年级；
 * 初中界面汉字默认不标拼音。
 */
export const GRADE_CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const GRADE_PY = ['', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];
export const ALL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const MAX_CONTENT_GRADE = 9;

/** 要不要隐藏拼音（V5.1）：家长选了“显示 / 不显示”就按家长的；没选过时小学显示、初中不显示 */
export const pinyinHidden = (s: { grade?: number; pinyin?: 'auto' | 'on' | 'off' }) =>
  s.pinyin === 'off' || (s.pinyin !== 'on' && isJunior(s.grade));

/** 初中：七年级及以上 */
export const isJunior = (grade: number | undefined) => (grade ?? 1) >= 7;

/** 取内容用的年级（1～9） */
export const contentGrade = (grade: number | undefined) => Math.min(Math.max(grade ?? 1, 1), MAX_CONTENT_GRADE);

/** 发给 AI 服务的年级：旧版服务只认 1～6（超出时会当成一年级），所以另外带上真实年级 gradeFull（V5.2 服务端认） */
export const aiGrade = (grade: number | undefined) => ({ grade: Math.min(contentGrade(grade), 6), gradeFull: contentGrade(grade) });
