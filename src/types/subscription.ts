export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  next_payment_date: Date;
  start_date?: Date;
  category: string;
  color: string;
  icon?: string;
}

export type SortOption = 'recent' | 'name' | 'price';
