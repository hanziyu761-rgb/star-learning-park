import { layoutFor } from '@/components/useLayout';
import app from '../app.json';

describe('V2.20 平板与横屏', () => {
  it('手机（短边 < 600）不算平板，不放大', () => {
    expect(layoutFor(360, 640)).toMatchObject({ tablet: false, landscape: false, wide: false, k: 1 });
    expect(layoutFor(412, 915)).toMatchObject({ tablet: false, k: 1 });
  });
  it('平板竖屏：放大一档，但不分两栏', () => {
    expect(layoutFor(800, 1280)).toMatchObject({ tablet: true, landscape: false, wide: false, k: 1.25 });
  });
  it('平板横屏：左右两栏', () => {
    expect(layoutFor(1280, 800)).toMatchObject({ tablet: true, landscape: true, wide: true });
    expect(layoutFor(1366, 1024).wide).toBe(true);
  });
  it('app.json 不再锁死竖屏（手机由 OrientationGate 锁竖屏）', () => {
    expect(app.expo.orientation).toBe('default');
  });
});
