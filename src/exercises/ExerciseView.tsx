import React from 'react';
import type { Exercise } from '@/lesson/types';
import { ChoiceExercise } from './ChoiceExercise';
import { InputExercise } from './InputExercise';
import { MultiExercise } from './MultiExercise';
import { TraceExercise } from './TraceExercise';
import { ClockSetExercise } from './ClockSetExercise';
import { GridPlaceExercise, GridTapExercise } from './GridExercises';
import { PatternFillExercise } from './PatternFillExercise';
import { BinsExercise, RotateExercise, ShapePickExercise } from './ShapeExercises';
import type { ExerciseProps } from './common';
import { DragMatchExercise } from './DragMatchExercise';
import { SortExercise } from './SortExercise';
import { TrueFalseExercise } from './TrueFalseExercise';

/** 根据题型选择对应的练习组件，课程内容只需要写数据 */
export function ExerciseView(props: ExerciseProps<Exercise>) {
  const { exercise } = props;
  switch (exercise.kind) {
    case 'input':
      return <InputExercise {...props} exercise={exercise} />;
    case 'trace':
      return <TraceExercise {...props} exercise={exercise} />;
    case 'choice':
      return <ChoiceExercise {...props} exercise={exercise} />;
    case 'multi':
      return <MultiExercise {...props} exercise={exercise} />;
    case 'truefalse':
      return <TrueFalseExercise {...props} exercise={exercise} />;
    case 'drag-match':
      return <DragMatchExercise {...props} exercise={exercise} />;
    case 'sort':
      return <SortExercise {...props} exercise={exercise} />;
    case 'grid-place':
      return <GridPlaceExercise {...props} exercise={exercise} />;
    case 'grid-tap':
      return <GridTapExercise {...props} exercise={exercise} />;
    case 'shape-pick':
      return <ShapePickExercise {...props} exercise={exercise} />;
    case 'bins':
      return <BinsExercise {...props} exercise={exercise} />;
    case 'rotate':
      return <RotateExercise {...props} exercise={exercise} />;
    case 'clock-set':
      return <ClockSetExercise {...props} exercise={exercise} />;
    case 'pattern-fill':
      return <PatternFillExercise {...props} exercise={exercise} />;
  }
}
