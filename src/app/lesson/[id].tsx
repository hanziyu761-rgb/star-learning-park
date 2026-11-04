import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import LessonScreen from '@/screens/LessonScreen';

export default function LessonRoute() {
  const { id, resume } = useLocalSearchParams<{ id: string; resume?: string }>();
  return <LessonScreen id={id} resume={resume === '1'} />;
}
