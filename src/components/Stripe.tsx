import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

const Stripe: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const token = getToken();

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const params = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const sessionId = params.get('session_id') || params.get('sessionId') || params.get('session');

  const verifySession = async () => {
    if (!sessionId) {
      setMessage('Aucun `session_id` trouvé dans l’URL.');
      return;
    }
    setStatus('verifying');
    setMessage(null);
    try {
      const url = api(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`);
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setStatus('failed');
        setMessage(text || `Erreur serveur ${res.status}`);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : null;

      setStatus('success');
      setMessage(data?.message || 'Vérification terminée.');
    } catch (err: any) {
      setStatus('failed');
      setMessage('Erreur réseau lors de la vérification: ' + (err?.message || String(err)));
    }
  };

  useEffect(() => {
    // Si Stripe redirige vers /stripe avec session_id, tenter une vérification automatique.
    if (sessionId) {
      verifySession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Retour Stripe</h1>

      <div className="mb-4">
        <strong>Paramètres de la requête :</strong>
        <pre className="mt-2 p-2 rounded bg-muted/20 overflow-auto text-sm">
          {JSON.stringify(Object.fromEntries(params.entries()), null, 2)}
        </pre>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        <Button variant="outline" onClick={verifySession} disabled={status === 'verifying'}>
          {status === 'verifying' ? 'Vérification...' : 'Vérifier la session'}
        </Button>
      </div>

      {message && (
        <div className="mt-4 rounded-md bg-muted/10 p-3 text-sm">
          {message}
        </div>
      )}
    </div>
  );
};

export default Stripe;
