import { ReactNode } from 'react';
import { Briefcase, LogOut, Home, Settings, Users, Coins, DollarSign, FileText, Code, MessageCircle, Crown, Video, ShoppingCart, Smartphone, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  onNavigate: (page: string) => void;
}

export default function AdminLayout({ children, onNavigate }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="neo-clay backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => onNavigate('cms-admin')}
                className="flex items-center space-x-2 text-xl font-bold text-blue-900 hover:text-blue-700 transition"
              >
                <Settings className="w-8 h-8" />
                <span>Administration</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('user-management')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <Users className="w-4 h-4" />
                <span>Utilisateurs</span>
              </button>

              <button
                onClick={() => onNavigate('admin-credits-ia')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <Coins className="w-4 h-4" />
                <span>Crédits IA</span>
              </button>

              <button
                onClick={() => onNavigate('admin-ia-pricing')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <DollarSign className="w-4 h-4" />
                <span>Tarification IA</span>
              </button>

              <button
                onClick={() => onNavigate('admin-ia-config')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <Code className="w-4 h-4" />
                <span>Config IA</span>
              </button>

              <button
                onClick={() => onNavigate('admin-ia-templates')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <FileText className="w-4 h-4" />
                <span>Templates IA</span>
              </button>

              <button
                onClick={() => onNavigate('admin-chatbot')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-green-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chatbot IA</span>
              </button>

              <button
                onClick={() => onNavigate('admin-homepage-content')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <Video className="w-4 h-4" />
                <span>Contenu Accueil</span>
              </button>

              <button
                onClick={() => onNavigate('admin-ia-premium-quota')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-yellow-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <Crown className="w-4 h-4" />
                <span>Quotas Premium</span>
              </button>

              <button
                onClick={() => onNavigate('admin-profile-purchases')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-teal-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Achats Profils</span>
              </button>

              <button
                onClick={() => onNavigate('admin-credit-store-settings')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <Smartphone className="w-4 h-4" />
                <span>Orange Money</span>
              </button>

              <button
                onClick={() => onNavigate('admin-credit-packages')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <DollarSign className="w-4 h-4" />
                <span>Packs de Crédits</span>
              </button>

              <button
                onClick={() => onNavigate('admin-automation-rules')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <Zap className="w-4 h-4" />
                <span>Automations</span>
              </button>

              <button
                onClick={() => onNavigate('home')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 neo-clay-button rounded-xl transition hover:shadow-md"
              >
                <Home className="w-4 h-4" />
                <span>Voir le site</span>
              </button>

              <div className="flex items-center space-x-3 px-4 py-2 neo-clay-card rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 neo-clay-button rounded-xl transition hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full">
        {children}
      </main>

      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-6 h-6" />
              <span className="font-bold">JobGuinée - Administration</span>
            </div>
            <p className="text-gray-400 text-sm">&copy; 2025 Tous droits réservés</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
