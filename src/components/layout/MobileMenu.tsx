import { X, Home, Briefcase, Users, BookOpen, FileText, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function MobileMenu({ isOpen, onClose, currentPage, onNavigate }: MobileMenuProps) {
  const { user, profile, signOut, isAdmin } = useAuth();

  if (!isOpen) return null;

  const navigation = [
    { name: 'Accueil', page: 'home', icon: Home },
    { name: "Offres d'emploi", page: 'jobs', icon: Briefcase },
    { name: 'CVthèque', page: 'cvtheque', icon: Users },
    { name: 'Formations', page: 'formations', icon: BookOpen },
    { name: 'Blog', page: 'blog', icon: FileText },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      handleNavigate('home');
    } catch (error) {
      alert('Erreur lors de la déconnexion');
    }
  };

  const getDashboardPage = () => {
    if (isAdmin) return 'cms-admin';
    if (profile?.user_type === 'candidate') return 'candidate-dashboard';
    if (profile?.user_type === 'recruiter') return 'recruiter-dashboard';
    if (profile?.user_type === 'trainer') return 'trainer-dashboard';
    return 'home';
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-2xl overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {user && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-white border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-lg">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile?.full_name}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {profile?.user_type === 'candidate' && 'Candidat'}
                  {profile?.user_type === 'recruiter' && 'Recruteur'}
                  {profile?.user_type === 'trainer' && 'Formateur'}
                  {profile?.user_type === 'admin' && 'Administrateur'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          {user && (
            <div className="mb-4">
              <button
                onClick={() => handleNavigate(getDashboardPage())}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl flex items-center space-x-3 transition font-medium"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Mon tableau de bord</span>
              </button>
            </div>
          )}

          <div className="space-y-1 mb-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavigate(item.page)}
                  className={`w-full px-4 py-3 rounded-xl text-left flex items-center space-x-3 transition ${
                    currentPage === item.page
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {user ? (
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center space-x-3 transition font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Se déconnecter</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleNavigate('login')}
                className="w-full px-6 py-3 border-2 border-[#0E2F56] text-[#0E2F56] hover:bg-[#0E2F56] hover:text-white font-semibold rounded-xl transition"
              >
                Connexion
              </button>
              <button
                onClick={() => handleNavigate('signup')}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#FF8C00] to-[#e67e00] hover:from-[#e67e00] hover:to-[#d67500] text-white font-semibold rounded-xl transition shadow-lg"
              >
                S'inscrire
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
