// src/lib/api/email.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * 📧 Envoyer un email de vérification
 */
export async function sendVerificationEmail(email: string) {
    const response = await fetch(`${API_URL}/api/email/send-verification-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’envoi de l’email');
    }

    return data;
}