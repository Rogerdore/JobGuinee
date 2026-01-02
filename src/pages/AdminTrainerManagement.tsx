import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Download, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, ArrowUpDown, Building2,
  User, Mail, Phone, MapPin, Award, TrendingUp, RefreshCw,
  FileText, Shield, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TrainerProfile {
  id: string;
  profile_id: string;
  user_id: string;
  entity_type: 'individual' | 'organization';
  bio?: string;
  specializations?: string[];
  website_url?: string;
  location?: string;
  is_verified: boolean;
  verification_documents?: string[];
  verification_notes?: string;
  verified_at?: string;
  full_name?: string;
  profession?: string;
  experience_years?: number;
  certifications?: any[];
  photo_url?: string;
  organization_name?: string;
  organization_type?: string;
  rccm?: string;
  agrement_number?: string;
  address?: string;
  domaines?: string[];
  logo_url?: string;
  contact_person?: string;
  contact_person_title?: string;
  total_students?: number;
  total_formations?: number;
  average_rating?: number;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
  email?: string;
  phone?: string;
}

type SortField = 'created_at' | 'full_name' | 'organization_name' | 'is_verified' | 'total_formations';
type SortDirection = 'asc' | 'desc';

export default function AdminTrainerManagement() {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<TrainerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | 'individual' | 'organization'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    loadTrainers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trainers, searchTerm, entityTypeFilter, verificationFilter, sortField, sortDirection]);

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const { data: trainersData, error: trainersError } = await supabase
        .from('trainer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (trainersError) throw trainersError;

      if (trainersData) {
        const userIds = trainersData.map(t => t.user_id);
        const { data: authData, error: authError } = await supabase
          .from('profiles')
          .select('id, email, phone')
          .in('id', userIds);

        if (!authError && authData) {
          const enrichedTrainers = trainersData.map(trainer => {
            const auth = authData.find(a => a.id === trainer.user_id);
            return {
              ...trainer,
              email: auth?.email,
              phone: auth?.phone
            };
          });
          setTrainers(enrichedTrainers);
        } else {
          setTrainers(trainersData);
        }
      }
    } catch (error) {
      console.error('Error loading trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trainers];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.specializations?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.entity_type === entityTypeFilter);
    }

    if (verificationFilter !== 'all') {
      const isVerified = verificationFilter === 'verified';
      filtered = filtered.filter(t => t.is_verified === isVerified);
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'full_name' || sortField === 'organization_name') {
        aVal = aVal || '';
        bVal = bVal || '';
      }

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

    setFilteredTrainers(filtered);
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
    setSelectedTrainers(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTrainers.length === paginatedTrainers.length) {
      setSelectedTrainers([]);
    } else {
      setSelectedTrainers(paginatedTrainers.map(t => t.id));
    }
  };

  const verifyTrainer = async (trainerId: string, verified: boolean, notes?: string) => {
    const updateData: any = {
      is_verified: verified,
      verification_notes: notes,
      updated_at: new Date().toISOString()
    };

    if (verified) {
      updateData.verified_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('trainer_profiles')
      .update(updateData)
      .eq('id', trainerId);

    if (error) {
      console.error('Error verifying trainer:', error);
      return;
    }

    setShowVerificationModal(false);
    setSelectedTrainer(null);
    loadTrainers();
  };

  const handleBulkVerification = async (verified: boolean) => {
    if (!selectedTrainers.length) return;

    const updateData: any = {
      is_verified: verified,
      updated_at: new Date().toISOString()
    };

    if (verified) {
      updateData.verified_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('trainer_profiles')
      .update(updateData)
      .in('id', selectedTrainers);

    if (error) {
      console.error('Error bulk verifying trainers:', error);
      return;
    }

    setSelectedTrainers([]);
    loadTrainers();
  };

  const deleteTrainer = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce formateur ?')) return;

    const { error } = await supabase
      .from('trainer_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting trainer:', error);
      return;
    }

    loadTrainers();
  };

  const exportToCSV = () => {
    const csv = [
      ['Type', 'Nom', 'Email', 'Téléphone', 'Localisation', 'Vérifié', 'Formations', 'Étudiants', 'Note', 'Date création'],
      ...filteredTrainers.map(t => [
        t.entity_type === 'individual' ? 'Individuel' : 'Organisation',
        t.entity_type === 'individual' ? t.full_name || '' : t.organization_name || '',
        t.email || '',
        t.phone || '',
        t.location || '',
        t.is_verified ? 'Oui' : 'Non',
        t.total_formations?.toString() || '0',
        t.total_students?.toString() || '0',
        t.average_rating?.toFixed(1) || '0',
        new Date(t.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formateurs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage);
  const paginatedTrainers = filteredTrainers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: trainers.length,
    individuals: trainers.filter(t => t.entity_type === 'individual').length,
    organizations: trainers.filter(t => t.entity_type === 'organization').length,
    verified: trainers.filter(t => t.is_verified).length,
    pending: trainers.filter(t => !t.is_verified).length,
    totalFormations: trainers.reduce((sum, t) => sum + (t.total_formations || 0), 0),
    totalStudents: trainers.reduce((sum, t) => sum + (t.total_students || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des formateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Formateurs</h1>
        <p className="mt-2 text-gray-600">Liste complète de tous les formateurs et organismes de formation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Formateurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vérifiés</p>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Étudiants</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
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
                  placeholder="Rechercher par nom, email, localisation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous types</option>
              <option value="individual">Individuels</option>
              <option value="organization">Organisations</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous statuts</option>
              <option value="verified">Vérifiés</option>
              <option value="pending">En attente</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={loadTrainers}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selectedTrainers.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <p className="text-sm text-blue-900">
              {selectedTrainers.length} formateur(s) sélectionné(s)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkVerification(true)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Vérifier
              </button>
              <button
                onClick={() => handleBulkVerification(false)}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Retirer vérification
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
                    checked={selectedTrainers.length === paginatedTrainers.length && paginatedTrainers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('full_name')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Nom / Organisation
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('total_formations')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Formations
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Étudiants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('is_verified')}
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
              {paginatedTrainers.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedTrainers.includes(trainer.id)}
                      onChange={() => toggleSelection(trainer.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trainer.entity_type === 'individual'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {trainer.entity_type === 'individual' ? (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Individuel
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Organisation
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {(trainer.photo_url || trainer.logo_url) && (
                        <img
                          src={trainer.photo_url || trainer.logo_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {trainer.entity_type === 'individual' ? trainer.full_name : trainer.organization_name}
                        </p>
                        {trainer.entity_type === 'individual' && trainer.profession && (
                          <p className="text-xs text-gray-500">{trainer.profession}</p>
                        )}
                        {trainer.entity_type === 'organization' && trainer.organization_type && (
                          <p className="text-xs text-gray-500">{trainer.organization_type}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {trainer.email && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="w-3 h-3" />
                          {trainer.email}
                        </div>
                      )}
                      {trainer.phone && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Phone className="w-3 h-3" />
                          {trainer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {trainer.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {trainer.location}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{trainer.total_formations || 0}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{trainer.total_students || 0}</p>
                  </td>
                  <td className="px-6 py-4">
                    {trainer.average_rating ? (
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{trainer.average_rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trainer.is_verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {trainer.is_verified ? (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Vérifié
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          En attente
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(trainer.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedTrainer(trainer);
                          setShowVerificationModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Gérer vérification"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTrainer(trainer.id)}
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

        {filteredTrainers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun formateur trouvé</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredTrainers.length)} sur {filteredTrainers.length} résultats
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

      {showVerificationModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Vérification du formateur</h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Nom:</p>
                <p className="text-gray-900">
                  {selectedTrainer.entity_type === 'individual'
                    ? selectedTrainer.full_name
                    : selectedTrainer.organization_name}
                </p>
              </div>

              {selectedTrainer.entity_type === 'organization' && selectedTrainer.rccm && (
                <div>
                  <p className="text-sm font-medium text-gray-700">RCCM:</p>
                  <p className="text-gray-900">{selectedTrainer.rccm}</p>
                </div>
              )}

              {selectedTrainer.entity_type === 'organization' && selectedTrainer.agrement_number && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Numéro d'agrément:</p>
                  <p className="text-gray-900">{selectedTrainer.agrement_number}</p>
                </div>
              )}

              {selectedTrainer.verification_documents && selectedTrainer.verification_documents.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                  <div className="space-y-2">
                    {selectedTrainer.verification_documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <FileText className="w-4 h-4" />
                        Document {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700">Statut actuel:</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  selectedTrainer.is_verified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {selectedTrainer.is_verified ? 'Vérifié' : 'En attente'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setSelectedTrainer(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              {!selectedTrainer.is_verified && (
                <button
                  onClick={() => verifyTrainer(selectedTrainer.id, true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Vérifier
                </button>
              )}
              {selectedTrainer.is_verified && (
                <button
                  onClick={() => verifyTrainer(selectedTrainer.id, false)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Retirer vérification
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
