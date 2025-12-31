import { useEffect } from 'react';
import { ArrowRight, Handshake, Building2 } from 'lucide-react';

interface PartnerHubProps {
  onNavigate: (page: string) => void;
}

export default function PartnerHub({ onNavigate }: PartnerHubProps) {
  useEffect(() => {
    // Redirection automatique après 2 secondes
    const timer = setTimeout(() => {
      onNavigate('b2b-solutions');

      // Scroll vers la section partenaire après un court délai
      setTimeout(() => {
        const partnerSection = document.getElementById('devenir-partenaire');
        if (partnerSection) {
          partnerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onNavigate]);

  const handleManualRedirect = () => {
    onNavigate('b2b-solutions');
    setTimeout(() => {
      const partnerSection = document.getElementById('devenir-partenaire');
      if (partnerSection) {
        partnerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center border-2 border-green-500">
          {/* Icon Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Handshake className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF8C00] rounded-full flex items-center justify-center animate-bounce">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nouvelle structure de notre espace partenaire
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            L'espace partenaire a été intégré dans notre page{' '}
            <span className="font-bold text-green-700">Solutions B2B</span> pour vous offrir une expérience plus complète et professionnelle.
          </p>

          {/* Info Box */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Building2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <p className="font-semibold text-gray-900 mb-2">Ce qui change :</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Toutes les informations partenaire au même endroit</li>
                  <li>• Accès direct à toutes nos solutions B2B</li>
                  <li>• Processus de publication clarifié</li>
                  <li>• Expérience utilisateur améliorée</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Loading Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 h-full rounded-full animate-[loading_2s_ease-in-out]"
                   style={{ animation: 'loading 2s ease-in-out forwards' }} />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Redirection automatique en cours...
            </p>
          </div>

          {/* Manual Redirect Button */}
          <button
            onClick={handleManualRedirect}
            className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg group"
          >
            <span>Accéder maintenant aux Solutions B2B</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </button>

          {/* Note */}
          <p className="text-xs text-gray-500 mt-6">
            Cette page vous redirige automatiquement vers la section partenaire de Solutions B2B
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
