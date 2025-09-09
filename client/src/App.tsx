import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TopNav } from "@/components/layout/top-nav";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import TasksPage from "@/pages/tasks";
import FocusPage from "@/pages/focus";
import MindfulnessPage from "@/pages/mindfulness";
import MoodPage from "@/pages/mood";
import ProgressPage from "@/pages/progress";
import IntegrationsPage from "@/pages/integrations";
import { AuthCallback } from "@/pages/auth-callback";
import { GuestBanner } from "@/components/guest-banner";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { Profile } from "@shared/schema";

function AppContent() {
  const { user, loading, isGuest } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Check if user has a profile for onboarding
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles'],
    enabled: !!user && !isGuest,
  });
  
  // Show onboarding modal for new authenticated users without profile
  const shouldShowOnboarding = user && !isGuest && !profileLoading && !profile && !showOnboarding;
  
  // Auto-show onboarding for new users
  if (shouldShowOnboarding) {
    setShowOnboarding(true);
  }

  // Show loading for any auth state transition
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <Switch>
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="*" component={AuthPage} />
      </Switch>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 pb-16 lg:pb-0">
        <TopNav title="ZenFlow" />
        <GuestBanner />
        
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/tasks" component={TasksPage} />
            <Route path="/focus" component={FocusPage} />
            <Route path="/mindfulness" component={MindfulnessPage} />
            <Route path="/mood" component={MoodPage} />
            <Route path="/progress" component={ProgressPage} />
            <Route path="/integrations" component={IntegrationsPage} />
            <Route path="*" component={NotFound} />
          </Switch>
        </main>
      </div>
      
      <MobileNav />
      
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
