import { useLocalSearchParams } from 'expo-router';
import GameScreen from '@/screens/GameScreen';

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GameScreen id={id} />;
}
