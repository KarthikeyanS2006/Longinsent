import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('[longinset] Supabase env missing - copy .env.example to .env and fill values.');
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder');
