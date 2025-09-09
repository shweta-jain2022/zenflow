import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/auth-context';
import { useFocus } from '@/contexts/focus-context';
import { useGlobalTimer } from '@/contexts/timer-context';
import { useToast } from '@/hooks/use-toast';

interface TimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  soundEnabled: boolean;
}

export const FocusTimer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setFocusModeActive } = useFocus();
  const timer = useGlobalTimer();
  
  const [settings, setSettings] = useState<TimerSettings>({
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    soundEnabled: true,
  });

  // Update global timer config when settings change
  useEffect(() => {
    timer.updateConfig({
      focusMinutes: settings.focusMinutes,
      shortBreakMinutes: settings.shortBreakMinutes,
      longBreakMinutes: settings.longBreakMinutes,
    });
    // Reset timer to new duration if not currently running
    if (!timer.isRunning) {
      timer.resetTimer(timer.mode);
    }
  }, [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes, timer]);

  const saveSessionMutation = useMutation({
    mutationFn: async (data: { durationMinutes: number; sessionType: string }) => {
      return await apiRequest('POST', '/api/focus-sessions', {
        ...data,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      // Invalidate focus sessions cache to update dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/focus-sessions'] });
    },
  });

  // Calculate progress for the circular progress bar
  const totalSeconds = (() => {
    switch (timer.mode) {
      case 'focus':
        return settings.focusMinutes * 60;
      case 'short_break':
        return settings.shortBreakMinutes * 60;
      case 'long_break':
        return settings.longBreakMinutes * 60;
    }
  })();

  const currentSeconds = timer.minutes * 60 + timer.seconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 352; // 352 is the circumference

  useEffect(() => {
    timer.setOnComplete(() => {
      // Save session to database
      const durationMinutes = (() => {
        switch (timer.mode) {
          case 'focus':
            return settings.focusMinutes;
          case 'short_break':
            return settings.shortBreakMinutes;
          case 'long_break':
            return settings.longBreakMinutes;
        }
      })();

      saveSessionMutation.mutate({
        durationMinutes,
        sessionType: timer.mode,
      });

      // Show notification
      toast({
        title: 'Session Complete!',
        description: `${timer.mode === 'focus' ? 'Focus' : 'Break'} session finished.`,
      });

      // Play notification sound if enabled
      if (settings.soundEnabled) {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    });
  }, [timer, settings, saveSessionMutation, toast]);

  // Track focus mode status for break reminders
  useEffect(() => {
    const isInFocusMode = timer.mode === 'focus' && timer.isRunning;
    setFocusModeActive(isInFocusMode);
  }, [timer.mode, timer.isRunning, setFocusModeActive]);

  const getModeLabel = () => {
    switch (timer.mode) {
      case 'focus':
        return 'Focus Time';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
    }
  };

  const getStatusText = () => {
    if (timer.isRunning) {
      return timer.mode === 'focus' ? 'Stay focused!' : 'Take a break';
    }
    return 'Ready to start';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Focus Timer</h2>
        <p className="text-muted-foreground">Stay focused with Pomodoro or custom intervals</p>
      </div>

      {/* Timer Display */}
      <div className="max-w-md mx-auto">
        <Card className="text-center shadow-lg">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="text-6xl font-mono font-bold text-primary mb-2" data-testid="timer-display">
                {timer.formatTime}
              </div>
              <div className="text-sm text-muted-foreground">{getStatusText()}</div>
              <div className="text-xs text-muted-foreground mt-1">{getModeLabel()}</div>
            </div>

            {/* Progress Ring */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-muted/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-primary transition-all duration-1000"
                  strokeDasharray="352"
                  strokeDashoffset={352 - progress}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {timer.isRunning ? (
                  <Pause className="w-8 h-8 text-primary" />
                ) : (
                  <Play className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={timer.isRunning ? timer.pauseTimer : timer.startTimer}
                size="lg"
                data-testid="button-timer-toggle"
              >
                {timer.isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => timer.resetTimer()}
                size="lg"
                data-testid="button-timer-reset"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Selector */}
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Session Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button
                variant={timer.mode === 'focus' ? 'default' : 'outline'}
                onClick={() => timer.resetTimer('focus')}
                className="flex-1"
                data-testid="button-mode-focus"
              >
                Focus
              </Button>
              <Button
                variant={timer.mode === 'short_break' ? 'default' : 'outline'}
                onClick={() => timer.resetTimer('short_break')}
                className="flex-1"
                data-testid="button-mode-short-break"
              >
                Short Break
              </Button>
              <Button
                variant={timer.mode === 'long_break' ? 'default' : 'outline'}
                onClick={() => timer.resetTimer('long_break')}
                className="flex-1"
                data-testid="button-mode-long-break"
              >
                Long Break
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Settings */}
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              <Settings className="w-4 h-4 inline mr-2" />
              Timer Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Focus Duration</Label>
              <Select
                value={settings.focusMinutes.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, focusMinutes: parseInt(value) })
                }
              >
                <SelectTrigger className="w-32" data-testid="select-focus-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 min (test)</SelectItem>
                  <SelectItem value="25">25 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">
              <Label>Short Break</Label>
              <Select
                value={settings.shortBreakMinutes.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, shortBreakMinutes: parseInt(value) })
                }
              >
                <SelectTrigger className="w-32" data-testid="select-short-break-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center">
              <Label>Long Break</Label>
              <Select
                value={settings.longBreakMinutes.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, longBreakMinutes: parseInt(value) })
                }
              >
                <SelectTrigger className="w-32" data-testid="select-long-break-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="20">20 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Label>Sound Notifications</Label>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, soundEnabled: checked })
                }
                data-testid="switch-sound-notifications"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
