import { Subscription } from '@/types/subscription';
import { differenceInDays, getDaysUntil } from '@/hooks/useSubscriptions';

interface SubscriptionListItemProps {
  subscription: Subscription;
  onClick?: () => void;
}

export function SubscriptionListItem({ subscription, onClick }: SubscriptionListItemProps) {
  const daysUntilPayment = getDaysUntil(subscription.nextPaymentDate);
  
  const yearlyPrice = subscription.billingCycle === 'monthly' 
    ? subscription.price * 12 
    : subscription.price;
  
  const monthlyPrice = subscription.billingCycle === 'yearly' 
    ? subscription.price / 12 
    : subscription.price;

  return (
    <div 
      className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer active:scale-[0.98] lg:flex-col lg:items-start lg:p-6"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 lg:w-full">
        {subscription.imageUrl ? (
          <img 
            src={subscription.imageUrl} 
            alt={subscription.name} 
            className="h-14 w-14 flex-shrink-0 rounded-xl object-cover lg:h-16 lg:w-16"
          />
        ) : (
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-primary-foreground lg:h-16 lg:w-16"
            style={{ backgroundColor: subscription.color }}
          >
            {subscription.icon || subscription.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1 min-w-0 lg:hidden">
          <h3 className="font-semibold text-card-foreground">{subscription.name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {subscription.currency}{monthlyPrice.toFixed(2)} / m
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {subscription.currency}{yearlyPrice.toFixed(1)} / y
            </span>
          </div>
        </div>
        
          <div className="text-right flex-shrink-0 lg:hidden">
          <p className={`${daysUntilPayment === 0 ? 'text-destructive' : 'text-muted-foreground'} text-sm`}>{daysUntilPayment === 0 ? "Aujourd'hui" : `${daysUntilPayment} ${daysUntilPayment === 1 ? 'jour' : 'jours'}`}</p>
          {daysUntilPayment === 0 && (
            <span className="inline-block mt-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
              Aujourd'hui
            </span>
          )}
          <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${daysUntilPayment === 0 ? 'bg-destructive' : 'bg-muted-foreground/40'}`}
              style={{ width: `${Math.min(100, (Math.max(0, daysUntilPayment) / 30) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block lg:w-full lg:mt-4">
        <h3 className="font-semibold text-card-foreground text-lg">{subscription.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{subscription.category}</p>
        
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {subscription.currency}{monthlyPrice.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground"> / mois</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {subscription.currency}{yearlyPrice.toFixed(1)} / an
            </p>
          </div>
          <div className="text-right">
            <p className={`${daysUntilPayment === 0 ? 'text-destructive' : 'text-foreground'} text-sm font-medium`}>{daysUntilPayment === 0 ? "Aujourd'hui" : `${daysUntilPayment} ${daysUntilPayment === 1 ? 'jour' : 'jours'}`}</p>
            {daysUntilPayment === 0 && (
              <div className="mt-2">
                <span className="inline-block rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">Aujourd'hui</span>
              </div>
            )}
            <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${daysUntilPayment === 0 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${Math.max(5, Math.min(100, (1 - Math.max(0, daysUntilPayment) / 30) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
