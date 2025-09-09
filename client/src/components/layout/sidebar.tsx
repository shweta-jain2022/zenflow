import { Link, useLocation } from 'wouter';
import { Brain, LayoutDashboard, CheckSquare, Timer, Heart, Smile, TrendingUp, Settings, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Focus Timer', href: '/focus', icon: Timer },
  { name: 'Mindfulness', href: '/mindfulness', icon: Heart },
  { name: 'Mood & Journal', href: '/mood', icon: Smile },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Integrations', href: '/integrations', icon: Zap },
];

export const Sidebar = () => {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-card border-r border-border">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 py-4">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground">ZenFlow</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 p-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-primary">
                {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {user?.user_metadata?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
