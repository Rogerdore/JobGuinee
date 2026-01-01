import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CheckCircle, XCircle, Clock, Eye, Calendar, MapPin, Briefcase,
  Building, DollarSign, Users, AlertCircle, FileText, ChevronDown,
  ChevronUp, History, Search, RefreshCw, Zap, BarChart3,
  Filter, CheckSquare, Square, TrendingUp, AlertTriangle, Star, Flame, Tag,
  Download, Keyboard, TrendingDown, Activity, FileSpreadsheet, FileText as FilePdf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

interface PendingJob {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  sector: string;
  salary_range: string;
  company_name: string;
  submitted_at: string;
  user_id: string;
  recruiter_name: string;
  recruiter_email: string;
  company_id: string;
  category: string;
  position_count: number;
  experience_level: string;
  education_level: string;
  status: string;
  published_at?: string;
  expires_at?: string;
  validity_days?: number;
  renewal_count?: number;
  is_urgent: boolean;
  is_featured: boolean;
}

interface ModerationStats {
  pending_count: number;
  published_count: number;
  rejected_count: number;
  closed_count: number;
  expiring_soon_count: number;
  expiring_urgent_count: number;
  avg_moderation_hours: number;
  moderated_today: number;
}

interface BadgeStats {
  urgent_count: number;
  featured_count: number;
  both_count: number;
  total_published: number;
}

interface AdminJobModerationProps {
  onNavigate: (page: string) => void;
}

export default function AdminJobModerationEnhanced({ onNavigate }: AdminJobModerationProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [badgeStats, setBadgeStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [moderationNotes, setModerationNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [showRepublishModal, setShowRepublishModal] = useState<string | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState<string | null>(null);
  const [validityDays, setValidityDays] = useState(30);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all' | 'published' | 'closed' | 'rejected'>('pending');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [badgeFilter, setBadgeFilter] = useState<string>('all');
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === '?' && !showShortcuts) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showShortcuts]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadJobs(), loadStats(), loadBadgeStats()]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      showMessage('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_moderation_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadBadgeStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_badge_stats');
      if (error) throw error;
      setBadgeStats(data);
    } catch (error: any) {
      console.error('Error loading badge stats:', error);
    }
  };

  const loadJobs = async () => {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          location,
          contract_type,
          sector,
          salary_range,
          department,
          submitted_at,
          user_id,
          company_id,
          category,
          position_count,
          experience_level,
          education_level,
          status,
          published_at,
          expires_at,
          validity_days,
          renewal_count,
          is_urgent,
          is_featured
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter === 'all') {
        query = query.in('status', ['pending', 'published', 'rejected', 'closed']);
      } else {
        query = query.eq('status', statusFilter);
      }

      const { data: jobsData, error: jobsError } = await query;

      if (jobsError) throw jobsError;

      const jobsWithRecruiter = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', job.user_id)
            .single();

          return {
            ...job,
            company_name: job.department || 'N/A',
            recruiter_name: profileData?.full_name || 'Inconnu',
            recruiter_email: profileData?.email || 'N/A'
          };
        })
      );

      setJobs(jobsWithRecruiter);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      showMessage('error', 'Erreur lors du chargement des offres');
    }
  };

  const quickApprove = async (jobId: string, days: number = 30) => {
    setProcessing(jobId);
    try {
      console.log('Appel de approve_job_with_validity:', { jobId, days });

      const { data, error } = await supabase.rpc('approve_job_with_validity', {
        p_job_id: jobId,
        p_validity_days: days,
        p_notes: `Approbation rapide - ${days} jours`
      });

      console.log('Résultat RPC:', { data, error });

      if (error) {
        console.error('Erreur Supabase RPC:', error);
        throw new Error(`Erreur RPC: ${error.message}`);
      }

      if (data?.success) {
        showMessage('success', `Offre approuvée avec succès pour ${days} jours`);
        await loadData();
      } else {
        const errorMsg = data?.error || data?.message || 'Erreur inconnue';
        console.error('Échec de l\'approbation:', data);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error approving job:', error);
      showMessage('error', error.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const customApprove = async () => {
    if (!showApproveModal) return;

    setProcessing(showApproveModal);
    try {
      const { data, error } = await supabase.rpc('approve_job_with_badges_and_validity', {
        p_job_id: showApproveModal,
        p_validity_days: validityDays,
        p_is_urgent: isUrgent,
        p_is_featured: isFeatured,
        p_notes: moderationNotes || null
      });

      if (error) throw error;

      if (data?.success) {
        const badgeMsg = [];
        if (isUrgent) badgeMsg.push('URGENT');
        if (isFeatured) badgeMsg.push('À LA UNE');
        const badgeText = badgeMsg.length > 0 ? ` avec badges: ${badgeMsg.join(', ')}` : '';
        showMessage('success', `Offre approuvée pour ${validityDays} jours${badgeText}`);
        setShowApproveModal(null);
        setModerationNotes('');
        setValidityDays(30);
        setIsUrgent(false);
        setIsFeatured(false);
        await loadData();
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error approving job:', error);
      showMessage('error', error.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const updateBadges = async () => {
    if (!showBadgeModal) return;

    setProcessing(showBadgeModal);
    try {
      const { data, error } = await supabase.rpc('update_job_badges', {
        p_job_id: showBadgeModal,
        p_is_urgent: isUrgent,
        p_is_featured: isFeatured,
        p_notes: moderationNotes || null
      });

      if (error) throw error;

      if (data?.success) {
        showMessage('success', 'Badges mis à jour avec succès');
        setShowBadgeModal(null);
        setModerationNotes('');
        setIsUrgent(false);
        setIsFeatured(false);
        await loadData();
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error updating badges:', error);
      showMessage('error', error.message || 'Erreur lors de la mise à jour');
    } finally {
      setProcessing(null);
    }
  };

  const republishJob = async () => {
    if (!showRepublishModal) return;

    setProcessing(showRepublishModal);
    try {
      const { data, error } = await supabase.rpc('republish_job', {
        p_job_id: showRepublishModal,
        p_validity_days: validityDays,
        p_notes: moderationNotes || 'Republication'
      });

      if (error) throw error;

      if (data?.success) {
        showMessage('success', `Offre republiée pour ${validityDays} jours`);
        setShowRepublishModal(null);
        setModerationNotes('');
        setValidityDays(30);
        await loadData();
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error republishing job:', error);
      showMessage('error', error.message || 'Erreur lors de la republication');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (jobId: string) => {
    if (!rejectionReason.trim()) {
      showMessage('error', 'Veuillez indiquer une raison de rejet');
      return;
    }

    setProcessing(jobId);
    try {
      const { data, error } = await supabase.rpc('reject_job', {
        p_job_id: jobId,
        p_reason: rejectionReason,
        p_notes: moderationNotes || null
      });

      if (error) throw error;

      if (data?.success) {
        showMessage('success', 'Offre rejetée avec succès');
        setShowRejectModal(null);
        setRejectionReason('');
        setModerationNotes('');
        await loadData();
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error rejecting job:', error);
      showMessage('error', error.message || 'Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const toggleJobSelection = (jobId: string) => {
    const newSet = new Set(selectedJobs);
    if (newSet.has(jobId)) {
      newSet.delete(jobId);
    } else {
      newSet.add(jobId);
    }
    setSelectedJobs(newSet);
    setShowBulkActions(newSet.size > 0);
  };

  const selectAllVisible = () => {
    const visibleJobIds = filteredJobs.filter(j => j.status === 'pending').map(j => j.id);
    setSelectedJobs(new Set(visibleJobIds));
    setShowBulkActions(visibleJobIds.length > 0);
  };

  const clearSelection = () => {
    setSelectedJobs(new Set());
    setShowBulkActions(false);
  };

  const bulkApprove = async () => {
    if (selectedJobs.size === 0) return;

    setProcessing('bulk');
    let successCount = 0;
    let errorCount = 0;

    for (const jobId of selectedJobs) {
      try {
        const { data, error } = await supabase.rpc('approve_job_with_validity', {
          p_job_id: jobId,
          p_validity_days: 30,
          p_notes: 'Approbation en masse'
        });

        if (error) throw error;
        if (data?.success) successCount++;
        else errorCount++;
      } catch (error) {
        errorCount++;
      }
    }

    showMessage('success', `${successCount} offre(s) approuvée(s) ${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`);
    clearSelection();
    await loadData();
    setProcessing(null);
  };

  const openBadgeModal = (job: PendingJob) => {
    setShowBadgeModal(job.id);
    setIsUrgent(job.is_urgent);
    setIsFeatured(job.is_featured);
    setModerationNotes('');
  };

  const loadJobHistory = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_moderation_history')
        .select(`
          *,
          profiles!job_moderation_history_moderator_id_fkey(full_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobHistory(data || []);
      setShowHistory(jobId);
    } catch (error: any) {
      console.error('Error loading history:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Titre', 'Entreprise', 'Localisation', 'Status', 'Date soumission', 'Recruteur'];
    const rows = filteredJobs.map(job => [
      job.title,
      job.company_name,
      job.location,
      job.status,
      new Date(job.submitted_at).toLocaleDateString('fr-FR'),
      job.recruiter_name
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `moderation_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportStats = () => {
    if (!stats) return;
    const content = `Rapport de Modération - ${new Date().toLocaleDateString('fr-FR')}

En attente: ${stats.pending_count}
Publiées: ${stats.published_count}
Rejetées: ${stats.rejected_count}
Fermées: ${stats.closed_count}
Expire sous 7j: ${stats.expiring_soon_count}
Expire sous 3j: ${stats.expiring_urgent_count}
Temps moyen: ${stats.avg_moderation_hours.toFixed(1)}h
Modérées aujourd'hui: ${stats.moderated_today}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stats_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesSearch = (
          job.title.toLowerCase().includes(query) ||
          job.company_name.toLowerCase().includes(query) ||
          job.recruiter_name.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }

      if (sectorFilter !== 'all' && job.sector !== sectorFilter) return false;
      if (contractFilter !== 'all' && job.contract_type !== contractFilter) return false;
      if (locationFilter !== 'all' && !job.location.includes(locationFilter)) return false;

      if (badgeFilter === 'urgent' && !job.is_urgent) return false;
      if (badgeFilter === 'featured' && !job.is_featured) return false;
      if (badgeFilter === 'both' && (!job.is_urgent || !job.is_featured)) return false;

      return true;
    });
  }, [jobs, debouncedSearch, sectorFilter, contractFilter, locationFilter, badgeFilter]);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.sector).filter(Boolean)));
  }, [jobs]);

  const uniqueContracts = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.contract_type).filter(Boolean)));
  }, [jobs]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));
  }, [jobs]);

  const getStatusBadge = (job: PendingJob) => {
    const isExpiring = job.expires_at && new Date(job.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const isExpiringUrgent = job.expires_at && new Date(job.expires_at) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    switch (job.status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
            ⏳ En attente
          </span>
        );
      case 'published':
        if (isExpiringUrgent) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              🔥 Expire bientôt
            </span>
          );
        }
        if (isExpiring) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
              ⚠️ Expire sous 7j
            </span>
          );
        }
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            ✅ Publiée
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            ❌ Rejetée
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
            🔒 Fermée
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AdminLayout onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Chargement des offres...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Modération des Offres d'Emploi
            </h1>
            <p className="text-gray-600 mt-1">Validation rapide avec gestion des badges et durée de validité</p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShortcuts(true)}
              className="p-2 text-gray-600 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-200"
              title="Raccourcis clavier (?)"
            >
              <Keyboard className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportModal(true)}
              className="p-2 text-gray-600 hover:bg-green-50 rounded-lg transition border border-transparent hover:border-green-200"
              title="Exporter"
            >
              <Download className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadData}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-800">{stats.pending_count}</div>
              <div className="text-xs text-yellow-700">En attente</div>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-800">{stats.published_count}</div>
              <div className="text-xs text-green-700">Publiées</div>
            </div>
            {badgeStats && (
              <>
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-800">{badgeStats.urgent_count}</div>
                  <div className="text-xs text-red-700 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    URGENT
                  </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-800">{badgeStats.featured_count}</div>
                  <div className="text-xs text-blue-700 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    À LA UNE
                  </div>
                </div>
              </>
            )}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-800">{stats.expiring_soon_count}</div>
              <div className="text-xs text-orange-700">Expire 7j</div>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-800">{stats.expiring_urgent_count}</div>
              <div className="text-xs text-red-700">Expire 3j</div>
            </div>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-800">{stats.closed_count}</div>
              <div className="text-xs text-gray-700">Fermées</div>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-800">{stats.rejected_count}</div>
              <div className="text-xs text-red-700">Rejetées</div>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-800">{stats.moderated_today}</div>
              <div className="text-xs text-blue-700">Aujourd'hui</div>
            </div>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-800">{stats.avg_moderation_hours?.toFixed(1) || '0'}h</div>
              <div className="text-xs text-purple-700">Tps moyen</div>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg border-2 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">{selectedJobs.size} offre(s) sélectionnée(s)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={bulkApprove}
                  disabled={processing === 'bulk'}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Approuver tout (30j)
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
        >
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher (Ctrl+K)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500"
                >
                  {filteredJobs.length} résultat{filteredJobs.length > 1 ? 's' : ''}
                </motion.span>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">En attente uniquement</option>
              <option value="published">Publiées uniquement</option>
              <option value="closed">Fermées uniquement</option>
              <option value="rejected">Rejetées uniquement</option>
              <option value="all">Tous les statuts</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres {showFilters ? 'avancés' : ''}
            </motion.button>
            {statusFilter === 'pending' && paginatedJobs.filter(j => j.status === 'pending').length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={selectAllVisible}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-lg transition flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Tout sélectionner
              </motion.button>
            )}
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
                    <select
                      value={sectorFilter}
                      onChange={(e) => setSectorFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tous les secteurs</option>
                      {uniqueSectors.map(sector => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de contrat</label>
                    <select
                      value={contractFilter}
                      onChange={(e) => setContractFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tous les contrats</option>
                      {uniqueContracts.map(contract => (
                        <option key={contract} value={contract}>{contract}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Toutes les localisations</option>
                      {uniqueLocations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Badges</label>
                    <select
                      value={badgeFilter}
                      onChange={(e) => setBadgeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tous les badges</option>
                      <option value="urgent">URGENT uniquement</option>
                      <option value="featured">À LA UNE uniquement</option>
                      <option value="both">Les deux badges</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSectorFilter('all');
                      setContractFilter('all');
                      setLocationFilter('all');
                      setBadgeFilter('all');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200"
          >
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune offre trouvée</p>
            <p className="text-gray-500 text-sm mt-2">Les offres apparaîtront ici selon le filtre sélectionné</p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-gray-600 px-2">
              <span>
                Affichage {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredJobs.length)} sur {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''}
              </span>
              <span>Page {currentPage} / {totalPages}</span>
            </div>
            <div className="space-y-4">
            {paginatedJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox for bulk selection */}
                      {job.status === 'pending' && (
                        <button
                          onClick={() => toggleJobSelection(job.id)}
                          className="mt-1 p-1 hover:bg-gray-100 rounded transition"
                        >
                          {selectedJobs.has(job.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          {getStatusBadge(job)}

                          {/* Display current badges */}
                          {job.is_urgent && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white border-2 border-red-600 flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              URGENT
                            </span>
                          )}
                          {job.is_featured && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white border-2 border-blue-600 flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              À LA UNE
                            </span>
                          )}

                          {job.renewal_count > 0 && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 font-medium">
                              🔄 Renouvellement #{job.renewal_count}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span>{job.company_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{job.contract_type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Soumis le {new Date(job.submitted_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {job.expires_at && (
                            <div className="flex items-center gap-1 text-orange-600 font-medium">
                              <Clock className="w-4 h-4" />
                              <span>Expire le {new Date(job.expires_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Recruteur:</span> {job.recruiter_name} ({job.recruiter_email})
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => loadJobHistory(job.id)}
                        className="p-2 text-gray-600 hover:bg-blue-50 rounded-lg transition"
                        title="Voir l'historique"
                      >
                        <History className="w-5 h-5" />
                      </motion.button>
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        {expandedJob === job.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {job.status === 'pending' && !expandedJob && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => quickApprove(job.id, 30)}
                        disabled={processing === job.id}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        title="Approbation rapide pour 30 jours"
                      >
                        {processing === job.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Approbation...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Approuver 30j</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowApproveModal(job.id);
                          setValidityDays(30);
                          setIsUrgent(false);
                          setIsFeatured(false);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-2"
                        title="Configurer durée et badges"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Avec badges
                      </button>
                      <button
                        onClick={() => setShowRejectModal(job.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                        title="Rejeter l'offre"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Badge management for published jobs */}
                  {job.status === 'published' && !expandedJob && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openBadgeModal(job)}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Tag className="w-4 h-4" />
                        Gérer les badges
                      </button>
                    </div>
                  )}

                  {/* Republish Button for closed jobs */}
                  {job.status === 'closed' && !expandedJob && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setShowRepublishModal(job.id)}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Republier l'offre
                      </button>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedJob === job.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Description du poste</h4>
                        <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          {job.description}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Secteur</div>
                          <div className="font-medium text-gray-900">{job.sector || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Expérience</div>
                          <div className="font-medium text-gray-900">{job.experience_level || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Niveau d'études</div>
                          <div className="font-medium text-gray-900">{job.education_level || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Postes</div>
                          <div className="font-medium text-gray-900">{job.position_count || 1}</div>
                        </div>
                      </div>

                      {job.status === 'pending' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes de modération (optionnel)
                            </label>
                            <textarea
                              value={moderationNotes}
                              onChange={(e) => setModerationNotes(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ajoutez des notes internes..."
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => quickApprove(job.id, 30)}
                              disabled={processing === job.id}
                              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {processing === job.id ? (
                                <>
                                  <RefreshCw className="w-5 h-5 animate-spin" />
                                  <span>Approbation...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-5 h-5" />
                                  <span>Approuver 30j</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setShowApproveModal(job.id);
                                setValidityDays(30);
                                setIsUrgent(false);
                                setIsFeatured(false);
                              }}
                              disabled={processing === job.id}
                              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Avec badges
                            </button>
                            <button
                              onClick={() => setShowRejectModal(job.id)}
                              disabled={processing === job.id}
                              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-5 h-5" />
                              Rejeter
                            </button>
                          </div>
                        </div>
                      )}

                      {job.status === 'published' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => openBadgeModal(job)}
                            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <Tag className="w-5 h-5" />
                            Gérer les badges
                          </button>
                        </div>
                      )}

                      {job.status === 'closed' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowRepublishModal(job.id)}
                            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Republier l'offre
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Précédent
              </motion.button>

              <div className="flex gap-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Suivant
              </motion.button>
            </motion.div>
          )}
          </>
        )}

        {/* Custom Approve Modal with Badges */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Approuver l'offre avec badges</h3>
              </div>

              <div className="space-y-4">
                {/* Badge Selection */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    Badges de visibilité
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUrgent}
                        onChange={(e) => setIsUrgent(e.target.checked)}
                        className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                      />
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-900">URGENT</span>
                        <span className="text-xs text-gray-500">(affichage prioritaire en rouge)</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">À LA UNE</span>
                        <span className="text-xs text-gray-500">(mise en avant sur la page d'accueil)</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Validity Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée de validité <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[7, 15, 30, 45, 60, 90].map(days => (
                      <button
                        key={days}
                        onClick={() => setValidityDays(days)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          validityDays === days
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}
                      >
                        {days} jours
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ou saisissez une durée personnalisée (1-365 jours)"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Notes internes..."
                  />
                </div>

                {/* Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    L'offre sera visible pendant <strong>{validityDays} jours</strong> jusqu'au{' '}
                    <strong>{new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</strong>
                    {(isUrgent || isFeatured) && (
                      <>
                        {' '}avec les badges:{' '}
                        <strong>
                          {[isUrgent && 'URGENT', isFeatured && 'À LA UNE'].filter(Boolean).join(', ')}
                        </strong>
                      </>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowApproveModal(null);
                      setValidityDays(30);
                      setIsUrgent(false);
                      setIsFeatured(false);
                      setModerationNotes('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={customApprove}
                    disabled={processing === showApproveModal}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {processing === showApproveModal ? 'Approbation...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badge Management Modal */}
        {showBadgeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Tag className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Gérer les badges de visibilité</h3>
              </div>

              <div className="space-y-4">
                {/* Badge Selection */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUrgent}
                        onChange={(e) => setIsUrgent(e.target.checked)}
                        className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                      />
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-900">URGENT</span>
                        <span className="text-xs text-gray-500">(affichage prioritaire en rouge)</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">À LA UNE</span>
                        <span className="text-xs text-gray-500">(mise en avant sur la page d'accueil)</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Raison du changement..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBadgeModal(null);
                      setIsUrgent(false);
                      setIsFeatured(false);
                      setModerationNotes('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={updateBadges}
                    disabled={processing === showBadgeModal}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {processing === showBadgeModal ? 'Mise à jour...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Republish Modal */}
        {showRepublishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Republier l'offre</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouvelle durée de validité <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[7, 15, 30, 45, 60, 90].map(days => (
                      <button
                        key={days}
                        onClick={() => setValidityDays(days)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          validityDays === days
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}
                      >
                        {days} jours
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ou saisissez une durée personnalisée (1-365 jours)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Raison de la republication..."
                  />
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    L'offre sera à nouveau visible pendant <strong>{validityDays} jours</strong> jusqu'au{' '}
                    <strong>{new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</strong>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRepublishModal(null);
                      setValidityDays(30);
                      setModerationNotes('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={republishJob}
                    disabled={processing === showRepublishModal}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {processing === showRepublishModal ? 'Republication...' : 'Republier'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Rejeter l'offre</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du rejet <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: L'offre ne respecte pas les standards de qualité, informations incomplètes, contenu inapproprié..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Cette raison sera envoyée au recruteur</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleReject(showRejectModal)}
                    disabled={!rejectionReason.trim() || processing === showRejectModal}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {processing === showRejectModal ? 'Rejet en cours...' : 'Confirmer le rejet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shortcuts Modal */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcuts(false)}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Keyboard className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Raccourcis Clavier</h3>
                  </div>
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Recherche</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">Ctrl+K</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Aide (ce modal)</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">?</kbd>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Astuces</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Utilisez la recherche pour filtrer rapidement les offres</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Les filtres avancés permettent des recherches précises</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Sélectionnez plusieurs offres pour des actions en masse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Cliquez sur l'icône historique pour voir l'historique de modération</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExportModal(false)}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Download className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Exporter les Données</h3>
                  </div>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      exportToCSV();
                      setShowExportModal(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg hover:from-green-100 hover:to-emerald-100 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Exporter en CSV</div>
                        <div className="text-sm text-gray-600">
                          Liste des {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''} filtrée{filteredJobs.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      exportStats();
                      setShowExportModal(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="font-semibold text-gray-900">Exporter les Statistiques</div>
                        <div className="text-sm text-gray-600">
                          Rapport complet des statistiques de modération
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>

                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2 text-sm text-yellow-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>Les exports respectent les filtres actuellement appliqués</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(null)}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <History className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Historique de Modération</h3>
                  </div>
                  <button
                    onClick={() => setShowHistory(null)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {jobHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Aucun historique disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobHistory.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-full ${
                            entry.action === 'approved' ? 'bg-green-100' :
                            entry.action === 'rejected' ? 'bg-red-100' :
                            entry.action === 'republished' ? 'bg-purple-100' :
                            'bg-gray-100'
                          }`}>
                            {entry.action === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {entry.action === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                            {entry.action === 'republished' && <RefreshCw className="w-5 h-5 text-purple-600" />}
                            {entry.action === 'badge_updated' && <Tag className="w-5 h-5 text-blue-600" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-semibold text-gray-900">
                              {entry.action === 'approved' && 'Offre approuvée'}
                              {entry.action === 'rejected' && 'Offre rejetée'}
                              {entry.action === 'republished' && 'Offre republiée'}
                              {entry.action === 'badge_updated' && 'Badges mis à jour'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.created_at).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Par: <span className="font-medium">{entry.profiles?.full_name || 'Système'}</span>
                          </div>
                          {entry.reason && (
                            <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                              <span className="font-medium">Raison:</span> {entry.reason}
                            </div>
                          )}
                          {entry.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {entry.notes}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
