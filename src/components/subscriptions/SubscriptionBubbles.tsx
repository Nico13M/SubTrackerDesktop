import { Subscription } from '@/types/subscription';
import SubscriptionAvatar from './SubscriptionAvatar';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface SubscriptionBubblesProps {
  subscriptions: Subscription[];
}

export function SubscriptionBubbles({ subscriptions }: SubscriptionBubblesProps) {
  const displaySubs = subscriptions.slice(0, 6);
  const remaining = subscriptions.length - displaySubs.length;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Calcul de la taille basée sur le prix
  const getBubbleSize = (price: number, billingCycle: string) => {
    const monthlyPrice = billingCycle === 'yearly' ? price / 12 : price;
    
    if (monthlyPrice >= 100) return 'w-14 h-14 text-base';
    if (monthlyPrice >= 50) return 'w-10 h-10 text-sm';
    if (monthlyPrice >= 20) return 'w-8 h-8 text-sm';
    if (monthlyPrice >= 10) return 'w-6 h-6 text-xs';
    return 'w-8 h-8 text-xs';
  };

  const getMonthlyPrice = (sub: Subscription) => {
    return sub.billingCycle === 'yearly' ? sub.price / 12 : sub.price;
  };

  const getYearlyPrice = (sub: Subscription) => {
    return sub.billingCycle === 'yearly' ? sub.price : sub.price * 12;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 w-full">
      {displaySubs.map((sub) => {
        const sizeClass = getBubbleSize(sub.price, sub.billingCycle);
        const monthlyPrice = getMonthlyPrice(sub);
        const yearlyPrice = getYearlyPrice(sub);
        const getIconPx = (sc: string) => {
          if (sc.includes('w-14')) return 24;
          if (sc.includes('w-10')) return 20;
          if (sc.includes('w-8')) return 18;
          if (sc.includes('w-6')) return 16;
          return 16;
        };
        const iconPx = getIconPx(sizeClass);

        return (
          <motion.div
            key={sub.id}
            className="relative"
            initial={false}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => setHoveredId(sub.id)}
            onMouseLeave={() => setHoveredId((current) => (current === sub.id ? null : current))}
          >
            <SubscriptionAvatar
              name={sub.name}
              icon={sub.icon}
              color={sub.color}
              sizeClass={`${sizeClass} rounded-full`}
              iconPx={iconPx}
            />
            
            {/* Popup au hover */}
            <AnimatePresence initial={false}>
              {hoveredId === sub.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-3 min-w-[160px]"
                  >
                    {/* Flèche */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-popover"></div>
                    
                    {/* Contenu */}
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: sub.color }}
                      >
                        <SubscriptionAvatar
                          name={sub.name}
                          icon={sub.icon}
                          color={sub.color}
                          sizeClass="w-12 h-12 rounded-full"
                          iconPx={14}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.category}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        
                        <span className="text-muted-foreground">Par mois</span>
                        <span className="font-medium">{sub.currency}{monthlyPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Par an</span>
                        <span className="font-medium">{sub.currency}{yearlyPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border/50">
                        <span className="text-muted-foreground">Facturation</span>
                        <span className="font-medium">{sub.billingCycle === 'monthly' ? 'Mensuelle' : 'Annuelle'}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      {remaining > 0 && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium shadow-md ring-2 ring-background"
        >
          +{remaining}
        </motion.div>
      )}
    </div>
  );
}
