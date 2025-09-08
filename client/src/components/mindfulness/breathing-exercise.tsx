import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square } from 'lucide-react';
import { useBreathing } from '@/hooks/use-breathing';

export const BreathingExercise = () => {
  const breathing = useBreathing();

  const getCircleStyle = () => {
    const baseScale = 1;
    const maxScale = 1.3;
    
    switch (breathing.phase) {
      case 'inhale':
        return {
          transform: `scale(${baseScale + (maxScale - baseScale) * (1 - breathing.secondsLeft / 4)})`,
          opacity: 0.7 + 0.3 * (1 - breathing.secondsLeft / 4),
        };
      case 'hold':
        return {
          transform: `scale(${maxScale})`,
          opacity: 1,
        };
      case 'exhale':
        return {
          transform: `scale(${maxScale - (maxScale - baseScale) * (1 - breathing.secondsLeft / 6)})`,
          opacity: 1 - 0.3 * (1 - breathing.secondsLeft / 6),
        };
      case 'pause':
        return {
          transform: `scale(${baseScale})`,
          opacity: 0.7,
        };
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="bg-gradient-to-br from-secondary/10 via-card to-accent/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Guided Breathing</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          {/* Breathing Animation */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div
              className="w-full h-full bg-gradient-to-br from-secondary to-accent rounded-full transition-all duration-1000 ease-in-out"
              style={breathing.isActive ? getCircleStyle() : { transform: 'scale(1)', opacity: 0.7 }}
              data-testid="breathing-circle"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-semibold text-sm" data-testid="breathing-instruction">
                {breathing.isActive ? breathing.instruction : 'Ready to breathe'}
              </span>
            </div>
          </div>

          {breathing.isActive && (
            <div className="mb-6">
              <div className="text-2xl font-mono font-bold text-foreground mb-1">
                {breathing.secondsLeft}
              </div>
              <div className="text-sm text-muted-foreground">
                {breathing.phase === 'inhale' && 'Breathe in slowly...'}
                {breathing.phase === 'hold' && 'Hold your breath...'}
                {breathing.phase === 'exhale' && 'Breathe out slowly...'}
                {breathing.phase === 'pause' && 'Rest...'}
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-6">
            Follow the circle as it expands and contracts
          </p>

          <div className="flex justify-center space-x-4">
            {!breathing.isActive ? (
              <Button
                onClick={breathing.start}
                className="bg-secondary text-secondary-foreground hover:opacity-90"
                data-testid="button-start-breathing"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Breathing
              </Button>
            ) : (
              <Button
                onClick={breathing.stop}
                variant="outline"
                data-testid="button-stop-breathing"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
