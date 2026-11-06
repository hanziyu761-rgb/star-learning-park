/**
 * 刷卡一轮（V2.18，纯函数）：
 * - 点“记住了”：这一轮这个词不再出现
 * - 点“没记住”：隔 3 张卡后再出现一次（剩下不到 3 张就排到最后），卡片上标“第几次出现”
 * - “随机下一个”：从还没记住的词里随机换一张
 * 全部记住时 done = true。
 */
export interface Round {
  /** 待看的卡（第一张是当前卡） */
  queue: string[];
  remembered: string[];
  /** 每张卡已经出现的次数（当前卡已计入） */
  shown: Record<string, number>;
  total: number;
}

export const AGAIN_AFTER = 3;

export function startRound(ids: string[]): Round {
  const queue = [...ids];
  return { queue, remembered: [], shown: queue.length ? { [queue[0]]: 1 } : {}, total: ids.length };
}

function show(r: Round, queue: string[]): Round {
  const shown = { ...r.shown };
  if (queue[0] !== undefined) shown[queue[0]] = (shown[queue[0]] ?? 0) + 1;
  return { ...r, queue, shown };
}

export const current = (r: Round): string | undefined => r.queue[0];
export const timesShown = (r: Round, id: string): number => r.shown[id] ?? 0;
export const isDone = (r: Round): boolean => r.total > 0 && r.remembered.length >= r.total;

export function remember(r: Round): Round {
  const id = r.queue[0];
  if (id === undefined) return r;
  return show({ ...r, remembered: [...r.remembered, id] }, r.queue.slice(1));
}

export function forget(r: Round): Round {
  const id = r.queue[0];
  if (id === undefined) return r;
  const rest = r.queue.slice(1);
  const at = Math.min(AGAIN_AFTER, rest.length);
  return show(r, [...rest.slice(0, at), id, ...rest.slice(at)]);
}

/** 随机换一张还没记住的卡（不会换回同一张，除非只剩一张） */
export function randomNext(r: Round, rand: () => number): Round {
  if (r.queue.length <= 1) return r;
  const i = 1 + Math.floor(rand() * (r.queue.length - 1));
  const q = [...r.queue];
  const [picked] = q.splice(i, 1);
  // 当前卡放回队尾，抽中的卡变成当前卡
  const cur = q.shift()!;
  return show(r, [picked, ...q, cur]);
}

/** 跳到指定的卡（记忆窍门、关系图里点单词）：这张卡变成当前卡 */
export function jumpTo(r: Round, id: string): Round {
  if (r.queue[0] === id) return r;
  const q = r.queue.filter((x) => x !== id);
  if (q.length === r.queue.length && r.remembered.includes(id)) {
    // 已经记住的卡也可以再看，看完重新算作待看
    return show({ ...r, remembered: r.remembered.filter((x) => x !== id) }, [id, ...q]);
  }
  return show(r, [id, ...q]);
}

/** 当前时间（收藏、听写记录用；只在点击事件里调用） */
export const clickTime = (): number => Date.now();
