import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

function Login() {
  const { login, signup, error, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setLocalError(null);
    if (!email || !password) return setLocalError('Email et mot de passe requis');
    setIsSubmitting(true);
    try {
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
          navigate('/email-sent');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si déjà authentifié, on ne retourne rien (useEffect redirige)
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-card p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">{isSignup ? 'Créer un compte' : 'Se connecter'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} type="text" disabled={isSubmitting} />
            </div>
          )}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required disabled={isSubmitting} />
          </div>
          <div className="space-y-1">
            <Label>Mot de passe</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required disabled={isSubmitting} />
          </div>
          {(localError || error) && <p className="text-sm text-destructive">{localError ?? error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting || loading ? (isSignup ? 'Inscription...' : 'Connexion...') : (isSignup ? "S'inscrire" : 'Se connecter')}
          </Button>
          {isSignup && (
            <p className="text-xs text-muted-foreground">
              En vous inscrivant, vous acceptez le traitement de vos donnees personnelles conforme au RGPD pour la creation et la gestion de votre compte.
            </p>
          )}
        </form>
        <div className="mt-4 text-center">
          <button
            className="text-sm text-primary underline"
            onClick={(e) => { e.preventDefault(); setIsSignup(!isSignup); setLocalError(null); }}
            disabled={isSubmitting}
          >
            {isSignup ? 'J’ai déjà un compte — Se connecter' : 'Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
