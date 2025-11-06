import { useState, useEffect } from 'react';
import { Briefcase, Calendar, MapPin, Building, Eye, FileText, Clock, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cv_url: string;
  cover_letter_url?: string;
  message?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  applied_at: string;
  jobs: {
    id: string;
    title: string;
    location: string;
    contract_type: string;
    companies: {
      name: string;
    };
  };
}

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const loadApplications = async () => {
    setLoading(true);

    let query = supabase
      .from('applications')
      .select(`
        *,
        jobs!inner(
          id,
          title,
          location,
          contract_type,
          companies(name)
        )
      `)
      .eq('candidate_id', user!.id)
      .order('applied_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading applications:', error);
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: Clock, text: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      reviewed: { icon: Eye, text: 'Examinée', className: 'bg-blue-100 text-blue-800' },
      shortlisted: { icon: UserCheck, text: 'Présélectionné', className: 'bg-green-100 text-green-800' },
      rejected: { icon: XCircle, text: 'Refusée', className: 'bg-red-100 text-red-800' },
      hired: { icon: CheckCircle, text: 'Embauché', className: 'bg-emerald-100 text-emerald-800' }
    };

    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  const getStatusMessage = (status: string) => {
    const messages = {
      pending: 'Votre candidature est en cours d\'examen par le recruteur.',
      reviewed: 'Le recruteur a examiné votre candidature. Vous serez contacté si votre profil correspond.',
      shortlisted: 'Félicitations! Vous avez été présélectionné. Le recruteur vous contactera bientôt.',
      rejected: 'Votre candidature n\'a pas été retenue pour ce poste. Continuez à postuler!',
      hired: 'Félicitations! Vous avez été retenu pour ce poste!'
    };

    return messages[status as keyof typeof messages];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Mes candidatures ({applications.length})
        </h2>

        <div className="flex gap-2">
          {['all', 'pending', 'reviewed', 'shortlisted', 'hired', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-blue-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'Toutes' :
               status === 'pending' ? 'En attente' :
               status === 'reviewed' ? 'Examinées' :
               status === 'shortlisted' ? 'Présélectionné' :
               status === 'rejected' ? 'Refusées' : 'Embauché'}
            </button>
          ))}
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune candidature
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? "Vous n'avez pas encore postulé à des offres d'emploi"
              : `Aucune candidature avec le statut "${filter}"`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {application.jobs.title}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {application.jobs.companies?.name || 'Entreprise'}
                      </p>
                    </div>
                  </div>
                </div>
                {getStatusBadge(application.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {application.jobs.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  {application.jobs.contract_type}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Postulé le {formatDate(application.applied_at)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  {getStatusMessage(application.status)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={application.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-900 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Mon CV
                </a>

                {application.cover_letter_url && (
                  <a
                    href={application.cover_letter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-900 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Ma lettre
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
