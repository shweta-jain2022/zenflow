import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogPortal, DialogOverlay, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';
import type { Profile } from '@shared/schema';

export const EndOfDayReminder = () => {
  const { user, isGuest } = useAuth();
  const [, setLocation] = useLocation();
  const [showReminder, setShowReminder] = useState(false);
  

  // Get user profile to check work hours
  const { data: profile } = useQuery<Profile>({
    queryKey: ['/api/profiles'],
    enabled: !!user && !isGuest,
  });

  // Function to check if it's 15 minutes before work end time
  const isNearEndOfWorkDay = () => {
    if (!profile?.workEndTime) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    // Parse work end time (format: "HH:MM:SS")
    const [endHour, endMin] = profile.workEndTime.split(':').map(Number);
    const endTime = endHour * 60 + endMin;
    
    // Check if we're 15 minutes before end time (within a 5-minute window)
    const reminderTime = endTime - 15;
    
    
    return currentTime >= reminderTime && currentTime < reminderTime + 5;
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

  // Main reminder logic
  useEffect(() => {
    if (isGuest || !user || !profile) return;

    const checkForEndOfDay = () => {
      const inWorkHours = isInWorkHours();
      const nearEndOfDay = isNearEndOfWorkDay();
      
      // Only show if we're in work hours and near end of day
      if (inWorkHours && nearEndOfDay && !showReminder) {
        setShowReminder(true);
      }
    };

    // Check every minute
    const interval = setInterval(checkForEndOfDay, 60000);
    
    // Initial check
    checkForEndOfDay();

    return () => clearInterval(interval);
  }, [profile, user, isGuest, showReminder]);

  const handleLogMood = () => {
    setShowReminder(false);
    setLocation('/mood');
  };

  const handleSkip = () => {
    setShowReminder(false);
  };

  if (!showReminder) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80" data-testid="end-of-day-reminder">
      <div className="bg-background border rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5 text-primary" />
            End of Work Day
          </div>
          
          <p className="text-center text-muted-foreground">
            Before calling it a day, tell us how it went
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleLogMood}
              className="w-full"
              data-testid="button-log-mood"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Log your mood for the day
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="w-full"
              data-testid="button-skip"
            >
              <X className="mr-2 h-4 w-4" />
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};