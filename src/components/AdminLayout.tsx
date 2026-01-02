import { ReactNode, useState } from 'react';
import {
  LayoutDashboard, Users, Briefcase, FileCheck, Sparkles, CreditCard,
  Bell, MessageCircle, Shield, Settings, ChevronDown, ChevronRight,
  LogOut, Home, Menu, X, AlertTriangle, Zap, DollarSign, Code,
  FileText, Mail, Crown, Building2, Globe, ShoppingCart, Send,
  TrendingUp, Database, Lock, Download, Palette, Search, Activity,
  GraduationCap, AlertCircle, Calendar, Video
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  route?: string;
  badge?: string;
  children?: MenuItem[];
}

export default function AdminLayout({ children, onNavigate, currentPage = '' }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);

  const menuStructure: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      route: 'cms-admin'
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: Users,
      children: [
        { id: 'all-users', label: 'Tous les utilisateurs', icon: Users, route: 'user-management' },
        { id: 'candidates', label: 'Candidats', icon: FileCheck, route: 'user-management' },
        { id: 'recruiters', label: 'Recruteurs', icon: Building2, route: 'user-management' },
        { id: 'admins', label: 'Administrateurs', icon: Shield, route: 'user-management' }
      ]
    },
    {
      id: 'jobs',
      label: 'Offres d\'emploi',
      icon: Briefcase,
      children: [
        { id: 'all-jobs', label: 'Toutes les offres', icon: Briefcase, route: 'admin-job-list' },
        { id: 'job-moderation', label: 'Validation des offres', icon: FileCheck, route: 'admin-job-moderation' },
        { id: 'job-create', label: 'Créer une offre', icon: FileText, route: 'admin-job-create' },
        {
          id: 'job-badges',
          label: 'Badges & Visibilité',
          icon: Zap,
          children: [
            { id: 'badge-all', label: 'Tous les badges', icon: Zap, route: 'admin-job-badges' },
            { id: 'badge-urgent', label: 'Badge URGENT', icon: AlertTriangle, route: 'admin-job-badges' },
            { id: 'badge-featured', label: 'Badge À LA UNE', icon: Zap, route: 'admin-job-badges' }
          ]
        }
      ]
    },
    {
      id: 'applications',
      label: 'Candidatures',
      icon: FileCheck,
      children: [
        { id: 'all-applications', label: 'Toutes les candidatures', icon: FileCheck, route: 'cms-admin' },
        { id: 'external-apps', label: 'Candidatures externes', icon: Send, route: 'admin-external-applications' },
        { id: 'app-stats', label: 'Statistiques', icon: TrendingUp, route: 'cms-admin' }
      ]
    },
    {
      id: 'ai-services',
      label: 'IA & Services',
      icon: Sparkles,
      children: [
        { id: 'ia-center', label: 'Centre IA', icon: Activity, route: 'admin-ia-center' },
        { id: 'ia-credits', label: 'Crédits IA', icon: CreditCard, route: 'admin-credits-ia' },
        { id: 'ia-pricing', label: 'Tarification IA', icon: DollarSign, route: 'admin-ia-pricing' },
        { id: 'ia-config', label: 'Configuration IA', icon: Code, route: 'admin-ia-config' },
        { id: 'ia-templates', label: 'Templates IA', icon: FileText, route: 'admin-ia-templates' },
        { id: 'ia-quota', label: 'Quotas Premium', icon: Crown, route: 'admin-ia-premium-quota' }
      ]
    },
    {
      id: 'payments',
      label: 'Paiements & Packs',
      icon: CreditCard,
      children: [
        { id: 'premium-subs', label: 'Abonnements Premium', icon: Crown, route: 'admin-premium-subscriptions' },
        { id: 'enterprise-subs', label: 'Abonnements Enterprise', icon: Building2, route: 'admin-enterprise-subscriptions' },
        { id: 'credit-packages', label: 'Packs de Crédits', icon: DollarSign, route: 'admin-credit-packages' },
        { id: 'credit-purchases', label: 'Achats de Crédits', icon: ShoppingCart, route: 'admin-credit-purchases' },
        { id: 'profile-purchases', label: 'Achats de Profils', icon: Users, route: 'admin-profile-purchases' },
        { id: 'campaign-payments', label: 'Paiements Diffusion', icon: Send, route: 'admin-campaign-payments' },
        { id: 'orange-money', label: 'Config Orange Money', icon: DollarSign, route: 'admin-credit-store-settings' }
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      children: [
        { id: 'recruiter-notifs', label: 'Notifications Recruteurs', icon: Bell, route: 'admin-recruiter-notifications' },
        { id: 'communications', label: 'Communications', icon: MessageCircle, route: 'admin-communications' },
        { id: 'comm-create', label: 'Créer Communication', icon: Send, route: 'admin-communication-create' },
        { id: 'comm-logs', label: 'Historique Communications', icon: Database, route: 'admin-communication-logs' },
        { id: 'comm-templates', label: 'Templates Communications', icon: FileText, route: 'admin-communication-templates' },
        { id: 'email-templates', label: 'Templates Emails', icon: Mail, route: 'admin-email-templates' }
      ]
    },
    {
      id: 'chatbot',
      label: 'Chatbot Alpha',
      icon: MessageCircle,
      children: [
        { id: 'chatbot-config', label: 'Configuration', icon: Settings, route: 'admin-chatbot' },
        { id: 'chatbot-kb', label: 'Knowledge Base', icon: Database, route: 'admin-chatbot' },
        { id: 'chatbot-actions', label: 'Quick Actions', icon: Zap, route: 'admin-chatbot' },
        { id: 'chatbot-analytics', label: 'Analytics', icon: TrendingUp, route: 'admin-chatbot' }
      ]
    },
    {
      id: 'security',
      label: 'Sécurité & Audit',
      icon: Shield,
      children: [
        { id: 'security-logs', label: 'Logs Système', icon: Database, route: 'admin-security-logs' },
        { id: 'rls-access', label: 'Accès & RLS', icon: Lock, route: 'admin-security-logs' },
        { id: 'downloads', label: 'Téléchargements', icon: Download, route: 'download-documentation' }
      ]
    },
    {
      id: 'trainers',
      label: 'Formations & Formateurs',
      icon: GraduationCap,
      children: [
        { id: 'formation-list', label: 'Toutes les Formations', icon: GraduationCap, route: 'admin-formation-list' },
        { id: 'trainer-management', label: 'Tous les Formateurs', icon: Users, route: 'admin-trainer-management' },
        { id: 'formation-boost', label: 'Packs Boost & Badges', icon: Zap, route: 'admin-formation-boost' },
        { id: 'formation-config', label: 'Config Formations', icon: Settings, route: 'admin-formation-config' }
      ]
    },
    {
      id: 'modules',
      label: 'Modules Système',
      icon: Activity,
      children: [
        { id: 'cv-builder-config', label: 'CV Builder', icon: FileText, route: 'admin-cv-builder-config' },
        { id: 'job-alerts-config', label: 'Alertes Emploi', icon: AlertCircle, route: 'admin-job-alerts-config' },
        { id: 'interview-config', label: 'Entretiens', icon: Video, route: 'admin-interview-config' }
      ]
    },
    {
      id: 'config',
      label: 'Configuration',
      icon: Settings,
      children: [
        { id: 'global-settings', label: 'Paramètres Globaux', icon: Settings, route: 'cms-admin' },
        { id: 'homepage-content', label: 'Contenu Accueil', icon: Home, route: 'admin-homepage-content' },
        { id: 'branding', label: 'Branding', icon: Palette, route: 'cms-admin' },
        { id: 'seo', label: 'SEO', icon: Globe, route: 'admin-seo' },
        { id: 'seo-landing', label: 'Landing Pages SEO', icon: Globe, route: 'admin-seo-landing-pages' },
        { id: 'b2b-management', label: 'Gestion B2B', icon: Building2, route: 'admin-b2b-management' },
        { id: 'b2b-seo', label: 'SEO B2B', icon: Globe, route: 'admin-b2b-seo-config' },
        { id: 'diffusion-settings', label: 'Config Diffusion', icon: Send, route: 'admin-diffusion-settings' },
        { id: 'automation-rules', label: 'Règles d\'Automatisation', icon: Zap, route: 'admin-automation-rules' }
      ]
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  const isActive = (route?: string) => {
    if (!route) return false;
    return currentPage === route;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item.id);
    const active = isActive(item.route);
    const Icon = item.icon;

    return (
      <div key={item.id}>
        <div className="relative group/menu">
          <button
            onClick={() => {
              if (hasChildren) {
                toggleMenu(item.id);
              } else if (item.route && onNavigate) {
                onNavigate(item.route);
              }
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative
              ${active
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200'
                : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md'
              }
              ${level > 0 ? 'ml-4' : ''}
              ${!sidebarOpen ? 'justify-center' : ''}
            `}
            title={!sidebarOpen ? item.label : ''}
          >
            <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <Icon className={`w-5 h-5 transition-all duration-200 ${
                active
                  ? 'text-white'
                  : 'text-gray-600 group-hover:text-blue-600 group-hover:scale-110'
              }`} />
              {sidebarOpen && (
                <span className={`font-medium text-sm transition-colors ${active ? 'text-white' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              )}
              {item.badge && sidebarOpen && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            {hasChildren && sidebarOpen && (
              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                <ChevronDown className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
              </div>
            )}
            {hasChildren && !sidebarOpen && (
              <div className="absolute right-1 top-1">
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </button>

          {!sidebarOpen && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
              {item.label}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && sidebarOpen && (
          <div className="ml-2 mt-1 space-y-1 animate-slideDown">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getBreadcrumbs = () => {
    const breadcrumbs: string[] = ['Admin'];

    const findInMenu = (items: MenuItem[], route: string, path: string[] = []): string[] | null => {
      for (const item of items) {
        if (item.route === route) {
          return [...path, item.label];
        }
        if (item.children) {
          const found = findInMenu(item.children, route, [...path, item.label]);
          if (found) return found;
        }
      }
      return null;
    };

    const path = findInMenu(menuStructure, currentPage);
    if (path) {
      breadcrumbs.push(...path);
    }

    return breadcrumbs;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      if (onNavigate) onNavigate('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col shadow-xl
          ${sidebarOpen ? 'w-72' : 'w-20'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">JobGuinée</h1>
                <p className="text-xs text-gray-500">Administration</p>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mx-auto">
              <Settings className="w-6 h-6 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {menuStructure.map(item => renderMenuItem(item))}
        </div>

        <div className="border-t border-gray-200 p-4">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {profile?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate && onNavigate('home')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">Voir le site</span>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => onNavigate && onNavigate('home')}
                className="w-full p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                title="Voir le site"
              >
                <Home className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={handleSignOut}
                className="w-full p-3 bg-red-50 rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getBreadcrumbs().map((crumb, index, arr) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className={index === arr.length - 1 ? 'font-semibold text-gray-900' : ''}>
                      {crumb}
                    </span>
                    {index < arr.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>

        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-6 h-6" />
                <span className="font-bold">JobGuinée - Administration</span>
              </div>
              <p className="text-gray-400 text-sm">&copy; 2026 Tous droits réservés</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
