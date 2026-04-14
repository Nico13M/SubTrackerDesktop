import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('pending');
    setMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (res.ok) {
        navigate('/password-reset-sent');
      } else {
        setStatus('error');
        setMessage(data?.error ?? "Erreur lors de l'envoi de l'email.");
      }
    } catch (err) {
      setStatus('error');
      setMessage('Erreur réseau.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Réinitialiser le mot de passe</h1>
        <p className="mb-4">Indiquez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {message && <p className="text-sm text-destructive">{message}</p>}
          <div className="flex items-center justify-between">
            <Button type="submit" disabled={status === 'pending'}>
              {status === 'pending' ? 'Envoi...' : 'Envoyer'}
            </Button>
            <button
              type="button"
              className="text-sm text-primary underline"
              onClick={() => navigate('/login')}
            >
              Retour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
