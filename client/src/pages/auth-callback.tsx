import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

export const AuthCallback = () => {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          console.log('Supabase not configured, redirecting to auth');
          setTimeout(() => setLocation('/auth/signin'), 1000);
          return;
        }

        console.log('Processing auth callback...');
        console.log('Current URL:', window.location.href);
        
        // First try to get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        if (sessionData.session) {
          console.log('Found existing session');
          setStatus('success');
          setTimeout(() => {
            setLocation('/dashboard');
          }, 1500);
          return;
        }

        // Check if we have token fragments in the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('token_type');
        const type = hashParams.get('type');
        
        console.log('URL hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type, tokenType });
        
        // Check URL search params as fallback
        const urlParams = new URLSearchParams(window.location.search);
        const urlAccessToken = urlParams.get('access_token');
        const urlRefreshToken = urlParams.get('refresh_token');
        
        console.log('URL search params:', { accessToken: !!urlAccessToken, refreshToken: !!urlRefreshToken });

        if (accessToken && refreshToken) {
          console.log('Setting session from hash params');
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
            setStatus('error');
          } else {
            console.log('Session set successfully');
            setStatus('success');
            setTimeout(() => {
              setLocation('/dashboard');
            }, 1500);
          }
        } else if (urlAccessToken && urlRefreshToken) {
          console.log('Setting session from URL params');
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: urlAccessToken,
            refresh_token: urlRefreshToken,
          });
          
          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
            setStatus('error');
          } else {
            console.log('Session set successfully');
            setStatus('success');
            setTimeout(() => {
              setLocation('/dashboard');
            }, 1500);
          }
        } else if (type === 'signup') {
          // For email confirmation, we might not get tokens immediately
          console.log('Email confirmation detected, processing...');
          
          // Try to exchange the confirmation for a session
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.search);
            if (data.session) {
              console.log('Email confirmed and session created');
              setStatus('success');
              setTimeout(() => {
                setLocation('/dashboard');
              }, 1500);
            } else if (error) {
              console.log('Email confirmed but no session:', error.message);
              setStatus('success');
              setTimeout(() => {
                setLocation('/auth/signin');
              }, 2000);
            } else {
              console.log('Email confirmed, redirecting to sign in');
              setStatus('success');
              setTimeout(() => {
                setLocation('/auth/signin');
              }, 2000);
            }
          } catch (error) {
            console.log('Error processing confirmation, but email should be verified');
            setStatus('success');
            setTimeout(() => {
              setLocation('/auth/signin');
            }, 2000);
          }
        } else {
          console.log('No tokens found in URL, redirecting to sign in');
          setTimeout(() => {
            setLocation('/auth/signin');
          }, 2000);
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        setStatus('error');
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Auth callback timeout, redirecting to sign in');
      setStatus('error');
    }, 10000);

    handleAuthCallback();

    // Cleanup timeout
    return () => clearTimeout(timeoutId);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          {status === 'processing' && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Confirming your account...</h2>
              <p className="text-muted-foreground">Please wait while we verify your email.</p>
            </div>
          )}
          
          {status === 'success' && (
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Email confirmed!</h2>
              <p className="text-muted-foreground">Your account has been verified. Redirecting to sign in...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Confirmation failed</h2>
              <p className="text-muted-foreground mb-4">There was an issue confirming your email. Please try signing in or contact support.</p>
              <button
                onClick={() => setLocation('/auth/signin')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};