import { useState, useEffect } from 'react';
import { Bell, Plus, Edit, Trash2, Check, X, MapPin, Briefcase, DollarSign, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface JobAlert {
  id: string;
  title: string;
  keywords: string[];
  sectors: string[];
  locations: string[];
  experience_level: string[];
  contract_types: string[];
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean;
  notify_email: boolean;
  matched_jobs_count: number;
  last_check_at: string | null;
  created_at: string;
}

export default function JobAlertsManager() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    keywords: '',
    sectors: '',
    locations: '',
    experience_level: '',
    contract_types: '',
    salary_min: '',
    salary_max: '',
    notify_email: true
  });

  useEffect(() => {
    if (user?.id) {
      loadAlerts();
    }
  }, [user?.id]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const alertData = {
        user_id: user.id,
        title: formData.title,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        sectors: formData.sectors.split(',').map(s => s.trim()).filter(s => s),
        locations: formData.locations.split(',').map(l => l.trim()).filter(l => l),
        experience_level: formData.experience_level.split(',').map(e => e.trim()).filter(e => e),
        contract_types: formData.contract_types.split(',').map(c => c.trim()).filter(c => c),
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        notify_email: formData.notify_email,
        is_active: true
      };

      if (editingAlert) {
        const { error } = await supabase
          .from('job_alerts')
          .update(alertData)
          .eq('id', editingAlert.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_alerts')
          .insert(alertData);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingAlert(null);
      resetForm();
      loadAlerts();
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  };

  const handleEdit = (alert: JobAlert) => {
    setEditingAlert(alert);
    setFormData({
      title: alert.title,
      keywords: alert.keywords.join(', '),
      sectors: alert.sectors.join(', '),
      locations: alert.locations.join(', '),
      experience_level: alert.experience_level.join(', '),
      contract_types: alert.contract_types.join(', '),
      salary_min: alert.salary_min?.toString() || '',
      salary_max: alert.salary_max?.toString() || '',
      notify_email: alert.notify_email
    });
    setShowForm(true);
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;

    try {
      const { error } = await supabase
        .from('job_alerts')
        .delete()
        .eq('id', alertId);
      if (error) throw error;
      loadAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const toggleActive = async (alert: JobAlert) => {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .update({ is_active: !alert.is_active })
        .eq('id', alert.id);
      if (error) throw error;
      loadAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      keywords: '',
      sectors: '',
      locations: '',
      experience_level: '',
      contract_types: '',
      salary_min: '',
      salary_max: '',
      notify_email: true
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAlert(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Alertes Emploi</h2>
          <p className="text-gray-600 mt-1">Recevez des notifications pour les offres qui correspondent à vos critères</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Alerte
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-500 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {editingAlert ? 'Modifier l\'Alerte' : 'Créer une Alerte'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'alerte *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Développeur Web à Conakry"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mots-clés (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="développeur, web, javascript"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secteurs (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.sectors}
                  onChange={(e) => setFormData({ ...formData, sectors: e.target.value })}
                  placeholder="Informatique, Tech"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localités (séparées par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.locations}
                  onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                  placeholder="Conakry, Kindia"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveaux d'expérience (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  placeholder="Junior, Intermédiaire"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Types de contrat (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.contract_types}
                  onChange={(e) => setFormData({ ...formData, contract_types: e.target.value })}
                  placeholder="CDI, CDD, Freelance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salaire min (GNF)
                  </label>
                  <input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    placeholder="2000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salaire max (GNF)
                  </label>
                  <input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    placeholder="5000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notify_email"
                checked={formData.notify_email}
                onChange={(e) => setFormData({ ...formData, notify_email: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="notify_email" className="text-sm text-gray-700">
                Recevoir les notifications par email
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-5 h-5" />
                {editingAlert ? 'Mettre à jour' : 'Créer l\'alerte'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune alerte configurée</h3>
          <p className="text-gray-600 mb-6">Créez votre première alerte pour ne rater aucune opportunité</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer une alerte
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg border-2 ${alert.is_active ? 'border-green-200' : 'border-gray-200'} p-6 transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${alert.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Bell className={`w-5 h-5 ${alert.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded ${alert.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {alert.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {alert.matched_jobs_count > 0 && (
                        <span className="text-green-600 font-medium">
                          {alert.matched_jobs_count} offre{alert.matched_jobs_count > 1 ? 's' : ''} correspondante{alert.matched_jobs_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(alert)}
                    className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                    title={alert.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {alert.is_active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(alert)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {alert.keywords.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-700">Mots-clés:</span>
                      <span className="text-gray-600 ml-1">{alert.keywords.join(', ')}</span>
                    </div>
                  </div>
                )}
                {alert.sectors.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-700">Secteurs:</span>
                      <span className="text-gray-600 ml-1">{alert.sectors.join(', ')}</span>
                    </div>
                  </div>
                )}
                {alert.locations.length > 0 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-700">Localités:</span>
                      <span className="text-gray-600 ml-1">{alert.locations.join(', ')}</span>
                    </div>
                  </div>
                )}
                {(alert.salary_min || alert.salary_max) && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-700">Salaire:</span>
                      <span className="text-gray-600 ml-1">
                        {alert.salary_min && `${alert.salary_min.toLocaleString('fr-GN')} GNF`}
                        {alert.salary_min && alert.salary_max && ' - '}
                        {alert.salary_max && `${alert.salary_max.toLocaleString('fr-GN')} GNF`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {alert.notify_email && (
                <div className="mt-3 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded">
                  📧 Notifications par email activées
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
