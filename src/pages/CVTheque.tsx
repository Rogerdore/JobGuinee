import { useEffect, useState } from 'react';
import { Users, Grid, List, ShoppingCart, TrendingUp, Sparkles, Filter as FilterIcon, ChevronLeft, ChevronRight, Circle, Hexagon, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SearchBar from '../components/cvtheque/SearchBar';
import AdvancedFilters, { FilterValues } from '../components/cvtheque/AdvancedFilters';
import AnonymizedCandidateCard from '../components/cvtheque/AnonymizedCandidateCard';
import ProfileCart from '../components/cvtheque/ProfileCart';
import { sampleProfiles } from '../utils/sampleProfiles';

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
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [purchasedProfiles, setPurchasedProfiles] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sessionId] = useState(() => `guest_${Date.now()}_${Math.random().toString(36)}`);
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 12;

  useEffect(() => {
    loadCandidates();
    loadCart();
    if (profile?.id) {
      loadPurchasedProfiles();
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

    let candidatesList = [];

    if (data && !error && data.length > 0) {
      candidatesList = data.map(candidate => ({
        ...candidate,
        ai_score: calculateAIScore(candidate),
        profile_price: calculateProfilePrice(candidate.experience_years || 0),
      }));
    } else {
      candidatesList = sampleProfiles.map((profile, index) => ({
        id: `sample_${index}`,
        profile_id: `sample_profile_${index}`,
        ...profile,
        ai_score: calculateAIScore(profile),
        profile_price: calculateProfilePrice(profile.experience_years || 0),
        profile: {
          full_name: `Profil ${index + 1}`,
          email: `sample${index}@demo.com`,
          avatar_url: null
        }
      }));
    }

    setCandidates(candidatesList);
    setFilteredCandidates(candidatesList);

    setLoading(false);
  };

  const loadCart = async () => {
    const { data } = await supabase
      .from('profile_cart')
      .select(`
        *,
        candidate:candidate_profiles!profile_cart_candidate_id_fkey(
          id,
          title,
          experience_years,
          location,
          profile_price
        )
      `)
      .or(profile?.id ? `user_id.eq.${profile.id}` : `session_id.eq.${sessionId}`);

    if (data) {
      setCartItems(data);
    }
  };

  const loadPurchasedProfiles = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('profile_purchases')
      .select('candidate_id')
      .eq('buyer_id', profile.id)
      .eq('payment_status', 'completed');

    if (data) {
      setPurchasedProfiles(data.map(p => p.candidate_id));
    }
  };

  const calculateProfilePrice = (experienceYears: number) => {
    if (experienceYears >= 6) return 15000;
    if (experienceYears >= 3) return 8000;
    return 4000;
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    applyFilters(query, filters);
  };

  const handleFilterApply = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
    applyFilters(searchQuery, newFilters);
    setShowFilters(false);
  };

  const handleFilterClear = () => {
    setFilters({});
    setCurrentPage(1);
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

  const handleAddToCart = async (candidateId: string) => {
    console.log('🛒 Adding to cart:', candidateId);
    const candidate = candidates.find(c => c.id === candidateId);
    console.log('Found candidate:', candidate);

    const { error } = await supabase.from('profile_cart').insert({
      user_id: profile?.id || null,
      session_id: profile?.id ? null : sessionId,
      candidate_id: candidateId,
    });

    console.log('Insert result - error:', error);

    if (!error) {
      await loadCart();
      const profileName = candidate?.title || 'Profil';
      alert(`✅ ${profileName} a été ajouté au panier avec succès!\n\nCliquez sur l'icône panier en haut à droite pour finaliser votre achat.`);
    } else {
      console.error('Error adding to cart:', error);
      alert(`❌ Erreur lors de l'ajout au panier: ${error.message}\n\nVeuillez réessayer.`);
    }
  };

  const handleRemoveFromCart = async (itemId: string) => {
    await supabase.from('profile_cart').delete().eq('id', itemId);
    await loadCart();
  };

  const handleCheckout = () => {
    if (!profile?.id) {
      alert('Veuillez vous connecter pour finaliser votre achat');
      onNavigate('login');
      return;
    }

    alert('🚧 Paiement en cours de développement\n\nMoyens de paiement acceptés:\n- Orange Money\n- LengoPay\n- DigitalPay SA\n- Visa/Mastercard');
  };

  const handleViewDetails = (candidateId: string) => {
    console.log('👁️ Viewing details for:', candidateId);
    const candidate = candidates.find(c => c.id === candidateId);
    const isPurchased = purchasedProfiles.includes(candidateId);

    console.log('Found candidate:', candidate);
    console.log('Is purchased:', isPurchased);

    if (!candidate) {
      console.error('Candidate not found');
      alert('❌ Erreur: Profil introuvable');
      return;
    }

    if (isPurchased) {
      const fullInfo = `🎉 PROFIL COMPLET - ${candidate.profile?.full_name || 'Candidat'}

📋 Poste: ${candidate.title || 'N/A'}
📍 Localisation: ${candidate.location || 'N/A'}
💼 Expérience: ${candidate.experience_years || 0} ans
🎓 Formation: ${candidate.education_level || 'N/A'}

📧 Email: ${candidate.profile?.email || 'N/A'}
📱 Téléphone: [Disponible après achat]

🔧 Compétences principales:
${candidate.skills?.slice(0, 5).map(s => `• ${s}`).join('\n') || 'N/A'}

${candidate.bio ? `📝 Bio:\n${candidate.bio}\n` : ''}
💾 Téléchargez le CV complet depuis votre espace recruteur.`;
      alert(fullInfo);
    } else {
      const preview = `👁️ APERÇU DU PROFIL

📋 Poste: ${candidate.title || 'Professionnel qualifié'}
📍 Région: ${candidate.location?.split(',')[0] || 'Confidentielle'}
💼 Expérience: ${candidate.experience_years || 0} ans
🎓 Niveau: ${candidate.education_level || 'N/A'}

🔧 Compétences (aperçu):
${candidate.skills?.slice(0, 3).map(s => `• ${s}`).join('\n') || 'N/A'}

🔒 INFORMATIONS COMPLÈTES DISPONIBLES APRÈS ACHAT:
• Nom complet et coordonnées
• CV téléchargeable
• Certifications
• Portfolio / références
• Historique complet

💰 Prix: ${new Intl.NumberFormat('fr-GN').format(candidate.profile_price || 0)} GNF

➡️ Ajoutez ce profil au panier pour déverrouiller toutes les informations!`;
      alert(preview);
    }
  };

  const cartItemIds = cartItems.map(item => item.candidate_id);

  const getStats = () => {
    const junior = filteredCandidates.filter(c => (c.experience_years || 0) < 3).length;
    const intermediate = filteredCandidates.filter(c => {
      const exp = c.experience_years || 0;
      return exp >= 3 && exp < 6;
    }).length;
    const senior = filteredCandidates.filter(c => (c.experience_years || 0) >= 6).length;

    return { junior, intermediate, senior };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <ProfileCart
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                CVThèque - Base de Talents
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-900" />
                Parcourez les profils et sélectionnez ceux qui vous intéressent
              </p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-lg transition flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Panier</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{candidates.length}</div>
              <div className="text-sm text-gray-600">Profils disponibles</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-6 text-center hover:shadow-lg transition-all">
              <div className="flex items-center justify-center mb-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                  <Circle className="w-7 h-7 text-white fill-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-900 mb-1">{stats.junior}</div>
              <div className="text-sm text-orange-700 font-semibold mb-2">Profils Junior</div>
              <div className="text-xs text-orange-600 font-medium bg-orange-200/50 px-3 py-1 rounded-full inline-block">4.000 GNF</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 p-6 text-center hover:shadow-lg transition-all">
              <div className="flex items-center justify-center mb-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                  <Hexagon className="w-7 h-7 text-white fill-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">{stats.intermediate}</div>
              <div className="text-sm text-green-700 font-semibold mb-2">Profils Intermédiaires</div>
              <div className="text-xs text-green-600 font-medium bg-green-200/50 px-3 py-1 rounded-full inline-block">8.000 GNF</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-6 text-center hover:shadow-lg transition-all">
              <div className="flex items-center justify-center mb-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <Star className="w-7 h-7 text-white fill-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">{stats.senior}</div>
              <div className="text-sm text-blue-700 font-semibold mb-2">Profils Senior</div>
              <div className="text-xs text-blue-600 font-medium bg-blue-200/50 px-3 py-1 rounded-full inline-block">15.000 GNF</div>
            </div>
          </div>

          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full md:hidden mb-4 px-4 py-3 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            <FilterIcon className="w-5 h-5" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <div className={showFilters ? 'block' : 'hidden md:block'}>
            <AdvancedFilters onApply={handleFilterApply} onClear={handleFilterClear} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filteredCandidates.length}</span> profil(s) trouvé(s)
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
        ) : filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun profil trouvé</h3>
            <p className="text-gray-600">
              Essayez d'ajuster vos critères de recherche ou vos filtres
            </p>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {filteredCandidates
                .slice((currentPage - 1) * profilesPerPage, currentPage * profilesPerPage)
                .map((candidate) => (
                  <AnonymizedCandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    score={candidate.ai_score}
                    isInCart={cartItemIds.includes(candidate.id)}
                    isPurchased={purchasedProfiles.includes(candidate.id)}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                  />
                ))}
            </div>

            {filteredCandidates.length > profilesPerPage && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.ceil(filteredCandidates.length / profilesPerPage) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-10 h-10 rounded-lg font-medium transition ${
                        currentPage === page
                          ? 'bg-blue-900 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setCurrentPage(Math.min(Math.ceil(filteredCandidates.length / profilesPerPage), currentPage + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === Math.ceil(filteredCandidates.length / profilesPerPage)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-12 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Comment ça marche ?</h2>
              <p className="text-blue-100">
                Accédez aux informations complètes des profils qui vous intéressent
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-3xl mb-3">1️⃣</div>
              <h3 className="font-bold text-lg mb-2">Parcourez les profils</h3>
              <p className="text-blue-100 text-sm">
                Utilisez les filtres et la recherche IA pour trouver les candidats qui correspondent à vos besoins
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-3xl mb-3">2️⃣</div>
              <h3 className="font-bold text-lg mb-2">Ajoutez au panier</h3>
              <p className="text-blue-100 text-sm">
                Sélectionnez les profils qui vous intéressent et ajoutez-les à votre panier
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-3xl mb-3">3️⃣</div>
              <h3 className="font-bold text-lg mb-2">Payez et accédez</h3>
              <p className="text-blue-100 text-sm">
                Finalisez votre achat et accédez aux coordonnées complètes, CV et certifications
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
