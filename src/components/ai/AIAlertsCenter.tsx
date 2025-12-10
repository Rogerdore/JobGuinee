import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { jobAlertsService, JobAlert } from '../../services/jobAlertsService';
import { Bell, Plus, Trash2, ToggleRight, ToggleLeft, ArrowLeft, Loader, Mail, Volume2 } from 'lucide-react';
import CreditBalance from '../credits/CreditBalance';

interface AIAlertsCenterProps {
  onNavigate?: (page: string) => void;
}

export default function AIAlertsCenter({ onNavigate }: AIAlertsCenterProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    keywords: [] as string[],
    sectors: [] as string[],
    locations: [] as string[],
    experienceLevel: [] as string[],
    contractTypes: [] as string[],
    salaryMin: '',
    salaryMax: '',
  });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    loadAlerts();
  }, [user]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await jobAlertsService.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword),
    });
  };

  const handleToggleArray = (field: string, value: string) => {
    const arr = formData[field as any];
    if (arr.includes(value)) {
      setFormData({
        ...formData,
        [field]: arr.filter(v => v !== value),
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...arr, value],
      });
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await jobAlertsService.createAlert(
        formData.title,
        formData.keywords,
        formData.sectors,
        formData.locations,
        formData.experienceLevel,
        formData.contractTypes,
        formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        formData.salaryMax ? parseInt(formData.salaryMax) : undefined
      );

      setFormData({
        title: '',
        keywords: [],
        sectors: [],
        locations: [],
        experienceLevel: [],
        contractTypes: [],
        salaryMin: '',
        salaryMax: '',
      });
      setShowForm(false);
      await loadAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAlert = async (alert: JobAlert) => {
    try {
      await jobAlertsService.toggleAlertStatus(alert.id);
      await loadAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleToggleNotifications = async (alert: JobAlert) => {
    try {
      await jobAlertsService.toggleEmailNotifications(alert.id);
      await loadAlerts();
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await jobAlertsService.deleteAlert(id);
      await loadAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => onNavigate?.('premium-ai')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux services
          </button>
          <CreditBalance />
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full text-white mb-4">
            <Bell className="w-4 h-4" />
            <span className="font-semibold">Alertes IA ciblées</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Centre des alertes emploi</h1>
          <p className="text-xl text-gray-600">Créez des alertes personnalisées et recevez les meilleures offres d'emploi</p>
        </div>

        {!showForm ? (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <button
              onClick={() => setShowForm(true)}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 text-left transition-all border border-gray-200 hover:border-blue-300 md:col-span-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nouvelle alerte</h3>
                <p className="text-gray-600">Créer une alerte emploi personnalisée</p>
              </div>
            </button>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 md:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Avantages des alertes</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Recevez les offres qui correspondent à vos critères en priorité</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Notifications automatiques par email</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Gérez plusieurs alertes simultanément</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-12 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Créer une alerte</h2>
            <form onSubmit={handleCreateAlert} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nom de l'alerte
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: Développeur React Senior"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Mots-clés
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Entrez un mot-clé"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map(keyword => (
                    <div
                      key={keyword}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Secteurs
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {jobAlertsService.getSuggestedSectors().map(sector => (
                    <label
                      key={sector}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.sectors.includes(sector)}
                        onChange={() => handleToggleArray('sectors', sector)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{sector}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Localisation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {jobAlertsService.getSuggestedLocations().map(location => (
                    <label
                      key={location}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.locations.includes(location)}
                        onChange={() => handleToggleArray('locations', location)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Salaire minimum (GNF)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    placeholder="Optionnel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Salaire maximum (GNF)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    placeholder="Optionnel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.title}
                  className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Création...' : 'Créer l\'alerte'}
                </button>
              </div>
            </form>
          </div>
        )}

        {alerts.length > 0 && !showForm && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes alertes</h2>
            <div className="grid gap-4">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{alert.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.matched_jobs_count} offre{alert.matched_jobs_count !== 1 ? 's' : ''} trouvée{alert.matched_jobs_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {alert.keywords.slice(0, 3).map(keyword => (
                      <span key={keyword} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {keyword}
                      </span>
                    ))}
                    {alert.keywords.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{alert.keywords.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4 flex-wrap">
                    <button
                      onClick={() => handleToggleAlert(alert)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: alert.is_active ? '#dcfce7' : '#f3f4f6',
                        color: alert.is_active ? '#15803d' : '#6b7280',
                      }}
                    >
                      {alert.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      {alert.is_active ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      onClick={() => handleToggleNotifications(alert)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: alert.notify_email ? '#dbeafe' : '#f3f4f6',
                        color: alert.notify_email ? '#0369a1' : '#6b7280',
                      }}
                    >
                      <Mail className="w-5 h-5" />
                      {alert.notify_email ? 'Notifications ON' : 'Notifications OFF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune alerte créée</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre première alerte pour rester informé</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Créer une alerte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
