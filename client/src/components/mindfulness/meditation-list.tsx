import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface MeditationSession {
  id: string;
  name: string;
  description: string;
  duration: number;
  category: string;
}

const meditationSessions: MeditationSession[] = [
  {
    id: '1',
    name: 'Morning Mindfulness',
    description: 'A gentle way to start your day with intention',
    duration: 10,
    category: 'morning',
  },
  {
    id: '2',
    name: 'Stress Relief',
    description: 'Let go of tension and find your center',
    duration: 15,
    category: 'stress',
  },
  {
    id: '3',
    name: 'Deep Focus',
    description: 'Enhance concentration and mental clarity',
    duration: 20,
    category: 'focus',
  },
  {
    id: '4',
    name: 'Bedtime Peace',
    description: 'Prepare for restful, rejuvenating sleep',
    duration: 25,
    category: 'sleep',
  },
];

export const MeditationList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playingSession, setPlayingSession] = useState<string | null>(null);

  const saveMeditationMutation = useMutation({
    mutationFn: async (data: { sessionName: string; durationMinutes: number }) => {
      return await apiRequest('POST', '/api/meditations', {
        ...data,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meditations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/stats'] });
    },
  });

  const handlePlaySession = (session: MeditationSession) => {
    setPlayingSession(session.id);
    
    // Simulate meditation session
    toast({
      title: 'Meditation Started',
      description: `Enjoying ${session.name} - ${session.duration} minutes`,
    });

    // Auto-complete after duration (for demo purposes, we'll use a shorter time)
    setTimeout(() => {
      setPlayingSession(null);
      saveMeditationMutation.mutate({
        sessionName: session.name,
        durationMinutes: session.duration,
      });
      
      toast({
        title: 'Meditation Complete',
        description: `Well done! You completed ${session.name}`,
      });
    }, session.duration * 100); // 100ms per "minute" for demo
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meditation Library</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meditationSessions.map((session) => (
            <div
              key={session.id}
              className="p-4 bg-background rounded-lg border border-border hover:shadow-sm transition-shadow"
              data-testid={`meditation-session-${session.id}`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">{session.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">{session.duration} min</span>
                    <Button
                      size="sm"
                      variant={playingSession === session.id ? 'default' : 'outline'}
                      onClick={() => handlePlaySession(session)}
                      disabled={playingSession === session.id}
                      data-testid={`button-play-meditation-${session.id}`}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {playingSession === session.id ? 'Playing...' : 'Play'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
