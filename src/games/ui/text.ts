/**
 * 游戏乐园界面文字（V2.19）：一、二年级显示拼音（拼音逐字人工填写，content.test 会用词库核对），三年级起显示汉字。
 */
import { zh } from '@/content/zh';
import type { DisplayText } from '@/lesson/types';

const T = {
  hub: zh('游戏乐园', 'yóu xì lè yuán'),
  start: zh('开始游戏', 'kāi shǐ yóu xì'),
  again: zh('再玩一局', 'zài wán yì jú'),
  back: zh('回游戏乐园', 'huí yóu xì lè yuán'),
  next: zh('下一题', 'xià yì tí'),
  nextGuest: zh('下一位客人', 'xià yí wèi kè rén'),
  done: zh('做好啦', 'zuò hǎo la'),
  tooMuch: zh('太多啦，拿出来一些', 'tài duō la ná chū lái yì xiē'),
  tapFood: zh('点一点食材，放进锅里', 'diǎn yi diǎn shí cái fàng jìn guō lǐ'),
  iWant: zh('我要', 'wǒ yào'),
  pot: zh('锅', 'guō'),
  fishTip: zh('钓起读音正确的鱼', 'diào qǐ dú yīn zhèng què de yú'),
  caught: zh('钓到啦', 'diào dào la'),
  swimAway: zh('游走啦，再找一找', 'yóu zǒu la zài zhǎo yi zhǎo'),
  bubbleTip: zh('按顺序戳泡泡', 'àn shùn xù chuō pào pao'),
  great: zh('拼对啦', 'pīn duì la'),
  listen: zh('再听一遍', 'zài tīng yí biàn'),
  rest: zh('今天玩够啦，明天再来吧', 'jīn tiān wán gòu la míng tiān zài lái ba'),
  restEyes: zh('玩了很久啦，休息一下眼睛吧', 'wán le hěn jiǔ la xiū xi yí xià yǎn jing ba'),
  finishedRound: zh('这一局完成啦', 'zhè yì jú wán chéng la'),
  exit: zh('退出', 'tuì chū'),
} as const;

export type GameTextKey = keyof typeof T;
export const GAME_TEXT = T;

/** 三年级起只显示汉字 */
export function gt(key: GameTextKey, grade: number): DisplayText {
  const v = T[key];
  return grade >= 3 ? v.map((s) => s.char).join('') : v;
}
