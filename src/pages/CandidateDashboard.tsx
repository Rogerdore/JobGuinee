import { useEffect, useState } from 'react';
import { Briefcase, FileText, Bell, Settings, Upload, MapPin, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Application, Job, Company, CandidateProfile } from '../lib/supabase';

interface CandidateDashboardProps {
  onNavigate: (page: string, jobId?: string) => void;
}

export default function CandidateDashboard({ onNavigate }: CandidateDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'profile' | 'alerts'>('applications');
  const [applications, setApplications] = useState<(Application & { jobs: Job & { companies: Company } })[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    skills: [] as string[],
    experience_years: 0,
    education_level: '',
    location: '',
    availability: 'immediate',
    desired_position: '',
    desired_salary_min: '',
    desired_salary_max: '',
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);

    const [appsData, profileData] = await Promise.all([
      supabase
        .from('applications')
        .select('*, jobs(*, companies(*))')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle(),
    ]);

    if (appsData.data) setApplications(appsData.data as any);
    if (profileData.data) {
      setCandidateProfile(profileData.data);
      setFormData({
        skills: profileData.data.skills || [],
        experience_years: profileData.data.experience_years || 0,
        education_level: profileData.data.education_level || '',
        location: profileData.data.location || '',
        availability: profileData.data.availability || 'immediate',
        desired_position: profileData.data.desired_position || '',
        desired_salary_min: profileData.data.desired_salary_min?.toString() || '',
        desired_salary_max: profileData.data.desired_salary_max?.toString() || '',
      });
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;

    const dataToSave = {
      user_id: profile.id,
      skills: formData.skills,
      experience_years: Number(formData.experience_years),
      education_level: formData.education_level,
      location: formData.location,
      availability: formData.availability,
      desired_position: formData.desired_position,
      desired_salary_min: formData.desired_salary_min ? Number(formData.desired_salary_min) : null,
      desired_salary_max: formData.desired_salary_max ? Number(formData.desired_salary_max) : null,
    };

    if (candidateProfile) {
      await supabase
        .from('candidate_profiles')
        .update(dataToSave)
        .eq('user_id', profile.id);
    } else {
      await supabase.from('candidate_profiles').insert(dataToSave);
    }

    loadData();
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      reviewed: 'Examinée',
      shortlisted: 'Présélectionné',
      rejected: 'Refusée',
      accepted: 'Acceptée',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon espace candidat</h1>
          <p className="text-gray-600">Bienvenue {profile?.full_name}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'applications'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Mes candidatures ({applications.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Mon profil</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'alerts'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>Alertes emploi</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'applications' && (
              <div>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Vous n'avez pas encore postulé à des offres</p>
                    <button
                      onClick={() => onNavigate('jobs')}
                      className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
                    >
                      Découvrir les offres
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3
                              className="font-bold text-lg text-gray-900 mb-2 hover:text-blue-900 cursor-pointer"
                              onClick={() => onNavigate('job-detail', app.job_id)}
                            >
                              {app.jobs?.title}
                            </h3>
                            <p className="text-gray-600 mb-2">{app.jobs?.companies?.company_name}</p>
                            {app.jobs?.location && (
                              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{app.jobs.location}</span>
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </div>

                        {app.ai_match_score && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Score de compatibilité</span>
                              <span className="font-semibold text-blue-900">{app.ai_match_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-900 h-2 rounded-full transition-all"
                                style={{ width: `${app.ai_match_score}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          Postulé le {new Date(app.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poste recherché
                    </label>
                    <input
                      type="text"
                      value={formData.desired_position}
                      onChange={(e) => setFormData({ ...formData, desired_position: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Développeur Web"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Années d'expérience
                    </label>
                    <input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau d'études
                    </label>
                    <select
                      value={formData.education_level}
                      onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="Bac">Bac</option>
                      <option value="Bac+2">Bac+2</option>
                      <option value="Licence">Licence (Bac+3)</option>
                      <option value="Master">Master (Bac+5)</option>
                      <option value="Doctorat">Doctorat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Conakry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salaire minimum souhaité (GNF)
                    </label>
                    <input
                      type="number"
                      value={formData.desired_salary_min}
                      onChange={(e) => setFormData({ ...formData, desired_salary_min: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 5000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salaire maximum souhaité (GNF)
                    </label>
                    <input
                      type="number"
                      value={formData.desired_salary_max}
                      onChange={(e) => setFormData({ ...formData, desired_salary_max: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 8000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compétences
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ajouter une compétence"
                    />
                    <button
                      onClick={addSkill}
                      className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
                    >
                      Ajouter
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center space-x-2"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition shadow-lg"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Configurez des alertes pour recevoir les nouvelles offres par email
                </p>
                <p className="text-sm text-gray-500">Fonctionnalité bientôt disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
