import { Menu, Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';

interface TopNavProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export const TopNav = ({ title, onMobileMenuToggle }: TopNavProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isGuest, signOut, exitGuestMode } = useAuth();
  
  const handleSignOut = async () => {
    if (isGuest) {
      exitGuestMode();
    } else {
      await signOut();
    }
  };
  
  const getUserDisplayName = () => {
    if (isGuest) return 'Guest User';
    return user?.user_metadata?.name || user?.email || 'User';
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-2 text-lg font-semibold text-foreground">ZenFlow</span>
        </div>

        <div className="hidden lg:block">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          <Button variant="ghost" size="sm" data-testid="button-notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                data-testid="button-user-menu"
              >
                <User className="h-4 w-4" />
                <span className="hidden md:inline-block text-sm font-medium">
                  {getUserDisplayName()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {isGuest ? 'Guest Mode' : 'Signed in as'}
              </div>
              <div className="px-2 py-1.5 text-sm font-medium truncate">
                {getUserDisplayName()}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600"
                data-testid="menu-item-signout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
