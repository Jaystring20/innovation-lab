'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

export function UserMenu() {
  const router = useRouter();
  const { user, displayName, isAdmin, isSuperAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          backgroundColor: '#1f1917',
          border: '1px solid #2a2420',
          color: '#faf8f6',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2a2420';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1f1917';
        }}
      >
        {displayName || user.email}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50"
          style={{
            backgroundColor: '#1f1917',
            border: '1px solid #2a2420',
          }}
        >
          {/* Profile Info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#2a2420' }}>
            <p className="text-sm" style={{ color: '#faf8f6' }}>
              {displayName}
            </p>
            <p className="text-xs" style={{ color: '#8b8680' }}>
              {user.email}
            </p>
          </div>

          {/* Role Info */}
          <div className="px-4 py-2 text-xs" style={{ color: '#8b8680' }}>
            {isSuperAdmin && (
              <p>
                <span style={{ color: '#da8a1d' }}>●</span> Super Admin
              </p>
            )}
            {isAdmin && !isSuperAdmin && (
              <p>
                <span style={{ color: '#da8a1d' }}>●</span> Admin
              </p>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#2a2420' }}></div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-4 py-2 text-left text-sm transition-colors"
            style={{
              color: '#ef4444',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  );
}
