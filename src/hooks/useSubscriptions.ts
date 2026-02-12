import { useState, useMemo, useEffect, useCallback } from 'react';
import { Subscription, SortOption } from '@/types/subscription';

// Helper function to calculate months difference
function differenceInMonths(dateLeft: Date, dateRight: Date): number {
  const yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
  const monthDiff = dateLeft.getMonth() - dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}

// Helper function to calculate days difference
export function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const diffTime = dateLeft.getTime() - dateRight.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseSubscription = (raw: any): Subscription => ({
    ...raw,
    nextPaymentDate: raw.nextPaymentDate ? new Date(raw.nextPaymentDate) : new Date(),
    startDate: raw.startDate ? new Date(raw.startDate) : undefined,
  });

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

    try {
      const res = await fetch(`${API_BASE}/api/subscriptions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSubscriptions((data || []).map(parseSubscription));
    } catch (err: any) {
      setError(err.message || 'Erreur de récupération');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const addSubscription = async (newSub: Omit<Subscription, 'id'>) => {
    try {
      const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

      const res = await fetch(`${API_BASE}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      setSubscriptions((prev) => [...prev, parseSubscription(created)]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to add subscription', err);
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Omit<Subscription, 'id'>>) => {
    try {
      const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

      const res = await fetch(`${API_BASE}/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? parseSubscription(updated) : sub)));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to update subscription', err);
    }
  };

  const removeSubscription = async (id: string) => {
    try {
      const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

      const res = await fetch(`${API_BASE}/api/subscriptions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete subscription', err);
    }
  };

  const getSubscriptionStats = (subscription: Subscription) => {
    const startDate = subscription.startDate || new Date();
    const monthsActive = Math.max(1, differenceInMonths(new Date(), startDate) + 1);
    const monthlyPrice = subscription.billingCycle === 'yearly' 
      ? subscription.price / 12 
      : subscription.price;
    const totalSpent = monthlyPrice * monthsActive;
    const yearlyPrice = subscription.billingCycle === 'yearly' 
      ? subscription.price 
      : subscription.price * 12;

    return {
      monthlyPrice,
      yearlyPrice,
      totalSpent,
      monthsActive,
    };
  };

  const sortedSubscriptions = useMemo(() => {
    const sorted = [...subscriptions];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime());
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price':
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted;
    }
  }, [subscriptions, sortBy]);

  const upcomingSubscriptions = useMemo(() => {
    return [...subscriptions]
      .sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime())
      .slice(0, 4);
  }, [subscriptions]);

  const stats = useMemo(() => {
    const monthlyTotal = subscriptions.reduce((acc, sub) => {
      const monthlyPrice = sub.billingCycle === 'yearly' ? sub.price / 12 : sub.price;
      return acc + monthlyPrice;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;

    return {
      monthlyTotal,
      yearlyTotal,
      totalCount: subscriptions.length,
    };
  }, [subscriptions]);

  return {
    subscriptions: sortedSubscriptions,
    upcomingSubscriptions,
    stats,
    sortBy,
    setSortBy,
    addSubscription,
    updateSubscription,
    removeSubscription,
    getSubscriptionStats,
    loading,
    error,
    refetch: fetchSubscriptions,
  };
}
