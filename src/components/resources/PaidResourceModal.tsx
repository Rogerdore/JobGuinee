import { X, Phone, Mail, DollarSign, User } from 'lucide-react';

interface PaidResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: {
    title: string;
    price: number;
    author: string;
    author_email?: string;
    author_phone?: string;
  };
}

export default function PaidResourceModal({ isOpen, onClose, resource }: PaidResourceModalProps) {
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ressource Payante</h2>
            <p className="text-gray-600">Cette ressource nécessite un paiement</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{resource.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Prix:</span>
              <span className="text-2xl font-bold text-[#0E2F56]">
                {formatPrice(resource.price)}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-[#0E2F56]" />
                Contacter l'auteur
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Auteur</p>
                  <p className="font-medium text-gray-900">{resource.author}</p>
                </div>

                {resource.author_email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </p>
                    <a
                      href={`mailto:${resource.author_email}?subject=Intéressé par: ${resource.title}`}
                      className="font-medium text-[#0E2F56] hover:text-blue-700 underline break-all"
                    >
                      {resource.author_email}
                    </a>
                  </div>
                )}

                {resource.author_phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </p>
                    <a
                      href={`tel:${resource.author_phone}`}
                      className="font-medium text-[#0E2F56] hover:text-blue-700 underline"
                    >
                      {resource.author_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <span className="font-bold">Instructions:</span> Contactez l'auteur pour effectuer le paiement et recevoir la ressource. Assurez-vous de mentionner le titre de la ressource dans votre message.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {resource.author_email && (
              <a
                href={`mailto:${resource.author_email}?subject=Intéressé par: ${resource.title}&body=Bonjour,%0D%0A%0D%0AJe suis intéressé par la ressource "${resource.title}" au prix de ${formatPrice(resource.price)}.%0D%0A%0D%0AMerci de me contacter pour finaliser la transaction.%0D%0A%0D%0ACordialement`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg transition font-medium"
              >
                <Mail className="w-5 h-5" />
                Envoyer un email
              </a>
            )}
            {resource.author_phone && (
              <a
                href={`tel:${resource.author_phone}`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#FF8C00] hover:bg-orange-600 text-white rounded-lg transition font-medium"
              >
                <Phone className="w-5 h-5" />
                Appeler
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-3 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
