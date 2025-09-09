import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Profile } from '@shared/schema';
import { useAuth } from '@/contexts/auth-context';

const WATER_REMINDER_MESSAGES = [
  '💧 "Hydration break! Take a refreshing sip of water."',
  '🌊 "Time to fuel up — grab a glass of water."',
  '🥤 "Quick reminder: Your body will thank you for a sip of water."',
  '☀️ "Stay energized! Take a moment to hydrate."',
  '🌱 "Little pause, big impact — drink some water now."'
];

export const WaterReminder = () => {
  const { user, isGuest } = useAuth();
  const [showReminder, setShowReminder] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  // Get user profile to check water reminder settings and work hours
  const { data: profile } = useQuery<Profile>({
    queryKey: ['/api/profiles'],
    enabled: !!user && !isGuest,
  });

  // Function to get random message
  const getRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * WATER_REMINDER_MESSAGES.length);
    return WATER_REMINDER_MESSAGES[randomIndex];
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

  // Function to get next reminder time (start + 1 hour, then every hour)
  const getNextReminderTime = () => {
    if (!profile?.workStartTime) return null;

    const now = new Date();
    const [startHour, startMin] = profile.workStartTime.split(':').map(Number);
    
    // Create reminder time for today
    const reminderTime = new Date();
    reminderTime.setHours(startHour + 1, startMin, 0, 0);

    // If first reminder time has passed, calculate next hourly reminder
    if (reminderTime <= now) {
      const hoursPassedSinceFirst = Math.floor((now.getTime() - reminderTime.getTime()) / (1000 * 60 * 60));
      reminderTime.setHours(reminderTime.getHours() + hoursPassedSinceFirst + 1);
    }

    return reminderTime;
  };

  // Main reminder logic
  useEffect(() => {
    if (!profile?.waterReminder || isGuest || !user) return;

    const scheduleNextReminder = () => {
      const nextReminderTime = getNextReminderTime();
      if (!nextReminderTime) return;

      const timeUntilReminder = nextReminderTime.getTime() - Date.now();
      
      // If reminder is in the future and we're in work hours
      if (timeUntilReminder > 0) {
        const timeoutId = setTimeout(() => {
          if (isInWorkHours()) {
            setCurrentMessage(getRandomMessage());
            setShowReminder(true);
          }
          // Schedule next reminder
          scheduleNextReminder();
        }, timeUntilReminder);

        return () => clearTimeout(timeoutId);
      } else {
        // Schedule for next hour
        const oneHour = 60 * 60 * 1000;
        const timeoutId = setTimeout(() => {
          if (isInWorkHours()) {
            setCurrentMessage(getRandomMessage());
            setShowReminder(true);
          }
          scheduleNextReminder();
        }, oneHour);

        return () => clearTimeout(timeoutId);
      }
    };

    const cleanup = scheduleNextReminder();
    return cleanup;
  }, [profile, user, isGuest]);

  // Don't render if reminder is disabled or not applicable
  if (!profile?.waterReminder || isGuest || !user || !showReminder) {
    return null;
  }

  const handleClose = () => {
    setShowReminder(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mx-4 max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          data-testid="button-close-water-reminder"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mb-4">
            <div className="text-2xl mb-2">💧</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Water Reminder
            </h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {currentMessage}
          </p>
        </div>
      </div>
    </div>
  );
};