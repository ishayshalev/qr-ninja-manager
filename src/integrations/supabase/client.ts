import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ryxmobnjjmvwchqcjmup.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eG1vYm5qam12d2NocWNqbXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MTA5MDQsImV4cCI6MjA1MjQ4NjkwNH0.ZqeBbaPC7gHKmmmDgernDsxIeOWR78eciBBOVkNUFHY";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
);