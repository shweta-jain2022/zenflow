import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Focus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface DndOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DndOverlay = ({ isVisible, onClose }: DndOverlayProps) => {
  const { user } = useAuth();
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  // Reset checkbox when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      setDoNotShowAgain(false);
    }
  }, [isVisible]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/profiles', {
        userId: user?.id,
        hideDndOverlay: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      onClose();
    },
  });

  const handleClose = () => {
    if (doNotShowAgain) {
      updateSettingsMutation.mutate();
    } else {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60" data-testid="dnd-overlay">
      <div className="bg-background border rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Focus className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Focus Mode Activated</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
              data-testid="button-close-dnd"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Want fewer distractions? Turn on Do Not Disturb:
            </p>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[80px]">On Windows:</span>
                <span>Press Win + A → Focus assist</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[80px]">On Mac:</span>
                <span>Click Control Center → Focus</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[80px]">On Mobile:</span>
                <span>Swipe down → Enable DND</span>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="do-not-show"
                checked={doNotShowAgain}
                onCheckedChange={(checked) => setDoNotShowAgain(checked as boolean)}
                data-testid="checkbox-do-not-show"
              />
              <label
                htmlFor="do-not-show"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Do not show this again
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};