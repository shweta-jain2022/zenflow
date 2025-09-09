import { Link, useLocation } from 'wouter';
import { LayoutDashboard, CheckSquare, Timer, Heart, TrendingUp, Settings } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Focus', href: '/focus', icon: Timer },
  { name: 'Mindful', href: '/mindfulness', icon: Heart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const MobileNav = () => {
  const [location] = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                className={`
                  flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
