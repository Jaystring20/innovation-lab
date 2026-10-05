'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Login successful, redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#150f0b' }}>
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">STEAM Foundry</h1>
          <p style={{ color: '#8b8680' }}>Admin Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg p-8 transition-colors" style={{ backgroundColor: 'rgba(31, 25, 23, 0.5)', border: '1px solid #2a2420' }}>
          <h2 className="text-2xl font-semibold mb-6 tracking-tight">Sign In</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444' }}>
              <p style={{ color: '#ef4444' }} className="text-sm">
                {error}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#8b8680' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.com"
                required
                className="w-full px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: '#1f1917',
                  border: '1px solid #2a2420',
                  color: '#faf8f6',
                }}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#8b8680' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: '#1f1917',
                    border: '1px solid #2a2420',
                    color: '#faf8f6',
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-sm"
                  style={{ color: '#8b8680' }}
                  disabled={loading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors mt-6"
              style={{
                backgroundColor: '#da8a1d',
                color: '#150f0b',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c97a0d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#da8a1d'}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#8b8680' }}>
          STEAM Foundry Admin Dashboard © 2026
        </p>
      </div>
    </div>
  );
}
