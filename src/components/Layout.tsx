import { ReactNode, useState, useRef, useEffect } from 'react';
import { Menu, X, Briefcase, User, LogOut, Home, BookOpen, Users, FileText, ChevronDown, LayoutDashboard, Settings, Building2, Package, Facebook, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCMS } from '../contexts/CMSContext';
import { NotificationCenter } from './notifications/NotificationCenter';
import ChatbotWidget from './chatbot/ChatbotWidget';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

function SocialLinks({ getSetting, className = "flex items-center space-x-4" }: { getSetting: any, className?: string }) {
  const socialConfig = [
    { key: 'social_facebook', icon: Facebook, color: 'hover:text-blue-600', label: 'Facebook' },
    { key: 'social_linkedin', icon: Linkedin, color: 'hover:text-blue-700', label: 'LinkedIn' },
    { key: 'social_twitter', icon: Twitter, color: 'hover:text-black', label: 'Twitter' },
    { key: 'social_whatsapp', icon: MessageCircle, color: 'hover:text-green-600', label: 'WhatsApp' },
  ];

  const activeLinks = socialConfig.filter(link => !!getSetting(link.key));

  if (activeLinks.length === 0) return null;

  return (
    <div className={className}>
      {activeLinks.map(link => {
        const Icon = link.icon;
        return (
          <a
            key={link.key}
            href={getSetting(link.key)}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-gray-500 transition-colors ${link.color}`}
            title={link.label}
          >
            <Icon className="w-5 h-5" />
          </a>
        );
      })}
    </div>
  );
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { getSetting } = useCMS();
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
    { name: 'Solutions B2B', page: 'b2b-solutions', icon: Building2 },
    { name: 'Formations', page: 'formations', icon: BookOpen },
    { name: 'Ressources', page: 'resources', icon: Package },
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
    <div className="min-h-screen">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'neo-clay backdrop-blur-md'
          : 'neo-clay backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center hover:opacity-80 transition"
              >
                <img
                  src="/logo_jobguinee.png"
                  alt="JobGuinée"
                  className="h-10 w-auto"
                />
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

            <div className="hidden lg:flex items-center mr-2 border-r border-gray-200 pr-4">
              <SocialLinks getSetting={getSetting} className="flex items-center space-x-2" />
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {user && <NotificationCenter />}
              {user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 neo-clay-button rounded-xl transition"
                  >
                    <User className="w-4 h-4" />
                    <span>
                      {profile?.user_type === 'recruiter' && profile?.company_name
                        ? profile.company_name
                        : profile?.full_name || 'Mon compte'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 neo-clay-card rounded-2xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500">{profile?.email}</p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full soft-gradient-blue text-primary-700">
                          {profile?.user_type === 'admin' ? 'Administrateur' : profile?.user_type === 'candidate' ? 'Candidat' : profile?.user_type === 'trainer' ? 'Formateur' : 'Recruteur'}
                        </span>
                      </div>

                      {isAdmin ? (
                        <button
                          onClick={() => {
                            onNavigate('cms-admin');
                            setAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 hover:neo-clay-pressed transition rounded-lg mx-2"
                        >
                          <Settings className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Administration CMS</p>
                            <p className="text-xs text-gray-500">Gestion du contenu du site</p>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const dashboardPage = profile?.user_type === 'recruiter'
                              ? 'recruiter-dashboard'
                              : profile?.user_type === 'trainer'
                              ? 'trainer-dashboard'
                              : 'candidate-dashboard';
                            onNavigate(dashboardPage);
                            setAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 hover:neo-clay-pressed transition rounded-lg mx-2"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <div>
                            <p className="font-medium">
                              {profile?.user_type === 'candidate' ? 'Espace Candidat' : profile?.user_type === 'trainer' ? 'Espace Formateur' : 'Espace Recruteur'}
                            </p>
                            <p className="text-xs text-gray-500">Tableau de bord et profil</p>
                          </div>
                        </button>
                      )}

                      <div className="border-t border-gray-200 my-2"></div>

                      <button
                        onClick={() => {
                          handleSignOut();
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50/50 transition rounded-lg mx-2"
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
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 rounded-xl transition shadow-lg"
                  >
                    Inscription
                  </button>

                  <div className="border-t border-gray-200 my-4 pt-4 px-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Suivez-nous</p>
                    <SocialLinks getSetting={getSetting} className="flex items-center space-x-6" />
                  </div>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl neo-clay-button text-gray-600"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/50 neo-clay">
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
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left ${
                      currentPage === item.page
                        ? 'neo-clay-pressed text-primary-700'
                        : 'text-gray-700 hover:neo-clay'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}

              {user ? (
                <>
                  <div className="px-4 py-3 neo-clay-pressed rounded-xl mb-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {profile?.user_type === 'recruiter' && profile?.company_name
                        ? profile.company_name
                        : profile?.full_name}
                    </p>
                    <p className="text-xs text-gray-500">{profile?.email}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full soft-gradient-blue text-primary-700">
                      {profile?.user_type === 'admin' ? 'Administrateur' : profile?.user_type === 'candidate' ? 'Candidat' : profile?.user_type === 'trainer' ? 'Formateur' : 'Recruteur'}
                    </span>
                  </div>

                  {isAdmin ? (
                    <button
                      onClick={() => {
                        onNavigate('cms-admin');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left neo-clay-pressed text-primary-700 hover:shadow-md transition"
                    >
                      <Settings className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">Administration CMS</p>
                        <p className="text-xs opacity-75">Gestion du contenu du site</p>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const dashboardPage = profile?.user_type === 'recruiter'
                          ? 'recruiter-dashboard'
                          : profile?.user_type === 'trainer'
                          ? 'trainer-dashboard'
                          : 'candidate-dashboard';
                        onNavigate(dashboardPage);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left neo-clay-pressed text-primary-700 hover:shadow-md transition"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">
                          {profile?.user_type === 'candidate' ? 'Espace Candidat' : profile?.user_type === 'trainer' ? 'Espace Formateur' : 'Espace Recruteur'}
                        </p>
                        <p className="text-xs opacity-75">Tableau de bord et profil</p>
                      </div>
                    </button>
                  )}

                  <div className="border-t border-gray-200 my-2"></div>

                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50/50 transition"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Déconnexion</span>
                  </button>

                  {(getSetting('social_facebook') || getSetting('social_linkedin') || getSetting('social_twitter') || getSetting('social_whatsapp')) && (
                    <div className="border-t border-gray-200 my-4 pt-4 px-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Suivez-nous</p>
                      <div className="flex items-center space-x-6">
                        {getSetting('social_facebook') && (
                          <a href={getSetting('social_facebook')} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors">
                            <Facebook className="w-6 h-6" />
                          </a>
                        )}
                        {getSetting('social_linkedin') && (
                          <a href={getSetting('social_linkedin')} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700 transition-colors">
                            <Linkedin className="w-6 h-6" />
                          </a>
                        )}
                        {getSetting('social_twitter') && (
                          <a href={getSetting('social_twitter')} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition-colors">
                            <Twitter className="w-6 h-6" />
                          </a>
                        )}
                        {getSetting('social_whatsapp') && (
                          <a href={getSetting('social_whatsapp')} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-600 transition-colors">
                            <MessageCircle className="w-6 h-6" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onNavigate('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left font-medium text-gray-700 neo-clay-button rounded-xl"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('signup');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left font-medium text-white bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 rounded-xl shadow-lg transition"
                  >
                    Inscription
                  </button>

                  <div className="border-t border-gray-200 my-4 pt-4 px-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Suivez-nous</p>
                    <SocialLinks getSetting={getSetting} className="flex items-center space-x-6" />
                  </div>
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
              <p className="text-gray-400 mb-6">
                La plateforme de recrutement moderne pour digitaliser le marché de l'emploi en Guinée.
              </p>
              <div className="flex items-center space-x-4">
                <SocialLinks getSetting={getSetting} className="flex items-center space-x-4" />
              </div>
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
                  <button onClick={() => onNavigate('resources')} className="hover:text-white transition">
                    Ressources
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
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
              <button
                onClick={() => onNavigate('privacy-policy')}
                className="hover:text-white transition underline"
              >
                Politique de confidentialité
              </button>
              <span className="hidden md:inline">•</span>
              <button
                onClick={() => onNavigate('terms-of-service')}
                className="hover:text-white transition underline"
              >
                Conditions d'utilisation
              </button>
            </div>
            <p>&copy; 2025 JobGuinée. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      <ChatbotWidget onNavigate={onNavigate} />
    </div>
  );
}
