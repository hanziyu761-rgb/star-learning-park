import React from 'react';
import type { Exercise } from '@/lesson/types';
import { ChoiceExercise } from './ChoiceExercise';
import type { ExerciseProps } from './common';
import { DragMatchExercise } from './DragMatchExercise';
import { SortExercise } from './SortExercise';
import { TrueFalseExercise } from './TrueFalseExercise';

/** 根据题型选择对应的练习组件，课程内容只需要写数据 */
export function ExerciseView(props: ExerciseProps<Exercise>) {
  const { exercise } = props;
  switch (exercise.kind) {
    case 'choice':
      return <ChoiceExercise {...props} exercise={exercise} />;
    case 'truefalse':
      return <TrueFalseExercise {...props} exercise={exercise} />;
    case 'drag-match':
      return <DragMatchExercise {...props} exercise={exercise} />;
    case 'sort':
      return <SortExercise {...props} exercise={exercise} />;
  }
}
