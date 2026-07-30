import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.error) {
      if (result.rateLimited && result.retryAfterSeconds) {
        const minutes = Math.ceil(result.retryAfterSeconds / 60);
        setError(
          `Too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`
        );
      } else {
        setError(result.error);
      }
    } else {
      setLocation('/dashboard');
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#1e3a6e] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <img
            src={`${basePath}/logo-3d.png`}
            alt="STG"
            className="h-16 mx-auto mb-4 drop-shadow-2xl"
          />
          <h1 className="text-2xl font-bold text-white">STG Admin Portal</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Operations Management Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-8">
            <h2 className="text-[#1a2744] font-bold text-lg mb-6">Sign in</h2>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#1a2744] mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] text-[#1a2744] placeholder-[#94a3b8] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition"
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#1a2744] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] text-[#1a2744] placeholder-[#94a3b8] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-[#fef2f2] border border-[#fecaca] px-4 py-3">
                  <p className="text-sm text-[#dc2626]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full mt-2 bg-[#1a2744] hover:bg-[#243256] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
            <p className="text-[#94a3b8] text-xs text-center">
              Access is restricted to authorised staff only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
