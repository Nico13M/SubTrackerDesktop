type PremiumPopupProps = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void | Promise<void>;
};

export default function PremiumPopup({
                                       open,
                                       onClose,
                                       onUpgrade,
                                     }: PremiumPopupProps) {
  if (!open) return null;

  return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center">

          <h2 className="text-xl font-bold mb-2">
            Limite gratuite atteinte 🚫
          </h2>

          <p className="text-gray-600 mb-4">
            Vous avez atteint la limite de 5 abonnements.
            Passez au Premium pour continuer.
          </p>

          <button
              className="bg-black text-white px-4 py-2 rounded-lg w-full"
              onClick={onUpgrade}
          >
            Passer Premium
          </button>

          <button
              className="mt-3 text-sm text-gray-500 underline"
              onClick={onClose}
          >
            Plus tard
          </button>

        </div>
      </div>
  );
}