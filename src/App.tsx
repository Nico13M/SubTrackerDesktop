import { useRef, useState, useEffect } from 'react';
import useAuth, { type UseAuthReturn } from '@/hooks/useAuth';
import Login from '@/components/auth/Login';
import VerifiedPopup from '@/components/auth/VerifiedPopup';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Settings, LogOut, Crown } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useScroll as useViewportScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/subscriptions/StatsCard';
import { SubscriptionBubbles } from '@/components/subscriptions/SubscriptionBubbles';
import { UpcomingCard } from '@/components/subscriptions/UpcomingCard';
import { SubscriptionListItem } from '@/components/subscriptions/SubscriptionListItem';
import { AddSubscriptionDialog } from '@/components/subscriptions/AddSubscriptionDialog';
import { SubscriptionDetailDialog } from '@/components/subscriptions/SubscriptionDetailDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
// Logout button will be rendered below Settings in the sidebar/header when authenticated
import { useSubscriptions } from '@/hooks/useSubscriptions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SortOption, Subscription } from '@/types/subscription';

function App() {
  const auth: UseAuthReturn = useAuth();
  const {
    subscriptions,
    upcomingSubscriptions,
    stats,
    sortBy,
    setSortBy,
    addSubscription,
    updateSubscription,
    removeSubscription,
    getSubscriptionStats,
    error: subscriptionsError,
  } = useSubscriptions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showVerifiedPopup, setShowVerifiedPopup] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    try {
      let changed = false;
      const params = new URLSearchParams(searchParams);

      if (params.get('verified') === 'true') {
        setShowVerifiedPopup(true);
        params.delete('verified');
        changed = true;
      }

      if (params.get('payment') === 'failed' || params.get('canceled') === 'true') {
        setShowCanceled(true);
        params.delete('payment');
        params.delete('canceled');
        changed = true;
      }

      if (changed) {
        setSearchParams(params, { replace: true });
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  // App-level state hooks must be declared unconditionally to preserve hooks order
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [showYearly, setShowYearly] = useState(false);

  const upcomingHeaderRef = useRef<HTMLHeadingElement | null>(null);
  const subscriptionsHeaderRef = useRef<HTMLHeadingElement | null>(null);
  const upcomingInView = useInView(upcomingHeaderRef, { once: true, amount: 0.4 });
  const subscriptionsInView = useInView(subscriptionsHeaderRef, { once: true, amount: 0.4 });

  const { scrollYProgress } = useViewportScroll();
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 130, damping: 24, mass: 0.35 });

  const pointerX = useMotionValue(0);
  const toggleRotate = useTransform(pointerX, [-120, 120], [-2, 2]);

  if (auth.loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Login />;
  }

  const handleSubscriptionClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailDialogOpen(true);
  };

  // Wrap updateSubscription so we can update the selectedSubscription immediately
  const handleUpdate = async (id: string, updates: Partial<Omit<Subscription, 'id'>>) => {
    const updated = await updateSubscription(id, updates as any);
    if (updated.ok) setSelectedSubscription(updated.data);
    return updated;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(amount);
  };

  

  const sortLabels: Record<SortOption, string> = {
    recent: 'Récent',
    name: 'Nom',
    price: 'Prix',
  };

  const selectedStats = selectedSubscription 
    ? getSubscriptionStats(selectedSubscription) 
    : null;

  // Total des prochains paiements (somme des montants listés dans `upcomingSubscriptions`)
  const upcomingTotal = upcomingSubscriptions.reduce((sum, s) => sum + s.price, 0);
  return (
    <div className="min-h-screen bg-background">
      <motion.div
        className="fixed left-0 top-0 z-50 h-1 w-full origin-left bg-primary/70"
        style={{ scaleX: progressScaleX }}
      />
      <VerifiedPopup open={showVerifiedPopup} onClose={() => setShowVerifiedPopup(false)} />
      {showCanceled && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl max-w-sm w-full text-center shadow-lg">
            <h2 className="text-xl font-bold mb-2 text-foreground">Paiement annulé</h2>
            <p className="text-muted-foreground mb-4">Échec du paiement — veuillez réessayer ou annuler l'opération.</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => setShowCanceled(false)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar for desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-border bg-card p-6 lg:block">
        <h1 className="mb-8 text-2xl font-bold text-foreground">SubTracker</h1>
        
        {/* Stats in sidebar */}
        <div className="space-y-4">
          <StatsCard
            value={`€${formatCurrency(stats.yearlyTotal)}`}
            label="Total annuel"
            variant="primary"
            icon="yearly"
          />
          <StatsCard
            value={`€${formatCurrency(stats.monthlyTotal)}`}
            label="Par mois"
            variant="secondary"
            icon="monthly"
          />
          <StatsCard
            value={`${stats.totalCount}`}
            label="Abonnements actifs"
            variant="secondary"
            icon="monthly"
          />
        </div>

        {/* Settings at bottom of sidebar */}
        <div className="absolute bottom-6 left-6 right-6 ">
          <div className=" flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
            <span className="text-sm font-medium text-foreground">Plan</span>
            {auth.user?.has_paid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Crown className="h-3 w-3" /> Premium
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                Gratuit
              </span>
            )}
          </div>
          <SettingsDialog />
              <Button variant="ghost" size="sm" onClick={() => { auth.logout(); window.location.reload(); }}
                className="inline-flex items-center justify-start w-full gap-2 rounded-md bg-destructive/10 px-3 py-1 text-sm text-destructive">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          {/* Mobile Header */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div>
              <h1 className="text-xl font-bold text-foreground">SubTracker</h1>
              <div className="mt-1">
                {auth.user?.has_paid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    Gratuit
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SettingsDialog />
              <Button variant="ghost" size="sm" onClick={() => { auth.logout(); window.location.reload(); }}
                className="inline-flex items-center justify-start gap-2 rounded-md bg-destructive/10 px-3 py-1 text-sm text-destructive">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
              
            </div>
          </div>

          {/* Mobile Stats Grid */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:hidden">
            <div className="space-y-3">
              <StatsCard
                value={`€${formatCurrency(stats.yearlyTotal)}`}
                label="Total annuel"
                variant="primary"
                icon="yearly"
              />
              <StatsCard
                value={`€${formatCurrency(stats.monthlyTotal)}`}
                label="Ce mois"
                variant="secondary"
                icon="monthly"
              />
            </div>
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">/y</span>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <SubscriptionBubbles subscriptions={subscriptions} />
            </div>
          </div>

          {/* Desktop Header */}
          <div className="mb-8 hidden items-center justify-between lg:flex">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
              <p className="text-muted-foreground">Gérez tous vos abonnements en un seul endroit</p>
            </div>
            <AddSubscriptionDialog onAdd={addSubscription} subscriptionCount={subscriptions.length} />
          </div>

          {/* Desktop Stats Bar */}
          <div className="mb-8 hidden gap-6 rounded-2xl bg-card p-6 shadow-sm lg:flex">
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Aperçu des abonnements</span>
              </div>
              <SubscriptionBubbles subscriptions={subscriptions} />
            </div>
            <div className="w-px bg-border" />
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">€{formatCurrency(stats.monthlyTotal)}</p>
                <p className="text-sm text-muted-foreground">par mois</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">€{formatCurrency(stats.yearlyTotal)}</p>
                <p className="text-sm text-muted-foreground">par an</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.totalCount}</p>
                <p className="text-sm text-muted-foreground">abonnements</p>
              </div>
            </div>
          </div>

          {subscriptions.length === 0 && !subscriptionsError && (
            <div className="mb-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Aucun abonnement pour le moment.
            </div>
          )}

          {subscriptionsError && (
            <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {subscriptionsError}
            </div>
          )}

          {/* Coming Up Section */}
          <section className="mb-8">
            <motion.h2
              ref={upcomingHeaderRef}
              initial={false}
              animate={upcomingInView ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-foreground lg:text-xl"
            >
              À venir
            </motion.h2>
            <div className="mb-4 flex items-center justify-start">
              <span className="text-sm font-medium text-muted-foreground@ ">Total à venir: €{formatCurrency(upcomingTotal)}</span>
            </div>
            <div className="overflow-x-hidden">
              <div className="flex gap-3 overflow-x-auto pb-2 px-4 lg:px-0 pr-6">
                <AnimatePresence initial={false} mode="popLayout">
                  {upcomingSubscriptions.map((sub) => (
                    <motion.div
                      key={sub.id}
                      layout
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <UpcomingCard
                        subscription={sub}
                        onClick={() => handleSubscriptionClick(sub)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* All Subscriptions Section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <motion.h2
                  ref={subscriptionsHeaderRef}
                  initial={false}
                  animate={subscriptionsInView ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg font-semibold text-foreground lg:text-xl"
                >
                  Tous les abonnements
                </motion.h2>
                <motion.button
                  onClick={() => setShowYearly(!showYearly)}
                  onPointerMove={(event) => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    pointerX.set(event.clientX - (bounds.left + bounds.width / 2));
                  }}
                  onPointerLeave={() => pointerX.set(0)}
                  style={{ rotate: toggleRotate }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showYearly ? 'Annuel' : 'Mensuel'} · €{formatCurrency(showYearly ? stats.yearlyTotal : stats.monthlyTotal)} {showYearly ? '/ an' : '/ mois'}
                  <span className="ml-1 text-xs text-primary">(cliquer pour changer)</span>
                </motion.button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {sortLabels[sortBy]}
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('price')}>
                    Prix
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    Récent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    Nom
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: Grid layout, Mobile: List layout */}
            <div className="space-y-3 lg:hidden">
              <AnimatePresence initial={false} mode="popLayout">
                {subscriptions.map((sub) => (
                  <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SubscriptionListItem
                      subscription={sub}
                      onClick={() => handleSubscriptionClick(sub)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false} mode="popLayout">
                {subscriptions.map((sub) => (
                  <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SubscriptionListItem
                      subscription={sub}
                      onClick={() => handleSubscriptionClick(sub)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Mobile Add Button */}
          <div className="lg:hidden">
            <AddSubscriptionDialog onAdd={addSubscription} subscriptionCount={subscriptions.length} />
          </div>

          {/* Detail Dialog */}
          <SubscriptionDetailDialog
            subscription={selectedSubscription}
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            onUpdate={handleUpdate}
            onDelete={removeSubscription}
            stats={selectedStats}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
