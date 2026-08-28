import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the build has no Supabase config — the app renders a setup notice. */
export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in the host ' +
      'environment (or copy .env.example to .env for local dev).',
  );
}

// createClient throws on an empty URL, which would blank the whole page on a
// misconfigured deploy. Fall back to a harmless placeholder origin so the app
// still mounts and can show ConfigNotice instead of a white screen; every real
// call fails cleanly until the env vars are set.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
);

export const BANK_DETAILS = {
  name: import.meta.env.VITE_BANK_NAME || '(set VITE_BANK_NAME)',
  accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || '(set VITE_BANK_ACCOUNT_NAME)',
  accountNumber:
    import.meta.env.VITE_BANK_ACCOUNT_NUMBER || '(set VITE_BANK_ACCOUNT_NUMBER)',
};
