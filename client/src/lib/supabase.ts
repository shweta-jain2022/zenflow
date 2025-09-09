import { createClient } from '@supabase/supabase-js';

// Get environment variables
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine correct assignment based on content patterns
let supabaseUrl: string;
let supabaseAnonKey: string;

if (rawUrl.startsWith('https://') && rawKey.startsWith('eyJ')) {
  // Correct order
  supabaseUrl = rawUrl;
  supabaseAnonKey = rawKey;
} else if (rawKey.startsWith('https://') && rawUrl.startsWith('eyJ')) {
  // Swapped - fix it
  console.log('Detected swapped Supabase environment variables, fixing...');
  supabaseUrl = rawKey;
  supabaseAnonKey = rawUrl;
} else {
  // Neither pattern matches clearly - use as provided
  supabaseUrl = rawUrl;
  supabaseAnonKey = rawKey;
}

// Validate URL format
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return url.includes('supabase.co') || url.includes('supabase.io');
  } catch {
    return false;
  }
};

const isValidKey = (key: string) => {
  return key.length > 100 && (key.startsWith('eyJ') || key.startsWith('sb-'));
};


if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl) || !isValidKey(supabaseAnonKey)) {
  console.warn('Supabase environment variables not properly configured. Using mock auth for development.');
  console.log('Expected: VITE_SUPABASE_URL should be https://your-project.supabase.co');
  console.log('Expected: VITE_SUPABASE_ANON_KEY should be a long JWT token starting with eyJ');
}

export const supabase = (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey))
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: false,
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey,
        },
      },
    })
  : null;
