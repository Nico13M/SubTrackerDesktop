import { useState } from 'react';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Login() {
  const { login, signup, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) return setLocalError('Email et mot de passe requis');
    if (!isSignup) {
      const res = await login(email, password);
      if (!res.ok) {
        setLocalError(res.error ?? 'Échec connexion');
      } else {
        window.location.reload();
      }
    } else {
      const res = await signup(email, password, name || undefined);
      if (!res.ok) {
        setLocalError(res.error ?? 'Échec inscription');
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">{isSignup ? 'Créer un compte' : 'Se connecter'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} type="text" />
            </div>
          )}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="space-y-1">
            <Label>Mot de passe</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {(localError || error) && <p className="text-sm text-destructive">{localError ?? error}</p>}
          <Button type="submit" className="w-full">{loading ? (isSignup ? 'Inscription...' : 'Connexion...') : (isSignup ? "S'inscrire" : 'Se connecter')}</Button>
        </form>
        <div className="mt-4 text-center">
          <button
            className="text-sm text-primary underline"
            onClick={(e) => { e.preventDefault(); setIsSignup(!isSignup); setLocalError(null); }}
          >
            {isSignup ? 'J’ai déjà un compte — Se connecter' : 'Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
