import { Briefcase } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="w-8 h-8" />
              <span className="text-xl font-bold">JobGuinée</span>
            </div>
            <p className="text-gray-400 mb-4">
              La plateforme de recrutement moderne pour digitaliser le marché de l'emploi en Guinée.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button onClick={() => onNavigate('jobs')} className="hover:text-white transition">
                  Offres d'emploi
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cvtheque')} className="hover:text-white transition">
                  CVthèque
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('formations')} className="hover:text-white transition">
                  Formations
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-white transition">
                  Blog
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: contact@jobguinee.com</li>
              <li>Tel: +224 620 00 00 00</li>
              <li>Conakry, Guinée</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2025 JobGuinée. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
