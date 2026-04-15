import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VerifiedPopup from '@/components/auth/VerifiedPopup';


const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>("pending");
  const [message, setMessage] = useState('');
  const [showVerifiedPopup, setShowVerifiedPopup] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
      return;
    }
    const isProd = (import.meta as any).env?.MODE === 'production';
    const API_BASE: string = isProd
      ? (import.meta as any).env?.VITE_API_BASE ?? ''
      : 'http://localhost:3000';
    fetch(`${API_BASE}/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : null;
        if (res.ok && data.success) {
          setStatus('success');
          setMessage('Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter.');
          setShowVerifiedPopup(true);
        } else {
          setStatus('error');
          setMessage((data && data.error) || 'Erreur lors de la vérification.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erreur réseau.');
      });
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <VerifiedPopup open={showVerifiedPopup} onClose={() => setShowVerifiedPopup(false)} />
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Vérification de l'email</h1>
        {status === 'pending' && <p>Vérification en cours...</p>}
        {status !== 'pending' && <p className="mb-6">{message}</p>}
        {status === 'success' && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => navigate('/login')}
          >
            Se connecter
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
