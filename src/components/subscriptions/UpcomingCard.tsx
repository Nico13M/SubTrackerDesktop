import { Subscription } from '@/types/subscription';
import { differenceInDays } from '@/hooks/useSubscriptions';

interface UpcomingCardProps {
  subscription: Subscription;
  onClick?: () => void;
}

export function UpcomingCard({ subscription, onClick }: UpcomingCardProps) {
  const daysUntilPayment = differenceInDays(subscription.nextPaymentDate, new Date());
  const maxDays = 30;
  const progress = Math.max(0, Math.min(100, ((maxDays - daysUntilPayment) / maxDays) * 100));
  
  const isUrgent = daysUntilPayment <= 3;

  const monthlyPrice = subscription.billingCycle === 'yearly' 
    ? subscription.price / 12 
    : subscription.price;

  return (
    <div 
      className="flex-shrink-0 rounded-2xl bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md min-w-[160px] cursor-pointer active:scale-[0.98] lg:min-w-0 lg:w-full lg:p-5"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {subscription.imageUrl ? (
          <img 
            src={subscription.imageUrl} 
            alt={subscription.name} 
            className="h-12 w-12 rounded-xl object-cover lg:h-14 lg:w-14"
          />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-primary-foreground lg:h-14 lg:w-14"
            style={{ backgroundColor: subscription.color }}
          >
            {subscription.icon || subscription.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate lg:text-lg">{subscription.name}</h3>
          <p className="text-sm text-muted-foreground lg:text-base">
            {subscription.currency}{monthlyPrice.toFixed(2)} / m
          </p>
        </div>
      </div>
      
      <div className="mt-3 lg:mt-4">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium lg:text-base ${isUrgent ? 'text-warning' : 'text-muted-foreground'}`}>
            {daysUntilPayment} jours restants
          </p>
          {isUrgent && (
            <span className="hidden lg:inline-block rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
              Bientôt
            </span>
          )}
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted lg:h-1.5 lg:mt-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isUrgent ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
