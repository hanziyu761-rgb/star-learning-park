import { useLocalSearchParams } from 'expo-router';
import type { Subject } from '@/lesson/types';
import ReviewScreen from '@/screens/ReviewScreen';

export default function ReviewRoute() {
  const { subject, grade } = useLocalSearchParams<{ subject?: Subject; grade?: string }>();
  return <ReviewScreen subject={subject} grade={grade ? Number(grade) : undefined} />;
}
