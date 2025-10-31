import { ReactNode, useState, useRef, useEffect } from 'react';
import { Menu, X, Briefcase, User, LogOut, Home, BookOpen, Users, FileText, ChevronDown, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './notifications/NotificationCenter';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-md border-b border-gray-200'
          : 'bg-white shadow-sm border-b border-gray-200'
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${
                      currentPage === item.page
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  >
                    <User className="w-4 h-4" />
                    <span>{profile?.full_name || 'Mon compte'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500">{profile?.email}</p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {profile?.user_type === 'candidate' ? 'Candidat' : 'Recruteur'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          onNavigate(profile?.user_type === 'recruiter' ? 'recruiter-dashboard' : 'candidate-dashboard');
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <div>
                          <p className="font-medium">
                            {profile?.user_type === 'candidate' ? 'Espace Candidat' : 'Espace Recruteur'}
                          </p>
                          <p className="text-xs text-gray-500">Tableau de bord et profil</p>
                        </div>
                      </button>

                      <div className="border-t border-gray-200 my-2"></div>

                      <button
                        onClick={() => {
                          handleSignOut();
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Déconnexion</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('login')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => onNavigate('signup')}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition"
                  >
                    Inscription
                  </button>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.page}
                    onClick={() => {
                      onNavigate(item.page);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      currentPage === item.page
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}

              {user ? (
                <>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
                    <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500">{profile?.email}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {profile?.user_type === 'candidate' ? 'Candidat' : 'Recruteur'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate(profile?.user_type === 'recruiter' ? 'recruiter-dashboard' : 'candidate-dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left bg-blue-50 text-blue-900 hover:bg-blue-100"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">
                        {profile?.user_type === 'candidate' ? 'Espace Candidat' : 'Espace Recruteur'}
                      </p>
                      <p className="text-xs opacity-75">Tableau de bord et profil</p>
                    </div>
                  </button>

                  <div className="border-t border-gray-200 my-2"></div>

                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onNavigate('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('signup');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-lg"
                  >
                    Inscription
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="w-full pt-16">
        {children}
      </main>

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
                <li>Tel: +224 XXX XX XX XX</li>
                <li>Conakry, Guinée</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 JobGuinée. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
