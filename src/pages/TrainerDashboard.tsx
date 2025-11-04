import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  DollarSign,
  Star,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { supabase, TrainerProfile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TrainerProfileForm from '../components/forms/TrainerProfileForm';
import FormationPublishForm from '../components/forms/FormationPublishForm';

interface TrainerDashboardProps {
  onNavigate: (page: string) => void;
}

interface Formation {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  status: string;
  thumbnail_url?: string;
  enrolled_count?: number;
  created_at: string;
}

interface Enrollment {
  id: string;
  formation_id: string;
  candidate_name: string;
  enrolled_at: string;
  progress: number;
  status: string;
}

export default function TrainerDashboard({ onNavigate }: TrainerDashboardProps) {
  const { user, profile } = useAuth();
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'formations' | 'students' | 'profile'>('overview');
  const [showFormationForm, setShowFormationForm] = useState(false);
  const [selectedFormationId, setSelectedFormationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user) {
      loadTrainerData();
    }
  }, [user]);

  const loadTrainerData = async () => {
    if (!user) return;

    try {
      const { data: trainerData } = await supabase
        .from('trainer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (trainerData) {
        setTrainerProfile(trainerData);
      }

      const { data: formationsData } = await supabase
        .from('formations')
        .select('*')
        .eq('trainer_id', trainerData?.id)
        .order('created_at', { ascending: false });

      setFormations(formationsData || []);

      const { data: enrollmentsData } = await supabase
        .from('formation_enrollments')
        .select(`
          id,
          formation_id,
          enrolled_at,
          progress,
          status,
          profiles:candidate_id (full_name)
        `)
        .in('formation_id', (formationsData || []).map(f => f.id));

      setEnrollments(enrollmentsData || []);
    } catch (error) {
      console.error('Error loading trainer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Formations Actives',
      value: formations.filter(f => f.status === 'published').length,
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      label: 'Étudiants Totaux',
      value: trainerProfile?.total_students || 0,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      label: 'Note Moyenne',
      value: trainerProfile?.rating ? `${trainerProfile.rating.toFixed(1)}/5` : 'N/A',
      icon: Star,
      color: 'bg-yellow-500'
    },
    {
      label: 'Revenus du Mois',
      value: '0 GNF',
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Espace Formateur</h1>
              <p className="text-gray-600 mt-1">Bienvenue, {profile?.full_name}</p>
            </div>
            {!trainerProfile?.is_verified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  Profil en attente de vérification
                </span>
              </div>
            )}
            {trainerProfile?.is_verified && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  Profil vérifié
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
                { id: 'formations', label: 'Mes Formations', icon: BookOpen },
                { id: 'students', label: 'Étudiants', icon: Users },
                { id: 'profile', label: 'Mon Profil', icon: GraduationCap }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-[#0E2F56] text-[#0E2F56]'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Activité Récente</h3>
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Aucune activité récente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enrollments.slice(0, 5).map((enrollment) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{enrollment.candidate_name}</p>
                              <p className="text-sm text-gray-600">
                                Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              Progression: {enrollment.progress}%
                            </div>
                            <div className="text-xs text-gray-500">{enrollment.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'formations' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Mes Formations</h3>
                  <button
                    onClick={() => {
                      setSelectedFormationId(undefined);
                      setShowFormationForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Créer une Formation
                  </button>
                </div>

                {formations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="mb-4">Aucune formation créée</p>
                    <button
                      onClick={() => {
                        setSelectedFormationId(undefined);
                        setShowFormationForm(true);
                      }}
                      className="px-6 py-3 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition"
                    >
                      Créer ma première formation
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formations.map((formation) => (
                      <div key={formation.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                        {formation.thumbnail_url && (
                          <img
                            src={formation.thumbnail_url}
                            alt={formation.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              formation.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {formation.status === 'published' ? 'Publié' : 'Brouillon'}
                            </span>
                            <span className="text-sm text-gray-600">{formation.category}</span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{formation.title}</h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{formation.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{formation.duration}</span>
                            <span className="font-bold text-[#0E2F56]">{formation.price.toLocaleString()} GNF</span>
                          </div>
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => {
                                setSelectedFormationId(formation.id);
                                setShowFormationForm(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                              Modifier
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                              <Eye className="w-4 h-4" />
                              Aperçu
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Mes Étudiants</h3>
                {enrollments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Aucun étudiant inscrit</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {enrollment.candidate_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{enrollment.candidate_name}</p>
                            <p className="text-sm text-gray-600">
                              Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{enrollment.progress}%</span>
                          </div>
                          <div className="text-xs text-gray-500">{enrollment.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                {trainerProfile ? (
                  <TrainerProfileForm
                    trainerProfile={trainerProfile}
                    onUpdate={loadTrainerData}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Chargement du profil...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showFormationForm && trainerProfile && (
          <FormationPublishForm
            trainerProfile={trainerProfile}
            formationId={selectedFormationId}
            onClose={() => {
              setShowFormationForm(false);
              setSelectedFormationId(undefined);
            }}
            onSuccess={loadTrainerData}
          />
        )}
      </div>
    </div>
  );
}
