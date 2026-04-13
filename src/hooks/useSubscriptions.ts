import { useState, useMemo, useEffect, useCallback } from 'react';
import { Subscription, SortOption } from '@/types/subscription';
import { extractApiErrorMessage, formatApiError } from '@/lib/apiErrors';

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

  type MutationResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };

  const parseSubscription = (raw: any): Subscription => {
    const nextRaw = raw.nextPaymentDate ?? raw.next_payment_date ?? raw.next_payment ?? null;
    const startRaw = raw.startDate ?? raw.start_date ?? null;
    const billing = (raw.billingCycle ?? raw.billing_cycle) as 'monthly' | 'yearly' | undefined;

    // Normalize icon value: accept brand ids (spotify, netflix...), initials, or full names.
    function normalizeIcon(rawIcon: any, nameVal: string | undefined): string | undefined {
      if (!rawIcon && !nameVal) return undefined;
      const rawStr = rawIcon ? String(rawIcon).trim() : '';
      const nameStr = nameVal ? String(nameVal).toLowerCase() : '';

      const brands = ['spotify', 'netflix', 'amazon', 'apple', 'disney', 'youtube'];

      // If rawIcon matches a known brand id, return it
      const lowerRaw = rawStr.toLowerCase();
      if (brands.includes(lowerRaw)) return lowerRaw;

      // If rawIcon is a single letter, preserve it as an initial.
      // Previously we attempted to map single letters to brand slugs
      // (e.g. 'N' -> 'netflix'), which made user-chosen initials turn
      // into brand icons. We now preserve single-character values so
      // that initials remain initials.
      if (rawStr.length === 1) {
        return rawStr;
      }

      // If rawIcon looks like a full name, try to map
      for (const b of brands) {
        if (rawStr.toLowerCase().includes(b) || nameStr.includes(b)) return b;
      }

      return rawIcon ? rawIcon : undefined;
    }

    const normalizedIcon = normalizeIcon(raw.icon ?? raw.icon_name ?? raw.iconName, raw.name ?? raw.title);

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
      icon: normalizedIcon,
      // image support removed from UI; ignore any image fields
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
      if (!res.ok) {
        const message = await extractApiErrorMessage(res, `HTTP ${res.status}`);
        throw new Error(formatApiError(message, res.status, 'Impossible de charger les abonnements.'));
      }
      const data = await res.json();
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (Array.isArray(data.subscriptions)) items = data.subscriptions;
      else if (Array.isArray(data.data)) items = data.data;
      else if (Array.isArray(data.items)) items = data.items;
      else items = [];

      setSubscriptions((items || []).map(parseSubscription));
    } catch (err: any) {
      setError(formatApiError(err?.message ?? '', undefined, 'Impossible de charger les abonnements.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);
  const [sortBy, setSortBy] = useState<SortOption>('price');

  const addSubscription = async (newSub: Omit<Subscription, 'id'>): Promise<MutationResult<Subscription>> => {
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
      };

      const res = await fetch(`${API_BASE}/api/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await extractApiErrorMessage(res, `HTTP ${res.status}`);
        return { ok: false, error: formatApiError(message, res.status, 'Impossible d’ajouter l’abonnement.') };
      }
      const created = await res.json();
     // Normalize various possible response shapes
      let newItem: any = created;
      if (Array.isArray(created)) newItem = created[0];
      else if (created.subscription) newItem = created.subscription;
      else if (created.data && created.data.subscription) newItem = created.data.subscription;
      else if (created.data && Array.isArray(created.data)) newItem = created.data[0];
      else if (created.subscriptions && Array.isArray(created.subscriptions)) newItem = created.subscriptions[0];

      const parsed = parseSubscription(newItem);
      setSubscriptions((prev) => [...prev, parsed]);
      return { ok: true, data: parsed };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to add subscription', err);
      const message = formatApiError(err instanceof Error ? err.message : String(err), undefined, 'Impossible d’ajouter l’abonnement.');
      return { ok: false, error: message };
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Omit<Subscription, 'id'>>): Promise<MutationResult<Subscription>> => {
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
      // image updates removed from UI; ignore image updates

      const res = await fetch(`${API_BASE}/api/subscriptions/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
     if (!res.ok) {
      const message = await extractApiErrorMessage(res, `HTTP ${res.status}`);
      return { ok: false, error: formatApiError(message, res.status, 'Impossible de modifier l’abonnement.') };
     }
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
            // imageUrl removed from type and UI
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

      if (!returnedParsed) {
        return { ok: false, error: 'Impossible de mettre à jour l’abonnement.' };
      }

      return { ok: true, data: returnedParsed };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to update subscription', err);
      const message = formatApiError(err instanceof Error ? err.message : String(err), undefined, 'Impossible de modifier l’abonnement.');
      return { ok: false, error: message };
    }
  };

  const removeSubscription = async (id: string): Promise<MutationResult<null>> => {
    try {
      const API_BASE: string = (import.meta as any).env?.VITE_API_BASE ?? '';

      const token = sessionStorage.getItem('subtracker_token');
      const res = await fetch(`${API_BASE}/api/subscriptions/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) {
        const message = await extractApiErrorMessage(res, `HTTP ${res.status}`);
        return { ok: false, error: formatApiError(message, res.status, 'Impossible de supprimer l’abonnement.') };
      }
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
      return { ok: true, data: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete subscription', err);
      const message = formatApiError(err instanceof Error ? err.message : String(err), undefined, 'Impossible de supprimer l’abonnement.');
      return { ok: false, error: message };
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

    function getNextPaymentDate(sub: Subscription): Date {
      let nextDate = new Date(sub.nextPaymentDate);
      nextDate.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
      const originalDay = nextDate.getDate();
      let safety = 0;
      while (nextDate < now && safety < 24) {
        const currentMonth = nextDate.getMonth();
        nextDate.setMonth(currentMonth + 1);
        if (nextDate.getDate() < originalDay) {
          nextDate.setDate(0);
        } else {
          nextDate.setDate(originalDay);
        }
        safety++;
      }
      return nextDate;
    }

    return [...subscriptions]
      .map((sub) => ({
        ...sub,
        _nextPaymentDate: getNextPaymentDate(sub)
      }))
      .filter((sub) => {
        const d = sub._nextPaymentDate;
        // Inclure aussi les abonnements dont la prochaine échéance est aujourd'hui
        return (
          (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) ||
          d.getTime() === now.getTime()
        );
      })
      .sort((a, b) => a._nextPaymentDate.getTime() - b._nextPaymentDate.getTime())
      .map((sub) => {
        const { _nextPaymentDate, ...rest } = sub;
        return rest as Subscription;
      });
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
