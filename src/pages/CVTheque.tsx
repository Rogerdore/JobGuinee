import { useEffect, useState } from 'react';
import { Users, Grid, List, Star, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SearchBar from '../components/cvtheque/SearchBar';
import AdvancedFilters, { FilterValues } from '../components/cvtheque/AdvancedFilters';
import CandidateCard from '../components/cvtheque/CandidateCard';

interface CVThequeProps {
  onNavigate: (page: string) => void;
}

export default function CVTheque({ onNavigate }: CVThequeProps) {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterValues>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    loadCandidates();
    if (profile?.user_type === 'recruiter') {
      loadFavorites();
    }
  }, [profile]);

  const loadCandidates = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('candidate_profiles')
      .select(`
        *,
        profile:profiles!candidate_profiles_profile_id_fkey(
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('visibility', 'public')
      .order('last_active_at', { ascending: false });

    if (data && !error) {
      const candidatesWithScores = data.map(candidate => ({
        ...candidate,
        ai_score: calculateAIScore(candidate),
      }));
      setCandidates(candidatesWithScores);
      setFilteredCandidates(candidatesWithScores);
    }

    setLoading(false);
  };

  const loadFavorites = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('favorite_candidates')
      .select('candidate_id')
      .eq('recruiter_id', profile.id);

    if (data) {
      setFavorites(data.map(f => f.candidate_id));
    }
  };

  const calculateAIScore = (candidate: any) => {
    let score = 60;

    if (candidate.experience_years) {
      score += Math.min(candidate.experience_years * 2, 20);
    }

    if (candidate.education_level) {
      const educationBonus: Record<string, number> = {
        'Doctorat': 20,
        'Master': 15,
        'Licence': 10,
        'BTS/DUT': 5,
      };
      score += educationBonus[candidate.education_level] || 0;
    }

    if (candidate.skills && candidate.skills.length > 0) {
      score += Math.min(candidate.skills.length, 10);
    }

    if (candidate.is_verified) {
      score += 10;
    }

    return Math.min(score, 100);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await saveSearch(query);
    applyFilters(query, filters);
  };

  const saveSearch = async (query: string) => {
    if (!profile?.id || !query) return;

    await supabase.from('talent_searches').insert({
      recruiter_id: profile.id,
      search_query: query,
      filters: filters,
      results_count: filteredCandidates.length,
    });
  };

  const handleFilterApply = (newFilters: FilterValues) => {
    setFilters(newFilters);
    applyFilters(searchQuery, newFilters);
  };

  const handleFilterClear = () => {
    setFilters({});
    setFilteredCandidates(candidates);
  };

  const applyFilters = (query: string, filterValues: FilterValues) => {
    let results = [...candidates];

    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(candidate => {
        const searchText = `
          ${candidate.title || ''}
          ${candidate.bio || ''}
          ${candidate.location || ''}
          ${candidate.skills?.join(' ') || ''}
          ${candidate.education_level || ''}
          ${candidate.profile?.full_name || ''}
        `.toLowerCase();
        return searchText.includes(queryLower);
      });
    }

    if (filterValues.location) {
      results = results.filter(c => c.location?.includes(filterValues.location));
    }

    if (filterValues.education_level) {
      results = results.filter(c => c.education_level === filterValues.education_level);
    }

    if (filterValues.experience_min !== undefined) {
      results = results.filter(c => (c.experience_years || 0) >= filterValues.experience_min!);
    }

    if (filterValues.experience_max !== undefined) {
      results = results.filter(c => (c.experience_years || 0) <= filterValues.experience_max!);
    }

    if (filterValues.mobility) {
      results = results.filter(c => c.mobility === filterValues.mobility);
    }

    if (filterValues.verified_only) {
      results = results.filter(c => c.is_verified);
    }

    if (filterValues.min_score) {
      results = results.filter(c => c.ai_score >= filterValues.min_score!);
    }

    results.sort((a, b) => b.ai_score - a.ai_score);

    setFilteredCandidates(results);
  };

  const handleToggleFavorite = async (candidateId: string) => {
    if (!profile?.id) return;

    if (favorites.includes(candidateId)) {
      await supabase
        .from('favorite_candidates')
        .delete()
        .eq('recruiter_id', profile.id)
        .eq('candidate_id', candidateId);

      setFavorites(favorites.filter(id => id !== candidateId));
    } else {
      await supabase.from('favorite_candidates').insert({
        recruiter_id: profile.id,
        candidate_id: candidateId,
      });

      setFavorites([...favorites, candidateId]);
    }
  };

  const handleContact = async (candidateId: string) => {
    if (!profile?.id) return;
    alert('Fonctionnalité de messagerie disponible prochainement !');
  };

  const handleDownload = async (candidateId: string) => {
    if (!profile?.id) return;

    await supabase.from('cv_downloads').insert({
      recruiter_id: profile.id,
      candidate_id: candidateId,
    });

    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate?.cv_url) {
      window.open(candidate.cv_url, '_blank');
    } else {
      alert('CV non disponible pour ce candidat');
    }
  };

  const handleViewDetails = (candidateId: string) => {
    alert('Vue détaillée du profil disponible prochainement !');
  };

  const displayedCandidates = activeTab === 'favorites'
    ? filteredCandidates.filter(c => favorites.includes(c.id))
    : filteredCandidates;

  if (profile?.user_type !== 'recruiter') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès réservé aux recruteurs</h2>
          <p className="text-gray-600 mb-6">
            La CVThèque est accessible uniquement aux entreprises et recruteurs inscrits.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                CVThèque - Base de Talents
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-900" />
                Recherche intelligente propulsée par l'IA
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-3xl font-bold text-blue-900">{candidates.length}</div>
              <div className="text-sm text-gray-600">Profils disponibles</div>
            </div>
          </div>

          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        <div className="mb-6">
          <AdvancedFilters onApply={handleFilterApply} onClear={handleFilterClear} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 font-medium rounded-lg transition ${
                  activeTab === 'all'
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Tous ({filteredCandidates.length})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 font-medium rounded-lg transition ${
                  activeTab === 'favorites'
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Star className="w-4 h-4 inline mr-2" />
                Favoris ({favorites.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900 mb-4"></div>
            <p className="text-gray-600">Chargement des profils...</p>
          </div>
        ) : displayedCandidates.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun profil trouvé</h3>
            <p className="text-gray-600">
              Essayez d'ajuster vos critères de recherche ou vos filtres
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          }`}>
            {displayedCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                score={candidate.ai_score}
                isFavorite={favorites.includes(candidate.id)}
                onContact={handleContact}
                onDownload={handleDownload}
                onToggleFavorite={handleToggleFavorite}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        <div className="mt-12 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Passez en Premium</h2>
              <p className="text-blue-100">
                Accédez à tous les profils vérifiés, téléchargements illimités et analyses IA avancées
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold mb-1">800K</div>
              <div className="text-blue-100 text-sm">GNF / mois</div>
              <div className="text-white font-medium mt-2">Formule Pro</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold mb-1">1,5M</div>
              <div className="text-blue-100 text-sm">GNF / mois</div>
              <div className="text-white font-medium mt-2">Formule Corporate</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold mb-1">2M</div>
              <div className="text-blue-100 text-sm">GNF / mois</div>
              <div className="text-white font-medium mt-2">Formule Premium+</div>
            </div>
          </div>
          <button className="mt-6 px-8 py-3 bg-white text-blue-900 font-bold rounded-lg hover:bg-blue-50 transition shadow-lg">
            Découvrir les offres Premium
          </button>
        </div>
      </div>
    </div>
  );
}
