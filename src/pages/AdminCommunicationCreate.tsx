import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Send, Calendar, Users, Mail, MessageSquare, Bell, AlertTriangle, CheckCircle, Eye, Newspaper, Search, BookOpen, GraduationCap, FileText, X, ChevronUp, ChevronDown } from 'lucide-react';
import { adminCommunicationService, CommunicationFilters, ChannelsConfig, CommunicationTemplate, NewsletterContentItem } from '../services/adminCommunicationService';
import { useModalContext } from '../contexts/ModalContext';

interface AdminCommunicationCreateProps {
  onNavigate: (page: string, param?: string) => void;
}

export default function AdminCommunicationCreate({ onNavigate }: AdminCommunicationCreateProps) {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
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

  // Newsletter-specific state
  const [newsletterContent, setNewsletterContent] = useState<{ articles: any[]; formations: any[]; resources: any[] }>({ articles: [], formations: [], resources: [] });
  const [selectedItems, setSelectedItems] = useState<NewsletterContentItem[]>([]);
  const [contentSearch, setContentSearch] = useState('');
  const [contentTab, setContentTab] = useState<'articles' | 'formations' | 'resources'>('articles');
  const [loadingContent, setLoadingContent] = useState(false);
  const [includeNewsletterSubs, setIncludeNewsletterSubs] = useState(false);
  const [newsletterSubsCount, setNewsletterSubsCount] = useState(0);

  const isNewsletter = type === 'newsletter';
  const totalSteps = isNewsletter ? 5 : 4;

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (isNewsletter && selectedItems.length === 0) {
      loadNewsletterContent();
    }
  }, [isNewsletter]);

  useEffect(() => {
    const audienceStep = isNewsletter ? 3 : 2;
    if (currentStep === audienceStep) {
      calculateAudience();
      if (isNewsletter) {
        loadNewsletterSubsCount();
      }
    }
    // Auto-generate newsletter email when entering channels step
    const channelsStep = isNewsletter ? 4 : 3;
    if (currentStep === channelsStep && isNewsletter && selectedItems.length > 0) {
      const emailSubject = title || 'Newsletter JobGuinée';
      const htmlContent = adminCommunicationService.generateNewsletterHtml(selectedItems, emailSubject);
      setChannels((prev) => ({
        ...prev,
        email: {
          ...prev.email,
          enabled: true,
          subject: prev.email?.subject || emailSubject,
          content: htmlContent,
        },
      }));
    }
  }, [filters, currentStep, isNewsletter]);

  const loadTemplates = async () => {
    try {
      const data = await adminCommunicationService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadNewsletterContent = async () => {
    setLoadingContent(true);
    try {
      const data = await adminCommunicationService.getNewsletterContent();
      setNewsletterContent(data);
    } catch (error) {
      console.error('Error loading newsletter content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const loadNewsletterSubsCount = async () => {
    try {
      const count = await adminCommunicationService.getNewsletterSubscribersCount();
      setNewsletterSubsCount(count);
    } catch (error) {
      console.error('Error loading newsletter subs count:', error);
    }
  };

  const toggleContentItem = (item: any, itemType: 'article' | 'formation' | 'resource') => {
    const exists = selectedItems.find((s) => s.id === item.id && s.type === itemType);
    if (exists) {
      setSelectedItems((prev) => prev.filter((s) => !(s.id === item.id && s.type === itemType)));
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          type: itemType,
          id: item.id,
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt || item.description || item.meta_description || '',
          image_url: item.image_url,
          category: item.category,
          price: item.price,
          start_date: item.start_date,
          published_at: item.published_at,
        },
      ]);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...selectedItems];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setSelectedItems(newItems);
  };

  const filteredContent = useMemo(() => {
    const list =
      contentTab === 'articles' ? newsletterContent.articles :
      contentTab === 'formations' ? newsletterContent.formations :
      newsletterContent.resources;
    if (!contentSearch.trim()) return list;
    const q = contentSearch.toLowerCase();
    return list.filter((item: any) =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.excerpt || item.description || item.meta_description || '').toLowerCase().includes(q)
    );
  }, [contentTab, newsletterContent, contentSearch]);

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

    if (isNewsletter) {
      // Newsletter: 5 steps — 1:Objectif 2:Contenus 3:Audience 4:Canaux 5:Envoi
      if (currentStep === 2) return selectedItems.length > 0;
      if (currentStep === 3) return audienceCount > 0 || includeNewsletterSubs;
      if (currentStep === 4) {
        const enabledChannels = Object.entries(channels).filter(([_, config]) => config?.enabled);
        if (enabledChannels.length === 0) return false;
        return enabledChannels.every(([channel, config]) => {
          if (channel === 'email') {
            return config.subject && config.subject.trim().length > 0 && config.content && config.content.trim().length > 0;
          }
          return config.content && config.content.trim().length > 0;
        });
      }
      if (currentStep === 5) {
        if (sendMode === 'scheduled') return !!scheduledDate && !!scheduledTime;
        return true;
      }
    } else {
      // Normal: 4 steps — 1:Objectif 2:Audience 3:Canaux 4:Envoi
      if (currentStep === 2) return audienceCount > 0;
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
        if (sendMode === 'scheduled') return !!scheduledDate && !!scheduledTime;
        return true;
      }
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
        estimated_audience_count: audienceCount + (includeNewsletterSubs ? newsletterSubsCount : 0),
        channels_json: channels,
        content_items: isNewsletter ? selectedItems : undefined,
        include_newsletter_subscribers: includeNewsletterSubs,
        status: 'draft',
      });

      if (sendMode === 'immediate') {
        // Send to profile users
        await adminCommunicationService.sendCommunication(communication.id, filters, channels);

        // If newsletter with subscribers, also send to newsletter subscribers
        if (isNewsletter && includeNewsletterSubs) {
          const subscribers = await adminCommunicationService.getNewsletterSubscribers();
          if (subscribers.length > 0) {
            const emailContent = channels.email?.content || '';
            const emailSubject = channels.email?.subject || title;
            await adminCommunicationService.sendNewsletterToSubscribers(
              communication.id,
              subscribers,
              emailSubject,
              emailContent
            );
          }
        }

        showSuccess('Succès', 'Communication envoyée avec succès !');
      } else {
        const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;
        await adminCommunicationService.scheduleCommunication(communication.id, scheduledAt);
        showSuccess('Succès', 'Communication programmée avec succès !');
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
      telephone: '+224 621 00 00 00',
      role: 'Candidat',
      lien: 'https://jobguinee-pro.com',
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
    <>
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
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step
                      ? 'bg-[#FF8C00] border-[#FF8C00] text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < totalSteps && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-[#FF8C00]' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {isNewsletter ? (
                <>
                  <span className="text-xs text-gray-600">Objectif</span>
                  <span className="text-xs text-gray-600">Contenus</span>
                  <span className="text-xs text-gray-600">Audience</span>
                  <span className="text-xs text-gray-600">Canaux</span>
                  <span className="text-xs text-gray-600">Envoi</span>
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-600">Objectif</span>
                  <span className="text-xs text-gray-600">Audience</span>
                  <span className="text-xs text-gray-600">Canaux</span>
                  <span className="text-xs text-gray-600">Envoi</span>
                </>
              )}
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
                      { value: 'newsletter', label: 'Newsletter', icon: Newspaper },
                      { value: 'system_info', label: 'Information Système', icon: Bell },
                      { value: 'important_notice', label: 'Notification Importante', icon: AlertTriangle },
                      { value: 'promotion', label: 'Annonce / Promotion', icon: Send },
                      { value: 'maintenance_alert', label: 'Maintenance / Alerte', icon: AlertTriangle },
                      { value: 'institutional', label: 'Message Institutionnel', icon: Mail },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setType(value);
                          // When switching to/from newsletter, reset step to 1
                          if (currentStep > 1) setCurrentStep(1);
                          // Auto-enable email & set defaults for newsletter
                          if (value === 'newsletter') {
                            setIncludeNewsletterSubs(true);
                          }
                        }}
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

            {currentStep === 2 && isNewsletter && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Étape 2: Sélection des Contenus</h2>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Content browser */}
                  <div className="flex-1">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4">
                      {([
                        { key: 'articles', label: 'Articles', icon: BookOpen, count: newsletterContent.articles.length },
                        { key: 'formations', label: 'Formations', icon: GraduationCap, count: newsletterContent.formations.length },
                        { key: 'resources', label: 'Ressources', icon: FileText, count: newsletterContent.resources.length },
                      ] as const).map(({ key, label, icon: Icon, count }) => (
                        <button
                          key={key}
                          onClick={() => { setContentTab(key); setContentSearch(''); }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                            contentTab === key
                              ? 'bg-[#FF8C00] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label} ({count})
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        placeholder="Rechercher un contenu..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    {/* Content list */}
                    {loadingContent ? (
                      <div className="text-center py-8 text-gray-500">Chargement des contenus...</div>
                    ) : filteredContent.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Aucun contenu trouvé</div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {filteredContent.map((item: any) => {
                          const itemType = contentTab === 'articles' ? 'article' : contentTab === 'formations' ? 'formation' : 'resource';
                          const isSelected = selectedItems.some((s) => s.id === item.id && s.type === itemType);
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleContentItem(item, itemType)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition flex gap-4 items-start ${
                                isSelected
                                  ? 'border-[#FF8C00] bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {item.image_url && (
                                <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">{item.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {item.excerpt || item.description || item.meta_description || ''}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  {item.category && (
                                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{item.category}</span>
                                  )}
                                  {item.published_at && (
                                    <span className="text-xs text-gray-400">{new Date(item.published_at).toLocaleDateString('fr-FR')}</span>
                                  )}
                                  {item.start_date && (
                                    <span className="text-xs text-gray-400">Début: {new Date(item.start_date).toLocaleDateString('fr-FR')}</span>
                                  )}
                                  {item.price != null && (
                                    <span className="text-xs text-green-600 font-medium">{item.price === 0 ? 'Gratuit' : `${item.price.toLocaleString()} GNF`}</span>
                                  )}
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                                isSelected ? 'bg-[#FF8C00] border-[#FF8C00]' : 'border-gray-300'
                              }`}>
                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected items cart */}
                  <div className="lg:w-72 flex-shrink-0">
                    <div className="sticky top-4 bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-[#FF8C00]" />
                        Contenus sélectionnés ({selectedItems.length})
                      </h3>
                      {selectedItems.length === 0 ? (
                        <p className="text-sm text-gray-500">Sélectionnez au moins 1 contenu pour votre newsletter</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedItems.map((item, index) => {
                            const typeColors = { article: 'bg-blue-100 text-blue-700', formation: 'bg-green-100 text-green-700', resource: 'bg-purple-100 text-purple-700' };
                            const typeLabels = { article: 'Article', formation: 'Formation', resource: 'Ressource' };
                            return (
                              <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg p-3 border border-gray-200 flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${typeColors[item.type]}`}>
                                    {typeLabels[item.type]}
                                  </span>
                                  <p className="text-xs font-medium text-gray-900 mt-1 truncate">{item.title}</p>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => moveItem(index, 'down')} disabled={index === selectedItems.length - 1} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => setSelectedItems((prev) => prev.filter((_, i) => i !== index))}
                                  className="p-0.5 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === (isNewsletter ? 3 : 2) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Étape {isNewsletter ? 3 : 2}: Filtrage de l'Audience</h2>

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

                {audienceCount === 0 && !includeNewsletterSubs && (
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

                {/* Newsletter subscribers toggle */}
                {isNewsletter && (
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-[#FF8C00]" />
                        <div>
                          <p className="font-semibold text-gray-900">Inclure les abonnés newsletter</p>
                          <p className="text-sm text-gray-600">{newsletterSubsCount} abonné{newsletterSubsCount > 1 ? 's' : ''} (non connectés)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIncludeNewsletterSubs(!includeNewsletterSubs)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          includeNewsletterSubs ? 'bg-[#FF8C00]' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          includeNewsletterSubs ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    {includeNewsletterSubs && (
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <p className="text-sm text-gray-700">
                          <strong>Audience totale :</strong> {audienceCount} profils + {newsletterSubsCount} abonnés = <strong className="text-[#FF8C00]">{audienceCount + newsletterSubsCount}</strong> destinataires
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === (isNewsletter ? 4 : 3) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Étape {isNewsletter ? 4 : 3}: Canaux & Contenu</h2>

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
                            {(channel === 'sms' || channel === 'whatsapp') && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Seuls les utilisateurs ayant un numéro de téléphone enregistré recevront ce message.
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Variables: {'{{prenom}}, {{nom}}, {{telephone}}, {{role}}, {{lien}}'}
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

            {currentStep === (isNewsletter ? 5 : 4) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Étape {isNewsletter ? 5 : 4}: Envoi & Planification</h2>

                <div className="bg-yellow-50 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">Communication à grande échelle</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Cette communication sera envoyée à {audienceCount + (includeNewsletterSubs ? newsletterSubsCount : 0)} destinataires. Vérifiez bien le contenu avant d'envoyer.
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
                      <p className="font-medium text-gray-900">{audienceCount + (includeNewsletterSubs ? newsletterSubsCount : 0)} destinataires</p>
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

              {currentStep < totalSteps ? (
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
    </>
  );
}
