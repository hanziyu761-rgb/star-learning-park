import { useLocalSearchParams } from 'expo-router';
import type { Subject } from '@/lesson/types';
import ReviewScreen from '@/screens/ReviewScreen';

export default function ReviewRoute() {
  const { subject } = useLocalSearchParams<{ subject?: Subject }>();
  return <ReviewScreen subject={subject} />;
}
