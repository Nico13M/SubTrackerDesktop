import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import PremiumPopup from './PremiumPopup';
import SubscriptionAvatar from './SubscriptionAvatar';
import { Subscription } from '@/types/subscription';
import useAuth from "@/hooks/useAuth.ts";

interface AddSubscriptionDialogProps {
  onAdd: (subscription: Omit<Subscription, 'id'>) => Promise<{ ok: true } | { ok: false; error: string }> | { ok: true } | { ok: false; error: string } | void;
  subscriptionCount?: number;
}

const categories = [
  'Entertainment',
  'Music',
  'Fitness',
  'Insurance',
  'Phone',
  'Cloud',
  'Shopping',
  'Streaming',
  'Software',
  'Other'
];

const colors = [
  'hsl(262, 83%, 58%)',
  'hsl(0, 75%, 50%)',
  'hsl(142, 70%, 45%)',
  'hsl(200, 80%, 50%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(340, 75%, 55%)',
  'hsl(0, 0%, 0%)',
  'hsl(226, 85%, 44%)',
  'hsl(0, 100%, 50%)'

];

export function AddSubscriptionDialog({ onAdd, subscriptionCount = 0 }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const API_BASE: string = import.meta.env.PROD ? (import.meta as any).env?.VITE_API_BASE ?? '' : 'http://localhost:3000';
  const { getToken } = useAuth();
  const token = getToken();

  const hasReachedLimit = subscriptionCount >= 5;

  const brands = [
    { id: 'spotify', label: 'Spotify', color: '#1DB954', icon: 'simple-icons:spotify' },
    { id: 'netflix', label: 'Netflix', color: '#E50914', icon: 'simple-icons:netflix' },
    { id: 'amazon', label: 'Amazon', color: '#FF9900', icon: 'simple-icons:amazon' },
    { id: 'apple', label: 'Apple', color: '#000000', icon: 'simple-icons:apple' },
    { id: 'disney', label: 'Disney+', color: '#113CCF', icon: 'streamline-logos:disney-plus-logo-solid' },
    { id: 'youtube', label: 'YouTube', color: '#FF0000', icon: 'simple-icons:youtube' },
    { id: 'mycanal', label: 'MyCanal', color: '#000000', icon: 'cbi:my-canal' },
    { id: 'loyer', label: 'Loyer', color: '#239FFF', icon: 'bi:house-fill' },
    { id: 'box', label: 'Box', color: '#FF0000', icon: 'pixelarticons:modem' },
    { id: 'edf', label: 'EDF', color: '#FFC000', icon: 'mage:electricity-fill' },
  ];



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    if (!name || !price || !category || !nextPaymentDate) {
      setError('Merci de remplir tous les champs.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          billingCycle,
          category,
          color,
          next_payment_date: nextPaymentDate,
          icon: selectedIcon ?? null,
        }),
      });

      const data = await res.json();

      // 🚨 FREE LIMIT
      if (!res.ok && data.error === 'FREE_LIMIT_REACHED') {
        setShowPremiumPopup(true);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Erreur serveur');
        return;
      }

      await onAdd?.(data.subscription);

      // reset
      setName('');
      setPrice('');
      setCategory('');
      setNextPaymentDate('');
      setSelectedIcon(null);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-6 py-6 shadow-lg lg:static lg:translate-x-0 lg:rounded-xl lg:px-4 lg:py-2">
          <Plus className="mr-2 h-5 w-5" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {hasReachedLimit ? (
          // Show premium popup instead of form
          <div className="text-center py-4">
            <h2 className="text-xl font-bold mb-2">
              Limite gratuite atteinte 🚫
            </h2>

            <p className="text-gray-600 mb-4">
              Vous avez atteint la limite de 5 abonnements.
              Passez au Premium pour continuer.
            </p>

            <button
              className="bg-black text-white px-4 py-2 rounded-lg w-full mb-3"
              onClick={async () => {
                const res = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });

                const data = await res.json();
                window.location.href = data.url;
              }}
            >
              Passer Premium
            </button>

            <button
              className="text-sm text-gray-500 underline w-full"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nouvel abonnement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <div>
                <SubscriptionAvatar
                  name={name || ' '}
                  icon={selectedIcon ?? undefined}
                  color={color}
                  sizeClass="h-14 w-14 rounded-xl"
                  iconPx={24}
                />
              </div>
            </div>
            <div className="pt-2">
              <Label>Ou choisir une icône</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {brands.map((b) => {
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => { setSelectedIcon(b.id); setColor(b.color); }}
                      className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-shadow border ${selectedIcon === b.id ? 'ring-2 ring-primary' : 'hover:shadow-sm'}`}
                    >
                      <SubscriptionAvatar
                        name={b.label}
                        icon={b.id}
                        color={b.color}
                        sizeClass="h-6 w-6 rounded-full"
                        iconPx={16}
                      />
                      <span>{b.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => { setSelectedIcon(null); setColor(colors[0]); }}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-shadow border ${selectedIcon === null ? 'ring-2 ring-primary' : 'hover:shadow-sm'}`}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-700">—</span>
                  <span>Aucun</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix, Spotify..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.99"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing">Cycle</Label>
              <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="yearly">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Prochaine date de paiement</Label>
            <Input
              id="date"
              type="date"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <PremiumPopup
              open={showPremiumPopup}
              onClose={() => setShowPremiumPopup(false)}
              onUpgrade={async () => {
                const res = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });

                const data = await res.json();
                window.location.href = data.url;
              }}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Ajouter l'abonnement
          </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
