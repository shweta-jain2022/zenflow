import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';

interface TimerConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  mode: 'focus' | 'short_break' | 'long_break';
  formatTime: string;
}

interface TimerContextValue extends TimerState {
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: (newMode?: 'focus' | 'short_break' | 'long_break') => void;
  setOnComplete: (callback: () => void) => void;
  updateConfig: (config: TimerConfig) => void;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider = ({ children }: TimerProviderProps) => {
  const [config, setConfig] = useState<TimerConfig>({
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
  });
  
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

  const updateConfig = (newConfig: TimerConfig) => {
    setConfig(newConfig);
    // Only reset timer if it's at the default state (not paused mid-session)
    if (!isRunning && minutes === config.focusMinutes && seconds === 0) {
      resetTimer(mode);
    }
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

  // Update timer when config changes - only if at default state
  useEffect(() => {
    if (!isRunning && minutes === config.focusMinutes && seconds === 0) {
      switch (mode) {
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
    }
  }, [config, mode, isRunning, minutes, seconds]);

  const value: TimerContextValue = {
    minutes,
    seconds,
    isRunning,
    mode,
    formatTime: formatTime(minutes, seconds),
    startTimer,
    pauseTimer,
    resetTimer,
    setOnComplete,
    updateConfig,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useGlobalTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useGlobalTimer must be used within a TimerProvider');
  }
  return context;
};