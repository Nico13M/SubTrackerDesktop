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
  // Calculate difference in whole calendar days (UTC) to avoid timezone and
  // hour-of-day rounding issues. This returns the number of days from
  // dateRight to dateLeft (can be negative if dateLeft is earlier).
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const utcLeft = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate());
  const utcRight = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate());
  return Math.floor((utcLeft - utcRight) / MS_PER_DAY);
}

/**
 * Retourne le nombre de jours entre aujourd'hui (ou `fromDate`) et `target`.
 * - `target` peut être un `Date` ou une ISO string.
 * - `inclusive = true` retournera `difference + 1` (compte inclusif).
 */
export function getDaysUntil(target: Date | string, fromDate?: Date, inclusive = false): number {
  const from = fromDate ? new Date(fromDate) : new Date();
  const targetDate = typeof target === 'string' ? new Date(target) : target;
  const days = differenceInDays(targetDate, from);
  return inclusive ? days + 1 : days;
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseSubscription = (raw: any): Subscription => {
    const nextRaw = raw.nextPaymentDate ?? raw.next_payment_date ?? raw.next_payment ?? null;
    const startRaw = raw.startDate ?? raw.start_date ?? null;
    const billing = (raw.billingCycle ?? raw.billing_cycle) as 'monthly' | 'yearly' | undefined;

    return {
      id: String(raw.id ?? raw._id ?? Date.now()),
      name: raw.name ?? raw.title ?? 'Untitled',
      price: Number(raw.price ?? 0),
      currency: raw.currency ?? '€',
      billingCycle: billing ?? 'monthly',
      nextPaymentDate: nextRaw ? new Date(nextRaw) : new Date(),
      startDate: startRaw ? new Date(startRaw) : undefined,
      category: raw.category ?? 'Other',
      color: raw.color ?? 'hsl(220, 80%, 50%)',
      icon: raw.icon ?? undefined,
      imageUrl: raw.imageUrl ?? raw.image_url ?? undefined,
    } as Subscription;
  };

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
    const now = new Date();
    const MAX_DAYS = 30;

    return [...subscriptions]
      .filter((sub) => {
        const days = differenceInDays(sub.nextPaymentDate, now);
        return days >= 0 && days <= MAX_DAYS;
      })
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
