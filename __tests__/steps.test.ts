/** V5.4 数学应用题分步讲解：每一步用题目自己的数算出来，最后算出的就是答案 */
import { JUNIOR_GENERATORS } from '@/knowledge/genJunior';
import { UPPER_GENERATORS } from '@/knowledge/genUpper';
import { kpExercise } from '@/knowledge/generators';
import type { ChoiceExercise } from '@/lesson/types';
import { plainText } from '@/content/zh';
import { seeded } from '@/thinking/challenges';

describe('应用题分步讲解', () => {
  it('有分步讲解的题：至少 2 步、讲解里算出的就是答案、没有 NaN / undefined', () => {
    const withSteps = new Set<string>();
    let n = 0;
    for (const [kp, g] of Object.entries({ ...UPPER_GENERATORS, ...JUNIOR_GENERATORS })) {
      const r = seeded(kp.length * 131 + kp.charCodeAt(1));
      for (let i = 0; i < 150; i++) {
        const sig = g.make(r);
        const e = kpExercise(kp, sig) as ChoiceExercise;
        if (!e.steps) continue;
        withSteps.add(kp);
        n++;
        const text = e.steps.join(' ');
        expect([kp, sig, e.steps.length >= 2]).toEqual([kp, sig, true]);
        expect([kp, sig, text]).not.toEqual([kp, sig, expect.stringMatching(/NaN|undefined|Infinity|\[object/)]);
        const ans = plainText(e.options.find((o) => o.id === e.answerId)!.text!).replace(/[°折]$/, '');
        expect([kp, sig, text.includes(ans)]).toEqual([kp, sig, true]);
      }
    }
    expect(n).toBeGreaterThan(500);
    // 二～六年级的周长、面积、倍数、经过时间、三角形内角、鸡兔同笼、植树、体积、分数、圆、折扣利息、圆柱圆锥；初中列方程、方程组、影长
    expect(withSteps.size).toBeGreaterThanOrEqual(15);
  });

  it('改成自己填数的题也带着分步讲解', () => {
    const e = kpExercise('m5.trees', '0:60:5:in');
    expect(e.kind).toBe('input');
    expect('steps' in e && e.steps?.length).toBeGreaterThan(1);
  });
});
