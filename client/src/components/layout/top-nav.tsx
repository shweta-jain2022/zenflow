import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';

interface TopNavProps {
  title: string;
  onMobileMenuToggle?: () => void;
}

export const TopNav = ({ title, onMobileMenuToggle }: TopNavProps) => {
  const { theme, toggleTheme } = useTheme();

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
          <span className="ml-2 text-lg font-semibold text-foreground">MindFlow</span>
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
        </div>
      </div>
    </header>
  );
};
