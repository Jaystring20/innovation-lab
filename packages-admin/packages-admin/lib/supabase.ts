/**
 * Supabase Client
 * Centralized client for all database operations
 * Used across both Competition and Learning Lab modules
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-App-Version': '1.0.0',
    },
  },
});

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get user admin role
 */
export async function getUserAdminRole() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('admin_users')
    .select('role, tier_scope')
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  return data;
}

/**
 * Check if user has admin access
 */
export async function isAdmin() {
  const role = await getUserAdminRole();
  return role && ['super_admin', 'curriculum_editor', 'organizer'].includes(role.role);
}

/**
 * Sign in with email/password
 */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign out
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Listen to auth changes
 */
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}
