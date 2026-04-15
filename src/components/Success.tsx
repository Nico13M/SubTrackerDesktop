import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const token = getToken();

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'idle') return; // Évite les requêtes infinies

    const sessionId = searchParams.get('session_id') || searchParams.get('sessionId') || searchParams.get('session');
    if (!sessionId) {
      setStatus('failed');
      setMessage('Aucun identifiant de session de paiement fourni.');
      return;
    }

    const verify = async () => {
      setStatus('verifying');
      try {
        const url = api(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`);
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          setStatus('failed');
          setMessage(text || `Erreur serveur ${res.status}`);
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : null;

        setStatus('success');
        setMessage(data?.message || 'Votre paiement a bien été enregistré. Merci !');
      } catch (err: any) {
        setStatus('failed');
        setMessage('Erreur réseau lors de la vérification du paiement.');
      }
    };

    verify();
  }, [searchParams, token, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full">
        <h1 className="text-2xl font-semibold mb-4">Validation du paiement</h1>

        <div className="p-6 rounded-lg bg-white shadow">
          {status === 'verifying' && <p>Vérification en cours...</p>}

          {status === 'success' && (
            <div>
              <p className="mb-4">{message}</p>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Voir mes abonnements
                </Button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div>
              <p className="mb-4 text-destructive">{message}</p>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/pricing')}>Retour à la page prix</Button>
                <Button variant="outline" onClick={() => navigate('/')}>Accueil</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Success;
