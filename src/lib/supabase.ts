import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Surface a clear message in dev instead of a cryptic runtime crash.
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.',
  );
}

// Browser-safe client. Respects RLS (anon role) until a user signs in via
// Supabase Auth, at which point authenticated-role policies apply (organizers).
export const supabase = createClient(url ?? '', anonKey ?? '');

export const BANK_DETAILS = {
  name: import.meta.env.VITE_BANK_NAME || '(set VITE_BANK_NAME)',
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || '(set VITE_BANK_ACCOUNT_NAME)',
  accountNumber:
    import.meta.env.VITE_BANK_ACCOUNT_NUMBER || '(set VITE_BANK_ACCOUNT_NUMBER)',
};
