import { Subscription } from '@/types/subscription';

export const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    price: 15.99,
    currency: '€',
    billingCycle: 'monthly',
    nextPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    category: 'Entertainment',
    color: 'hsl(0, 75%, 50%)',
    icon: 'N'
  },
  {
    id: '2',
    name: 'Spotify',
    price: 9.99,
    currency: '€',
    billingCycle: 'monthly',
    nextPaymentDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    category: 'Music',
    color: 'hsl(142, 70%, 45%)',
    icon: 'S'
  },
  {
    id: '3',
    name: 'Salle de sport',
    price: 35,
    currency: '€',
    billingCycle: 'monthly',
    nextPaymentDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    category: 'Fitness',
    color: 'hsl(262, 83%, 58%)',
    icon: 'G'
  },
  {
    id: '4',
    name: 'iCloud',
    price: 2.99,
    currency: '€',
    billingCycle: 'monthly',
    nextPaymentDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
    category: 'Cloud',
    color: 'hsl(200, 80%, 50%)',
    icon: 'i'
  },
  {
    id: '5',
    name: 'Amazon Prime',
    price: 69.90,
    currency: '€',
    billingCycle: 'yearly',
    nextPaymentDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    category: 'Shopping',
    color: 'hsl(38, 92%, 50%)',
    icon: 'A'
  },
  {
    id: '6',
    name: 'Disney+',
    price: 8.99,
    currency: '€',
    billingCycle: 'monthly',
    nextPaymentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    category: 'Streaming',
    color: 'hsl(220, 80%, 50%)',
    icon: 'D'
  }
];
