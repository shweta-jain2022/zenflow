import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useGuestRestriction } from '@/hooks/use-guest-restriction';

type MoodType = 'great' | 'good' | 'okay' | 'stressed' | 'sad';

const moodOptions = [
  { value: 'great' as MoodType, emoji: '😄', label: 'Great' },
  { value: 'good' as MoodType, emoji: '😊', label: 'Good' },
  { value: 'okay' as MoodType, emoji: '😐', label: 'Okay' },
  { value: 'stressed' as MoodType, emoji: '😰', label: 'Stressed' },
  { value: 'sad' as MoodType, emoji: '😢', label: 'Sad' },
];

export const MoodSelector = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkGuestRestriction } = useGuestRestriction();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);

  const saveMoodMutation = useMutation({
    mutationFn: async (mood: MoodType) => {
      return await apiRequest('POST', '/api/moods', {
        mood,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moods'] });
      toast({
        title: 'Mood logged',
        description: 'Your mood has been recorded for today.',
      });
      setSelectedMood(null);
    },
  });

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
  };

  const handleSubmit = () => {
    if (checkGuestRestriction('log mood')) {
      return;
    }
    
    if (selectedMood) {
      saveMoodMutation.mutate(selectedMood);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling today?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleMoodSelect(option.value)}
              className={`
                p-4 rounded-xl bg-background border-2 transition-colors text-center
                ${selectedMood === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent hover:border-primary/50'
                }
              `}
              data-testid={`mood-option-${option.value}`}
            >
              <div className="text-3xl mb-2">{option.emoji}</div>
              <div className="text-xs text-muted-foreground">{option.label}</div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedMood || saveMoodMutation.isPending}
          className="w-full"
          data-testid="button-save-mood"
        >
          {saveMoodMutation.isPending ? 'Saving...' : 'Log Today\'s Mood'}
        </Button>
      </CardContent>
    </Card>
  );
};
