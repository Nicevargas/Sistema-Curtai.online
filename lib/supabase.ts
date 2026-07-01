import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cljrtjucbauzkanwrftc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsanJ0anVjYmF1emthbndyZnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDUyMDgsImV4cCI6MjA5ODQ4MTIwOH0.I8vWjGFfaWsBtdD73MhHc_vU-yR1_C9vHplmQH9ALSw';

// Initialize with placeholders if missing to avoid build-time crashes
// Real calls will fail gracefully if keys are not provided later
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'curso-auth-token',
    }
  }
);

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
  }
}
