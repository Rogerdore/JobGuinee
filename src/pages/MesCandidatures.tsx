import { useEffect, useState } from 'react';
import { Briefcase, Calendar, Building, MapPin, Eye, FileText, Clock, CheckCircle, XCircle, AlertCircle, Filter, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Application, Job, Company } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Select, Spinner } from '../components/ui';

interface MesCandidaturesProps {
  onNavigate: (page: string, jobId?: string) => void;
}

type ApplicationWithJob = Application & {
  jobs: Job & {
    companies: Company;
  };
};

const STATUS_CONFIG = {
  pending: { label: 'En attente', variant: 'info' as const, icon: Clock },
  reviewed: { label: 'Examinée', variant: 'default' as const, icon: Eye },
  shortlisted: { label: 'Présélectionné', variant: 'warning' as const, icon: AlertCircle },
  interview: { label: 'Entretien', variant: 'warning' as const, icon: Calendar },
  rejected: { label: 'Refusée', variant: 'danger' as const, icon: XCircle },
  accepted: { label: 'Acceptée', variant: 'success' as const, icon: CheckCircle },
};

export default function MesCandidatures({ onNavigate }: MesCandidaturesProps) {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, [profile?.id]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter]);

  const loadApplications = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            *,
            companies (*)
          )
        `)
        .eq('candidate_id', profile.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications((data as ApplicationWithJob[]) || []);
    } catch (error) {
      alert('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.jobs.title.toLowerCase().includes(query) ||
          app.jobs.companies?.company_name?.toLowerCase().includes(query)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusStats = () => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      reviewed: applications.filter((a) => a.status === 'reviewed' || a.status === 'shortlisted' || a.status === 'interview').length,
      accepted: applications.filter((a) => a.status === 'accepted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Candidatures</h1>
          <p className="text-gray-600">Suivez l'état de vos candidatures en temps réel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-orange-600">{stats.reviewed}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acceptées</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        <Card padding="md" className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par poste ou entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                fullWidth
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                fullWidth
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="reviewed">Examinée</option>
                <option value="shortlisted">Présélectionné</option>
                <option value="interview">Entretien</option>
                <option value="accepted">Acceptée</option>
                <option value="rejected">Refusée</option>
              </Select>
            </div>
          </div>
        </Card>

        {filteredApplications.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {applications.length === 0 ? 'Aucune candidature' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-600 mb-6">
                {applications.length === 0
                  ? 'Vous n\'avez pas encore postulé à des offres'
                  : 'Aucune candidature ne correspond à vos critères de recherche'}
              </p>
              <Button variant="primary" onClick={() => onNavigate('jobs')}>
                Découvrir les offres
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const statusConfig = STATUS_CONFIG[application.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={application.id} hover padding="md" className="cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3
                            className="text-lg font-semibold text-gray-900 hover:text-[#0E2F56] transition mb-2"
                            onClick={() => onNavigate('job-detail', application.job_id)}
                          >
                            {application.jobs.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            {application.jobs.companies && (
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <span>{application.jobs.companies.company_name}</span>
                              </div>
                            )}
                            {application.jobs.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{application.jobs.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Postulé le {new Date(application.applied_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant={statusConfig.variant}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {application.jobs.contract_type && (
                              <Badge variant="default">{application.jobs.contract_type}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('job-detail', application.job_id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir l'offre
                      </Button>
                      {application.cover_letter && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <FileText className="w-4 h-4" />
                          <span>Lettre de motivation jointe</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
