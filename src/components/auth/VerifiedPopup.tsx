import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const VerifiedPopup: React.FC<Props> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <div className="fixed top-6 right-6 z-50">
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</div>
              <div className="flex-1">
                <div className="font-medium">Email vérifié</div>
                <div className="text-sm text-muted-foreground">Votre compte a bien été activé.</div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VerifiedPopup;
