import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import PracticeScreen from '@/screens/PracticeScreen';

export default function PracticeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PracticeScreen id={id} />;
}
