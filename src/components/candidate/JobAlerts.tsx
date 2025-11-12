import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Mail,
  MessageCircle,
  Send,
  Search,
  Loader,
  AlertCircle,
  CheckCircle2,
  X,
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  Award,
  Clock,
  Power,
  PowerOff,
} from 'lucide-react';

interface JobAlert {
  id: string;
  alert_name: string;
  keywords: string[];
  job_type: string[];
  location: string[];
  salary_min: number | null;
  sector: string[];
  experience_level: string[];
  notification_email: boolean;
  notification_sms: boolean;
  notification_whatsapp: boolean;
  phone_number: string | null;
  frequency: 'instant' | 'daily' | 'weekly';
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
}

export default function JobAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    alert_name: '',
    keywords: [] as string[],
    job_type: [] as string[],
    location: [] as string[],
    salary_min: '',
    sector: [] as string[],
    experience_level: [] as string[],
    notification_email: true,
    notification_sms: false,
    notification_whatsapp: false,
    phone_number: '',
    frequency: 'instant' as 'instant' | 'daily' | 'weekly',
    is_active: true,
  });

  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    loadAlerts();
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Erreur chargement alertes:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des alertes.' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (alert?: JobAlert) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        alert_name: alert.alert_name,
        keywords: alert.keywords || [],
        job_type: alert.job_type || [],
        location: alert.location || [],
        salary_min: alert.salary_min ? String(alert.salary_min) : '',
        sector: alert.sector || [],
        experience_level: alert.experience_level || [],
        notification_email: alert.notification_email,
        notification_sms: alert.notification_sms,
        notification_whatsapp: alert.notification_whatsapp,
        phone_number: alert.phone_number || '',
        frequency: alert.frequency,
        is_active: alert.is_active,
      });
    } else {
      setEditingAlert(null);
      setFormData({
        alert_name: '',
        keywords: [],
        job_type: [],
        location: [],
        salary_min: '',
        sector: [],
        experience_level: [],
        notification_email: true,
        notification_sms: false,
        notification_whatsapp: false,
        phone_number: '',
        frequency: 'instant',
        is_active: true,
      });
    }
    setShowModal(true);
    setMessage(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAlert(null);
    setKeywordInput('');
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  const toggleArrayValue = (field: keyof typeof formData, value: string) => {
    const currentArray = formData[field] as string[];
    if (currentArray.includes(value)) {
      setFormData({
        ...formData,
        [field]: currentArray.filter((v) => v !== value),
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentArray, value],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const alertData = {
        user_id: user.id,
        alert_name: formData.alert_name,
        keywords: formData.keywords,
        job_type: formData.job_type,
        location: formData.location,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        sector: formData.sector,
        experience_level: formData.experience_level,
        notification_email: formData.notification_email,
        notification_sms: formData.notification_sms,
        notification_whatsapp: formData.notification_whatsapp,
        phone_number: formData.phone_number || null,
        frequency: formData.frequency,
        is_active: formData.is_active,
      };

      if (editingAlert) {
        const { error } = await supabase
          .from('job_alerts')
          .update(alertData)
          .eq('id', editingAlert.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Alerte modifiée avec succès!' });
      } else {
        const { error } = await supabase.from('job_alerts').insert(alertData);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Alerte créée avec succès!' });
      }

      await loadAlerts();
      setTimeout(() => closeModal(), 1500);
    } catch (error: any) {
      console.error('Erreur sauvegarde alerte:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleAlert = async (alert: JobAlert) => {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .update({ is_active: !alert.is_active })
        .eq('id', alert.id);

      if (error) throw error;
      await loadAlerts();
      setMessage({
        type: 'success',
        text: `Alerte ${!alert.is_active ? 'activée' : 'désactivée'} avec succès!`,
      });
    } catch (error: any) {
      console.error('Erreur toggle alerte:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;

    try {
      const { error } = await supabase.from('job_alerts').delete().eq('id', alertId);

      if (error) throw error;
      await loadAlerts();
      setMessage({ type: 'success', text: 'Alerte supprimée avec succès!' });
    } catch (error: any) {
      console.error('Erreur suppression alerte:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const jobTypes = ['CDI', 'CDD', 'Stage', 'Freelance', 'Alternance', 'Interim'];
  const locations = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Nzérékoré', 'Boké', 'Mamou', 'Faranah'];
  const sectors = [
    'Informatique',
    'Finance',
    'Commerce',
    'Santé',
    'Éducation',
    'Agriculture',
    'Industrie',
    'Services',
    'Construction',
    'Tourisme',
  ];
  const experienceLevels = ['Débutant', 'Junior (1-3 ans)', 'Confirmé (3-5 ans)', 'Senior (5+ ans)', 'Expert'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Alertes Emploi</h2>
          <p className="text-gray-600 mt-1">
            Recevez des notifications pour les offres correspondant à vos critères
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle alerte</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border-l-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          <div className="flex items-center space-x-3">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune alerte configurée</h3>
          <p className="text-gray-600 mb-6">
            Créez votre première alerte pour ne manquer aucune opportunité
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Créer ma première alerte</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl shadow-sm border-2 p-6 transition ${
                alert.is_active ? 'border-blue-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl ${
                      alert.is_active ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    <Bell
                      className={`w-6 h-6 ${
                        alert.is_active ? 'text-blue-900' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{alert.alert_name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {alert.frequency === 'instant'
                            ? 'Instantané'
                            : alert.frequency === 'daily'
                            ? 'Quotidien'
                            : 'Hebdomadaire'}
                        </span>
                      </span>
                      {alert.last_sent_at && (
                        <span>
                          Dernier envoi: {new Date(alert.last_sent_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAlert(alert)}
                    className={`p-2 rounded-lg transition ${
                      alert.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={alert.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {alert.is_active ? (
                      <Power className="w-5 h-5" />
                    ) : (
                      <PowerOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openModal(alert)}
                    className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    title="Modifier"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {alert.keywords.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <Search className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex flex-wrap gap-2">
                      {alert.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-900 text-sm rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {alert.job_type.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <Briefcase className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex flex-wrap gap-2">
                      {alert.job_type.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {alert.location.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex flex-wrap gap-2">
                      {alert.location.map((loc, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {alert.salary_min && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>Salaire minimum: {alert.salary_min.toLocaleString()} GNF</span>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-600 pt-2 border-t">
                  <span className="font-medium">Notifications:</span>
                  {alert.notification_email && (
                    <span className="flex items-center space-x-1 text-blue-700">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </span>
                  )}
                  {alert.notification_sms && (
                    <span className="flex items-center space-x-1 text-green-700">
                      <MessageCircle className="w-4 h-4" />
                      <span>SMS</span>
                    </span>
                  )}
                  {alert.notification_whatsapp && (
                    <span className="flex items-center space-x-1 text-green-700">
                      <Send className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAlert ? 'Modifier l\'alerte' : 'Nouvelle alerte emploi'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border-l-4 ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p
                    className={`text-sm font-medium ${
                      message.type === 'success' ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'alerte *
                </label>
                <input
                  type="text"
                  value={formData.alert_name}
                  onChange={(e) => setFormData({ ...formData, alert_name: e.target.value })}
                  placeholder="Ex: Développeur Full Stack à Conakry"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mots-clés
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Ajouter un mot-clé"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-4 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-900 rounded-full"
                    >
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de contrat
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {jobTypes.map((type) => (
                    <label
                      key={type}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer transition ${
                        formData.job_type.includes(type)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.job_type.includes(type)}
                        onChange={() => toggleArrayValue('job_type', type)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localisation
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {locations.map((loc) => (
                    <label
                      key={loc}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer transition ${
                        formData.location.includes(loc)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.location.includes(loc)}
                        onChange={() => toggleArrayValue('location', loc)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{loc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salaire minimum (GNF)
                </label>
                <input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  placeholder="Ex: 3000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur d'activité
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {sectors.map((sector) => (
                    <label
                      key={sector}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer transition ${
                        formData.sector.includes(sector)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.sector.includes(sector)}
                        onChange={() => toggleArrayValue('sector', sector)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{sector}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau d'expérience
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {experienceLevels.map((level) => (
                    <label
                      key={level}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer transition ${
                        formData.experience_level.includes(level)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.experience_level.includes(level)}
                        onChange={() => toggleArrayValue('experience_level', level)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Méthodes de notification
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.notification_email}
                      onChange={(e) =>
                        setFormData({ ...formData, notification_email: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600"
                    />
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">Recevoir les alertes par email</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.notification_sms}
                      onChange={(e) =>
                        setFormData({ ...formData, notification_sms: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600"
                    />
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">SMS</p>
                      <p className="text-sm text-gray-600">Recevoir les alertes par SMS</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.notification_whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, notification_whatsapp: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600"
                    />
                    <Send className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp</p>
                      <p className="text-sm text-gray-600">Recevoir les alertes via WhatsApp</p>
                    </div>
                  </label>
                </div>

                {(formData.notification_sms || formData.notification_whatsapp) && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="+224 XXX XX XX XX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={formData.notification_sms || formData.notification_whatsapp}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence des notifications
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as 'instant' | 'daily' | 'weekly',
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="instant">Instantané (dès qu'une offre correspond)</option>
                  <option value="daily">Quotidien (résumé journalier)</option>
                  <option value="weekly">Hebdomadaire (résumé hebdomadaire)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-gray-900">Activer cette alerte</span>
                </label>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Sauvegarde...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{editingAlert ? 'Modifier' : 'Créer'} l'alerte</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
