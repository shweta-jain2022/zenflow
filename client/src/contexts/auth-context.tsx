import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Helper function to clear all auth-related cache
const clearAuthCache = () => {
  try {
    // Clear localStorage items related to Supabase auth
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('supabase') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('Auth cache cleared automatically');
  } catch (error) {
    console.log('Error clearing cache:', error);
  }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // Mock user for development when Supabase is not configured
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'demo@example.com',
        user_metadata: { name: 'Demo User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      
      setUser(mockUser);
      setLoading(false);
      return;
    }

    // Clear any stale auth state on startup
    clearAuthCache();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.log('Session error on startup:', error.message);
        clearAuthCache();
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, !!session?.user);
      
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        // Add small delay for first signin to ensure state propagates
        setTimeout(() => setLoading(false), 100);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        clearAuthCache();
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) {
      // Mock signup for development
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email,
        user_metadata: { name },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      
      setUser(mockUser);
      return { error: null };
    }

    // Get the current domain - it should be the Replit domain
    const currentDomain = window.location.origin;
    const redirectTo = `${currentDomain}/auth/callback`;
    
    console.log('Using redirect URL for signup:', redirectTo);
    
    // Clear cache before signup to ensure clean state
    clearAuthCache();
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          name,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      // Mock signin for development
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email,
        user_metadata: { name: email.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      
      setUser(mockUser);
      return { error: null };
    }

    console.log('Attempting to sign in with:', email);
    
    // Clear cache before attempting sign in to avoid stale auth state
    clearAuthCache();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Sign in result:', { 
        user: data.user?.id, 
        error: error?.message,
        session: !!data.session 
      });
      
      // If there's an auth-related error, clear cache again
      if (error && (error.message?.includes('Email not confirmed') || error.message?.includes('Invalid'))) {
        clearAuthCache();
      }
      
      return { error };
    } catch (networkError) {
      console.error('Network error during sign in:', networkError);
      return { error: { message: 'Connection failed. Please check your internet connection and try again.' } };
    }
  };

  const signOut = async () => {
    if (!supabase) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
