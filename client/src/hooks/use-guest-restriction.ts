import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export const useGuestRestriction = () => {
  const { isGuest, exitGuestMode } = useAuth();
  const { toast } = useToast();

  const checkGuestRestriction = (action: string = 'save data') => {
    if (isGuest) {
      toast({
        title: 'Guest Mode Limitation',
        description: `You can't ${action} in guest mode. Sign up for full access to save your progress.`,
        variant: 'destructive',
      });
      return true; // Restricted
    }
    return false; // Not restricted
  };

  return {
    isGuest,
    checkGuestRestriction,
  };
};