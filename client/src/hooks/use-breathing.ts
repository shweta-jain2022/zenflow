import { useState, useEffect, useRef } from 'react';

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

interface BreathingConfig {
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  pauseSeconds: number;
}

const defaultConfig: BreathingConfig = {
  inhaleSeconds: 4,
  holdSeconds: 2,
  exhaleSeconds: 6,
  pauseSeconds: 2,
};

export const useBreathing = (config: BreathingConfig = defaultConfig) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(config.inhaleSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getInstruction = (currentPhase: BreathingPhase) => {
    switch (currentPhase) {
      case 'inhale':
        return 'Breathe in';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe out';
      case 'pause':
        return 'Pause';
    }
  };

  const getNextPhase = (currentPhase: BreathingPhase): BreathingPhase => {
    switch (currentPhase) {
      case 'inhale':
        return 'hold';
      case 'hold':
        return 'exhale';
      case 'exhale':
        return 'pause';
      case 'pause':
        return 'inhale';
    }
  };

  const getDurationForPhase = (breathingPhase: BreathingPhase) => {
    switch (breathingPhase) {
      case 'inhale':
        return config.inhaleSeconds;
      case 'hold':
        return config.holdSeconds;
      case 'exhale':
        return config.exhaleSeconds;
      case 'pause':
        return config.pauseSeconds;
    }
  };

  const start = () => {
    setIsActive(true);
    setPhase('inhale');
    setSecondsLeft(config.inhaleSeconds);
  };

  const stop = () => {
    setIsActive(false);
    setPhase('inhale');
    setSecondsLeft(config.inhaleSeconds);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            // Move to next phase
            const nextPhase = getNextPhase(phase);
            setPhase(nextPhase);
            return getDurationForPhase(nextPhase);
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
  }, [isActive, phase, config]);

  return {
    isActive,
    phase,
    secondsLeft,
    instruction: getInstruction(phase),
    start,
    stop,
  };
};
