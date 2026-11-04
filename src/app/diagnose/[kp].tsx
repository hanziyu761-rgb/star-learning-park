import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import DiagnoseScreen from '@/screens/DiagnoseScreen';

export default function DiagnoseRoute() {
  const { kp } = useLocalSearchParams<{ kp: string }>();
  return <DiagnoseScreen kp={kp} />;
}
