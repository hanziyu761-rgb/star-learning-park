import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import React from 'react';
import { Text } from 'react-native';
import { mathAddLesson } from '@/content/math';
import { zh, zhPrompt } from '@/content/zh';
import { ParentGate } from '@/components/ParentGate';
import { PinyinText } from '@/components/PinyinText';
import { ChoiceExercise } from '@/exercises/ChoiceExercise';
import { SortExercise } from '@/exercises/SortExercise';
import { TrueFalseExercise } from '@/exercises/TrueFalseExercise';
import type {
  ChoiceExercise as ChoiceData,
  SortExercise as SortData,
  TrueFalseExercise as TFData,
} from '@/lesson/types';
import { ProgressProvider, useProgress } from '@/progress/ProgressContext';
import { flushProgressWrites } from '@/progress/storage';

// 这里测手机语音：不带预先录好的录音（录音播放见 clips.test.ts）
jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { f: {}, m: {}, c: {} } }));

const choice = (
  mathAddLesson.steps.find((s) => s.kind === 'exercise' && s.exercise.id === 'count-strawberry') as {
    exercise: ChoiceData;
  }
).exercise;

describe('上注音组件', () => {
  it('每个汉字上方显示对应拼音，可隐藏拼音', async () => {
    const { rerender } = await render(<PinyinText text={zh('日月', 'rì yuè')} />);
    expect(screen.getByText('rì')).toBeTruthy();
    expect(screen.getByText('月')).toBeTruthy();
    await rerender(<PinyinText text={zh('日月', 'rì yuè')} hidePinyin />);
    expect(screen.queryByText('rì')).toBeNull();
  });
});

describe('选择题', () => {
  it('答错给提示可重试，答对后报告“非一次答对、尝试 2 次”', async () => {
    const onSolved = jest.fn();
    const onFeedback = jest.fn();
    await render(<ChoiceExercise exercise={choice} lang="zh" onFeedback={onFeedback} onSolved={onSolved} />);
    await fireEvent.press(screen.getByTestId('option-3'));
    expect(onFeedback).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'wrong' }));
    expect(onSolved).not.toHaveBeenCalled();
    // 已答错的选项不能重复计数
    await fireEvent.press(screen.getByTestId('option-3'));
    await fireEvent.press(screen.getByTestId('option-4'));
    expect(onFeedback).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'correct' }));
    expect(onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
    // 答对后再点不会重复报告
    await fireEvent.press(screen.getByTestId('option-5'));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it('一次答对', async () => {
    const onSolved = jest.fn();
    await render(<ChoiceExercise exercise={choice} lang="zh" onFeedback={() => {}} onSolved={onSolved} />);
    await fireEvent.press(screen.getByTestId('option-4'));
    expect(onSolved).toHaveBeenCalledWith({ firstTryCorrect: true, attempts: 1 });
  });

  it('听音题会朗读要听的内容', async () => {
    const ex: ChoiceData = {
      ...choice,
      id: 'listen',
      stem: undefined,
      listen: { text: '水', lang: 'zh-CN' },
    };
    await render(<ChoiceExercise exercise={ex} lang="zh" onFeedback={() => {}} onSolved={() => {}} />);
    (Speech.speak as jest.Mock).mockClear();
    await fireEvent.press(screen.getByTestId('listen-button'));
    expect(Speech.speak).toHaveBeenCalledWith('水', expect.objectContaining({ language: 'zh-CN' }));
  });
});

describe('正误判断', () => {
  it('判断正确后完成', async () => {
    const ex: TFData = {
      kind: 'truefalse',
      id: 'tf',
      skill: 'zh.sentence',
      prompt: zhPrompt('说得对吗？', 'shuō de duì ma'),
      statement: { text: zh('这是水。', 'zhè shì shuǐ'), speak: { text: '这是水', lang: 'zh-CN' } },
      answer: false,
      wrongHint: zhPrompt('再看看', 'zài kàn kan'),
    };
    const onSolved = jest.fn();
    await render(<TrueFalseExercise exercise={ex} lang="zh" onFeedback={() => {}} onSolved={onSolved} />);
    await fireEvent.press(screen.getByTestId('tf-false'));
    expect(onSolved).toHaveBeenCalledWith({ firstTryCorrect: true, attempts: 1 });
  });
});

describe('排序', () => {
  it('点错顺序有提示，按顺序点完后完成', async () => {
    const ex: SortData = {
      kind: 'sort',
      id: 'sort',
      skill: 'math.order',
      prompt: zhPrompt('从小到大', 'cóng xiǎo dào dà'),
      items: [
        { id: '2', text: '2' },
        { id: '1', text: '1' },
        { id: '3', text: '3' },
      ],
      order: ['1', '2', '3'],
      wrongHint: zhPrompt('先找最小的数', 'xiān zhǎo zuì xiǎo de shù'),
    };
    const onSolved = jest.fn();
    const onFeedback = jest.fn();
    await render(<SortExercise exercise={ex} lang="zh" onFeedback={onFeedback} onSolved={onSolved} />);
    await fireEvent.press(screen.getByTestId('sort-2'));
    expect(onFeedback).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'wrong' }));
    await fireEvent.press(screen.getByTestId('sort-1'));
    await fireEvent.press(screen.getByTestId('sort-2'));
    await fireEvent.press(screen.getByTestId('sort-3'));
    // 尝试次数 = 出错次数 + 最终完成 1 次
    expect(onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
  });
});

describe('家长验证', () => {
  it('答错不能进入，答对才能进入', async () => {
    const onPass = jest.fn();
    const rand = () => 0; // 题目固定为 6 × 6
    await render(<ParentGate onPass={onPass} rand={rand} />);
    expect(screen.getByTestId('gate-question')).toHaveTextContent('6 × 6 = ?');
    await fireEvent.press(screen.getByTestId('key-3'));
    await fireEvent.press(screen.getByTestId('key-确定'));
    expect(onPass).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('key-3'));
    await fireEvent.press(screen.getByTestId('key-6'));
    await fireEvent.press(screen.getByTestId('key-确定'));
    expect(onPass).toHaveBeenCalled();
  });
});

describe('进度 Provider：关闭 APP 后重新打开', () => {
  function Probe() {
    const { status, state, dispatch } = useProgress();
    return (
      <>
        <Text testID="status">{status}</Text>
        <Text testID="stars">{state.totalStars}</Text>
        <Text
          testID="finish"
          onPress={() => {
            dispatch({ type: 'lesson/start', lessonId: 'L', subject: 'math', now: 1000, resume: false });
            dispatch({ type: 'lesson/complete', lessonId: 'L', subject: 'math', now: 2000 });
          }}
        >
          finish
        </Text>
      </>
    );
  }

  beforeEach(() => AsyncStorage.clear());

  it('完成课程后卸载，再次挂载能读回星星', async () => {
    const first = await render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ready'));
    await fireEvent.press(screen.getByTestId('finish'));
    expect(screen.getByTestId('stars')).toHaveTextContent('3');
    await act(async () => {
      await flushProgressWrites();
    });
    await first.unmount();

    await render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ready'));
    expect(screen.getByTestId('stars')).toHaveTextContent('3');
  });
});
