import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    setStatus('pending');
    setMessage('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        navigate('/login', { state: { passwordChanged: true } });
      } else {
        setStatus('error');
        setMessage(data?.error ?? 'Erreur lors de la réinitialisation.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Erreur réseau.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Choisir un nouveau mot de passe</h1>
        {status === 'error' && message && <p className="text-sm text-destructive mb-4">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Confirmer le mot de passe</Label>
            <Input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" disabled={status === 'pending' || !token}>
              {status === 'pending' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>
            <button type="button" className="text-sm text-primary underline" onClick={() => navigate('/login')}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
