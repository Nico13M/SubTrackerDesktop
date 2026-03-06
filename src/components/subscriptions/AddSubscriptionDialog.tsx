import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

import SubscriptionAvatar from './SubscriptionAvatar';
import { Subscription } from '@/types/subscription';

interface AddSubscriptionDialogProps {
  onAdd: (subscription: Omit<Subscription, 'id'>) => void;
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

export function AddSubscriptionDialog({ onAdd }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

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

  // image upload removed from UI

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price || !category || !nextPaymentDate) return;

    onAdd({
      name,
      price: parseFloat(price),
      currency: '€',
      billingCycle,
      category,
      color,
      nextPaymentDate: new Date(nextPaymentDate),
      startDate: new Date(),
      icon: selectedIcon ?? undefined,
    });

    // Reset form
    setName('');
    setPrice('');
    setBillingCycle('monthly');
    setCategory('');
    setColor(colors[0]);
    setNextPaymentDate('');
    // imageUrl removed
    setSelectedIcon(null);
    setOpen(false);
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
        <DialogHeader>
          <DialogTitle>Nouvel abonnement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full">
            Ajouter l'abonnement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
