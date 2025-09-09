import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function NotFound() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showNotFound, setShowNotFound] = useState(false);
  
  useEffect(() => {
    if (user && !loading) {
      // Authenticated users should go to dashboard, not see 404
      setLocation('/dashboard');
      return;
    }
    
    // Only show 404 after a delay if user is definitely not authenticated
    const timer = setTimeout(() => {
      if (!user && !loading) {
        setShowNotFound(true);
      }
    }, 500); // Wait 500ms before showing 404
    
    return () => clearTimeout(timer);
  }, [user, loading, setLocation]);
  
  // Show loading while we determine what to do
  if (loading || (user && !loading) || !showNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
