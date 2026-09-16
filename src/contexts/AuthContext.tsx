import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'organizer' | 'judge' | 'teacher' | 'student';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  school_id: string | null;
  team_id?: string | null;
  is_team_account?: boolean;
}

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  /** True until both the session and its profile have resolved. */
  loading: boolean;
  role: UserRole | null;
  isOrganizer: boolean;
  isJudge: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  displayName: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The role lives in public.profiles, not in the JWT — RLS reads it through
 * is_organizer(). The client mirrors that check so a signed-in teacher is
 * routed away from organizer screens instead of landing on empty tables.
 */
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, school_id, team_id, is_team_account')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('Could not load profile:', error.message);
    return null;
  }
  return (data as Profile | null) ?? null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function resolve(s: Session | null) {
      if (!active) return;
      setSession(s);
      setProfile(s ? await fetchProfile(s.user.id) : null);
      if (active) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setLoading(true);
      resolve(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refresh = async () => {
    if (session) setProfile(await fetchProfile(session.user.id));
  };

  const role = profile?.role ?? null;

  const value: AuthContextType = {
    session,
    profile,
    loading,
    role,
    isOrganizer: role === 'organizer',
    isJudge: role === 'judge',
    isTeacher: role === 'teacher',
    isStudent: role === 'student',
    displayName:
      profile?.full_name ??
      (session?.user.user_metadata?.name as string | undefined) ??
      session?.user.email ??
      null,
    signIn,
    signOut,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
