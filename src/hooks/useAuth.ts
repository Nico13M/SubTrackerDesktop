import { useState, useEffect } from 'react';

type User = { id: string; email: string; name?: string, notificationsEnabled?: boolean } | null;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

  const getApiErrorMessage = async (res: Response, fallback: string) => {
    let raw = '';
    try {
      raw = await res.text();
    } catch {
      return fallback;
    }

    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.error === 'string' && parsed.error.trim()) {
        return parsed.error;
      }
      if (typeof parsed?.message === 'string' && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      // Not JSON; continue with raw text.
    }

    return raw;
  };

  const mapLoginErrorMessage = (message: string, status?: number) => {
    const normalized = message.toLowerCase();
    if (status === 401 || normalized.includes('invalid credentials')) {
      return 'Email ou mot de passe incorrect.';
    }
    return message || 'Une erreur est survenue pendant la connexion.';
  };

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
        const message = await getApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(mapLoginErrorMessage(message, res.status));
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
      const rawMessage = err?.message ?? '';
      const message = rawMessage.toLowerCase().includes('failed to fetch')
        ? 'Impossible de contacter le serveur. Vérifiez votre connexion.'
        : (rawMessage || 'Une erreur est survenue pendant la connexion.');
      setError(message);
      return { ok: false, error: message };
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
        const message = await getApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(message || 'Une erreur est survenue pendant l\'inscription.');
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
      const rawMessage = err?.message ?? '';
      const message = rawMessage.toLowerCase().includes('failed to fetch')
        ? 'Impossible de contacter le serveur. Vérifiez votre connexion.'
        : (rawMessage || 'Une erreur est survenue pendant l\'inscription.');
      setError(message);
      return { ok: false, error: message };
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
        const message = await getApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(message);
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

  const updateUserSettings = async (settings: { notificationsEnabled: boolean }) => {
    const token = getToken();
    if (!token) return { ok: false, error: 'No token' };

    try {
      const res = await fetch(`${API_BASE}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(message);
      }

      const data = await res.json();
      // Optionally update user state if the backend returns the updated user
      if (data.user) {
        setUser(data.user);
      }
      return { ok: true, user: data.user };
    } catch (err: any) {
      console.error('Failed to update user settings:', err.message);
      return { ok: false, error: err.message };
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
    getToken,
    updateUserSettings,
  };
}

export default useAuth;
