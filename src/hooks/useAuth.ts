import { useState, useEffect } from 'react';
import { extractApiErrorMessage, formatApiError } from '@/lib/apiErrors';

type User = { id: string; email: string; name?: string, notificationsEnabled?: boolean } | null;

type MutationResult<T> =
  | { ok: true; user?: User; token?: string; data?: T }
  | { ok: false; error: string };

export type UseAuthReturn = {
  user: User;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<MutationResult<User>>;
  signup: (email: string, password: string, name?: string) => Promise<MutationResult<User>>;
  refresh: (token?: string) => Promise<MutationResult<string>>;
  logout: () => void;
  isAuthenticated: boolean;
  fetchMe: () => Promise<User>;
  getToken: () => string | null;
  updateUserSettings: (settings: { notificationsEnabled: boolean }) => Promise<MutationResult<User>>;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE: string = import.meta.env.PROD ? (import.meta as any).env?.VITE_API_BASE ?? '' : 'http://localhost:3000';

  const getToken = () => sessionStorage.getItem('subtracker_token');

  const login = async (email: string, password: string): Promise<MutationResult<User>> => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const message = await extractApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(formatApiError(message, res.status, 'Une erreur est survenue pendant la connexion.'));
      }
      const data = await res.json();
      const token = data?.token;
      const user = data?.user ?? null;
      // Vérification de la validation email côté front (is_active)
      if (user && user.is_active === false) {
        setError('Votre email n\'a pas encore été validé. Veuillez vérifier votre boîte mail.');
        return { ok: false, error: 'Votre email n\'a pas encore été validé. Veuillez vérifier votre boîte mail.' };
      }
      if (token) {
        sessionStorage.setItem('subtracker_token', token);
      }
      setUser(user);
      return { ok: true, user };
    } catch (err: any) {
      const rawMessage = err?.message ?? '';
      const message = formatApiError(rawMessage, undefined, 'Une erreur est survenue pendant la connexion.');
      setError(message);
      return { ok: false, error: message };
    }
  };

  const signup = async (email: string, password: string, name?: string): Promise<MutationResult<User>> => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const message = await extractApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(formatApiError(message, res.status, 'Une erreur est survenue pendant l\'inscription.'));
      }
      const data = await res.json();
      const token = data?.token;
      const user = data?.user ?? null;
      // Si l'utilisateur n'est pas actif, ne pas stocker le token ni setUser
      if (user && user.is_active === false) {
        return { ok: true, user };
      }
      if (token) {
        sessionStorage.setItem('subtracker_token', token);
      }
      setUser(user);
      return { ok: true, user };
    } catch (err: any) {
      const rawMessage = err?.message ?? '';
      const message = formatApiError(rawMessage, undefined, 'Une erreur est survenue pendant l\'inscription.');
      setError(message);
      return { ok: false, error: message };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('subtracker_token');
    setUser(null);
  };

  const refresh = async (token?: string): Promise<MutationResult<string>> => {
    const current = token ?? getToken();
    if (!current) return { ok: false, error: 'No token' };
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${current}` },
        body: JSON.stringify({ token: current }),
      });
      if (!res.ok) {
        const message = await extractApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(formatApiError(message, res.status, 'Une erreur est survenue.'));
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
      return { ok: false, error: formatApiError(err?.message ?? '', undefined, 'Une erreur est survenue.').trim() };
    }
  };

  const fetchMe = async (): Promise<User> => {
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

  const updateUserSettings = async (settings: { notificationsEnabled: boolean }): Promise<MutationResult<User>> => {
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
        const message = await extractApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(formatApiError(message, res.status, 'Une erreur est survenue.'));
      }

      const data = await res.json();
      // Optionally update user state if the backend returns the updated user
      if (data.user) {
        setUser(data.user);
      }
      return { ok: true, user: data.user };
    } catch (err: any) {
      console.error('Failed to update user settings:', err.message);
      return { ok: false, error: formatApiError(err?.message ?? '', undefined, 'Une erreur est survenue.') };
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
