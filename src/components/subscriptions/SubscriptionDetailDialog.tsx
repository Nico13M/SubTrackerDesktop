import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Subscription } from '@/types/subscription';
import { Trash2, ImagePlus, X, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SubscriptionDetailDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Omit<Subscription, 'id'>>) => void;
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
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    if (subscription) {
      setName(subscription.name);
      setPrice(subscription.price.toString());
      setBillingCycle(subscription.billingCycle);
      setCategory(subscription.category);
      setColor(subscription.color);
      setNextPaymentDate(format(subscription.nextPaymentDate, 'yyyy-MM-dd'));
      setImageUrl(subscription.imageUrl || '');
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!subscription || !name || !price || !category || !nextPaymentDate) return;

    onUpdate(subscription.id, {
      name,
      price: parseFloat(price),
      billingCycle,
      category,
      color,
      nextPaymentDate: new Date(nextPaymentDate),
      imageUrl: imageUrl || undefined,
      icon: name.charAt(0).toUpperCase(),
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    if (subscription) {
      onDelete(subscription.id);
      onOpenChange(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!subscription) return null;

  const displayImageUrl = isEditing ? imageUrl : subscription.imageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {displayImageUrl ? (
              <img 
                src={displayImageUrl} 
                alt={subscription.name} 
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-primary-foreground"
                style={{ backgroundColor: isEditing ? color : subscription.color }}
              >
                {(isEditing ? name : subscription.name).charAt(0).toUpperCase()}
              </div>
            )}
            {isEditing ? name : subscription.name}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Image / Logo (optionnel)</Label>
              <div className="flex items-center gap-3">
                {imageUrl ? (
                  <div className="relative">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary"
                  >
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  Ajouter une image ou un logo
                </span>
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
              <div className="grid grid-cols-2 gap-3">
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
                  {format(subscription.nextPaymentDate, 'd MMMM yyyy', { locale: fr })}
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
