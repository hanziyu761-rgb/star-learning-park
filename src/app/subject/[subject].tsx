import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import SubjectScreen from '@/screens/SubjectScreen';

export default function SubjectRoute() {
  const { subject } = useLocalSearchParams<{ subject: string }>();
  return <SubjectScreen subject={subject} />;
}
