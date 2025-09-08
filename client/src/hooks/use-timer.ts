import { useState, useEffect, useRef } from 'react';

interface TimerConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

export const useTimer = (config: TimerConfig) => {
  const [minutes, setMinutes] = useState(config.focusMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = (newMode?: 'focus' | 'short_break' | 'long_break') => {
    const targetMode = newMode || mode;
    setIsRunning(false);
    setMode(targetMode);
    
    switch (targetMode) {
      case 'focus':
        setMinutes(config.focusMinutes);
        break;
      case 'short_break':
        setMinutes(config.shortBreakMinutes);
        break;
      case 'long_break':
        setMinutes(config.longBreakMinutes);
        break;
    }
    setSeconds(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const setOnComplete = (callback: () => void) => {
    onCompleteRef.current = callback;
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev === 0) {
            setMinutes(prevMin => {
              if (prevMin === 0) {
                // Timer completed
                setIsRunning(false);
                if (onCompleteRef.current) {
                  onCompleteRef.current();
                }
                return 0;
              }
              return prevMin - 1;
            });
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    minutes,
    seconds,
    isRunning,
    mode,
    formatTime: formatTime(minutes, seconds),
    startTimer,
    pauseTimer,
    resetTimer,
    setOnComplete,
  };
};
