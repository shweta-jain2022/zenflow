import { BreathingExercise } from '@/components/mindfulness/breathing-exercise';
import { MeditationList } from '@/components/mindfulness/meditation-list';

export default function MindfulnessPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Mindfulness</h2>
        <p className="text-muted-foreground">Take a moment to breathe and center yourself</p>
      </div>

      <BreathingExercise />
      <MeditationList />
    </div>
  );
}
