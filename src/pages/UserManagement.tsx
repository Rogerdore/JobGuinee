import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, Shield, UserCog, Search, AlertCircle, CheckCircle, X,
  ArrowLeft, Home, ChevronRight, Trash2, UserPlus, RefreshCw,
  Crown, Send, Mail, ExternalLink,
  ArrowUpDown, ArrowUp, ArrowDown, Ban, Power,
  Filter, MoreVertical, MessageSquare, Bell, Phone, Megaphone,
  ArrowRight, FileText, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { adminCommunicationService, CommunicationFilters, ChannelsConfig, CommunicationTemplate } from '../services/adminCommunicationService';

interface UserManagementProps {
  onNavigate: (page: string) => void;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: 'candidate' | 'recruiter' | 'admin' | 'trainer';
  created_at: string;
  phone?: string;
  has_profile?: boolean;
  profile_completion_percentage?: number;
  profile_completed?: boolean;
  is_active?: boolean;
  banned_until?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
}

type SortKey = 'full_name' | 'email' | 'user_type' | 'created_at' | 'profile_completion_percentage' | 'is_active' | 'last_sign_in_at';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive' | 'unconfirmed';

const USER_TYPES = [
  { value: 'candidate', label: 'Candidat',       color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Users },
  { value: 'recruiter', label: 'Recruteur',       color: 'bg-green-100 text-green-700 border-green-200', icon: UserCog },
  { value: 'trainer',   label: 'Formateur',       color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Shield },
  { value: 'admin',     label: 'Administrateur',  color: 'bg-red-100 text-red-700 border-red-200', icon: Crown },
];

const ITEMS_PER_PAGE = 20;

function CompletionBar({ pct, completed }: { pct: number; completed: boolean }) {
  const color = completed ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400';
  const label = completed ? 'text-green-700' : pct >= 75 ? 'text-blue-700' : pct >= 40 ? 'text-amber-700' : 'text-red-600';
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-[40px]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-[11px] font-semibold tabular-nums ${label} shrink-0`}>{pct}%</span>
    </div>
  );
}

function StatusBadge({ user }: { user: Profile }) {
  const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
  const isInactive = user.is_active === false;
  const isUnconfirmed = !user.email_confirmed_at;

  if (isBanned || isInactive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 border border-red-200">
        <Ban className="w-3 h-3" />Inactif
      </span>
    );
  }
  if (isUnconfirmed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
        <AlertCircle className="w-3 h-3" />Non conf.
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 border border-green-200">
      <CheckCircle className="w-3 h-3" />Actif
    </span>
  );
}

export default function UserManagement({ onNavigate }: UserManagementProps) {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'candidate' | 'recruiter' | 'admin' | 'trainer'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<Profile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showToggleModal, setShowToggleModal] = useState<{ user: Profile; activate: boolean } | null>(null);
  const [showActionsDropdown, setShowActionsDropdown] = useState<string | null>(null);

  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '' });
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // Communication module state
  const [showCommPanel, setShowCommPanel] = useState(false);
  const [commStep, setCommStep] = useState<1 | 2 | 3 | 4>(1); // 1=channel, 2=audience, 3=template, 4=preview+send
  const [commChannel, setCommChannel] = useState<'email' | 'sms' | 'whatsapp' | 'notification'>('email');
  const [commFilters, setCommFilters] = useState<CommunicationFilters>({ user_types: [], account_status: [] });
  const [commAudienceCount, setCommAudienceCount] = useState(0);
  const [commLoadingAudience, setCommLoadingAudience] = useState(false);
  const [commTemplates, setCommTemplates] = useState<CommunicationTemplate[]>([]);
  const [commSelectedTemplate, setCommSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [commSubject, setCommSubject] = useState('');
  const [commContent, setCommContent] = useState('');
  const [commSending, setCommSending] = useState(false);
  const [commTitle, setCommTitle] = useState('');

  useEffect(() => { loadUsers(); loadPendingInvitations(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType, statusFilter, sortKey, sortDir]);

  // Communication module helpers
  const loadCommTemplates = useCallback(async (channel: string) => {
    try {
      const data = await adminCommunicationService.getTemplates(channel);
      setCommTemplates(data);
    } catch { setCommTemplates([]); }
  }, []);

  const calculateCommAudience = useCallback(async (filters: CommunicationFilters) => {
    setCommLoadingAudience(true);
    try {
      const count = await adminCommunicationService.calculateAudienceCount(filters);
      setCommAudienceCount(count);
    } catch { setCommAudienceCount(0); }
    finally { setCommLoadingAudience(false); }
  }, []);

  const handleOpenCommPanel = () => {
    setShowCommPanel(true);
    setCommStep(1);
    setCommChannel('email');
    setCommFilters({ user_types: [], account_status: [] });
    setCommSelectedTemplate(null);
    setCommSubject('');
    setCommContent('');
    setCommTitle('');
    setCommAudienceCount(0);
  };

  const handleCommChannelSelect = async (ch: typeof commChannel) => {
    setCommChannel(ch);
    await loadCommTemplates(ch);
    setCommSelectedTemplate(null);
    setCommSubject('');
    setCommContent('');
    setCommStep(2);
  };

  const handleCommFiltersDone = async () => {
    await calculateCommAudience(commFilters);
    setCommStep(3);
  };

  const handleCommTemplateSelect = (tpl: CommunicationTemplate) => {
    setCommSelectedTemplate(tpl);
    setCommSubject(tpl.subject || '');
    setCommContent(tpl.content);
    setCommStep(4);
  };

  const handleCommSkipTemplate = () => {
    setCommSelectedTemplate(null);
    setCommStep(4);
  };

  const handleSendCommunication = async () => {
    if (!commContent.trim()) { showMsg('error', 'Le contenu ne peut pas être vide'); return; }
    if (!commTitle.trim()) { showMsg('error', 'Veuillez donner un titre à cette communication'); return; }

    setCommSending(true);
    try {
      const channelsConfig: ChannelsConfig = {
        [commChannel]: {
          enabled: true,
          subject: commSubject || commTitle,
          content: commContent,
          template_id: commSelectedTemplate?.id,
        },
        notification: {
          enabled: true,
          content: commContent.replace(/<[^>]*>/g, '').slice(0, 300),
        },
      };

      const comm = await adminCommunicationService.createCommunication({
        title: commTitle,
        type: 'system_info',
        description: `Communication via ${commChannel}`,
        filters_json: commFilters,
        estimated_audience_count: commAudienceCount,
        channels_json: channelsConfig,
        status: 'draft',
        total_recipients: commAudienceCount,
        total_sent: 0,
        total_failed: 0,
        total_excluded: 0,
      });

      await adminCommunicationService.sendCommunication(comm.id);

      showMsg('success', `Communication envoyée à ${commAudienceCount} destinataire(s)`);
      setShowCommPanel(false);
    } catch (err: any) {
      showMsg('error', err.message || 'Erreur lors de l\'envoi');
    } finally {
      setCommSending(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setShowActionsDropdown(null);
    if (showActionsDropdown) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showActionsDropdown]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_all_users');
      if (error) throw error;
      setUsers((data || []) as Profile[]);
    } catch {
      showMsg('error', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const { count } = await supabase
        .from('admin_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());
      setPendingInvitationsCount(count || 0);
    } catch { /* non-critical */ }
  };

  // ─── Filtering + Sorting + Pagination ──────────────────────────
  const filteredSorted = useMemo(() => {
    let list = [...users];

    if (filterType !== 'all') list = list.filter(u => u.user_type === filterType);

    if (statusFilter === 'active') {
      list = list.filter(u => u.is_active !== false && !(u.banned_until && new Date(u.banned_until) > new Date()) && u.email_confirmed_at);
    } else if (statusFilter === 'inactive') {
      list = list.filter(u => u.is_active === false || (u.banned_until && new Date(u.banned_until) > new Date()));
    } else if (statusFilter === 'unconfirmed') {
      list = list.filter(u => !u.email_confirmed_at);
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(u =>
        u.email?.toLowerCase().includes(s) ||
        u.full_name?.toLowerCase().includes(s) ||
        u.phone?.toLowerCase().includes(s)
      );
    }

    list.sort((a, b) => {
      let va: any = a[sortKey];
      let vb: any = b[sortKey];
      if (sortKey === 'is_active') { va = va === false ? 0 : 1; vb = vb === false ? 0 : 1; }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, filterType, statusFilter, searchTerm, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ─── Counts ─────────────────────────────────────────────────────
  const userCounts = USER_TYPES.reduce((acc, type) => {
    acc[type.value] = users.filter(u => u.user_type === type.value).length;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = users.filter(u => u.is_active !== false && !(u.banned_until && new Date(u.banned_until) > new Date()) && u.email_confirmed_at).length;
  const inactiveCount = users.filter(u => u.is_active === false || (u.banned_until && new Date(u.banned_until) > new Date())).length;
  const unconfirmedCount = users.filter(u => !u.email_confirmed_at).length;

  // ─── Sort handler ───────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  // ─── Actions ────────────────────────────────────────────────────
  const handleChangeUserType = async (userId: string, newType: Profile['user_type']) => {
    if (userId === currentUser?.id) { showMsg('error', 'Vous ne pouvez pas modifier votre propre rôle'); return; }
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase.rpc('admin_update_user_type', { target_user_id: userId, new_type: newType });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_type: newType } : u));
      showMsg('success', 'Rôle mis à jour');
    } catch (err: any) {
      showMsg('error', err.message?.includes('admin required') ? 'Droits administrateur requis' : 'Erreur lors de la modification');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!showToggleModal) return;
    const { user, activate } = showToggleModal;
    setTogglingUserId(user.id);
    setShowToggleModal(null);
    try {
      const { error } = await supabase.rpc('admin_toggle_user_status', { target_user_id: user.id, activate });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === user.id ? {
        ...u, is_active: activate, banned_until: activate ? null : '2099-12-31T23:59:59Z'
      } : u));
      showMsg('success', activate
        ? `Compte de ${user.full_name || user.email} activé`
        : `Compte de ${user.full_name || user.email} désactivé`
      );
    } catch (err: any) {
      showMsg('error', err.message || 'Erreur lors du changement de statut');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!showDeleteModal || deleteConfirmText.toLowerCase() !== 'supprimer') return;
    const user = showDeleteModal;
    setDeletingUserId(user.id);
    setShowDeleteModal(null);
    setDeleteConfirmText('');
    try {
      const { error } = await supabase.rpc('admin_delete_user_account', { target_user_id: user.id });
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showMsg('success', `Compte de ${user.full_name || user.email} supprimé définitivement`);
    } catch (err: any) {
      showMsg('error', err.message || 'Erreur lors de la suppression du compte');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) { showMsg('error', 'Nom et email sont obligatoires'); return; }
    setInviting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/send-admin-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}` },
        body: JSON.stringify({ invitee_email: inviteForm.email.trim(), invitee_name: inviteForm.name.trim() }),
      });
      const result = await response.json();
      if (!response.ok) { showMsg('error', result.error || "Erreur lors de l'envoi"); return; }
      showMsg('success', `Invitation envoyée à ${inviteForm.email}`);
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '' });
      setPendingInvitationsCount(c => c + 1);
    } catch (err: any) {
      showMsg('error', err.message || "Erreur lors de l'envoi");
    } finally {
      setInviting(false);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 7000);
  };

  const getUserTypeInfo = (type: string) =>
    USER_TYPES.find(t => t.value === type) || { value: type, label: type, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Users };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isUserDisabled = (user: Profile) =>
    user.is_active === false || (user.banned_until != null && new Date(user.banned_until) > new Date());

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="neo-clay-card rounded-2xl p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-6">Vous devez être administrateur pour accéder à cette page.</p>
            <button onClick={() => onNavigate('home')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <div className="mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
              <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-blue-600 transition">
                <Home className="w-4 h-4" /><span>Accueil</span>
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Administration</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-600 font-medium">Gestion des utilisateurs</span>
            </div>
            <button onClick={() => onNavigate('cms-admin')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Retour au CMS</span>
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestion des utilisateurs</h1>
              <p className="text-gray-600">{users.length} compte{users.length > 1 ? 's' : ''} au total</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenCommPanel}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-md text-sm"
              >
                <Megaphone className="w-4 h-4" />
                Communication
              </button>
              <button
                onClick={() => onNavigate('admin-invitations')}
                className="relative flex items-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
              >
                <Mail className="w-4 h-4" />
                Invitations
                {pendingInvitationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingInvitationsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition shadow-md text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Créer un administrateur
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 neo-clay-card rounded-xl p-4 flex items-center gap-3 ${message.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
              <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>{message.text}</p>
              <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {USER_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => { setFilterType(filterType === type.value as any ? 'all' : type.value as any); setStatusFilter('all'); }}
                  className={`neo-clay-card rounded-xl p-3 flex items-center gap-2.5 transition cursor-pointer hover:shadow-md ${filterType === type.value ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${type.color.split(' ').slice(0, 2).join(' ')}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-gray-900 leading-none">{userCounts[type.value] || 0}</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{type.label}s</p>
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => { setStatusFilter(statusFilter === 'active' ? 'all' : 'active'); setFilterType('all'); }}
              className={`neo-clay-card rounded-xl p-3 flex items-center gap-2.5 transition cursor-pointer hover:shadow-md ${statusFilter === 'active' ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4 text-green-700" /></div>
              <div className="text-left">
                <p className="text-xl font-bold text-gray-900 leading-none">{activeCount}</p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Actifs</p>
              </div>
            </button>
            <button
              onClick={() => { setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive'); setFilterType('all'); }}
              className={`neo-clay-card rounded-xl p-3 flex items-center gap-2.5 transition cursor-pointer hover:shadow-md ${statusFilter === 'inactive' ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><Ban className="w-4 h-4 text-red-700" /></div>
              <div className="text-left">
                <p className="text-xl font-bold text-gray-900 leading-none">{inactiveCount}</p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Désactivés</p>
              </div>
            </button>
            {unconfirmedCount > 0 && (
              <button
                onClick={() => { setStatusFilter(statusFilter === 'unconfirmed' ? 'all' : 'unconfirmed'); setFilterType('all'); }}
                className={`neo-clay-card rounded-xl p-3 flex items-center gap-2.5 transition cursor-pointer hover:shadow-md ${statusFilter === 'unconfirmed' ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><AlertCircle className="w-4 h-4 text-amber-700" /></div>
                <div className="text-left">
                  <p className="text-xl font-bold text-gray-900 leading-none">{unconfirmedCount}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Non confirmés</p>
                </div>
              </button>
            )}
          </div>

          {/* Search & Filters bar */}
          <div className="neo-clay-card rounded-2xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl neo-clay-input focus:outline-none text-sm"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Filter className="w-3.5 h-3.5" />Rôle:
                </div>
                {(['all', 'candidate', 'recruiter', 'trainer', 'admin'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition text-xs ${filterType === type ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {type === 'all' ? 'Tous' : getUserTypeInfo(type).label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <span className="font-medium">{filteredSorted.length}</span> résultat{filteredSorted.length > 1 ? 's' : ''}
                {(filterType !== 'all' || statusFilter !== 'all' || searchTerm) && (
                  <button
                    onClick={() => { setFilterType('all'); setStatusFilter('all'); setSearchTerm(''); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Effacer les filtres
                  </button>
                )}
              </p>
              <button onClick={loadUsers} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Actualiser
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600" />
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="neo-clay-card rounded-2xl overflow-hidden">
              <table className="w-full table-fixed">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="w-[30%] px-3 py-2.5 text-left">
                        <button onClick={() => handleSort('full_name')} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-blue-600 uppercase tracking-wider">
                          Utilisateur <SortIcon col="full_name" />
                        </button>
                      </th>
                      <th className="w-[12%] px-2 py-2.5 text-left">
                        <button onClick={() => handleSort('user_type')} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-blue-600 uppercase tracking-wider">
                          Rôle <SortIcon col="user_type" />
                        </button>
                      </th>
                      <th className="w-[11%] px-2 py-2.5 text-left">
                        <button onClick={() => handleSort('is_active')} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-blue-600 uppercase tracking-wider">
                          Statut <SortIcon col="is_active" />
                        </button>
                      </th>
                      <th className="w-[13%] px-2 py-2.5 text-left">
                        <button onClick={() => handleSort('profile_completion_percentage')} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-blue-600 uppercase tracking-wider">
                          Profil <SortIcon col="profile_completion_percentage" />
                        </button>
                      </th>
                      <th className="w-[12%] px-2 py-2.5 text-left">
                        <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-blue-600 uppercase tracking-wider">
                          Inscrit <SortIcon col="created_at" />
                        </button>
                      </th>
                      <th className="w-[12%] px-2 py-2.5 text-left">
                        <button onClick={() => handleSort('last_sign_in_at')} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-blue-600 uppercase tracking-wider">
                          Dern. co. <SortIcon col="last_sign_in_at" />
                        </button>
                      </th>
                      <th className="w-[10%] px-2 py-2.5 text-center text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedUsers.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      const disabled = isUserDisabled(user);
                      const isUpdating = updatingUserId === user.id;
                      const isToggling = togglingUserId === user.id;
                      const isDeleting = deletingUserId === user.id;
                      const pct = user.profile_completion_percentage ?? 0;
                      const completed = user.profile_completed ?? false;
                      const hasProfile = user.has_profile !== false;

                      return (
                        <tr
                          key={user.id}
                          className={`transition ${isSelf ? 'bg-blue-50/30' : ''} ${disabled ? 'bg-red-50/20 opacity-75' : 'hover:bg-gray-50/50'}`}
                        >
                          {/* User info */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 ${disabled ? 'bg-gray-400' : 'bg-gradient-to-br from-gray-600 to-gray-800'}`}>
                                {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0 overflow-hidden">
                                <p className="font-semibold text-gray-900 text-xs truncate">
                                  {user.full_name || <span className="text-gray-400 font-normal italic">Sans nom</span>}
                                  {isSelf && <span className="ml-1 text-[10px] text-blue-600 font-normal">(vous)</span>}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-2 py-2.5">
                            <select
                              value={user.user_type}
                              onChange={(e) => handleChangeUserType(user.id, e.target.value as Profile['user_type'])}
                              disabled={isUpdating || isSelf}
                              className="w-full px-1.5 py-1 rounded-md text-[11px] font-medium bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <option value="candidate">Candidat</option>
                              <option value="recruiter">Recruteur</option>
                              <option value="trainer">Formateur</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>

                          {/* Status */}
                          <td className="px-2 py-2.5"><StatusBadge user={user} /></td>

                          {/* Profile completion */}
                          <td className="px-2 py-2.5">
                            {hasProfile ? <CompletionBar pct={pct} completed={completed} /> : <span className="text-[11px] text-gray-400 italic">—</span>}
                          </td>

                          {/* Created */}
                          <td className="px-2 py-2.5 text-[11px] text-gray-500">{formatDate(user.created_at)}</td>

                          {/* Last sign in */}
                          <td className="px-2 py-2.5 text-[11px] text-gray-500">{formatDate(user.last_sign_in_at)}</td>

                          {/* Actions dropdown */}
                          <td className="px-2 py-2.5 text-center">
                            {(isToggling || isDeleting) ? (
                              <div className="inline-flex items-center justify-center w-8 h-8">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : isSelf ? (
                              <span className="text-[10px] text-gray-400">—</span>
                            ) : (
                              <div className="relative inline-block">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowActionsDropdown(showActionsDropdown === user.id ? null : user.id); }}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {showActionsDropdown === user.id && (
                                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                                    {disabled ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setShowActionsDropdown(null); setShowToggleModal({ user, activate: true }); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition"
                                      >
                                        <Power className="w-4 h-4" />Activer le compte
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setShowActionsDropdown(null); setShowToggleModal({ user, activate: false }); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition"
                                      >
                                        <Ban className="w-4 h-4" />Désactiver le compte
                                      </button>
                                    )}
                                    <div className="border-t border-gray-100 my-1" />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setShowActionsDropdown(null); setShowDeleteModal(user); }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                                    >
                                      <Trash2 className="w-4 h-4" />Supprimer définitivement
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredSorted.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Aucun utilisateur trouvé</p>
                    {(searchTerm || filterType !== 'all' || statusFilter !== 'all') && (
                      <button
                        onClick={() => { setSearchTerm(''); setFilterType('all'); setStatusFilter('all'); }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Effacer les filtres
                      </button>
                    )}
                  </div>
                )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500">
                    {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredSorted.length)} sur {filteredSorted.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push(-1);
                        acc.push(p);
                        return acc;
                      }, [] as number[])
                      .map((p, i) => p === -1 ? (
                        <span key={`dots-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium ${currentPage === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                        >
                          {p}
                        </button>
                      ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: Invite Admin ─────────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><Crown className="w-5 h-5 text-red-600" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Inviter un administrateur</h2>
                  <p className="text-xs text-gray-500">Invitation sécurisée par email</p>
                </div>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSendInvitation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                <input type="text" value={inviteForm.name} onChange={(e) => setInviteForm(p => ({ ...p, name: e.target.value }))} placeholder="Jean Dupont" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email *</label>
                <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@exemple.com" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm">Annuler</button>
                <button type="submit" disabled={inviting} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                  {inviting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</> : <><Send className="w-4 h-4" />Envoyer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Toggle Status (Activate/Deactivate) ──────────── */}
      {showToggleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowToggleModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${showToggleModal.activate ? 'bg-green-100' : 'bg-amber-100'}`}>
                {showToggleModal.activate
                  ? <Power className="w-8 h-8 text-green-600" />
                  : <Ban className="w-8 h-8 text-amber-600" />}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {showToggleModal.activate ? 'Activer ce compte ?' : 'Désactiver ce compte ?'}
              </h2>
              <p className="text-gray-600 text-sm">
                {showToggleModal.activate
                  ? <>Le compte de <strong>{showToggleModal.user.full_name || showToggleModal.user.email}</strong> sera réactivé. L'utilisateur pourra se connecter à nouveau.</>
                  : <>Le compte de <strong>{showToggleModal.user.full_name || showToggleModal.user.email}</strong> sera désactivé. L'utilisateur ne pourra plus se connecter.</>
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowToggleModal(null)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition">Annuler</button>
              <button
                onClick={handleToggleStatus}
                className={`flex-1 px-4 py-3 rounded-xl text-white font-semibold transition ${showToggleModal.activate ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {showToggleModal.activate ? 'Activer' : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Delete with "supprimer" confirmation ──────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowDeleteModal(null); setDeleteConfirmText(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Supprimer ce compte ?</h2>
              <p className="text-gray-600 text-sm mb-1">
                Vous êtes sur le point de supprimer <strong>définitivement</strong> le compte de :
              </p>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mt-3">
                <p className="font-semibold text-gray-900">{showDeleteModal.full_name || 'Sans nom'}</p>
                <p className="text-sm text-gray-600">{showDeleteModal.email}</p>
                <p className="text-xs text-gray-500 mt-1">Rôle : {getUserTypeInfo(showDeleteModal.user_type).label}</p>
              </div>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs text-red-700 font-medium mb-1">⚠️ Cette action est irréversible</p>
                <p className="text-xs text-red-600">
                  Le compte, le profil, les candidatures et toutes les données associées seront supprimés.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tapez <span className="font-bold text-red-600">supprimer</span> pour confirmer :
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="supprimer"
                autoComplete="off"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm font-medium ${
                  deleteConfirmText.toLowerCase() === 'supprimer'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 focus:border-red-300'
                }`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(null); setDeleteConfirmText(''); }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteConfirmText.toLowerCase() !== 'supprimer'}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── COMMUNICATION PANEL (Slide-over) ────────────────────── */}
      {showCommPanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setShowCommPanel(false)}>
          <div
            className="bg-white w-full max-w-lg h-full shadow-2xl overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Communication</h2>
                  <p className="text-xs text-gray-500">Étape {commStep}/4</p>
                </div>
              </div>
              <button onClick={() => setShowCommPanel(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step progress */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= commStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                ))}
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                <span>Canal</span><span>Audience</span><span>Template</span><span>Envoi</span>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">

              {/* ═══ STEP 1: Channel Selection ═══ */}
              {commStep === 1 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">Choisir le canal de communication</h3>
                  {([
                    { key: 'email' as const, icon: Mail, label: 'Email', desc: 'Envoi via le système email (SendGrid/Brevo)', color: 'from-blue-500 to-blue-600' },
                    { key: 'sms' as const, icon: Phone, label: 'SMS', desc: 'Message texte court (160 car. max)', color: 'from-green-500 to-green-600' },
                    { key: 'whatsapp' as const, icon: MessageSquare, label: 'WhatsApp', desc: 'Message via WhatsApp Business', color: 'from-emerald-500 to-emerald-600' },
                    { key: 'notification' as const, icon: Bell, label: 'Notification in-app', desc: 'Notification intégrée à la plateforme', color: 'from-purple-500 to-purple-600' },
                  ]).map(({ key, icon: Icon, label, desc, color }) => (
                    <button
                      key={key}
                      onClick={() => handleCommChannelSelect(key)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition text-left group"
                    >
                      <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 ml-auto shrink-0" />
                    </button>
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onNavigate('admin-communications')}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir l'historique des communications
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 2: Audience Filters ═══ */}
              {commStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCommStep(1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-4 h-4" /></button>
                    <h3 className="text-sm font-bold text-gray-900">Sélectionner l'audience</h3>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Titre de la communication *</label>
                    <input
                      type="text"
                      value={commTitle}
                      onChange={(e) => setCommTitle(e.target.value)}
                      placeholder="Ex: Rappel complétion de profil"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* User types */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Type d'utilisateur</label>
                    <div className="flex flex-wrap gap-2">
                      {['candidate', 'recruiter', 'trainer', 'admin'].map((ut) => (
                        <button
                          key={ut}
                          onClick={() => {
                            const current = commFilters.user_types || [];
                            setCommFilters(p => ({
                              ...p,
                              user_types: current.includes(ut) ? current.filter(t => t !== ut) : [...current, ut],
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            (commFilters.user_types || []).includes(ut)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {ut === 'candidate' ? 'Candidats' : ut === 'recruiter' ? 'Recruteurs' : ut === 'trainer' ? 'Formateurs' : 'Admins'}
                        </button>
                      ))}
                    </div>
                    {(!commFilters.user_types || commFilters.user_types.length === 0) && (
                      <p className="text-[11px] text-gray-400 mt-1">Aucun filtre = tous les utilisateurs</p>
                    )}
                  </div>

                  {/* Account status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Statut du compte</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'active', label: 'Actifs' },
                        { value: 'inactive', label: 'Inactifs' },
                        { value: 'unconfirmed', label: 'Non confirmés' },
                      ].map((s) => (
                        <button
                          key={s.value}
                          onClick={() => {
                            const current = commFilters.account_status || [];
                            setCommFilters(p => ({
                              ...p,
                              account_status: current.includes(s.value) ? current.filter(t => t !== s.value) : [...current, s.value],
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            (commFilters.account_status || []).includes(s.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Profile completion min */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Profil complété à min. {commFilters.min_completion || 0}%
                    </label>
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={commFilters.min_completion || 0}
                      onChange={(e) => setCommFilters(p => ({ ...p, min_completion: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCommFiltersDone}
                    disabled={!commTitle.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {commLoadingAudience ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Calcul de l'audience...</>
                    ) : (
                      <>Continuer <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}

              {/* ═══ STEP 3: Template Selection ═══ */}
              {commStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCommStep(2)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-4 h-4" /></button>
                      <h3 className="text-sm font-bold text-gray-900">Choisir un template</h3>
                    </div>
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-full">
                      {commAudienceCount} destinataire{commAudienceCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  {commTemplates.length > 0 ? (
                    <div className="space-y-2">
                      {commTemplates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => handleCommTemplateSelect(tpl)}
                          className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition group"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-gray-900 truncate">{tpl.name}</p>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0" />
                          </div>
                          {tpl.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tpl.description}</p>}
                          {tpl.subject && <p className="text-[11px] text-gray-400 mt-1 truncate">Objet: {tpl.subject}</p>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucun template pour ce canal</p>
                    </div>
                  )}

                  <button
                    onClick={handleCommSkipTemplate}
                    className="w-full px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
                  >
                    Rédiger un message libre
                  </button>
                </div>
              )}

              {/* ═══ STEP 4: Preview & Send ═══ */}
              {commStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCommStep(3)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-4 h-4" /></button>
                      <h3 className="text-sm font-bold text-gray-900">Aperçu & envoi</h3>
                    </div>
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-full">
                      {commAudienceCount} dest.
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Canal:</span>
                      <span className="font-medium text-gray-900 capitalize">{commChannel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Audience:</span>
                      <span className="font-medium text-gray-900">
                        {(commFilters.user_types && commFilters.user_types.length > 0) ? commFilters.user_types.join(', ') : 'Tous les utilisateurs'}
                        {commFilters.min_completion ? ` (profil ≥ ${commFilters.min_completion}%)` : ''}
                      </span>
                    </div>
                    {commSelectedTemplate && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Template:</span>
                        <span className="font-medium text-gray-900">{commSelectedTemplate.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Subject */}
                  {commChannel === 'email' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Objet de l'email *</label>
                      <input
                        type="text"
                        value={commSubject}
                        onChange={(e) => setCommSubject(e.target.value)}
                        placeholder="Objet de l'email..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contenu du message *</label>
                    <textarea
                      value={commContent}
                      onChange={(e) => setCommContent(e.target.value)}
                      rows={commChannel === 'sms' ? 4 : 10}
                      maxLength={commChannel === 'sms' ? 160 : undefined}
                      placeholder={commChannel === 'sms' ? 'Message SMS (160 car. max)...' : 'Contenu du message...'}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                    />
                    {commChannel === 'sms' && (
                      <p className="text-[10px] text-gray-400 text-right mt-0.5">{commContent.length}/160</p>
                    )}
                  </div>

                  {/* Notification copy notice */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Bell className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Une notification in-app sera aussi envoyée à chaque destinataire en complément du {commChannel}.
                    </p>
                  </div>

                  {/* Send button */}
                  <button
                    onClick={handleSendCommunication}
                    disabled={commSending || !commContent.trim() || !commTitle.trim() || (commChannel === 'email' && !commSubject.trim())}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {commSending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours...</>
                    ) : (
                      <><Send className="w-4 h-4" />Envoyer à {commAudienceCount} destinataire{commAudienceCount > 1 ? 's' : ''}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
