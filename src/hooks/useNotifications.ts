import useAuth from './useAuth';
import { useSubscriptions } from './useSubscriptions';
import { Subscription } from '@/types/subscription';

export function useNotifications() {
  const { user } = useAuth();
  const { subscriptions } = useSubscriptions();

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

  const sendNotificationEmail = async (sub: Subscription) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }

    try {
      const token = sessionStorage.getItem('subtracker_token');
      const response = await fetch(`${API_BASE}/api/notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: user.email,
          subscription_name: sub.name,
          amount: sub.price,
          due_date: sub.nextPaymentDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  const checkAndSendNotifications = async () => {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const upcomingSubscriptions = subscriptions.filter(sub => {
      const paymentDate = new Date(sub.nextPaymentDate);
      return paymentDate <= threeDaysFromNow && paymentDate >= today;
    });

    for (const sub of upcomingSubscriptions) {
      try {
        await sendNotificationEmail(sub);
        console.log(`Notification sent for ${sub.name}`);
      } catch (error) {
        console.error(`Failed to send notification for ${sub.name}:`, error);
      }
    }
  };

  return { sendNotificationEmail, checkAndSendNotifications };
}
