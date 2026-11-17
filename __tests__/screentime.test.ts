/** V5.4 护眼与学习时长 */
import { emptyScreenTime, extend, parseScreenTime, REST_SEC, skipRest, status, tick, unlimitedToday, type Limits, type ScreenTime } from '@/screentime/model';

const T0 = new Date(2026, 10, 16, 8, 0, 0).getTime();
const S = 1000;
/** 模拟 APP 一直开着，每 10 秒计时一次，共 sec 秒 */
function run(s: ScreenTime, from: number, sec: number, limits: Limits): [ScreenTime, number] {
  let t = from;
  for (let i = 0; i < sec / 10; i++) {
    t += 10 * S;
    s = tick(s, t, limits);
  }
  return [s, t];
}

describe('护眼与学习时长', () => {
  it('不限制时一直可以用，只记时长', () => {
    const L = { dailyMinutes: 0, breakMinutes: 0 };
    const [s, t] = run(tick(emptyScreenTime(T0), T0, L), T0, 3 * 3600, L);
    expect(status(s, t, L)).toEqual({ kind: 'ok', usedMin: 180 });
  });

  it('连续学 20 分钟休息 5 分钟；休息时不计时，休息完接着学', () => {
    const L = { dailyMinutes: 0, breakMinutes: 20 };
    let [s, t] = run(tick(emptyScreenTime(T0), T0, L), T0, 20 * 60, L);
    expect(status(s, t, L)).toEqual({ kind: 'rest', leftSec: REST_SEC });
    [s, t] = run(s, t, REST_SEC - 10, L);
    expect(status(s, t, L).kind).toBe('rest');
    expect(Math.round(s.usedSec / 60)).toBe(20);
    [s, t] = run(s, t, 20, L);
    expect(status(s, t, L).kind).toBe('ok');
  });

  it('离开 APP 超过 5 分钟算自然休息过了', () => {
    const L = { dailyMinutes: 0, breakMinutes: 20 };
    let [s, t] = run(tick(emptyScreenTime(T0), T0, L), T0, 15 * 60, L);
    t += 10 * 60 * S; // 离开 10 分钟
    s = tick(s, t, L);
    [s, t] = run(s, t, 15 * 60, L);
    expect(status(s, t, L).kind).toBe('ok');
  });

  it('每天 40 分钟用满就停；家长再加 15 分钟；今天不限；第二天重新算', () => {
    const L = { dailyMinutes: 40, breakMinutes: 0 };
    let [s, t] = run(tick(emptyScreenTime(T0), T0, L), T0, 45 * 60, L);
    expect(status(s, t, L)).toEqual({ kind: 'limit', usedMin: 40, limitMin: 40 });
    s = extend(s, t, L);
    expect(status(s, t, L).kind).toBe('ok');
    [s, t] = run(s, t, 16 * 60, L);
    expect(status(s, t, L).kind).toBe('limit');
    expect(status(unlimitedToday(s, t), t, L).kind).toBe('ok');
    const tomorrow = new Date(2026, 10, 17, 8).getTime();
    expect(status(parseScreenTime(JSON.stringify(s), tomorrow), tomorrow, L)).toEqual({ kind: 'ok', usedMin: 0 });
  });

  it('家长可以跳过这次休息；坏数据当作今天刚开始', () => {
    const L = { dailyMinutes: 0, breakMinutes: 15 };
    const [s, t] = run(tick(emptyScreenTime(T0), T0, L), T0, 15 * 60, L);
    expect(status(skipRest(s), t, L).kind).toBe('ok');
    expect(parseScreenTime('乱码', T0)).toEqual(emptyScreenTime(T0));
  });
});

