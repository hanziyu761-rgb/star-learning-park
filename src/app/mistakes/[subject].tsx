import { useLocalSearchParams } from 'expo-router';
import type { Subject } from '@/lesson/types';
import MistakesScreen from '@/screens/MistakesScreen';

export default function MistakesRoute() {
  const { subject } = useLocalSearchParams<{ subject: Subject }>();
  return <MistakesScreen subject={subject} />;
}
