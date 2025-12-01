import { useEffect, useState } from 'react';
import {
  Briefcase,
  Eye,
  FileText,
  Award,
  TrendingUp,
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Search,
  Bell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Application, Job, Company, CandidateProfile } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Spinner } from '../components/ui';
import { calculateCandidateCompletion, getMissingCandidateFields } from '../utils/profileCompletion';

interface CandidateDashboardProps {
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

export default function CandidateDashboard({ onNavigate }: CandidateDashboardProps) {
  const { profile, user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState<(Job & { companies: Company })[]>([]);

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [appsData, profileData, jobsData] = await Promise.all([
        supabase
          .from('applications')
          .select('*, jobs(*, companies(*))')
          .eq('candidate_id', profile.id)
          .order('applied_at', { ascending: false })
          .limit(5),
        supabase
          .from('candidate_profiles')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle(),
        supabase
          .from('jobs')
          .select('*, companies(*)')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      if (appsData.data) setApplications(appsData.data as any);
      if (profileData.data) setCandidateProfile(profileData.data);
      if (jobsData.data) setRecentJobs(jobsData.data as any);
    } catch (error) {
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getProfileCompletionScore = () => {
    if (!candidateProfile) return 0;
    return calculateCandidateCompletion(candidateProfile, profile);
  };

  const getStats = () => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      active: applications.filter((a) =>
        ['reviewed', 'shortlisted', 'interview'].includes(a.status)
      ).length,
      accepted: applications.filter((a) => a.status === 'accepted').length,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = getStats();
  const profileScore = getProfileCompletionScore();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour {profile?.full_name || 'Candidat'} 👋
          </h1>
          <p className="text-gray-600">Bienvenue sur votre tableau de bord candidat</p>
        </div>

        {profileScore < 80 && (
          <Card padding="md" className="mb-8 border-l-4 border-orange-500">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Complétez votre profil ({profileScore}%)
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Un profil complet augmente vos chances d'être contacté par les recruteurs
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('candidate-profile-form')}
                >
                  Compléter mon profil
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Candidatures</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Briefcase className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En cours</p>
                <p className="text-3xl font-bold text-orange-600">{stats.active}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-600" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Acceptées</p>
                <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Mes Candidatures Récentes</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('mes-candidatures')}
                  >
                    Voir tout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune candidature
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Commencez par postuler à des offres qui vous intéressent
                    </p>
                    <Button variant="primary" onClick={() => onNavigate('jobs')}>
                      Découvrir les offres
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => {
                      const statusConfig = STATUS_CONFIG[application.status];
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div
                          key={application.id}
                          className="p-4 border-2 border-gray-100 rounded-xl hover:border-[#0E2F56] transition cursor-pointer"
                          onClick={() => onNavigate('job-detail', application.job_id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {application.jobs.title}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
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
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={statusConfig.variant}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(application.applied_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Mon Profil</CardTitle>
                <CardDescription>
                  Complété à {profileScore}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all"
                        style={{ width: `${profileScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${profile?.full_name ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={profile?.full_name ? 'text-gray-900' : 'text-gray-500'}>
                        Nom complet (10%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${profile?.phone ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={profile?.phone ? 'text-gray-900' : 'text-gray-500'}>
                        Téléphone (10%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${candidateProfile?.title ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={candidateProfile?.title ? 'text-gray-900' : 'text-gray-500'}>
                        Titre professionnel (15%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${candidateProfile?.bio ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={candidateProfile?.bio ? 'text-gray-900' : 'text-gray-500'}>
                        Présentation (15%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${candidateProfile?.location ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={candidateProfile?.location ? 'text-gray-900' : 'text-gray-500'}>
                        Localisation (10%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${candidateProfile?.experience_years !== undefined && candidateProfile.experience_years >= 0 ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={candidateProfile?.experience_years !== undefined && candidateProfile.experience_years >= 0 ? 'text-gray-900' : 'text-gray-500'}>
                        Expérience (10%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${candidateProfile?.skills?.length ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={candidateProfile?.skills?.length ? 'text-gray-900' : 'text-gray-500'}>
                        Compétences (10%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${candidateProfile?.languages?.length ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={candidateProfile?.languages?.length ? 'text-gray-900' : 'text-gray-500'}>
                        Langues (5%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${candidateProfile?.cv_url ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={candidateProfile?.cv_url ? 'text-gray-900' : 'text-gray-500'}>
                        CV téléchargé (10%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-5 h-5 ${candidateProfile?.education && Array.isArray(candidateProfile.education) && candidateProfile.education.length > 0 ? 'text-green-600' : 'text-gray-300'}`} />
                      <span className={candidateProfile?.education && Array.isArray(candidateProfile.education) && candidateProfile.education.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                        Formation (5%)
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => onNavigate('candidate-profile-form')}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier mon profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Offres Recommandées</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('jobs')}>
                Voir toutes les offres
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune offre disponible pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border-2 border-gray-100 rounded-xl hover:border-[#0E2F56] transition cursor-pointer"
                    onClick={() => onNavigate('job-detail', job.id)}
                  >
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {job.title}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600 mb-3">
                      {job.companies && (
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span className="line-clamp-1">{job.companies.company_name}</span>
                        </div>
                      )}
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {job.contract_type && (
                        <Badge variant="info">{job.contract_type}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
