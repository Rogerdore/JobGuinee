import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Send, Calendar, Users, Mail, MessageSquare, Bell, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { adminCommunicationService, CommunicationFilters, ChannelsConfig, CommunicationTemplate } from '../services/adminCommunicationService';
import { useModalContext } from '../contexts/ModalContext';

interface AdminCommunicationCreateProps {
  onNavigate: (page: string, param?: string) => void;
}

export default function AdminCommunicationCreate({
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext(); onNavigate }: AdminCommunicationCreateProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('system_info');
  const [description, setDescription] = useState('');

  const [filters, setFilters] = useState<CommunicationFilters>({
    user_types: [],
    account_status: [],
    min_completion: 0,
  });
  const [audienceCount, setAudienceCount] = useState(0);
  const [loadingAudience, setLoadingAudience] = useState(false);

  const [channels, setChannels] = useState<ChannelsConfig>({
    email: { enabled: false, subject: '', content: '' },
    sms: { enabled: false, content: '' },
    whatsapp: { enabled: false, content: '' },
    notification: { enabled: false, content: '' },
  });

  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewChannel, setPreviewChannel] = useState<string>('');

  const [sendMode, setSendMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (currentStep === 2) {
      calculateAudience();
    }
  }, [filters, currentStep]);

  const loadTemplates = async () => {
    try {
      const data = await adminCommunicationService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const calculateAudience = async () => {
    setLoadingAudience(true);
    try {
      const count = await adminCommunicationService.calculateAudienceCount(filters);
      setAudienceCount(count);
    } catch (error) {
      console.error('Error calculating audience:', error);
      setAudienceCount(0);
    } finally {
      setLoadingAudience(false);
    }
  };

  const handleFilterChange = (key: keyof CommunicationFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleUserType = (userType: string) => {
    const current = filters.user_types || [];
    if (current.includes(userType)) {
      handleFilterChange('user_types', current.filter((t) => t !== userType));
    } else {
      handleFilterChange('user_types', [...current, userType]);
    }
  };

  const handleChannelToggle = (channel: keyof ChannelsConfig) => {
    setChannels((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled: !prev[channel]?.enabled,
      },
    }));
  };

  const handleChannelContent = (channel: keyof ChannelsConfig, field: string, value: string) => {
    setChannels((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: value,
      },
    }));
  };

  const loadTemplate = (templateId: string, channel: keyof ChannelsConfig) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setChannels((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          subject: template.subject || '',
          content: template.content,
          template_id: templateId,
        },
      }));
    }
  };

  const canGoNext = () => {
    if (currentStep === 1) {
      return title.trim().length > 0 && type;
    }
    if (currentStep === 2) {
      return audienceCount > 0;
    }
    if (currentStep === 3) {
      const enabledChannels = Object.entries(channels).filter(([_, config]) => config?.enabled);
      if (enabledChannels.length === 0) return false;
      return enabledChannels.every(([channel, config]) => {
        if (channel === 'email') {
          return config.subject && config.subject.trim().length > 0 && config.content && config.content.trim().length > 0;
        }
        return config.content && config.content.trim().length > 0;
      });
    }
    if (currentStep === 4) {
      if (sendMode === 'scheduled') {
        return scheduledDate && scheduledTime;
      }
      return true;
    }
    return false;
  };

  const handleSave = async () => {
    if (!canGoNext()) return;

    setSaving(true);
    try {
      const communication = await adminCommunicationService.createCommunication({
        title,
        type: type as any,
        description,
        filters_json: filters,
        estimated_audience_count: audienceCount,
        channels_json: channels,
        status: 'draft',
      });

      if (sendMode === 'immediate') {
        await adminCommunicationService.sendCommunication(communication.id);
        alert('Communication envoyée avec succès !');
      } else {
        const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;
        await adminCommunicationService.scheduleCommunication(communication.id, scheduledAt);
        alert('Communication programmée avec succès !');
      }

      onNavigate('admin-communications');
    } catch (error) {
      console.error('Error saving communication:', error);
      showError('Erreur', 'Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const renderPreviewModal = () => {
    if (!showPreview || !previewChannel) return null;

    const channelConfig = channels[previewChannel as keyof ChannelsConfig];
    const sampleData = {
      prenom: 'Mamadou',
      nom: 'Diallo',
      role: 'Candidat',
      lien: 'https://jobguinee.com',
      message: 'Message test',
      date: '01/01/2025',
    };

    const renderedContent = adminCommunicationService.renderTemplate(
      channelConfig?.content || '',
      sampleData
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Prévisualisation - {previewChannel}</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            {previewChannel === 'email' && channelConfig?.subject && (
              <div className="mb-4 pb-4 border-b border-gray-300">
                <p className="text-xs text-gray-500 mb-1">Sujet:</p>
                <p className="font-semibold text-gray-900">
                  {adminCommunicationService.renderTemplate(channelConfig.subject, sampleData)}
                </p>
              </div>
            )}
            <div className="whitespace-pre-wrap text-gray-700">{renderedContent}</div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              Les variables affichées utilisent des données d'exemple. Les vraies données seront utilisées lors de l'envoi.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => onNavigate('admin-communications')}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nouvelle Communication</h1>
              <p className="text-gray-600 mt-1">Créez une communication multicanale</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step
                      ? 'bg-[#FF8C00] border-[#FF8C00] text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-[#FF8C00]' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">Objectif</span>
              <span className="text-xs text-gray-600">Audience</span>
              <span className="text-xs text-gray-600">Canaux</span>
              <span className="text-xs text-gray-600">Envoi</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Étape 1: Objectif & Type</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la communication *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Maintenance programmée le 01/01/2025"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de communication *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { value: 'system_info', label: 'Information Système', icon: Bell },
                      { value: 'important_notice', label: 'Notification Importante', icon: AlertTriangle },
                      { value: 'promotion', label: 'Annonce / Promotion', icon: Send },
                      { value: 'maintenance_alert', label: 'Maintenance / Alerte', icon: AlertTriangle },
                      { value: 'institutional', label: 'Message Institutionnel', icon: Mail },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setType(value)}
                        className={`p-4 border-2 rounded-lg text-left transition flex items-center gap-3 ${
                          type === value
                            ? 'border-[#FF8C00] bg-orange-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${type === value ? 'text-[#FF8C00]' : 'text-gray-400'}`} />
                        <span className={`font-medium ${type === value ? 'text-[#FF8C00]' : 'text-gray-700'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Décrivez l'objectif de cette communication..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Étape 2: Filtrage de l'Audience</h2>

                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">
                        Audience ciblée: {loadingAudience ? '...' : audienceCount} utilisateurs
                      </p>
                      <p className="text-sm text-blue-700">Mise à jour automatique selon vos filtres</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'utilisateur
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['candidate', 'recruiter', 'trainer', 'enterprise'].map((userType) => (
                      <button
                        key={userType}
                        onClick={() => toggleUserType(userType)}
                        className={`px-4 py-2 border-2 rounded-lg transition ${
                          filters.user_types?.includes(userType)
                            ? 'border-[#FF8C00] bg-orange-50 text-[#FF8C00]'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {userType === 'candidate' && 'Candidat'}
                        {userType === 'recruiter' && 'Recruteur'}
                        {userType === 'trainer' && 'Formateur'}
                        {userType === 'enterprise' && 'Entreprise'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profil complété minimum: {filters.min_completion}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={filters.min_completion}
                    onChange={(e) => handleFilterChange('min_completion', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {audienceCount === 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">Aucun utilisateur trouvé</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Ajustez vos filtres pour cibler une audience plus large
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Étape 3: Canaux & Contenu</h2>

                {(['email', 'sms', 'whatsapp', 'notification'] as const).map((channel) => {
                  const channelLabels = {
                    email: { label: 'Email', icon: Mail, color: 'blue' },
                    sms: { label: 'SMS', icon: MessageSquare, color: 'green' },
                    whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'green' },
                    notification: { label: 'Notification interne', icon: Bell, color: 'orange' },
                  };
                  const { label, icon: Icon, color } = channelLabels[channel];
                  const channelTemplates = templates.filter((t) => t.channel === channel);

                  return (
                    <div key={channel} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-6 h-6 text-${color}-600`} />
                          <h3 className="text-lg font-bold text-gray-900">{label}</h3>
                        </div>
                        <button
                          onClick={() => handleChannelToggle(channel)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            channels[channel]?.enabled ? 'bg-[#FF8C00]' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            channels[channel]?.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      {channels[channel]?.enabled && (
                        <div className="space-y-4">
                          {channelTemplates.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Utiliser un template
                              </label>
                              <select
                                onChange={(e) => e.target.value && loadTemplate(e.target.value, channel)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                              >
                                <option value="">Sélectionner un template...</option>
                                {channelTemplates.map((t) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {channel === 'email' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sujet *
                              </label>
                              <input
                                type="text"
                                value={channels.email?.subject || ''}
                                onChange={(e) => handleChannelContent('email', 'subject', e.target.value)}
                                placeholder="Sujet de l'email..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Message *
                            </label>
                            <textarea
                              value={channels[channel]?.content || ''}
                              onChange={(e) => handleChannelContent(channel, 'content', e.target.value)}
                              rows={channel === 'sms' ? 3 : 6}
                              placeholder={`Votre message ${channel}...`}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                            />
                            {channel === 'sms' && (
                              <p className="text-xs text-gray-500 mt-1">
                                {channels.sms?.content?.length || 0} / 160 caractères
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Variables: {'{{prenom}}, {{nom}}, {{role}}, {{lien}}'}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setPreviewChannel(channel);
                              setShowPreview(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                          >
                            <Eye className="w-4 h-4" />
                            Prévisualiser
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Étape 4: Envoi & Planification</h2>

                <div className="bg-yellow-50 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">Communication à grande échelle</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Cette communication sera envoyée à {audienceCount} utilisateurs. Vérifiez bien le contenu avant d'envoyer.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSendMode('immediate')}
                    className={`p-6 border-2 rounded-lg transition ${
                      sendMode === 'immediate'
                        ? 'border-[#FF8C00] bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Send className={`w-8 h-8 mb-3 ${sendMode === 'immediate' ? 'text-[#FF8C00]' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-bold mb-1 ${sendMode === 'immediate' ? 'text-[#FF8C00]' : 'text-gray-700'}`}>
                      Envoyer immédiatement
                    </h3>
                    <p className="text-sm text-gray-600">L'envoi démarre dans quelques secondes</p>
                  </button>

                  <button
                    onClick={() => setSendMode('scheduled')}
                    className={`p-6 border-2 rounded-lg transition ${
                      sendMode === 'scheduled'
                        ? 'border-[#FF8C00] bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Calendar className={`w-8 h-8 mb-3 ${sendMode === 'scheduled' ? 'text-[#FF8C00]' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-bold mb-1 ${sendMode === 'scheduled' ? 'text-[#FF8C00]' : 'text-gray-700'}`}>
                      Programmer l'envoi
                    </h3>
                    <p className="text-sm text-gray-600">Choisir une date et heure</p>
                  </button>
                </div>

                {sendMode === 'scheduled' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heure *
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <h4 className="font-semibold text-gray-900">Récapitulatif</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Titre</p>
                      <p className="font-medium text-gray-900">{title}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Audience</p>
                      <p className="font-medium text-gray-900">{audienceCount} utilisateurs</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Canaux activés</p>
                      <p className="font-medium text-gray-900">
                        {Object.entries(channels).filter(([_, config]) => config?.enabled).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Mode d'envoi</p>
                      <p className="font-medium text-gray-900">
                        {sendMode === 'immediate' ? 'Immédiat' : 'Programmé'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  disabled={!canGoNext()}
                  className="flex items-center gap-2 px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={!canGoNext() || saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF8C00] to-[#FF6B00] text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Lancer la communication
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderPreviewModal()}
    </AdminLayout>
  );
}
