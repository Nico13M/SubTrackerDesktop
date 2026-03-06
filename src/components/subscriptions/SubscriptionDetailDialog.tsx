import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Subscription } from '@/types/subscription';
import { Trash2, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { format, sub } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Icon } from '@iconify/react';
import SubscriptionAvatar from './SubscriptionAvatar';

interface SubscriptionDetailDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Omit<Subscription, 'id'>>) => Promise<Subscription | null> | void;
  onDelete: (id: string) => void;
  stats: {
    monthlyPrice: number;
    yearlyPrice: number;
    totalSpent: number;
    monthsActive: number;
  } | null;
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

const brands = [
  { id: 'spotify', label: 'Spotify', color: '#1DB954', icon: 'simple-icons:spotify' },
  { id: 'netflix', label: 'Netflix', color: '#E50914', icon: 'simple-icons:netflix' },
  { id: 'amazon', label: 'Amazon', color: '#FF9900', icon: 'simple-icons:amazon' },
  { id: 'apple', label: 'Apple', color: '#000000', icon: 'simple-icons:apple' },
  { id: 'disney', label: 'Disney+', color: '#113CCF', icon: 'streamline-logos:disney-plus-logo-solid' },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', icon: 'simple-icons:youtube' },
  { id: 'mycanal', label: 'MyCanal', color: '#000000', icon: 'cbi:my-canal' },
];

export function SubscriptionDetailDialog({
  subscription,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  stats,
}: SubscriptionDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  // fileInputRef kept for parity but image upload removed

  const startEditing = () => {
    if (subscription) {

      setName(subscription.name);
      setPrice(subscription.price.toString());
      setBillingCycle(subscription.billingCycle);
      setCategory(subscription.category);
      setColor(subscription.color);
      setNextPaymentDate(format(subscription.nextPaymentDate, 'yyyy-MM-dd'));
      setSelectedIcon(subscription.icon ?? subscription.name.charAt(0).toUpperCase());
      setIsEditing(true);
      console.log(subscription.icon)
    }
  };

  const handleSave = async () => {
    if (!subscription || !name || !price || !category || !nextPaymentDate) return;

    const res = await onUpdate(subscription.id, {
      name,
      price: parseFloat(price),
      billingCycle,
      category,
      color,
      nextPaymentDate: new Date(nextPaymentDate),
      icon: selectedIcon ?? undefined,
    } as Partial<Omit<Subscription, 'id'>>);

    // If parent updated selectedSubscription, it will re-render the dialog with new values.
    // Wait for the update to complete before leaving edit mode to ensure UI shows updated data.
    setIsEditing(false);
    return res;
  };

  const handleDelete = () => {
    if (subscription) {
      onDelete(subscription.id);
      onOpenChange(false);
    }
  };

  // image upload removed from UI

  if (!subscription) return null;

  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-2 sm:mx-auto sm:max-w-md max-w-full overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <SubscriptionAvatar
              name={isEditing ? name : subscription.name}
              icon={isEditing ? selectedIcon ?? subscription.icon : subscription.icon}
              color={isEditing ? color : subscription.color}
              sizeClass="h-12 w-12 rounded-xl"
              iconPx={20}
            />
            {isEditing ? name : subscription.name}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Ou choisir une icône</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {brands.map((b) => {
                  const iconName = b.icon;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => { setSelectedIcon(b.id); setColor(b.color); }}
                      className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-shadow border ${selectedIcon === b.id ? 'ring-2 ring-primary' : 'hover:shadow-sm'}`}
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: b.color }}>
                        <Icon icon={iconName} className="h-4 w-4" width={16} height={16} />
                      </span>
                      <span>{b.label}</span>
                    </button>
                  );
                })}
                  <button
                    type="button"
                    
                    onClick={() => { setSelectedIcon(String(name || subscription.name).charAt(0).toUpperCase()); setColor(subscription.color); }}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-shadow border ${selectedIcon === String(name || subscription.name).charAt(0).toUpperCase() ? 'ring-2 ring-primary' : 'hover:shadow-sm'}`}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-700">{String(name || subscription.name).charAt(0).toUpperCase()}</span>
                    <span>Aucun</span>
                  </button>
              </div>
              </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Prix (€)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-billing">Cycle</Label>
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
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Prochaine date de paiement</Label>
              <Input
                id="edit-date"
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

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                Sauvegarder
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 ">
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Mensuel</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    €{stats.monthlyPrice.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Annuel</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    €{stats.yearlyPrice.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl bg-primary/10 p-3">
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Total dépensé ({stats.monthsActive} mois)</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-primary">
                    €{stats.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="space-y-2 rounded-xl bg-muted/30 p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catégorie</span>
                <span className="font-medium">{subscription.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cycle</span>
                <span className="font-medium">
                  {subscription.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prochain paiement</span>
                <span className="font-medium">
                  {(() => {
                    const now = new Date();
                    let nextDate = new Date(subscription.nextPaymentDate);
                    nextDate.setHours(0,0,0,0);
                    now.setHours(0,0,0,0);
                    const originalDay = nextDate.getDate();
                    let safety = 0;
                    while (nextDate <= now && safety < 24) {
                      const currentMonth = nextDate.getMonth();
                      nextDate.setMonth(currentMonth + 1);
                      // Si le jour a changé (ex: 31 -> 2), on force le dernier jour du mois
                      if (nextDate.getDate() < originalDay) {
                        nextDate.setDate(0); // dernier jour du mois précédent
                      } else {
                        nextDate.setDate(originalDay);
                      }
                      safety++;
                    }
                    return format(nextDate, 'd MMMM yyyy', { locale: fr });
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix</span>
                <span className="font-medium">
                  {subscription.currency}{subscription.price.toFixed(2)} / {subscription.billingCycle === 'monthly' ? 'mois' : 'an'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={startEditing} className="flex-1">
                Modifier
              </Button>
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
