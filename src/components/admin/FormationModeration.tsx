import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Eye, MessageSquare, RefreshCw, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ModerationRequest {
  id: string;
  formation_id: string;
  trainer_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  moderator_notes?: string;
  changes_requested?: string;
  priority: number;
  is_resubmission: boolean;
  formation_title?: string;
  trainer_name?: string;
  formation?: any;
}

export default function FormationModeration() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ModerationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ModerationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'changes_requested'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ModerationRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [changesRequested, setChangesRequested] = useState('');

  useEffect(() => {
    loadModerationRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, searchTerm]);

  const loadModerationRequests = async () => {
    setLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('formation_moderation_requests')
        .select(`
          *,
          formation:formations(title, description, category, level, price, duration),
          trainer:trainer_profiles(full_name, organization_name, entity_type)
        `)
        .order('priority', { ascending: false })
        .order('submitted_at', { ascending: false });

      if (requestsError) throw requestsError;

      const enrichedRequests = (requestsData || []).map(req => ({
        ...req,
        formation_title: req.formation?.title,
        trainer_name: req.trainer?.entity_type === 'individual'
          ? req.trainer?.full_name
          : req.trainer?.organization_name
      }));

      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error loading moderation requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.formation_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.trainer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = async (requestId: string, formationId: string) => {
    try {
      const { error: moderationError } = await supabase
        .from('formation_moderation_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          moderator_notes: reviewNotes
        })
        .eq('id', requestId);

      if (moderationError) throw moderationError;

      const { error: formationError } = await supabase
        .from('formations')
        .update({
          moderation_status: 'approved',
          status: 'active'
        })
        .eq('id', formationId);

      if (formationError) throw formationError;

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewNotes('');
      loadModerationRequests();
    } catch (error) {
      console.error('Error approving formation:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (requestId: string, formationId: string) => {
    if (!rejectReason.trim()) {
      alert('Veuillez fournir une raison de rejet');
      return;
    }

    try {
      const { error: moderationError } = await supabase
        .from('formation_moderation_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: rejectReason,
          moderator_notes: reviewNotes
        })
        .eq('id', requestId);

      if (moderationError) throw moderationError;

      const { error: formationError } = await supabase
        .from('formations')
        .update({
          moderation_status: 'rejected',
          status: 'archived'
        })
        .eq('id', formationId);

      if (formationError) throw formationError;

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewNotes('');
      setRejectReason('');
      loadModerationRequests();
    } catch (error) {
      console.error('Error rejecting formation:', error);
      alert('Erreur lors du rejet');
    }
  };

  const handleRequestChanges = async (requestId: string, formationId: string) => {
    if (!changesRequested.trim()) {
      alert('Veuillez décrire les modifications demandées');
      return;
    }

    try {
      const { error: moderationError } = await supabase
        .from('formation_moderation_requests')
        .update({
          status: 'changes_requested',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          changes_requested: changesRequested,
          moderator_notes: reviewNotes
        })
        .eq('id', requestId);

      if (moderationError) throw moderationError;

      const { error: formationError } = await supabase
        .from('formations')
        .update({
          moderation_status: 'changes_requested'
        })
        .eq('id', formationId);

      if (formationError) throw formationError;

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewNotes('');
      setChangesRequested('');
      loadModerationRequests();
    } catch (error) {
      console.error('Error requesting changes:', error);
      alert('Erreur lors de la demande de modifications');
    }
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    changes: requests.filter(r => r.status === 'changes_requested').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des demandes de modération...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Modération des Formations</h2>
        <p className="mt-2 text-gray-600">Gérez les demandes de publication des formateurs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approuvées</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Modifications</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.changes}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600" />
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
                  placeholder="Rechercher par formation ou formateur..."
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
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Rejetées</option>
              <option value="changes_requested">Modifications demandées</option>
            </select>

            <button
              onClick={loadModerationRequests}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de soumission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{request.formation_title}</p>
                    {request.is_resubmission && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Resoumission
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {request.trainer_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(request.submitted_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.priority > 5
                        ? 'bg-red-100 text-red-800'
                        : request.priority > 2
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {request.priority > 5 ? 'Haute' : request.priority > 2 ? 'Moyenne' : 'Normale'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'pending'
                        ? 'bg-orange-100 text-orange-800'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status === 'pending' && 'En attente'}
                      {request.status === 'approved' && 'Approuvée'}
                      {request.status === 'rejected' && 'Rejetée'}
                      {request.status === 'changes_requested' && 'Modifications'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowReviewModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                      Examiner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune demande de modération trouvée</p>
          </div>
        )}
      </div>

      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Examiner la demande</h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Formation</h4>
                <p className="text-lg font-medium text-gray-900">{selectedRequest.formation_title}</p>
              </div>

              {selectedRequest.formation && (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">{selectedRequest.formation.description}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Catégorie</p>
                      <p className="font-medium text-gray-900">{selectedRequest.formation.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Niveau</p>
                      <p className="font-medium text-gray-900">{selectedRequest.formation.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Durée</p>
                      <p className="font-medium text-gray-900">{selectedRequest.formation.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prix</p>
                      <p className="font-medium text-gray-900">
                        {selectedRequest.formation.price ? `${selectedRequest.formation.price.toLocaleString()} GNF` : 'Gratuit'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Formateur</h4>
                <p className="text-gray-900">{selectedRequest.trainer_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes du modérateur (optionnel)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notes internes..."
                />
              </div>

              {selectedRequest.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison de rejet (si rejet)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Expliquez pourquoi cette formation est rejetée..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modifications demandées (si modifications)
                    </label>
                    <textarea
                      value={changesRequested}
                      onChange={(e) => setChangesRequested(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Décrivez les modifications à apporter..."
                    />
                  </div>
                </>
              )}

              {selectedRequest.rejection_reason && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-semibold text-red-900 mb-1">Raison du rejet</p>
                  <p className="text-red-700">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {selectedRequest.changes_requested && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-semibold text-yellow-900 mb-1">Modifications demandées</p>
                  <p className="text-yellow-700">{selectedRequest.changes_requested}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRequest(null);
                  setReviewNotes('');
                  setRejectReason('');
                  setChangesRequested('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>

              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedRequest.id, selectedRequest.formation_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={() => handleRequestChanges(selectedRequest.id, selectedRequest.formation_id)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Demander modifications
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id, selectedRequest.formation_id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approuver
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
