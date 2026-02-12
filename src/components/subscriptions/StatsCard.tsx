import { cn } from '@/lib/utils';
import { TrendingUp, Calendar } from 'lucide-react';

interface StatsCardProps {
  value: string;
  label: string;
  variant?: 'primary' | 'secondary';
  icon?: 'yearly' | 'monthly';
}

export function StatsCard({ value, label, variant = 'primary', icon }: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]',
        variant === 'primary' 
          ? 'bg-lavender' 
          : 'bg-accent'
      )}
    >
      <p className={cn(
        'text-3xl font-bold tracking-tight',
        variant === 'primary' ? 'text-primary' : 'text-accent-foreground'
      )}>
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {icon === 'yearly' && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
        {icon === 'monthly' && <Calendar className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
