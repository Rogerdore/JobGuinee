import { useState, useEffect, useCallback } from 'react';
import { Mail, Bell, Zap, CreditCard, Briefcase, Users, MessageCircle, Calendar, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, ToggleLeft as Toggle, Settings, Activity, ChevronDown, ChevronRight, Search, Filter, Save, Eye, BarChart2, Shield, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface EmailEventSetting {
  id: string;
  event_key: string;
  event_name: string;
  event_description: string;
  category: string;
  is_enabled: boolean;
  channels: string[];
  delay_minutes: number;
  priority: number;
  template_key: string | null;
  max_retries: number;
  updated_at: string;
}

interface EmailStats {
  total_queue: number;
  pending: number;
  sent: number;
  failed: number;
  today_sent: number;
}

interface QueueEntry {
  id: string;
  to_email: string;
  to_name: string;
  status: string;
  priority: number;
  scheduled_for: string;
  created_at: string;
  error_message: string | null;
  template: { template_key: string; name: string } | null;
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  onboarding:   { label: 'Onboarding',    icon: Users,         color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  applications: { label: 'Candidatures',  icon: Briefcase,     color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  alerts:       { label: 'Alertes Emploi',icon: Bell,          color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  interviews:   { label: 'Entretiens',    icon: Calendar,      color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200' },
  jobs:         { label: 'Offres',        icon: Briefcase,     color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200' },
  payments:     { label: 'Paiements',     icon: CreditCard,    color: 'text-green-700',   bg: 'bg-green-50 border-green-200' },
  digest:       { label: 'Digest',        icon: BarChart2,     color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
  messaging:    { label: 'Messagerie',    icon: MessageCircle, color: 'text-pink-700',    bg: 'bg-pink-50 border-pink-200' },
  cvtheque:     { label: 'CVthèque',      icon: Users,         color: 'text-gray-700',    bg: 'bg-gray-50 border-gray-200' },
};

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  email:        { label: 'Email',          color: 'bg-blue-100 text-blue-700' },
  notification: { label: 'Notification',   color: 'bg-gray-100 text-gray-700' },
  sms:          { label: 'SMS',            color: 'bg-green-100 text-green-700' },
  whatsapp:     { label: 'WhatsApp',       color: 'bg-emerald-100 text-emerald-700' },
};

interface AdminEmailEventsProps {
  onNavigate?: (page: string) => void;
}

export default function AdminEmailEvents({ onNavigate }: AdminEmailEventsProps) {
  const [events, setEvents] = useState<EmailEventSetting[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'queue' | 'stats'>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('email_event_settings')
      .select('*')
      .order('category')
      .order('priority', { ascending: false });

    if (!error && data) setEvents(data);
  }, []);

  const loadStats = useCallback(async () => {
    const { data: queueData } = await supabase
      .from('email_queue')
      .select('status');

    if (queueData) {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayLogs } = await supabase
        .from('email_logs')
        .select('id')
        .gte('sent_at', `${today}T00:00:00Z`);

      setStats({
        total_queue: queueData.length,
        pending: queueData.filter(e => e.status === 'pending').length,
        sent: queueData.filter(e => e.status === 'sent').length,
        failed: queueData.filter(e => e.status === 'failed').length,
        today_sent: todayLogs?.length || 0,
      });
    }
  }, []);

  const loadQueue = useCallback(async () => {
    const { data } = await supabase
      .from('email_queue')
      .select(`
        id, to_email, to_name, status, priority,
        scheduled_for, created_at, error_message,
        template:email_templates(template_key, name)
      `)
      .in('status', ['pending', 'failed'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setQueue(data as QueueEntry[]);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadEvents(), loadStats(), loadQueue()]);
      setLoading(false);
    };
    load();
  }, [loadEvents, loadStats, loadQueue]);

  const toggleEvent = async (event: EmailEventSetting) => {
    setSaving(event.id);
    const newValue = !event.is_enabled;

    const { error } = await supabase
      .from('email_event_settings')
      .update({ is_enabled: newValue, updated_at: new Date().toISOString() })
      .eq('id', event.id);

    if (!error) {
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_enabled: newValue } : e));
      showToast('success', `"${event.event_name}" ${newValue ? 'activé' : 'désactivé'}`);
    } else {
      showToast('error', 'Erreur lors de la mise à jour');
    }
    setSaving(null);
  };

  const updateEventField = async (id: string, field: keyof EmailEventSetting, value: any) => {
    setSaving(id);
    const { error } = await supabase
      .from('email_event_settings')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
      showToast('success', 'Paramètre mis à jour');
    } else {
      showToast('error', 'Erreur lors de la mise à jour');
    }
    setSaving(null);
  };

  const bulkToggle = async (enable: boolean) => {
    setBulkSaving(true);
    const filtered = filteredEvents;
    const ids = filtered.map(e => e.id);

    const { error } = await supabase
      .from('email_event_settings')
      .update({ is_enabled: enable, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (!error) {
      setEvents(prev => prev.map(e => ids.includes(e.id) ? { ...e, is_enabled: enable } : e));
      showToast('success', `${ids.length} événements ${enable ? 'activés' : 'désactivés'}`);
    } else {
      showToast('error', 'Erreur lors de la mise à jour groupée');
    }
    setBulkSaving(false);
  };

  const retryFailed = async () => {
    const { error } = await supabase
      .from('email_queue')
      .update({ status: 'pending', retry_count: 0, error_message: null })
      .eq('status', 'failed');

    if (!error) {
      showToast('success', 'Emails en échec remis en attente');
      await loadQueue();
      await loadStats();
    }
  };

  const categories = Array.from(new Set(events.map(e => e.category)));

  const filteredEvents = events.filter(e => {
    const matchesSearch = !searchQuery ||
      e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.event_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.event_key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'enabled' && e.is_enabled) ||
      (filterStatus === 'disabled' && !e.is_enabled);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, EmailEventSetting[]>);

  const enabledCount = events.filter(e => e.is_enabled).length;
  const disabledCount = events.filter(e => !e.is_enabled).length;

  if (loading) {
    return (
      <AdminLayout onNavigate={onNavigate} currentPage="admin-email-events">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onNavigate={onNavigate} currentPage="admin-email-events">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border transition-all duration-300 ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
            <span className="text-sm font-medium">{toast.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moteur d'événements Email</h1>
            <p className="text-gray-500 mt-1 text-sm">Activez, désactivez et configurez chaque déclencheur d'email de la plateforme</p>
          </div>
          <button
            onClick={() => { loadEvents(); loadStats(); loadQueue(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Événements actifs',    value: enabledCount,          icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50'  },
            { label: 'Événements inactifs',  value: disabledCount,         icon: XCircle,     color: 'text-gray-500',   bg: 'bg-gray-50'   },
            { label: 'En attente (queue)',   value: stats?.pending || 0,   icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50'  },
            { label: 'Envoyés aujourd\'hui', value: stats?.today_sent || 0, icon: Mail,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: 'En échec',             value: stats?.failed || 0,    icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50'    },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</span>
                <div className={`w-7 h-7 ${s.bg} rounded-lg flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { key: 'events', label: 'Événements',  icon: Zap },
            { key: 'queue',  label: 'File d\'attente', icon: Clock },
            { key: 'stats',  label: 'Activité',    icon: Activity },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ONGLET ÉVÉNEMENTS */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_META[cat]?.label || cat}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="enabled">Actifs uniquement</option>
                  <option value="disabled">Inactifs uniquement</option>
                </select>

                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => bulkToggle(true)}
                    disabled={bulkSaving}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Tout activer
                  </button>
                  <button
                    onClick={() => bulkToggle(false)}
                    disabled={bulkSaving}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Tout désactiver
                  </button>
                </div>
              </div>
            </div>

            {/* Events grouped by category */}
            {Object.entries(groupedEvents).map(([category, catEvents]) => {
              const meta = CATEGORY_META[category] || { label: category, icon: Mail, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' };
              const Icon = meta.icon;
              const activeInCat = catEvents.filter(e => e.is_enabled).length;

              return (
                <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Category header */}
                  <div className={`flex items-center justify-between px-5 py-3 border-b ${meta.bg}`}>
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      <span className={`font-semibold text-sm ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-gray-500 bg-white/70 px-2 py-0.5 rounded-full border border-white/50">
                        {activeInCat}/{catEvents.length} actifs
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {activeInCat < catEvents.length && (
                        <button
                          onClick={() => bulkToggle(true)}
                          className="text-xs text-green-600 hover:text-green-700 px-2 py-0.5 rounded hover:bg-white/50 transition-colors"
                        >
                          Activer tous
                        </button>
                      )}
                      {activeInCat > 0 && (
                        <button
                          onClick={() => bulkToggle(false)}
                          className="text-xs text-red-500 hover:text-red-600 px-2 py-0.5 rounded hover:bg-white/50 transition-colors"
                        >
                          Désactiver tous
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Events list */}
                  <div className="divide-y divide-gray-50">
                    {catEvents.map(event => (
                      <div key={event.id} className="group">
                        {/* Main row */}
                        <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                          {/* Toggle */}
                          <button
                            onClick={() => toggleEvent(event)}
                            disabled={saving === event.id}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                              event.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                            title={event.is_enabled ? 'Désactiver' : 'Activer'}
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ${
                              event.is_enabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </button>

                          {/* Name & description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-gray-900">{event.event_name}</span>
                              <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{event.event_key}</code>
                              {!event.is_enabled && (
                                <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Inactif</span>
                              )}
                            </div>
                            {event.event_description && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{event.event_description}</p>
                            )}
                          </div>

                          {/* Channels */}
                          <div className="hidden md:flex items-center gap-1">
                            {event.channels.map(ch => (
                              <span key={ch} className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANNEL_META[ch]?.color || 'bg-gray-100 text-gray-600'}`}>
                                {CHANNEL_META[ch]?.label || ch}
                              </span>
                            ))}
                          </div>

                          {/* Priority badge */}
                          <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500">
                            <span className="font-medium">Priorité</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${
                              event.priority >= 8 ? 'bg-red-50 text-red-600' :
                              event.priority >= 6 ? 'bg-amber-50 text-amber-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>{event.priority}</span>
                          </div>

                          {/* Expand button */}
                          <button
                            onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {expandedEvent === event.id
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expanded settings */}
                        {expandedEvent === event.id && (
                          <div className="px-5 pb-5 pt-2 bg-gray-50/50 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                  Priorité (1–10)
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={event.priority}
                                    onChange={e => setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, priority: +e.target.value } : ev))}
                                    className="flex-1 h-2 accent-blue-600"
                                  />
                                  <span className="text-sm font-bold text-blue-700 w-6 text-right">{event.priority}</span>
                                  <button
                                    onClick={() => updateEventField(event.id, 'priority', event.priority)}
                                    disabled={saving === event.id}
                                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                  Délai avant envoi (minutes)
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="1440"
                                    value={event.delay_minutes}
                                    onChange={e => setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, delay_minutes: +e.target.value } : ev))}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() => updateEventField(event.id, 'delay_minutes', event.delay_minutes)}
                                    disabled={saving === event.id}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                  Tentatives max
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={event.max_retries}
                                    onChange={e => setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, max_retries: +e.target.value } : ev))}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() => updateEventField(event.id, 'max_retries', event.max_retries)}
                                    disabled={saving === event.id}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="md:col-span-3">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                  Template associé
                                </label>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 font-mono">
                                    {event.template_key || '—'}
                                  </code>
                                  {event.template_key && (
                                    <button
                                      onClick={() => onNavigate && onNavigate('admin-email-templates')}
                                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Voir le template
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                              <Info className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                Canaux : {event.channels.join(', ')} ·
                                Dernière modification : {new Date(event.updated_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucun événement trouvé</p>
                <p className="text-gray-400 text-sm mt-1">Modifiez vos critères de recherche</p>
              </div>
            )}
          </div>
        )}

        {/* ONGLET FILE D'ATTENTE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {queue.length} email(s) en attente ou en échec
              </p>
              {stats && stats.failed > 0 && (
                <button
                  onClick={retryFailed}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Relancer les {stats.failed} en échec
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {queue.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">File d'attente vide</p>
                  <p className="text-gray-400 text-sm mt-1">Tous les emails ont été traités</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinataire</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Template</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Priorité</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Programmé pour</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Erreur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {queue.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{entry.to_name || '—'}</div>
                            <div className="text-xs text-gray-500">{entry.to_email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                              {(entry.template as any)?.template_key || 'Inconnu'}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                              entry.status === 'pending'    ? 'bg-amber-50 text-amber-700' :
                              entry.status === 'failed'     ? 'bg-red-50 text-red-700' :
                              entry.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                              'bg-green-50 text-green-700'
                            }`}>
                              {entry.status === 'pending' && <Clock className="w-3 h-3" />}
                              {entry.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              entry.priority >= 8 ? 'bg-red-50 text-red-600' :
                              entry.priority >= 6 ? 'bg-amber-50 text-amber-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>{entry.priority}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(entry.scheduled_for).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3">
                            {entry.error_message ? (
                              <span className="text-xs text-red-500 truncate max-w-xs block" title={entry.error_message}>
                                {entry.error_message}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET ACTIVITÉ */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Résumé par catégorie */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  Événements par catégorie
                </h3>
                <div className="space-y-3">
                  {categories.map(cat => {
                    const catEvents = events.filter(e => e.category === cat);
                    const active = catEvents.filter(e => e.is_enabled).length;
                    const pct = catEvents.length > 0 ? Math.round((active / catEvents.length) * 100) : 0;
                    const meta = CATEGORY_META[cat] || { label: cat, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: Mail };
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${active === catEvents.length ? 'bg-green-500' : active === 0 ? 'bg-red-400' : 'bg-amber-400'}`} />
                        <span className="text-sm text-gray-700 flex-1">{meta.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${active === catEvents.length ? 'bg-green-500' : active === 0 ? 'bg-red-400' : 'bg-amber-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500 w-12 text-right">{active}/{catEvents.length}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status global */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  État du moteur email
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: 'Triggers SQL actifs',
                      desc: 'Entretiens, offres clôturées, crédits, alertes emploi',
                      status: true,
                    },
                    {
                      label: 'Queue email',
                      desc: `${stats?.pending || 0} en attente, traitée toutes les minutes`,
                      status: true,
                    },
                    {
                      label: 'Processeur send-email',
                      desc: 'Edge Function SMTP Hostinger',
                      status: true,
                    },
                    {
                      label: 'Rappels entretiens (cron)',
                      desc: 'Toutes les 15 minutes via pg_cron',
                      status: true,
                    },
                    {
                      label: 'Digest quotidien recruteur',
                      desc: 'Edge Function avec envoi réel activé',
                      status: true,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.status ? 'bg-green-100' : 'bg-red-100'}`}>
                        {item.status
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Événements désactivés */}
            {disabledCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">{disabledCount} événement(s) désactivé(s)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {events.filter(e => !e.is_enabled).map(e => (
                    <div key={e.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                      <span className="text-sm text-gray-700">{e.event_name}</span>
                      <button
                        onClick={() => toggleEvent(e)}
                        disabled={saving === e.id}
                        className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                      >
                        Activer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
