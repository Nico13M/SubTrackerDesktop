import { useState, useMemo } from 'react';
import { Subscription, SortOption } from '@/types/subscription';
import { mockSubscriptions } from '@/data/mockSubscriptions';

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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const addSubscription = (newSub: Omit<Subscription, 'id'>) => {
    const subscription: Subscription = {
      ...newSub,
      id: Date.now().toString(),
    };
    setSubscriptions((prev) => [...prev, subscription]);
  };

  const updateSubscription = (id: string, updates: Partial<Omit<Subscription, 'id'>>) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub))
    );
  };

  const removeSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
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
  };
}
