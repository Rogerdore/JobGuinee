import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, Shield, FileText, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModalContext } from '../contexts/ModalContext';

interface Verification {
  id: string;
  candidate_id: string;
  user_id: string;
  verification_type: string;
  documents_urls: string[];
  status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  candidate: {
    title: string;
    location: string;
    experience_years: number;
    is_verified: boolean;
    profile: {
      full_name: string;
      email: string;
    };
  };
}

export default function AdminCandidateVerifications() {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const { profile } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [verifications, searchQuery, statusFilter]);

  const loadVerifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('candidate_verifications')
      .select(`
        *,
        candidate:candidate_profiles!candidate_verifications_candidate_id_fkey(
          title,
          location,
          experience_years,
          is_verified,
          profile:profiles!candidate_profiles_profile_id_fkey(full_name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setVerifications(data as any);
    } else if (error) {
      console.error('Error loading verifications:', error);
      showError('Erreur', 'Erreur lors du chargement des vérifications. Veuillez réessayer.');
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...verifications];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.candidate?.profile?.full_name?.toLowerCase().includes(query) ||
        v.candidate?.profile?.email?.toLowerCase().includes(query) ||
        v.candidate?.title?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    setFilteredVerifications(filtered);
  };

  const handleApprove = async (verificationId: string, candidateId: string) => {
    if (!profile?.id) return;

    setProcessing(true);

    const { error: verificationError } = await supabase
      .from('candidate_verifications')
      .update({
        status: 'approved',
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('id', verificationId);

    if (verificationError) {
      console.error('Error updating verification:', verificationError);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour de la vérification');
      setProcessing(false);
      return;
    }

    const { error: candidateError } = await supabase
      .from('candidate_profiles')
      .update({
        is_verified: true,
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (candidateError) {
      console.error('Error updating candidate:', candidateError);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour du profil candidat');
    } else {
      alert('Profil vérifié avec succès');
      setSelectedVerification(null);
      setAdminNotes('');
      await loadVerifications();
    }

    setProcessing(false);
  };

  const handleReject = async (verificationId: string) => {
    if (!profile?.id || !rejectionReason.trim()) {
      showWarning('Attention', 'Veuillez indiquer une raison de rejet');
      return;
    }

    setProcessing(true);

    const { error } = await supabase
      .from('candidate_verifications')
      .update({
        status: 'rejected',
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        admin_notes: adminNotes || null,
      })
      .eq('id', verificationId);

    if (error) {
      console.error('Error rejecting verification:', error);
      showError('Erreur', 'Erreur lors du rejet. Veuillez réessayer.');
    } else {
      showWarning('Information', 'Demande rejetée');
      setSelectedVerification(null);
      setAdminNotes('');
      setRejectionReason('');
      await loadVerifications();
    }

    setProcessing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      'under_review': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En révision' },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approuvé' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeté' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'identity': 'Identité',
      'education': 'Formation',
      'experience': 'Expérience',
      'full': 'Complète'
    };
    return labels[type] || type;
  };

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900 mb-4"></div>
          <p className="text-gray-600">Chargement des vérifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vérifications des Profils Candidats</h1>
          <p className="text-gray-600">Vérifiez et approuvez les profils des candidats</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">Total demandes</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
            <div className="text-3xl font-bold text-yellow-900 mb-1">{stats.pending}</div>
            <div className="text-sm text-yellow-700">En attente</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">
            <div className="text-3xl font-bold text-green-900 mb-1">{stats.approved}</div>
            <div className="text-sm text-green-700">Approuvées</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <div className="text-3xl font-bold text-red-900 mb-1">{stats.rejected}</div>
            <div className="text-sm text-red-700">Rejetées</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="under_review">En révision</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
        </div>

        {filteredVerifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune vérification trouvée</h3>
            <p className="text-gray-600">Essayez d'ajuster vos filtres de recherche</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVerifications.map((verification) => (
                    <tr key={verification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(verification.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {verification.candidate?.profile?.full_name}
                          {verification.candidate?.is_verified && (
                            <Shield className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{verification.candidate?.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTypeLabel(verification.verification_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {verification.documents_urls?.length || 0} document(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(verification.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedVerification(verification);
                            setAdminNotes(verification.admin_notes || '');
                            setRejectionReason(verification.rejection_reason || '');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Gérer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedVerification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-2xl sticky top-0">
              <h2 className="text-2xl font-bold">Gestion de la Vérification</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Candidat</p>
                  <p className="font-semibold text-gray-900">{selectedVerification.candidate?.profile?.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedVerification.candidate?.profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Poste</p>
                  <p className="font-semibold text-gray-900">{selectedVerification.candidate?.title}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Type de vérification</p>
                <p className="font-semibold text-gray-900">{getTypeLabel(selectedVerification.verification_type)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Documents soumis ({selectedVerification.documents_urls?.length || 0})</p>
                {selectedVerification.documents_urls && selectedVerification.documents_urls.length > 0 ? (
                  <div className="space-y-2">
                    {selectedVerification.documents_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                      >
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-900">Document {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun document soumis</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Date de demande</p>
                <p className="font-semibold text-gray-900">{formatDate(selectedVerification.created_at)}</p>
              </div>

              {selectedVerification.status !== 'pending' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Statut: {getStatusBadge(selectedVerification.status)}</p>
                  {selectedVerification.rejection_reason && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Raison du rejet:</p>
                      <p className="text-sm text-gray-900">{selectedVerification.rejection_reason}</p>
                    </div>
                  )}
                  {selectedVerification.admin_notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Notes admin:</p>
                      <p className="text-sm text-gray-900">{selectedVerification.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedVerification.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes administrateur
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ajoutez des notes..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison du rejet (si applicable)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Expliquez pourquoi la demande est rejetée..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedVerification.id, selectedVerification.candidate_id)}
                      disabled={processing}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(selectedVerification.id)}
                      disabled={processing}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Rejeter
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setAdminNotes('');
                  setRejectionReason('');
                }}
                disabled={processing}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
