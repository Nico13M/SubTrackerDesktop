import { sendVerificationEmail } from '@/lib/api/email';

export function useEmailVerification() {
    const sendEmail = async (email: string) => {
        await sendVerificationEmail(email);
    };

    return { sendEmail };
}