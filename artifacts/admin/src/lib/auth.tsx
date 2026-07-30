import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TOKEN_KEY = 'stg_admin_token';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const API_BASE = basePath.replace(/\/admin$/, '') + '/api';

interface LoginResult {
  error?: string;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
}

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    fetch(`${API_BASE}/admin-auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: stored }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      })
      .catch(() => {
        // Network error — keep the token, re-check on next navigation
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(`${API_BASE}/admin-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.status === 429) {
        return {
          error: data.error ?? 'Too many failed login attempts.',
          rateLimited: true,
          retryAfterSeconds: data.retryAfterSeconds,
        };
      }
      if (!res.ok) {
        return { error: data.error ?? 'Login failed.' };
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      return {};
    } catch {
      return { error: 'Could not connect to server. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
