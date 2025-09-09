import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";

export const GuestBanner = () => {
  const { isGuest, exitGuestMode } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  if (!isGuest || !isVisible) {
    return null;
  }

  return (
    <Alert className="mx-4 my-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-blue-800 dark:text-blue-200 text-sm">
          You're exploring as a guest. Features are limited and data won't be saved.{' '}
          <Button 
            variant="link" 
            className="h-auto p-0 text-blue-600 dark:text-blue-400 underline" 
            onClick={exitGuestMode}
            data-testid="button-sign-up-guest-banner"
          >
            Sign up for full access
          </Button>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          onClick={() => setIsVisible(false)}
          data-testid="button-dismiss-guest-banner"
        >
          <X className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};