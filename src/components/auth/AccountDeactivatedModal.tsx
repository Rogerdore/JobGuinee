import { ShieldX, Mail, X } from 'lucide-react';

interface AccountDeactivatedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDeactivatedModal({ isOpen, onClose }: AccountDeactivatedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red header band */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldX className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Compte désactivé</h2>
              <p className="text-red-100 text-sm mt-0.5">Accès temporairement suspendu</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            Votre compte a été <strong className="text-red-600">désactivé</strong> par un administrateur.
            Vous ne pouvez plus accéder à la plateforme pour le moment.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-amber-800 font-medium mb-1">Pourquoi mon compte est désactivé ?</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Cela peut être dû à une violation des conditions d'utilisation,
              une activité suspecte détectée, ou une demande administrative.
              Si vous pensez qu'il s'agit d'une erreur, contactez-nous.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-700 font-medium mb-2">Besoin d'aide ?</p>
            <a
              href="mailto:contact@jobguinee-pro.com"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
            >
              <Mail className="w-4 h-4" />
              contact@jobguinee-pro.com
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
