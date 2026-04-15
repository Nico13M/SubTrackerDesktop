
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Info, Loader2 } from 'lucide-react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import useAuth from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { api } from '@/lib/api';

export function SettingsDialog() {
    // Fonction pour récupérer la valeur notificationsEnabled depuis l'API
    const fetchNotificationSetting = async () => {
      try {
        const token = sessionStorage.getItem('subtracker_token');
        const res = await fetch(api('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erreur API');
        const data = await res.json();
        const value = data.user?.notificationsEnabled ?? false;
        setNotificationsEnabled(value);
      } catch (e) {
        console.error('Erreur lors de la récupération de notificationsEnabled', e);
      }
    };
  const [open, setOpen] = useState(false);
  const { stats } = useSubscriptions();
  const { user, logout, updateUserSettings } = useAuth();
  const { checkAndSendNotifications } = useNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const token = sessionStorage.getItem('subtracker_token');
      // On suppose que la route pour supprimer le compte utilisateur est DELETE /api/user
      const res = await fetch(api('/api/user/delete'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur API lors de la suppression');
      logout();
      window.location.reload();
    } catch (e) {
      console.error('Erreur lors de la suppression du compte', e);
      alert('Impossible de supprimer le compte.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (user) {
      setNotificationsEnabled(user.notificationsEnabled ?? false);
    }
  }, [user]);

  const handleNotificationToggle = async () => {
    if (isSavingNotifications) return;
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    setNotificationsError(null);
    setIsSavingNotifications(true);
    try {
      const result = await updateUserSettings({ notificationsEnabled: newState });
      if (!result.ok) {
        setNotificationsEnabled(!newState);
        setNotificationsError(result.error);
      }
    } finally {
      setIsSavingNotifications(false);
    }
  };

  useEffect(() => {
    if (notificationsEnabled) {
      checkAndSendNotifications();
    }
  }, [notificationsEnabled, checkAndSendNotifications]);
  
    // Synchronisation au chargement de la page (montage du composant)
    useEffect(() => {
      fetchNotificationSetting();
    }, []);
  if (!user) {
    return null; 
  }


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
              {notificationsError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {notificationsError}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span>Activer les notifications par email</span>
                </div>
                <button
                  onClick={handleNotificationToggle}
                  aria-label="Activer ou désactiver les notifications"
                  title="Activer ou désactiver les notifications"
                  disabled={isSavingNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  {isSavingNotifications ? (
                    <span className="inline-flex w-full items-center justify-center text-white">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </span>
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Conformement au RGPD, vous pouvez activer ou desactiver ces notifications a tout moment depuis vos parametres.
              </p>
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

          {/* Auth actions */}
          <div className="rounded-xl bg-muted/50 p-4">
            <h3 className="font-semibold mb-3">Compte</h3>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-destructive">
                  Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Oui, supprimer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { logout(); window.location.reload(); }}
                  className="inline-flex items-center justify-center w-full rounded-md bg-secondary/30 px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/40"
                >
                  Déconnexion
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center w-full rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                >
                  Supprimer le compte
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
