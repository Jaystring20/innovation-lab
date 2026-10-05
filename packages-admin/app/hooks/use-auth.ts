'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  role?: 'organizer' | 'admin' | 'super_admin' | 'judge' | 'teacher';
  full_name?: string;
  email?: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOrganizer: boolean;
  displayName: string;
  signOut: () => Promise<void>;
}

/**
 * Master Key Organizer Account
 *
 * Email: jerryadeyemi20@gmail.com
 * Role: organizer (with full admin access to all modules)
 *
 * This account is the Master Key that provides access to:
 * - Dashboard
 * - Store (Orders Management)
 * - Competition Module
 * - Judge Management
 * - All admin features without restrictions
 */
const MASTER_KEY_EMAIL = 'jerryadeyemi20@gmail.com';
const MASTER_KEY_USER: AuthUser = {
  id: 'organizer-master-key',
  email: MASTER_KEY_EMAIL,
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  role: 'organizer',
  full_name: 'Jerry Adeyemi (Master Key)',
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch authenticated user from Supabase
    const fetchUser = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setUser(null);
          return;
        }

        if (session?.user) {
          // Get user role from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile error:', profileError);
          }

          setUser({
            ...session.user,
            role: (profile?.role as AuthUser['role']) || 'organizer',
            full_name: profile?.full_name || session.user.email,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single();

        setUser({
          ...session.user,
          role: (profile?.role as AuthUser['role']) || 'organizer',
          full_name: profile?.full_name || session.user.email,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Master Key account has full access
  const isMasterKey = user?.email === MASTER_KEY_EMAIL;
  const isSuperAdmin = user?.role === 'super_admin' || isMasterKey;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || isMasterKey;
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin' || user?.role === 'super_admin' || isMasterKey;

  const displayName = user?.full_name || user?.email || 'Guest';

  async function signOut() {
    if (IS_SUPER_ADMIN_MODE) {
      // In super admin mode, just clear state
      setUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    } else {
      setUser(null);
    }
  }

  return {
    user: user || null,
    loading,
    isAdmin,
    isSuperAdmin,
    isOrganizer,
    displayName,
    signOut,
  };
}
