import { Link, useLocation } from 'wouter';
import { Heart, Smile } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const mobileMenuItems = [
  { name: 'Mindfulness', href: '/mindfulness', icon: Heart },
  { name: 'Mood & Journal', href: '/mood', icon: Smile },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [location] = useLocation();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        
        <nav className="mt-6 space-y-2">
          {mobileMenuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  onClick={onClose}
                  data-testid={`mobile-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`
                    flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};