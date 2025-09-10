import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Profile } from '@shared/schema';
import { useAuth } from '@/contexts/auth-context';
import { useFocus } from '@/contexts/focus-context';

const BREAK_ACTIVITIES = {
  '2': [
    '🌬️ Do deep breathing: inhale 4 sec, hold 4 sec, exhale 6 sec.',
    '🧘 Quick neck & shoulder stretch at your desk.',
    '🎵 Play one upbeat song snippet or hum along.',
    '👀 Eye refresh: follow the 20-20-20 rule (look 20 feet away for 20 seconds).'
  ],
  '5': [
    '🏃 Walk around your room/office to boost circulation.',
    '📱 Send a kind message or emoji to a friend/family.',
    '📝 Jot down 1 thing you\'re grateful for.',
    '💪 Do 10 push-ups, squats, or chair dips.',
    '🌿 Step outside for fresh air (balcony/window works too).'
  ],
  '10': [
    '🍎 Have a mindful snack (fruit, nuts, dark chocolate).',
    '🎧 Listen to a short podcast or guided meditation.',
    '✍️ Quick journaling: "How am I feeling right now?"',
    '🎨 Do a tiny doodle or sketch to unlock creativity.',
    '🌞 Stand in sunlight for a mini energy reset.'
  ],
  '15': [
    '🚶 Take a short walk outside — nature if possible.',
    '📚 Read a few pages of a book you enjoy.',
    '🧘 Try a short yoga flow/stretch routine.',
    '🎶 Play or practice a musical instrument.',
    '☕ Make yourself a proper tea/coffee and savor it mindfully.'
  ]
};

export const BreakReminder = () => {
  const { user, isGuest } = useAuth();
  const { isFocusModeActive } = useFocus();
  const [showReminder, setShowReminder] = useState(false);
  const [currentActivity, setCurrentActivity] = useState('');
  const [lastFocusEndTime, setLastFocusEndTime] = useState<Date | null>(null);
  const [breakTimer, setBreakTimer] = useState(0); // Timer in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const wasFocusModeActive = useRef(isFocusModeActive);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user profile to check break settings and work hours
  const { data: profile } = useQuery<Profile>({
    queryKey: ['/api/profiles'],
    enabled: !!user && !isGuest,
  });

  // Function to get random activity based on break duration
  const getRandomActivity = (duration: string) => {
    const activities = BREAK_ACTIVITIES[duration as keyof typeof BREAK_ACTIVITIES] || BREAK_ACTIVITIES['5'];
    const randomIndex = Math.floor(Math.random() * activities.length);
    return activities[randomIndex];
  };

  // Function to check if we're in work hours
  const isInWorkHours = () => {
    if (!profile?.workStartTime || !profile?.workEndTime) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    // Parse work hours (format: "HH:MM:SS")
    const [startHour, startMin] = profile.workStartTime.split(':').map(Number);
    const [endHour, endMin] = profile.workEndTime.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  };

  // Function to get next break reminder time
  const getNextBreakTime = () => {
    if (!profile?.workStartTime || !profile?.breakFrequency || !profile?.breakDuration) return null;

    const now = new Date();
    const frequencyMinutes = parseInt(profile.breakFrequency);
    const durationMinutes = parseInt(profile.breakDuration);
    
    // If user just came out of focus mode, schedule break for now + break duration
    if (lastFocusEndTime && (now.getTime() - lastFocusEndTime.getTime()) < 60000) { // Within 1 minute
      const nextBreakTime = new Date(lastFocusEndTime);
      nextBreakTime.setMinutes(nextBreakTime.getMinutes() + durationMinutes);
      return nextBreakTime;
    }
    
    const [startHour, startMin] = profile.workStartTime.split(':').map(Number);
    
    // Create first break time (start + frequency)
    const firstBreakTime = new Date();
    firstBreakTime.setHours(startHour, startMin + frequencyMinutes, 0, 0);

    // If first break time has passed, calculate next break
    if (firstBreakTime <= now) {
      const timeSinceFirst = now.getTime() - firstBreakTime.getTime();
      const intervalsPassed = Math.floor(timeSinceFirst / (frequencyMinutes * 60 * 1000));
      firstBreakTime.setMinutes(firstBreakTime.getMinutes() + (intervalsPassed + 1) * frequencyMinutes);
    }

    return firstBreakTime;
  };

  // Main break reminder logic
  useEffect(() => {
    if (!profile?.breakFrequency || !profile?.breakDuration || profile?.focusMode || isGuest || !user) return;

    const scheduleNextBreak = () => {
      const nextBreakTime = getNextBreakTime();
      if (!nextBreakTime) return;

      const timeUntilBreak = nextBreakTime.getTime() - Date.now();
      
      // If break is in the future
      if (timeUntilBreak > 0) {
        const timeoutId = setTimeout(() => {
          if (isInWorkHours() && !isFocusModeActive) {
            const duration = parseInt(profile.breakDuration || '5');
            setCurrentActivity(getRandomActivity(profile.breakDuration || '5'));
            setBreakTimer(duration * 60); // Convert minutes to seconds
            setIsTimerRunning(true);
            setShowReminder(true);
          }
          // Schedule next break
          scheduleNextBreak();
        }, timeUntilBreak);

        return () => clearTimeout(timeoutId);
      } else {
        // Schedule for next interval
        const frequencyMs = parseInt(profile.breakFrequency) * 60 * 1000;
        const timeoutId = setTimeout(() => {
          if (isInWorkHours() && !isFocusModeActive) {
            const duration = parseInt(profile.breakDuration || '5');
            setCurrentActivity(getRandomActivity(profile.breakDuration || '5'));
            setBreakTimer(duration * 60); // Convert minutes to seconds
            setIsTimerRunning(true);
            setShowReminder(true);
          }
          scheduleNextBreak();
        }, frequencyMs);

        return () => clearTimeout(timeoutId);
      }
    };

    const cleanup = scheduleNextBreak();
    return cleanup;
  }, [profile, user, isGuest, isFocusModeActive, lastFocusEndTime]);

  // Track when focus mode ends
  useEffect(() => {
    // If focus mode just ended (was true, now false)
    if (wasFocusModeActive.current && !isFocusModeActive) {
      setLastFocusEndTime(new Date());
    }
    
    wasFocusModeActive.current = isFocusModeActive;
  }, [isFocusModeActive]);

  // Break timer countdown effect
  useEffect(() => {
    if (isTimerRunning && breakTimer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setBreakTimer(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setShowReminder(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, breakTimer]);

  // Don't render if not applicable
  if (isGuest || !user || !showReminder || !profile?.breakFrequency) {
    return null;
  }

  const handleSkip = () => {
    setShowReminder(false);
    setIsTimerRunning(false);
    setBreakTimer(0);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Format timer display (MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mx-4 max-w-md w-full">
        {/* Content */}
        <div className="text-center">
          <div className="mb-4">
            <div className="text-2xl mb-2">⏱️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Break Time
            </h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            {currentActivity}
          </p>

          {/* Break Timer */}
          <div className="mb-6">
            <div className="text-3xl font-mono font-bold text-primary mb-1">
              {formatTimer(breakTimer)}
            </div>
            <div className="text-sm text-muted-foreground">
              Break time remaining
            </div>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
            data-testid="button-skip-break"
          >
            Skip Break
          </button>
        </div>
      </div>
    </div>
  );
};