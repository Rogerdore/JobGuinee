import { useState, useRef, useEffect } from 'react';
import { Menu, Briefcase, User, LogOut, Home, BookOpen, Users, FileText, ChevronDown, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  scrolled: boolean;
  onMobileMenuToggle: () => void;
}

export function Header({ currentPage, onNavigate, scrolled, onMobileMenuToggle }: HeaderProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigation = [
    { name: 'Accueil', page: 'home', icon: Home },
    { name: "Offres d'emploi", page: 'jobs', icon: Briefcase },
    { name: 'CVthèque', page: 'cvtheque', icon: Users },
    { name: 'Formations', page: 'formations', icon: BookOpen },
    { name: 'Blog', page: 'blog', icon: FileText },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'neo-clay backdrop-blur-md' : 'neo-clay backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 text-xl font-bold text-blue-900 hover:text-blue-700 transition"
            >
              <Briefcase className="w-8 h-8" />
              <span>JobGuinée</span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center space-x-2 ${
                    currentPage === item.page
                      ? 'neo-clay-pressed text-primary-700'
                      : 'text-gray-700 hover:neo-clay'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user && <NotificationCenter />}
            {user ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 neo-clay rounded-xl hover:shadow-md transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.full_name || 'Utilisateur'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {profile?.user_type === 'candidate' && 'Candidat'}
                      {profile?.user_type === 'recruiter' && 'Recruteur'}
                      {profile?.user_type === 'trainer' && 'Formateur'}
                      {profile?.user_type === 'admin' && 'Administrateur'}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                    accountMenuOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 neo-clay rounded-xl shadow-xl overflow-hidden">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-white border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                      <p className="text-xs text-gray-600 mt-1">{profile?.email}</p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => {
                          onNavigate(getDashboardPage());
                          setAccountMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Mon tableau de bord</span>
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              onNavigate('user-management');
                              setAccountMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition"
                          >
                            <Users className="w-4 h-4" />
                            <span>Gestion utilisateurs</span>
                          </button>
                          <button
                            onClick={() => {
                              onNavigate('cms-admin');
                              setAccountMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Administration CMS</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Connexion
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-2 bg-gradient-to-r from-[#FF8C00] to-[#e67e00] hover:from-[#e67e00] hover:to-[#d67500] text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl"
                >
                  S'inscrire
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            {user && <NotificationCenter />}
            <button
              onClick={onMobileMenuToggle}
              className="ml-2 p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
