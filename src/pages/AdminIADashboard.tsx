import { useState } from 'react';
import { Brain, Settings, FileText, DollarSign, Shield, Activity, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import AdminIACenter from './AdminIACenter';
import AdminIAConfig from './AdminIAConfig';
import AdminIATemplates from './AdminIATemplates';
import AdminIAPricing from './AdminIAPricing';
import AdminCreditsIA from './AdminCreditsIA';
import AdminIAPremiumQuota from './AdminIAPremiumQuota';
import AdminCreditPackages from './AdminCreditPackages';
import AdminCreditPurchases from './AdminCreditPurchases';
import AdminCreditStoreSettings from './AdminCreditStoreSettings';

/**
 * TABLEAU DE BORD IA CENTRALISÉ
 *
 * RÈGLE MÉTIER OBLIGATOIRE:
 * - UN SEUL ONGLET dans l'admin pour TOUTE l'IA
 * - Pas de duplication de pages IA ailleurs
 * - Structure hiérarchique claire
 *
 * SOUS-ONGLETS:
 * 1. Vue Globale - AdminIACenter
 * 2. Configuration - AdminIAConfig
 * 3. Templates - AdminIATemplates
 * 4. Pricing - AdminIAPricing
 * 5. Crédits & Quotas - AdminCreditsIA + AdminIAPremiumQuota
 * 6. Boutique - AdminCreditPackages + AdminCreditPurchases + AdminCreditStoreSettings
 * 7. Sécurité & Logs
 */

interface AdminIADashboardProps {
  onNavigate: (page: string) => void;
}

type TabKey = 'overview' | 'config' | 'templates' | 'pricing' | 'credits' | 'shop' | 'security';

export default function AdminIADashboard({ onNavigate }: AdminIADashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [creditSubTab, setCreditSubTab] = useState<'quotas' | 'history'>('quotas');
  const [shopSubTab, setShopSubTab] = useState<'packages' | 'purchases' | 'settings'>('packages');

  const tabs = [
    {
      key: 'overview' as TabKey,
      label: 'Vue Globale',
      icon: Activity,
      description: 'Dashboard général des services IA'
    },
    {
      key: 'config' as TabKey,
      label: 'Configuration',
      icon: Settings,
      description: 'Gestion des services et paramètres'
    },
    {
      key: 'templates' as TabKey,
      label: 'Templates',
      icon: FileText,
      description: 'Modèles de documents IA'
    },
    {
      key: 'pricing' as TabKey,
      label: 'Tarification',
      icon: DollarSign,
      description: 'Coûts des services IA'
    },
    {
      key: 'credits' as TabKey,
      label: 'Crédits & Quotas',
      icon: BarChart3,
      description: 'Gestion des crédits et quotas premium'
    },
    {
      key: 'shop' as TabKey,
      label: 'Boutique',
      icon: ShoppingCart,
      description: 'Packs, achats et paramètres boutique'
    },
    {
      key: 'security' as TabKey,
      label: 'Sécurité',
      icon: Shield,
      description: 'Logs et sécurité IA'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminIACenter onNavigate={onNavigate} />;

      case 'config':
        return <AdminIAConfig onNavigate={onNavigate} />;

      case 'templates':
        return <AdminIATemplates onNavigate={onNavigate} />;

      case 'pricing':
        return <AdminIAPricing onNavigate={onNavigate} />;

      case 'credits':
        return (
          <div className="space-y-6">
            {/* Sub-tabs pour Crédits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setCreditSubTab('quotas')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    creditSubTab === 'quotas'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Crédits IA
                </button>
                <button
                  onClick={() => setCreditSubTab('history')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    creditSubTab === 'history'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Quotas Premium
                </button>
              </div>
              <div className="p-6">
                {creditSubTab === 'quotas' ? (
                  <AdminCreditsIA onNavigate={onNavigate} />
                ) : (
                  <AdminIAPremiumQuota onNavigate={onNavigate} />
                )}
              </div>
            </div>
          </div>
        );

      case 'shop':
        return (
          <div className="space-y-6">
            {/* Sub-tabs pour Boutique */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setShopSubTab('packages')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    shopSubTab === 'packages'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  Packs de Crédits
                </button>
                <button
                  onClick={() => setShopSubTab('purchases')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    shopSubTab === 'purchases'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-2" />
                  Achats
                </button>
                <button
                  onClick={() => setShopSubTab('settings')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    shopSubTab === 'settings'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Paramètres
                </button>
              </div>
              <div className="p-6">
                {shopSubTab === 'packages' && <AdminCreditPackages onNavigate={onNavigate} />}
                {shopSubTab === 'purchases' && <AdminCreditPurchases onNavigate={onNavigate} />}
                {shopSubTab === 'settings' && <AdminCreditStoreSettings onNavigate={onNavigate} />}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sécurité & Logs IA</h2>
                <p className="text-gray-600">Audit et traçabilité des services IA</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Logs d'utilisation */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Logs d'utilisation IA</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Consultez les logs dans la table <code className="bg-gray-100 px-2 py-1 rounded">ai_service_usage_history</code>
                </p>
                <button
                  onClick={() => {
                    window.open(`${import.meta.env.VITE_SUPABASE_URL}/project/default/editor`, '_blank');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ouvrir SQL Editor
                </button>
              </div>

              {/* Alertes de sécurité */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Alertes de sécurité</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Tous les services IA passent par le moteur central</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Validation des crédits avant chaque appel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Logs complets de toutes les transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Pas de logique IA locale dans les modules métier</span>
                  </li>
                </ul>
              </div>

              {/* Conformité */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">État de conformité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-800 mb-1">Architecture</div>
                    <ul className="space-y-1 text-green-700">
                      <li>✓ Moteur IA centralisé</li>
                      <li>✓ Pas de duplication de logique</li>
                      <li>✓ Services configurables via DB</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-green-800 mb-1">Sécurité</div>
                    <ul className="space-y-1 text-green-700">
                      <li>✓ Validation des entrées (input_schema)</li>
                      <li>✓ Parsing sécurisé des sorties</li>
                      <li>✓ Traçabilité complète</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Intelligence Artificielle</h1>
              <p className="text-blue-100">Centre de gestion des services IA - Moteur centralisé</p>
            </div>
          </div>

          {/* Tabs navigation */}
          <div className="flex flex-wrap gap-2 mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            {tabs.find(t => t.key === activeTab)?.description}
          </div>
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
}
