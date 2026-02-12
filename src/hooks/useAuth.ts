import { useState, useEffect } from 'react';

type User = { id: string; email: string; name?: string } | null;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

  const getToken = () => sessionStorage.getItem('subtracker_token');

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const token = data?.token;
      const user = data?.user ?? null;
      if (token) {
        sessionStorage.setItem('subtracker_token', token);
      }
      setUser(user);
      return { ok: true, user };
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
      return { ok: false, error: err.message };
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const token = data?.token;
      const user = data?.user ?? null;
      if (token) {
        sessionStorage.setItem('subtracker_token', token);
      }
      setUser(user);
      return { ok: true, user };
    } catch (err: any) {
      setError(err.message ?? 'Signup failed');
      return { ok: false, error: err.message };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('subtracker_token');
    setUser(null);
  };

  const refresh = async (token?: string) => {
    const current = token ?? getToken();
    if (!current) return { ok: false, error: 'No token' };
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${current}` },
        body: JSON.stringify({ token: current }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const newToken = data?.token;
      if (newToken) {
        sessionStorage.setItem('subtracker_token', newToken);
      }
      return { ok: true, token: newToken };
    } catch (err: any) {
      // If refresh fails, clear token
      sessionStorage.removeItem('subtracker_token');
      setUser(null);
      return { ok: false, error: err.message };
    }
  };

  const fetchMe = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setUser(null);
      return null;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // try refresh once if unauthorized
        if (res.status === 401) {
          const r = await refresh(token);
          if (r.ok && r.token) {
            // retry fetchMe once
            const res2 = await fetch(`${API_BASE}/api/auth/me`, {
              headers: { Authorization: `Bearer ${r.token}` },
            });
            if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
            const data2 = await res2.json();
            setUser(data2.user ?? null);
            return data2.user ?? null;
          }
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setUser(data.user ?? null);
      return data.user ?? null;
    } catch (err) {
      sessionStorage.removeItem('subtracker_token');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    refresh,
    logout,
    isAuthenticated: !!user,
    fetchMe,
  };
}

export default useAuth;
