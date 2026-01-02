import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, FileText, TrendingUp, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormationConfig {
  id?: string;
  boost_7j_price: number;
  boost_15j_price: number;
  boost_30j_price: number;
  premium_month_price: number;
  premium_org_annual_price: number;
  max_formations_per_trainer: number;
  auto_approve_formations: boolean;
  require_trainer_verification: boolean;
  min_formation_duration_hours: number;
  max_formation_duration_hours: number;
  allow_online_formations: boolean;
  allow_in_person_formations: boolean;
  allow_hybrid_formations: boolean;
  default_currency: string;
  commission_percentage: number;
  platform_fee_percentage: number;
  enable_trainer_analytics: boolean;
  enable_formation_ratings: boolean;
  min_rating_stars: number;
  updated_at?: string;
}

export default function AdminFormationConfig() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'settings' | 'features' | 'analytics'>('pricing');
  const [config, setConfig] = useState<FormationConfig>({
    boost_7j_price: 50000,
    boost_15j_price: 90000,
    boost_30j_price: 150000,
    premium_month_price: 200000,
    premium_org_annual_price: 2000000,
    max_formations_per_trainer: 10,
    auto_approve_formations: false,
    require_trainer_verification: true,
    min_formation_duration_hours: 1,
    max_formation_duration_hours: 500,
    allow_online_formations: true,
    allow_in_person_formations: true,
    allow_hybrid_formations: true,
    default_currency: 'GNF',
    commission_percentage: 15,
    platform_fee_percentage: 5,
    enable_trainer_analytics: true,
    enable_formation_ratings: true,
    min_rating_stars: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('formation_config')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading formation config:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const configData = {
        ...config,
        updated_at: new Date().toISOString()
      };

      if (config.id) {
        const { error } = await supabase
          .from('formation_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('formation_config')
          .insert([configData])
          .select()
          .single();

        if (error) throw error;
        if (data) setConfig(data);
      }

      setMessage({ type: 'success', text: 'Configuration enregistrée avec succès' });
    } catch (error) {
      console.error('Error saving formation config:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'pricing', label: 'Tarification', icon: DollarSign },
    { id: 'settings', label: 'Paramètres', icon: Settings },
    { id: 'features', label: 'Fonctionnalités', icon: FileText },
    { id: 'analytics', label: 'Analyses', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuration des Formations</h1>
        <p className="mt-2 text-gray-600">
          Gérez les paramètres globaux du système de formations et des formateurs
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarification des Packs Promotionnels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Boost 7 jours (GNF)
                    </label>
                    <input
                      type="number"
                      value={config.boost_7j_price}
                      onChange={(e) => setConfig({ ...config, boost_7j_price: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Boost 15 jours (GNF)
                    </label>
                    <input
                      type="number"
                      value={config.boost_15j_price}
                      onChange={(e) => setConfig({ ...config, boost_15j_price: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Boost 30 jours (GNF)
                    </label>
                    <input
                      type="number"
                      value={config.boost_30j_price}
                      onChange={(e) => setConfig({ ...config, boost_30j_price: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Premium Mensuel (GNF)
                    </label>
                    <input
                      type="number"
                      value={config.premium_month_price}
                      onChange={(e) => setConfig({ ...config, premium_month_price: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Premium Organisation Annuel (GNF)
                    </label>
                    <input
                      type="number"
                      value={config.premium_org_annual_price}
                      onChange={(e) => setConfig({ ...config, premium_org_annual_price: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commissions et Frais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission de la plateforme (%)
                    </label>
                    <input
                      type="number"
                      value={config.commission_percentage}
                      onChange={(e) => setConfig({ ...config, commission_percentage: Number(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frais de plateforme (%)
                    </label>
                    <input
                      type="number"
                      value={config.platform_fee_percentage}
                      onChange={(e) => setConfig({ ...config, platform_fee_percentage: Number(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres Généraux</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Approbation automatique des formations</p>
                      <p className="text-sm text-gray-600">Les formations sont publiées sans validation manuelle</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.auto_approve_formations}
                        onChange={(e) => setConfig({ ...config, auto_approve_formations: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Vérification obligatoire des formateurs</p>
                      <p className="text-sm text-gray-600">Les formateurs doivent être vérifiés avant de publier</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.require_trainer_verification}
                        onChange={(e) => setConfig({ ...config, require_trainer_verification: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Limites et Contraintes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre maximum de formations par formateur
                    </label>
                    <input
                      type="number"
                      value={config.max_formations_per_trainer}
                      onChange={(e) => setConfig({ ...config, max_formations_per_trainer: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée minimum (heures)
                    </label>
                    <input
                      type="number"
                      value={config.min_formation_duration_hours}
                      onChange={(e) => setConfig({ ...config, min_formation_duration_hours: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée maximum (heures)
                    </label>
                    <input
                      type="number"
                      value={config.max_formation_duration_hours}
                      onChange={(e) => setConfig({ ...config, max_formation_duration_hours: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Devise par défaut
                    </label>
                    <select
                      value={config.default_currency}
                      onChange={(e) => setConfig({ ...config, default_currency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="GNF">GNF (Franc Guinéen)</option>
                      <option value="USD">USD (Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Types de Formations Autorisés</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Formations en ligne</p>
                      <p className="text-sm text-gray-600">Autoriser les formations 100% en ligne</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allow_online_formations}
                        onChange={(e) => setConfig({ ...config, allow_online_formations: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Formations en présentiel</p>
                      <p className="text-sm text-gray-600">Autoriser les formations en personne</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allow_in_person_formations}
                        onChange={(e) => setConfig({ ...config, allow_in_person_formations: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Formations hybrides</p>
                      <p className="text-sm text-gray-600">Autoriser les formations mixtes (en ligne + présentiel)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allow_hybrid_formations}
                        onChange={(e) => setConfig({ ...config, allow_hybrid_formations: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fonctionnalités d'Analyse</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Analyses pour les formateurs</p>
                      <p className="text-sm text-gray-600">Permettre aux formateurs de voir leurs statistiques</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_trainer_analytics}
                        onChange={(e) => setConfig({ ...config, enable_trainer_analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Système de notation</p>
                      <p className="text-sm text-gray-600">Activer les notes et avis sur les formations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_formation_ratings}
                        onChange={(e) => setConfig({ ...config, enable_formation_ratings: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note minimale (étoiles)
                  </label>
                  <input
                    type="number"
                    value={config.min_rating_stars}
                    onChange={(e) => setConfig({ ...config, min_rating_stars: Number(e.target.value) })}
                    min="1"
                    max="5"
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Note minimale requise pour afficher la formation</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
