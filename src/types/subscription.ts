export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextPaymentDate: Date;
  startDate?: Date;
  category: string;
  color: string;
  icon?: string;
  imageUrl?: string;
}

export type SortOption = 'recent' | 'name' | 'price';
