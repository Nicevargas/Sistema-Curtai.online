import { createClient } from '@supabase/supabase-js';

const sanitizeValue = (val: string | undefined): string => {
  if (!val) return '';
  const trimmed = val.trim().replace(/^["']|["']$/g, '');
  if (
    trimmed.includes('placeholder') ||
    trimmed.includes('your-project') ||
    trimmed.includes('your-anon-key') ||
    trimmed === ''
  ) {
    return '';
  }
  return trimmed;
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const fallbackUrl = 'https://cljrtjucbauzkanwrftc.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsanJ0anVjYmF1emthbndyZnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDUyMDgsImV4cCI6MjA5ODQ4MTIwOH0.I8vWjGFfaWsBtdD73MhHc_vU-yR1_C9vHplmQH9ALSw';

const supabaseUrl = sanitizeValue(rawUrl) || fallbackUrl;
const supabaseAnonKey = sanitizeValue(rawKey) || fallbackKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'curso-auth-token',
  },
});

if (typeof window !== 'undefined') {
  console.log('Supabase Initialized with URL:', supabaseUrl);
}
