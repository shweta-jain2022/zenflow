import { createClient } from '@supabase/supabase-js';

// Get environment variables
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Auto-fix if variables are swapped (URL should start with https://, key should be a long string)
if (supabaseUrl.startsWith('eyJ') && supabaseAnonKey.startsWith('https://')) {
  console.log('Detected swapped Supabase environment variables, fixing...');
  [supabaseUrl, supabaseAnonKey] = [supabaseAnonKey, supabaseUrl];
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
      },
    })
  : null;
