import useAuth from './useAuth';
import { useSubscriptions } from './useSubscriptions';
import { Subscription } from '@/types/subscription';
import emailjs from '@emailjs/browser';

export function useNotifications() {
  const { user } = useAuth();
  const { subscriptions } = useSubscriptions();

  const SERVICE_ID: string = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID ;
  const TEMPLATE_ID: string = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID ;
  const PUBLIC_KEY: string = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY ;

  const sendNotificationEmail = async (sub: Subscription) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    try {
      const templateParams = {
        to_name: user.name || user.email,
        to_email: user.email,
        subscription_name: sub.name,
        amount: sub.price,
        due_date: sub.next_payment_date,
        app_url: window.location.origin,
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email EmailJS:', error);
      throw error;
    }
  };

  const checkAndSendNotifications = async () => {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const upcomingSubscriptions = subscriptions.filter(sub => {
      const paymentDate = new Date(sub.next_payment_date);
      return paymentDate <= threeDaysFromNow && paymentDate >= today;
    });

    for (const sub of upcomingSubscriptions) {
      try {
        await sendNotificationEmail(sub);
      } catch (error) {
        console.error(`Failed to send notification for ${sub.name}:`, error);
      }
    }
  };

  return { sendNotificationEmail, checkAndSendNotifications };
}
