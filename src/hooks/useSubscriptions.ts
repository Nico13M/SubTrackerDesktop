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

function parseISODate(raw?: string | Date | null): Date | undefined {
  if (!raw) return undefined;
  if (raw instanceof Date) return raw;
  const s = String(raw);
  // Normalize '+00:00' to 'Z' which is widely supported.
  const normalized = s.endsWith('+00:00') ? s.replace('+00:00', 'Z') : s;
  return new Date(normalized);
}

// Serialize Date to backend format: ISO with '+00:00' timezone suffix.
function serializeDateForBackend(d?: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().replace('Z', '+00:00');
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
      nextPaymentDate: nextRaw ? parseISODate(nextRaw) ?? new Date() : new Date(),
      startDate: startRaw ? parseISODate(startRaw) : undefined,
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
      const token = sessionStorage.getItem('subtracker_token');
      const res = await fetch(`${API_BASE}/api/subscriptions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (Array.isArray(data.subscriptions)) items = data.subscriptions;
      else if (Array.isArray(data.data)) items = data.data;
      else if (Array.isArray(data.items)) items = data.items;
      else items = [];

      setSubscriptions((items || []).map(parseSubscription));
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

      const token = sessionStorage.getItem('subtracker_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Map frontend camelCase fields to backend/postgres snake_case columns
      const payload: any = {
        name: newSub.name,
        price: newSub.price,
        currency: newSub.currency,
        billing_cycle: newSub.billingCycle,
        next_payment_date: serializeDateForBackend(newSub.nextPaymentDate),
        start_date: serializeDateForBackend(newSub.startDate),
        category: newSub.category,
        color: newSub.color,
        icon: newSub.icon,
        image_url: newSub.imageUrl ?? null,
      };

      const res = await fetch(`${API_BASE}/api/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const created = await res.json();
     // Normalize various possible response shapes
      let newItem: any = created;
      if (Array.isArray(created)) newItem = created[0];
      else if (created.subscription) newItem = created.subscription;
      else if (created.data && created.data.subscription) newItem = created.data.subscription;
      else if (created.data && Array.isArray(created.data)) newItem = created.data[0];
      else if (created.subscriptions && Array.isArray(created.subscriptions)) newItem = created.subscriptions[0];

      setSubscriptions((prev) => [...prev, parseSubscription(newItem)]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to add subscription', err);
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Omit<Subscription, 'id'>>): Promise<Subscription | null> => {
    try {
      const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

      const token = sessionStorage.getItem('subtracker_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      // Map update fields to snake_case
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.billingCycle !== undefined) payload.billing_cycle = updates.billingCycle;
      if (updates.nextPaymentDate !== undefined) payload.next_payment_date = serializeDateForBackend(updates.nextPaymentDate as Date | null);
      if (updates.startDate !== undefined) payload.start_date = serializeDateForBackend(updates.startDate as Date | null);
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;

      const res = await fetch(`${API_BASE}/api/subscriptions/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
     if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      // Debug: log raw PUT response
      // eslint-disable-next-line no-console
      console.debug(`PUT /api/subscriptions/${id} raw response`, updated);

      // Normalize response shapes (similar to POST)
      let updatedItem: any = updated;
      if (Array.isArray(updated)) updatedItem = updated[0];
      else if (updated.subscription) updatedItem = updated.subscription;
      else if (updated.data && updated.data.subscription) updatedItem = updated.data.subscription;
      else if (updated.data && Array.isArray(updated.data)) updatedItem = updated.data[0];
      else if (updated.subscriptions && Array.isArray(updated.subscriptions)) updatedItem = updated.subscriptions[0];

      let returnedParsed: Subscription | null = null;
      setSubscriptions((prev) => {
        const newSubs = prev.map((sub) => {
          if (sub.id !== id) return sub;

          const hasFields = updatedItem && (updatedItem.name || updatedItem.price || updatedItem.next_payment_date || updatedItem.nextPaymentDate || updatedItem.billing_cycle || updatedItem.billingCycle);

          if (hasFields) {
            const parsed = parseSubscription(updatedItem);
            returnedParsed = parsed;
            return parsed;
          }

          // Fallback: backend returned only minimal info (e.g. id). Merge local updates into existing subscription.
          const mergedRaw: any = {
            id: sub.id,
            name: updates.name ?? sub.name,
            price: updates.price ?? sub.price,
            currency: updates.currency ?? sub.currency,
            billingCycle: updates.billingCycle ?? sub.billingCycle,
            nextPaymentDate: updates.nextPaymentDate ?? sub.nextPaymentDate,
            startDate: updates.startDate ?? sub.startDate,
            category: updates.category ?? sub.category,
            color: updates.color ?? sub.color,
            icon: updates.icon ?? sub.icon,
            imageUrl: updates.imageUrl ?? sub.imageUrl,
          };

          // Debug: show merged fallback object
          // eslint-disable-next-line no-console
          console.debug('Merged fallback for subscription update', mergedRaw);

          const parsed = parseSubscription(mergedRaw);
          returnedParsed = parsed;
          return parsed;
        });

        // Debug: log new subscriptions array after update
        // eslint-disable-next-line no-console
        console.debug('Subscriptions after local update', newSubs);

        return newSubs;
      });

      return returnedParsed;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to update subscription', err);
      return null;
    }
  };

  const removeSubscription = async (id: string) => {
    try {
      const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

      const token = sessionStorage.getItem('subtracker_token');
      const res = await fetch(`${API_BASE}/api/subscriptions/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
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
