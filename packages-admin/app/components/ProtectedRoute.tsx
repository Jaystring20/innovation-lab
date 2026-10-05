'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading, error } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsReady(false);
      return;
    }

    if (error || !session) {
      router.push('/auth/login');
      return;
    }

    setIsReady(true);
  }, [session, loading, error, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#150f0b' }}>
        <div className="text-center">
          <div className="mb-4 w-8 h-8 border-4 border-transparent border-t-color rounded-full animate-spin" style={{ borderTopColor: '#da8a1d' }}></div>
          <p style={{ color: '#8b8680' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
