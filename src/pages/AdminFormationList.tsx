import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Filter, Download, Eye, CreditCard as Edit, Trash2, CheckCircle, XCircle, Clock, ArrowUpDown, MoreVertical, MapPin, Calendar, DollarSign, Users, TrendingUp, ChevronDown, RefreshCw, Plus, Zap, Shield, Settings, AlertTriangle } from 'lucide-react';
import { supabase, TrainerProfile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import FormationPublishForm from '../components/forms/FormationPublishForm';
import FormationModeration from '../components/admin/FormationModeration';
import FormationBoostModal from '../components/admin/FormationBoostModal';
import TrainerAccountManagement from '../components/admin/TrainerAccountManagement';

interface Formation {
  id: string;
  title: string;
  description: string;
  provider: string;
  duration: string;
  level: string;
  category: string;
  price: number;
  image_url?: string;
  status: 'active' | 'archived';
  created_at: string;
  trainer_id?: string;
  trainer_name?: string;
  enrollments_count?: number;
}

type SortField = 'title' | 'created_at' | 'price' | 'status';
type SortDirection = 'asc' | 'desc';
type ActiveTab = 'formations' | 'moderation' | 'trainers' | 'account_management';

export default function AdminFormationList() {
  const { user } = useAuth();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [adminTrainerProfile, setAdminTrainerProfile] = useState<TrainerProfile | null>(null);
  const [editingFormationId, setEditingFormationId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<ActiveTab>('formations');
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedFormationForBoost, setSelectedFormationForBoost] = useState<string | null>(null);

  const categories = ['Informatique', 'Management', 'Marketing', 'Finance', 'RH', 'Autre'];
  const levels = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];

  useEffect(() => {
    loadFormations();
    loadOrCreateAdminTrainerProfile();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [formations, searchTerm, statusFilter, categoryFilter, levelFilter, sortField, sortDirection]);

  const loadOrCreateAdminTrainerProfile = async () => {
    if (!user) return;

    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('trainer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        setAdminTrainerProfile(existingProfile);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const newTrainerProfile = {
        user_id: user.id,
        profile_id: user.id,
        entity_type: 'organization' as const,
        organization_name: 'JobGuinee - Administration',
        organization_type: 'Plateforme',
        bio: 'Formations publiées par l\'administration de JobGuinee',
        is_verified: true,
        verified_at: new Date().toISOString(),
        location: 'Conakry, Guinée',
        website_url: 'https://jobguinee.com',
        domaines: ['Tous domaines']
      };

      const { data: newProfile, error: insertError } = await supabase
        .from('trainer_profiles')
        .insert(newTrainerProfile)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating admin trainer profile:', insertError);
        return;
      }

      setAdminTrainerProfile(newProfile);
    } catch (error) {
      console.error('Error loading/creating admin trainer profile:', error);
    }
  };

  const loadFormations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('formations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFormations(data || []);
    } catch (error) {
      console.error('Error loading formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...formations];

    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.provider?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter);
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(f => f.level === levelFilter);
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredFormations(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedFormations(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFormations.length === paginatedFormations.length) {
      setSelectedFormations([]);
    } else {
      setSelectedFormations(paginatedFormations.map(f => f.id));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'archive' | 'delete') => {
    if (!selectedFormations.length) return;

    if (action === 'delete') {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedFormations.length} formation(s) ?`)) {
        return;
      }

      const { error } = await supabase
        .from('formations')
        .delete()
        .in('id', selectedFormations);

      if (error) {
        console.error('Error deleting formations:', error);
        return;
      }
    } else {
      const newStatus = action === 'activate' ? 'active' : 'archived';
      const { error } = await supabase
        .from('formations')
        .update({ status: newStatus })
        .in('id', selectedFormations);

      if (error) {
        console.error('Error updating formations:', error);
        return;
      }
    }

    setSelectedFormations([]);
    loadFormations();
  };

  const updateFormationStatus = async (id: string, status: 'active' | 'archived') => {
    const { error } = await supabase
      .from('formations')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return;
    }

    loadFormations();
  };

  const deleteFormation = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return;

    const { error } = await supabase
      .from('formations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting formation:', error);
      return;
    }

    loadFormations();
  };

  const handlePublishNew = () => {
    setEditingFormationId(undefined);
    setShowPublishModal(true);
  };

  const handleEditFormation = (formationId: string) => {
    setEditingFormationId(formationId);
    setShowPublishModal(true);
  };

  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setEditingFormationId(undefined);
  };

  const handlePublishSuccess = () => {
    loadFormations();
    handleClosePublishModal();
  };

  const exportToCSV = () => {
    const csv = [
      ['Titre', 'Formateur', 'Catégorie', 'Niveau', 'Durée', 'Prix', 'Statut', 'Date création'],
      ...filteredFormations.map(f => [
        f.title,
        f.provider || '',
        f.category || '',
        f.level || '',
        f.duration || '',
        f.price?.toString() || '0',
        f.status,
        new Date(f.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(filteredFormations.length / itemsPerPage);
  const paginatedFormations = filteredFormations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: formations.length,
    active: formations.filter(f => f.status === 'active').length,
    archived: formations.filter(f => f.status === 'archived').length,
    totalRevenue: formations.reduce((sum, f) => sum + (f.price || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des formations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Formations et Formateurs</h1>
          <p className="mt-2 text-gray-600">Gestion complète, modération, services boost et contrôle des comptes</p>
        </div>
        {activeTab === 'formations' && (
          <button
            onClick={handlePublishNew}
            disabled={!adminTrainerProfile}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Publier une formation
          </button>
        )}
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('formations')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'formations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            Formations
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'moderation'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            Modération
          </button>

          <button
            onClick={() => setActiveTab('trainers')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'trainers'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Users className="w-5 h-5" />
            Formateurs
          </button>

          <button
            onClick={() => setActiveTab('account_management')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'account_management'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Settings className="w-5 h-5" />
            Gestion des comptes
          </button>
        </div>
      </div>

      {activeTab === 'moderation' && (
        <FormationModeration />
      )}

      {activeTab === 'trainers' && (
        <AdminTrainerManagement />
      )}

      {activeTab === 'account_management' && (
        <TrainerAccountManagement />
      )}

      {activeTab === 'formations' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Formations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <GraduationCap className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actives</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Archivées</p>
              <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
            </div>
            <XCircle className="w-10 h-10 text-gray-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenu Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue.toLocaleString()} GNF</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, description ou formateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="archived">Archivées</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous niveaux</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={loadFormations}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selectedFormations.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <p className="text-sm text-blue-900">
              {selectedFormations.length} formation(s) sélectionnée(s)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Activer
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Archiver
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFormations.length === paginatedFormations.length && paginatedFormations.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Formation
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Niveau
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Prix
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Statut
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Date
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedFormations.map((formation) => (
                <tr key={formation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedFormations.includes(formation.id)}
                      onChange={() => toggleSelection(formation.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {formation.image_url && (
                        <img
                          src={formation.image_url}
                          alt={formation.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{formation.title}</p>
                        <p className="text-sm text-gray-500">{formation.duration}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{formation.provider || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {formation.category || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {formation.level || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {formation.price ? `${formation.price.toLocaleString()} GNF` : 'Gratuit'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      formation.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {formation.status === 'active' ? 'Active' : 'Archivée'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(formation.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedFormationForBoost(formation.id);
                          setShowBoostModal(true);
                        }}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="Services Boost"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditFormation(formation.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateFormationStatus(
                          formation.id,
                          formation.status === 'active' ? 'archived' : 'active'
                        )}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title={formation.status === 'active' ? 'Archiver' : 'Activer'}
                      >
                        {formation.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteFormation(formation.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFormations.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune formation trouvée</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredFormations.length)} sur {filteredFormations.length} résultats
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2 py-1">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {showBoostModal && selectedFormationForBoost && (
        <FormationBoostModal
          formationId={selectedFormationForBoost}
          formationTitle={formations.find(f => f.id === selectedFormationForBoost)?.title || ''}
          onClose={() => {
            setShowBoostModal(false);
            setSelectedFormationForBoost(null);
          }}
          onSuccess={() => {
            loadFormations();
          }}
        />
      )}

      {showPublishModal && adminTrainerProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingFormationId ? 'Modifier la formation' : 'Publier une nouvelle formation'}
              </h2>
              <button
                onClick={handleClosePublishModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <FormationPublishForm
                trainerProfile={adminTrainerProfile}
                formationId={editingFormationId}
                onClose={handleClosePublishModal}
                onSuccess={handlePublishSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
