import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmailSent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Vérifiez votre boîte mail</h1>
        <p className="mb-6">
          Un email de confirmation vient de vous être envoyé. Veuillez cliquer sur le lien de validation pour activer votre compte.
        </p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => navigate('/login')}
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};

export default EmailSent;
