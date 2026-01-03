import { useState, useEffect } from 'react';
import { Zap, AlertTriangle, CheckCircle, XCircle, Clock, Filter, Search, Eye, TrendingUp, Calendar } from 'lucide-react';
import { jobBadgeRequestService, type JobBadgeRequest } from '../services/jobBadgeRequestService';

export default function AdminJobBadges() {
  const [requests, setRequests] = useState<JobBadgeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<JobBadgeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<JobBadgeRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [filters, setFilters] = useState({
    badge_type: '' as '' | 'urgent' | 'featured',
    status: '' as '' | 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled',
    search: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filters]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await jobBadgeRequestService.getAllRequests();
      setRequests(data);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (filters.badge_type) {
      filtered = filtered.filter(r => r.badge_type === filters.badge_type);
    }

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.payment_reference?.toLowerCase().includes(search) ||
        r.job_id.toLowerCase().includes(search)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = (request: JobBadgeRequest) => {
    setSelectedRequest(request);
    setActionType('approve');
    setActionNotes('');
    setShowActionModal(true);
  };

  const handleReject = (request: JobBadgeRequest) => {
    setSelectedRequest(request);
    setActionType('reject');
    setRejectionReason('');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    try {
      if (actionType === 'approve') {
        await jobBadgeRequestService.approveRequest(selectedRequest.id, actionNotes);
      } else {
        await jobBadgeRequestService.rejectRequest(selectedRequest.id, rejectionReason);
      }

      setShowActionModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    urgent: requests.filter(r => r.badge_type === 'urgent' && r.status === 'approved').length,
    featured: requests.filter(r => r.badge_type === 'featured' && r.status === 'approved').length
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E2F56] mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Badges Offres
          </h1>
          <p className="text-gray-600">
            Validez ou refusez les demandes de badges URGENT et À LA UNE
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-700" />
              <span className="text-sm font-medium text-yellow-700">EN ATTENTE</span>
            </div>
            <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
            <p className="text-sm text-yellow-700 mt-1">À valider</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-700" />
              <span className="text-sm font-medium text-green-700">ACTIFS</span>
            </div>
            <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
            <p className="text-sm text-green-700 mt-1">En cours</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-700" />
              <span className="text-sm font-medium text-red-700">URGENT</span>
            </div>
            <div className="text-3xl font-bold text-red-900">{stats.urgent}</div>
            <p className="text-sm text-red-700 mt-1">Badges actifs</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-[#FF8C00]" />
              <span className="text-sm font-medium text-[#FF8C00]">À LA UNE</span>
            </div>
            <div className="text-3xl font-bold text-orange-900">{stats.featured}</div>
            <p className="text-sm text-[#FF8C00] mt-1">Badges actifs</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par référence ou ID offre..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                  />
                </div>
              </div>

              <select
                value={filters.badge_type}
                onChange={(e) => setFilters({ ...filters, badge_type: e.target.value as any })}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56]"
              >
                <option value="">Tous les badges</option>
                <option value="urgent">URGENT</option>
                <option value="featured">À LA UNE</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56]"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Refusé</option>
                <option value="expired">Expiré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Filter className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Aucune demande trouvée</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {request.badge_type === 'urgent' ? (
                            <>
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-red-600">URGENT</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-5 h-5 text-[#FF8C00]" />
                              <span className="font-medium text-[#FF8C00]">À LA UNE</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-mono text-gray-900 text-xs">
                            {request.payment_reference}
                          </div>
                          <div className="text-gray-500 mt-1">
                            Job: {request.job_id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">{request.duration_days} jours</span>
                        </div>
                        {request.ends_at && jobBadgeRequestService.isActive(request) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {jobBadgeRequestService.getRemainingDays(request.ends_at)} jours restants
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {jobBadgeRequestService.formatPrice(request.price_gnf)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${jobBadgeRequestService.getStatusColor(request.status)}`}>
                          {jobBadgeRequestService.getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(request)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Valider
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Refuser
                            </button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Détails
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showActionModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className={`p-6 ${actionType === 'approve' ? 'bg-green-50' : 'bg-red-50'} border-b`}>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {actionType === 'approve' ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Valider la demande de badge
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      Refuser la demande de badge
                    </>
                  )}
                </h3>
              </div>

              <div className="p-6">
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Badge:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {selectedRequest.badge_type === 'urgent' ? 'URGENT' : 'À LA UNE'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Durée:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {selectedRequest.duration_days} jours
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Prix:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {jobBadgeRequestService.formatPrice(selectedRequest.price_gnf)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Paiement:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {selectedRequest.payment_method}
                      </span>
                    </div>
                  </div>
                </div>

                {actionType === 'approve' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes administratives (optionnel)
                    </label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Notes internes sur cette validation..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif de refus <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Expliquez pourquoi cette demande est refusée..."
                      required
                    />
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                  }}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAction}
                  disabled={actionType === 'reject' && !rejectionReason.trim()}
                  className={`px-6 py-2.5 rounded-lg font-medium text-white transition ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {actionType === 'approve' ? 'Valider et activer' : 'Refuser la demande'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
