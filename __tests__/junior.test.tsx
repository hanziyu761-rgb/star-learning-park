/** 初中（V4.3）：年级可选到九年级；七年级起不标拼音。V5.2 起初中有自己的内容，按初中年级取 */
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { PinyinText } from '@/components/PinyinText';
import { isPinyinOff, setPinyinOff } from '@/components/pinyinMode';
import { zh } from '@/content/zh';
import { ALL_GRADES, GRADE_CN, contentGrade, isJunior } from '@/progress/grade';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { createEmptyProgress, parseProgress } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { GradeCard } from '@/screens/ParentSettings';

afterEach(() => setPinyinOff(false));

describe('年级', () => {
  it('一～九年级；七年级起是初中', () => {
    expect(ALL_GRADES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(ALL_GRADES.map((g) => GRADE_CN[g]).join('')).toBe('一二三四五六七八九');
    expect(ALL_GRADES.filter(isJunior)).toEqual([7, 8, 9]);
    expect(isJunior(undefined)).toBe(false);
  });
  it('V5.2：初中有自己的练习，取内容时用初中年级（超出范围的收回 1～9）', () => {
    expect([1, 3, 6, 7, 8, 9].map(contentGrade)).toEqual([1, 3, 6, 7, 8, 9]);
    expect(contentGrade(12)).toBe(9);
    expect(contentGrade(0)).toBe(1);
    expect(contentGrade(undefined)).toBe(1);
  });
  it('学习记录里的七年级能保存再读出来', () => {
    const s = createEmptyProgress();
    s.settings.grade = 8;
    expect(parseProgress(JSON.stringify(s))!.settings.grade).toBe(8);
  });
});

describe('初中不标拼音', () => {
  it('开关打开后拼音消失，汉字还在；关掉又出现', async () => {
    await render(<PinyinText text={zh('数学', 'shù xué')} />);
    expect(screen.getByText('shù')).toBeTruthy();
    await act(async () => setPinyinOff(true));
    expect(isPinyinOff()).toBe(true);
    expect(screen.queryByText('shù')).toBeNull();
    expect(screen.getByText('数')).toBeTruthy();
    await act(async () => setPinyinOff(false));
    expect(screen.getByText('xué')).toBeTruthy();
  });
});

describe('家长设置里选年级', () => {
  it('选七年级：出现初中说明，全局不标拼音；改回六年级恢复', async () => {
    await AsyncStorage.clear();
    await render(
      <ProgressProvider>
        <GradeCard />
        <PinyinText text={zh('语文', 'yǔ wén')} />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('grade-9')).toBeTruthy());
    expect(screen.getByText('yǔ')).toBeTruthy();
    expect(screen.queryByTestId('grade-junior-note')).toBeNull();
    fireEvent.press(screen.getByTestId('grade-7'));
    await waitFor(() => expect(screen.getByTestId('grade-junior-note')).toBeTruthy());
    expect(screen.getByTestId('grade-junior-note').props.children).toMatch(/不标拼音.*按七～九年级出题.*已通过教师审核/);
    expect(screen.queryByText('yǔ')).toBeNull();
    expect(screen.getByText('语')).toBeTruthy();
    fireEvent.press(screen.getByTestId('grade-6'));
    await waitFor(() => expect(screen.getByText('yǔ')).toBeTruthy());
  });
});
