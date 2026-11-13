/** V5.0 设计系统：浅色 / 深色配色、外观设置、文字对比度、弹簧按钮 */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable } from '@/components/Tappable';
import { createEmptyProgress, parseProgress } from '@/progress/model';
import { ProgressProvider, useProgress } from '@/progress/ProgressContext';
import { AppearanceCard } from '@/screens/ParentSettings';
import { colors, getScheme, palettes, setScheme, subjectTheme, themed } from '@/theme';

afterEach(() => setScheme('light'));

/** WCAG 对比度 */
function contrast(a: string, b: string) {
  const lum = (h: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

describe('配色', () => {
  it('colors / subjectTheme 跟着当前配色取值；样式表按配色各生成一份', () => {
    const styles = themed(() => StyleSheet.create({ box: { backgroundColor: colors.card, color: colors.text } }));
    expect(colors.bg).toBe(palettes.light.bg);
    expect(styles.box.backgroundColor).toBe('#FFFFFF');
    setScheme('dark');
    expect(getScheme()).toBe('dark');
    expect(colors.bg).toBe('#000000'); // OLED 纯黑
    expect(styles.box.backgroundColor).toBe('#1C1C1E');
    expect(subjectTheme.math.color).not.toBe('#4A76A0');
    expect({ ...colors }.text).toBe('#F5F5F7'); // 展开写法也拿到深色
  });

  it('文字对比度：正文 ≥ 7，彩色文字在卡片上 ≥ 4.5（浅色、深色都检查）', () => {
    for (const s of ['light', 'dark'] as const) {
      const p = palettes[s];
      setScheme(s);
      expect(contrast(p.text, p.bg)).toBeGreaterThanOrEqual(7);
      expect(contrast(p.textSoft, p.card)).toBeGreaterThanOrEqual(4.5);
      for (const k of ['primary', 'correct', 'wrong', 'parent', 'blue', 'orange'] as const) {
        expect([s, k, contrast(p[k], p.card) >= 4.5]).toEqual([s, k, true]);
      }
      for (const sub of ['math', 'chinese', 'english'] as const) {
        expect([s, sub, contrast(subjectTheme[sub].color, p.card) >= 4.5]).toEqual([s, sub, true]);
        // 学科色按钮上的文字（浅色白字、深色黑字）
        expect(contrast(p.onAccent, subjectTheme[sub].color)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('没有刺眼的霓虹色：主要颜色的彩度（最亮通道减最暗通道）都不超过 0.4（旧版橙色 #FF8A3D 是 0.76）', () => {
    const sat = (h: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
      return Math.max(r, g, b) - Math.min(r, g, b);
    };
    expect(sat('#FF8A3D')).toBeGreaterThan(0.4);
    for (const s of ['light', 'dark'] as const) {
      setScheme(s);
      for (const c of [palettes[s].primary, palettes[s].correct, palettes[s].wrong, palettes[s].parent, ...(['math', 'chinese', 'english'] as const).map((k) => subjectTheme[k].color)]) {
        expect([c, sat(c) <= 0.4]).toEqual([c, true]);
      }
    }
  });
});

describe('外观设置', () => {
  it('旧记录没有外观设置：按跟随手机；不认识的值也按跟随手机；选过的保留', () => {
    const old = createEmptyProgress() as unknown as { settings: Record<string, unknown> };
    delete old.settings.appearance;
    expect(parseProgress(JSON.stringify(old))!.settings.appearance).toBe('system');
    old.settings.appearance = 'purple';
    expect(parseProgress(JSON.stringify(old))!.settings.appearance).toBe('system');
    old.settings.appearance = 'dark';
    expect(parseProgress(JSON.stringify(old))!.settings.appearance).toBe('dark');
  });

  it('家长选“深色”后全 APP 换成深色；选“浅色”换回', async () => {
    await AsyncStorage.clear();
    function Probe() {
      const { scheme } = useProgress();
      return <Text testID="probe" style={{ color: colors.text }}>{scheme}</Text>;
    }
    await render(
      <ProgressProvider>
        <AppearanceCard />
        <Probe />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('appearance-dark')).toBeTruthy());
    expect(screen.getByTestId('probe').props.children).toBe('light');
    fireEvent.press(screen.getByTestId('appearance-dark'));
    await waitFor(() => expect(screen.getByTestId('probe').props.children).toBe('dark'));
    expect(screen.getByTestId('probe').props.style.color).toBe('#F5F5F7');
    expect(screen.getByTestId('appearance-dark').props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByTestId('appearance-light'));
    await waitFor(() => expect(screen.getByTestId('probe').props.children).toBe('light'));
  });
});

describe('弹簧按钮', () => {
  it('和原来的 Pressable 用法一样：点击、禁用、按下样式函数都照常工作', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <Pressable testID="a" onPress={onPress} style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.5 }]}>
          <Text>A</Text>
        </Pressable>
        <Pressable testID="b" onPress={onPress} disabled>
          <Text>B</Text>
        </Pressable>
      </>,
    );
    fireEvent.press(screen.getByTestId('a'));
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
