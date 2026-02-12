import { useState } from 'react';
import { ArrowUpDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/subscriptions/StatsCard';
import { SubscriptionBubbles } from '@/components/subscriptions/SubscriptionBubbles';
import { UpcomingCard } from '@/components/subscriptions/UpcomingCard';
import { SubscriptionListItem } from '@/components/subscriptions/SubscriptionListItem';
import { AddSubscriptionDialog } from '@/components/subscriptions/AddSubscriptionDialog';
import { SubscriptionDetailDialog } from '@/components/subscriptions/SubscriptionDetailDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SortOption, Subscription } from '@/types/subscription';

function App() {
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
  } = useSubscriptions();

  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleSubscriptionClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const monthlySubscriptions = subscriptions.filter(s => s.billingCycle === 'monthly');
  const yearlyTotal = monthlySubscriptions.reduce((acc, s) => acc + s.price * 12, 0);

  const sortLabels: Record<SortOption, string> = {
    recent: 'Récent',
    name: 'Nom',
    price: 'Prix',
  };

  const selectedStats = selectedSubscription 
    ? getSubscriptionStats(selectedSubscription) 
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-border bg-card p-6 lg:block">
        <h1 className="mb-8 text-2xl font-bold text-foreground">SubTracker</h1>
        
        {/* Stats in sidebar */}
        <div className="space-y-4">
          <StatsCard
            value={`€${formatCurrency(stats.yearlyTotal)}`}
            label="Moy. annuelle"
            variant="primary"
            icon="yearly"
          />
          <StatsCard
            value={`€${formatCurrency(stats.monthlyTotal)}`}
            label="Ce mois"
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
        <div className="absolute bottom-6 left-6 right-6">
          <SettingsDialog />
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          {/* Mobile Header */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <h1 className="text-xl font-bold text-foreground">SubTracker</h1>
            <SettingsDialog />
          </div>

          {/* Mobile Stats Grid */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:hidden">
            <div className="space-y-3">
              <StatsCard
                value={`€${formatCurrency(stats.yearlyTotal)}`}
                label="Moy. annuelle"
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
            <AddSubscriptionDialog onAdd={addSubscription} />
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

          {/* Coming Up Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground lg:text-xl">À venir</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible">
              {upcomingSubscriptions.map((sub) => (
                <UpcomingCard 
                  key={sub.id} 
                  subscription={sub} 
                  onClick={() => handleSubscriptionClick(sub)}
                />
              ))}
            </div>
          </section>

          {/* All Subscriptions Section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground lg:text-xl">Tous les abonnements</h2>
                <p className="text-sm text-muted-foreground">
                  Mensuel · €{formatCurrency(yearlyTotal)} / y
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {sortLabels[sortBy]}
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    Récent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    Nom
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price')}>
                    Prix
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: Grid layout, Mobile: List layout */}
            <div className="space-y-3 lg:hidden">
              {subscriptions.map((sub) => (
                <SubscriptionListItem 
                  key={sub.id} 
                  subscription={sub} 
                  onClick={() => handleSubscriptionClick(sub)}
                />
              ))}
            </div>
            <div className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {subscriptions.map((sub) => (
                <SubscriptionListItem 
                  key={sub.id} 
                  subscription={sub} 
                  onClick={() => handleSubscriptionClick(sub)}
                />
              ))}
            </div>
          </section>

          {/* Mobile Add Button */}
          <div className="lg:hidden">
            <AddSubscriptionDialog onAdd={addSubscription} />
          </div>

          {/* Detail Dialog */}
          <SubscriptionDetailDialog
            subscription={selectedSubscription}
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            onUpdate={updateSubscription}
            onDelete={removeSubscription}
            stats={selectedStats}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
