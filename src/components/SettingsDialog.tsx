import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Clock, Info } from 'lucide-react';
import { useSubscriptions } from '@/hooks/useSubscriptions';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const { stats } = useSubscriptions();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full lg:w-full lg:justify-start lg:gap-3 lg:px-4 lg:rounded-xl">
          <Settings className="h-5 w-5" />
          <span className="hidden lg:inline">Paramètres</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="rounded-xl bg-muted/50 p-4">
            <h3 className="font-semibold mb-3">Résumé</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre d'abonnements</span>
                <span className="font-medium">{stats.totalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dépense mensuelle</span>
                <span className="font-medium">€{stats.monthlyTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dépense annuelle</span>
                <span className="font-medium">€{stats.yearlyTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-xl bg-muted/50 p-4">
            <h3 className="font-semibold mb-3">Préférences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span>Notifications</span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Rappel avant paiement</span>
                </div>
                <button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    reminderEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="rounded-xl bg-muted/50 p-4">
            <h3 className="font-semibold mb-3">À propos</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span>Version</span>
              </div>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
