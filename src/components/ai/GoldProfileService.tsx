import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePremiumEligibility } from '../../hooks/usePremiumEligibility';
import {
  Crown,
  Star,
  Video,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Award,
  CheckCircle,
  Loader,
  Plus,
  Clock,
  MessageCircle,
  BarChart3,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface CoachingSession {
  id: string;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  coach_feedback?: string;
  rating?: number;
}

interface VideoCV {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  thumbnail_url?: string;
  status: string;
  view_count: number;
  created_at: string;
}

interface VisibilityStats {
  first_page_appearances: number;
  total_appearances: number;
  profile_views: number;
  contact_reveals: number;
}

interface GoldProfileServiceProps {
  onNavigate?: (page: string) => void;
}

export default function GoldProfileService({ onNavigate }: GoldProfileServiceProps = {}) {
  const { user } = useAuth();
  const eligibility = usePremiumEligibility('gold_profile');
  const [loading, setLoading] = useState(true);
  const [isGoldMember, setIsGoldMember] = useState(false);
  const [goldExpiresAt, setGoldExpiresAt] = useState<string | null>(null);
  const [coachingSessions, setCoachingSessions] = useState<CoachingSession[]>([]);
  const [videoCVs, setVideoCVs] = useState<VideoCV[]>([]);
  const [visibilityStats, setVisibilityStats] = useState<VisibilityStats>({
    first_page_appearances: 0,
    total_appearances: 0,
    profile_views: 0,
    contact_reveals: 0,
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState('cv_review');

  useEffect(() => {
    loadGoldData();
  }, [user]);

  const loadGoldData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('is_gold_member, gold_member_expires_at')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setIsGoldMember(profile.is_gold_member);
        setGoldExpiresAt(profile.gold_member_expires_at);
      }

      if (profile?.is_gold_member) {
        await Promise.all([
          loadCoachingSessions(),
          loadVideoCVs(),
          loadVisibilityStats(),
        ]);
      }
    } catch (error) {
      console.error('Error loading gold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoachingSessions = async () => {
    const { data } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('scheduled_at', { ascending: false });

    if (data) setCoachingSessions(data);
  };

  const loadVideoCVs = async () => {
    const { data } = await supabase
      .from('video_cvs')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) setVideoCVs(data);
  };

  const loadVisibilityStats = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('profile_visibility_stats')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (data && data.length > 0) {
      const totals = data.reduce(
        (acc, stat) => ({
          first_page_appearances: acc.first_page_appearances + stat.first_page_appearances,
          total_appearances: acc.total_appearances + stat.total_appearances,
          profile_views: acc.profile_views + stat.profile_views,
          contact_reveals: acc.contact_reveals + stat.contact_reveals,
        }),
        { first_page_appearances: 0, total_appearances: 0, profile_views: 0, contact_reveals: 0 }
      );
      setVisibilityStats(totals);
    }
  };

  const bookCoachingSession = async (sessionType: string, scheduledDate: string) => {
    try {
      const { error } = await supabase
        .from('coaching_sessions')
        .insert({
          user_id: user!.id,
          session_type: sessionType,
          scheduled_at: scheduledDate,
          status: 'scheduled',
        });

      if (error) throw error;

      alert('Séance de coaching réservée avec succès !');
      setShowBookingModal(false);
      loadCoachingSessions();
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Erreur lors de la réservation');
    }
  };

  const sessionTypes = [
    { value: 'cv_review', label: 'Revue de CV', icon: '📄' },
    { value: 'interview_prep', label: 'Préparation entretien', icon: '🎯' },
    { value: 'career_planning', label: 'Planification carrière', icon: '📈' },
    { value: 'salary_negotiation', label: 'Négociation salariale', icon: '💰' },
    { value: 'general_coaching', label: 'Coaching général', icon: '💡' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Programmée',
      completed: 'Terminée',
      cancelled: 'Annulée',
      no_show: 'Absent',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (!isGoldMember) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Crown className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Profil Gold</h1>
                <p className="text-yellow-100 text-lg">
                  Le service premium ultime pour maximiser votre visibilité
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Avantages Exclusifs</h2>
                <div className="space-y-4">
                  {[
                    { icon: Star, text: 'Profil en première page des résultats de recherche' },
                    { icon: Users, text: '3 séances de coaching personnalisé avec nos experts' },
                    { icon: Video, text: 'Création de vidéo CV professionnelle' },
                    { icon: Award, text: 'Badge Gold visible sur votre profil' },
                    { icon: TrendingUp, text: 'Boost de visibilité x10' },
                    { icon: Eye, text: 'Statistiques détaillées de visibilité' },
                    { icon: MessageCircle, text: 'Support prioritaire cabinet JobGuinée' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-yellow-600" />
                      </div>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-yellow-400">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white font-bold mb-4">
                    <Sparkles className="w-5 h-5" />
                    Offre Premium
                  </div>
                  <div className="text-5xl font-bold text-gray-900 mb-2">500 000</div>
                  <div className="text-xl text-gray-600 mb-4">GNF / 3 mois</div>
                  <div className="text-sm text-gray-500">
                    Soit 166 667 GNF/mois
                  </div>
                </div>

                <button
                  onClick={() => alert('Paiement: Orange Money • LengoPay • DigitalPay SA\n\nVous serez contacté par notre équipe pour finaliser votre inscription Gold.')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-yellow-600 hover:to-orange-700 transition-all shadow-lg"
                >
                  <Crown className="w-6 h-6 inline-block mr-2" />
                  Devenir Membre Gold
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Paiement sécurisé via Orange Money, LengoPay ou DigitalPay SA
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Accompagnement personnalisé</h3>
                  <p className="text-blue-800">
                    En tant que membre Gold, vous bénéficiez d'un accompagnement complet de notre cabinet.
                    Notre équipe vous contactera pour planifier vos séances de coaching et la création de votre vidéo CV.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {onNavigate && (
        <button
          onClick={() => onNavigate('premium-ai')}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour aux Services IA</span>
        </button>
      )}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl shadow-xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Crown className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">Profil Gold</h1>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  Actif
                </span>
              </div>
              <p className="text-yellow-100">
                Votre abonnement expire le {goldExpiresAt ? new Date(goldExpiresAt).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={() => alert('Renouvellement automatique activé')}
            className="px-6 py-3 bg-white text-yellow-600 rounded-xl font-semibold hover:bg-yellow-50 transition-colors"
          >
            Renouveler
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Eye className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <p className="text-sm text-gray-600">Vues (30j)</p>
              <p className="text-3xl font-bold text-gray-900">{visibilityStats.profile_views}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8 text-yellow-600" />
            <div className="text-right">
              <p className="text-sm text-gray-600">1ère page</p>
              <p className="text-3xl font-bold text-gray-900">{visibilityStats.first_page_appearances}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-green-600" />
            <div className="text-right">
              <p className="text-sm text-gray-600">Contacts révélés</p>
              <p className="text-3xl font-bold text-gray-900">{visibilityStats.contact_reveals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div className="text-right">
              <p className="text-sm text-gray-600">Apparitions</p>
              <p className="text-3xl font-bold text-gray-900">{visibilityStats.total_appearances}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Séances de Coaching
            </h2>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Réserver
            </button>
          </div>

          {coachingSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune séance programmée</p>
              <p className="text-sm">Réservez votre première séance de coaching</p>
            </div>
          ) : (
            <div className="space-y-4">
              {coachingSessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      {sessionTypes.find(t => t.value === session.session_type)?.label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
                      {getStatusLabel(session.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(session.scheduled_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span>{session.duration_minutes} min</span>
                  </div>
                  {session.coach_feedback && (
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {session.coach_feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-orange-600" />
              Vidéo CV
            </h2>
            <button
              onClick={() => alert('Contactez notre équipe pour planifier la création de votre vidéo CV professionnelle.')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Créer
            </button>
          </div>

          {videoCVs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune vidéo CV</p>
              <p className="text-sm">Notre équipe vous aidera à créer votre vidéo CV professionnelle</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videoCVs.map((video) => (
                <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.view_count} vues
                    </span>
                    {video.video_url && (
                      <button className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-sm font-semibold hover:bg-orange-200">
                        Voir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Réserver une séance</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de séance
                </label>
                <select
                  value={selectedSessionType}
                  onChange={(e) => setSelectedSessionType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {sessionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => {
                    if (e.target.value) {
                      bookCoachingSession(selectedSessionType, new Date(e.target.value).toISOString());
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}