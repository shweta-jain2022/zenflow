import { MoodSelector } from '@/components/mood/mood-selector';
import { JournalEntry } from '@/components/mood/journal-entry';

export default function MoodPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Mood & Journal</h2>
        <p className="text-muted-foreground">Track your emotional well-being and reflect on your day</p>
      </div>

      <MoodSelector />
      <JournalEntry />
    </div>
  );
}
