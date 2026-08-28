import { createClient } from '@supabase/supabase-js';

/**
 * Supabase connection.
 *
 * The project URL and the *publishable* (anon) key are safe to ship in the
 * browser bundle — RLS is the real access control, and the anon role can only
 * do what its policies allow. They are baked in here as the default so a deploy
 * needs no environment configuration at all. Set VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY to point a build at a different project (e.g. staging).
 *
 * Never put the service_role key anywhere in this file — that one bypasses RLS
 * and belongs only in Edge Function secrets.
 */
const DEFAULT_URL = 'https://sctsrxuquhzdjjnlsqbm.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_Ci09czHBOmFNcIz-ib672g_79IixEfA';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL;
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON_KEY;

export const supabase = createClient(url, anonKey);
