import React, { useState, useEffect } from 'react';
import { useModalContext } from '../contexts/ModalContext';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Eye,
  MoreVertical,
  Calendar,
  Building2,
  Briefcase,
  Link as LinkIcon,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { externalApplicationService, ExternalApplication } from '../services/externalApplicationService';

type StatusFilter = 'all' | 'sent' | 'in_progress' | 'relance_sent' | 'accepted' | 'rejected' | 'no_response';

const statusConfig = {
  sent: { label: 'Envoyée', icon: Send, color: 'blue' },
  in_progress: { label: 'En cours', icon: Clock, color: 'yellow' },
  relance_sent: { label: 'Relance envoyée', icon: MessageCircle, color: 'purple' },
  accepted: { label: 'Acceptée', icon: CheckCircle, color: 'green' },
  rejected: { label: 'Refusée', icon: XCircle, color: 'red' },
  no_response: { label: 'Sans réponse', icon: AlertCircle, color: 'gray' },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'gray' }
};

interface ExternalApplicationsProps {
  onNavigate?: (page: string, param?: string) => void;
}

export default function ExternalApplications({ onNavigate }: ExternalApplicationsProps) {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const { user } = useAuth();

  const [applications, setApplications] = useState<ExternalApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ExternalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedApp, setSelectedApp] = useState<ExternalApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRelanceModal, setShowRelanceModal] = useState(false);
  const [relanceMessage, setRelanceMessage] = useState('');
  const [sendingRelance, setSendingRelance] = useState(false);

  const [statistics, setStatistics] = useState({
    total: 0,
    sent: 0,
    in_progress: 0,
    accepted: 0,
    rejected: 0,
    no_response: 0
  });

  useEffect(() => {
    loadApplications();
    loadStatistics();
  }, [user]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter]);

  const loadApplications = async () => {
    if (!user) return;

    setLoading(true);
    const result = await externalApplicationService.getCandidateApplications(user.id);

    if (result.success && result.data) {
      setApplications(result.data);
    }

    setLoading(false);
  };

  const loadStatistics = async () => {
    if (!user) return;

    const stats = await externalApplicationService.getStatistics(user.id);
    setStatistics(stats);
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        app =>
          app.job_title.toLowerCase().includes(query) ||
          app.company_name.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  };

  const handleUpdateStatus = async (appId: string, newStatus: ExternalApplication['status']) => {
    const result = await externalApplicationService.updateApplicationStatus(appId, newStatus);

    if (result.success) {
      loadApplications();
      loadStatistics();
      setShowDetailsModal(false);
    }
  };

  const handleSendRelance = async () => {
    if (!selectedApp || !relanceMessage.trim()) return;

    setSendingRelance(true);

    const result = await externalApplicationService.sendRelance(
      selectedApp.id,
      relanceMessage
    );

    if (result.success) {
      loadApplications();
      loadStatistics();
      setShowRelanceModal(false);
      setRelanceMessage('');
      setSelectedApp(null);
    } else {
      alert(result.error || 'Erreur lors de l\'envoi de la relance');
    }

    setSendingRelance(false);
  };

  const getStatusBadge = (status: ExternalApplication['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    const colorClasses = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${colorClasses[config.color]}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const canRelance = (app: ExternalApplication): boolean => {
    if (app.relance_count >= 3) return false;

    if (app.last_relance_at) {
      const daysSince = Math.floor((Date.now() - new Date(app.last_relance_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= 7;
    }

    const daysSinceSent = Math.floor((Date.now() - new Date(app.sent_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceSent >= 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => onNavigate?.('candidate-dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Retour au tableau de bord</span>
        </button>

        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Toutes vos candidatures externes
              </h1>
              <p className="text-gray-600">
                Envoyées via votre profil JobGuinée
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('external-application')}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Postuler à une offre externe
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900 font-medium">
                💡 Astuce : un profil bien complété augmente vos chances de réponse
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Les recruteurs apprécient les profils détaillés et professionnels.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.sent}</p>
                <p className="text-sm text-gray-600">Envoyées</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.in_progress}</p>
                <p className="text-sm text-gray-600">En cours</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.accepted}</p>
                <p className="text-sm text-gray-600">Acceptées</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.rejected}</p>
                <p className="text-sm text-gray-600">Refusées</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par poste ou entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filtres
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">Statut</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    statusFilter === 'all'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes
                </button>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as StatusFilter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      statusFilter === status
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune candidature externe
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez à postuler à des offres externes en utilisant votre profil JobGuinée
            </p>
            <button
              onClick={() => onNavigate?.('external-application')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Créer ma première candidature
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <div
                key={app.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-orange-600" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {app.job_title}
                        </h3>
                        <p className="text-gray-600 mb-3">{app.company_name}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Envoyée le {new Date(app.sent_at).toLocaleDateString('fr-FR')}
                          </div>

                          {app.job_url && (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                            >
                              <LinkIcon className="w-4 h-4" />
                              Voir l'offre
                            </a>
                          )}

                          {app.relance_count > 0 && (
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4" />
                              {app.relance_count} relance{app.relance_count > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(app.status)}

                          {app.email_sent_successfully && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Email envoyé
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canRelance(app) && (
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowRelanceModal(true);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Relancer
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDetailsModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Détails de la candidature</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Offre</h4>
                  <p className="text-lg font-medium text-gray-900">{selectedApp.job_title}</p>
                  <p className="text-gray-600">{selectedApp.company_name}</p>
                  {selectedApp.job_url && (
                    <a
                      href={selectedApp.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1 mt-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Voir l'offre complète
                    </a>
                  )}
                </div>

                {selectedApp.job_description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.job_description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact</h4>
                  <p className="text-gray-700">{selectedApp.recruiter_name || 'Recruteur'}</p>
                  <p className="text-gray-600">{selectedApp.recruiter_email}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Statut actuel</h4>
                  {getStatusBadge(selectedApp.status)}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Changer le statut</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedApp.id, status as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                          selectedApp.status === status
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedApp.custom_message && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Message personnalisé</h4>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {selectedApp.custom_message}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Informations</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Envoyée le: {new Date(selectedApp.sent_at).toLocaleString('fr-FR')}</p>
                    {selectedApp.last_relance_at && (
                      <p>Dernière relance: {new Date(selectedApp.last_relance_at).toLocaleString('fr-FR')}</p>
                    )}
                    <p>Nombre de relances: {selectedApp.relance_count}</p>
                    <p>Email envoyé: {selectedApp.email_sent_successfully ? 'Oui ✓' : 'Non'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRelanceModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Relancer le recruteur</h3>
                  <button
                    onClick={() => {
                      setShowRelanceModal(false);
                      setRelanceMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-gray-700">
                    <strong>{selectedApp.job_title}</strong> chez {selectedApp.company_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Candidature envoyée le {new Date(selectedApp.sent_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message de relance
                  </label>
                  <textarea
                    value={relanceMessage}
                    onChange={(e) => setRelanceMessage(e.target.value)}
                    rows={6}
                    placeholder="Ex: Je me permets de revenir vers vous concernant ma candidature. Je reste disponible pour un entretien..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Un email de relance professionnel sera envoyé au recruteur avec votre message
                    et le lien vers votre profil public.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowRelanceModal(false);
                      setRelanceMessage('');
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendRelance}
                    disabled={!relanceMessage.trim() || sendingRelance}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sendingRelance ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Envoyer la relance
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
