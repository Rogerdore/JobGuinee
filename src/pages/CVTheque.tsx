import { useEffect, useState } from 'react';
import { Users, Grid, List, ShoppingCart, TrendingUp, Sparkles, Filter as FilterIcon, ChevronLeft, ChevronRight, Circle, Hexagon, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/notifications/ToastContainer';
import SearchBar from '../components/cvtheque/SearchBar';
import AdvancedFilters, { FilterValues } from '../components/cvtheque/AdvancedFilters';
import AnonymizedCandidateCard from '../components/cvtheque/AnonymizedCandidateCard';
import ProfileCart from '../components/cvtheque/ProfileCart';
import CandidateProfileModal from '../components/cvtheque/CandidateProfileModal';
import CandidatePreviewModal from '../components/cvtheque/CandidatePreviewModal';
import RecruiterAccessModal from '../components/cvtheque/RecruiterAccessModal';
import CVThequePacksModal from '../components/cvtheque/CVThequePacksModal';
import { sampleProfiles } from '../utils/sampleProfiles';

interface CVThequeProps {
  onNavigate: (page: string) => void;
}

export default function CVTheque({ onNavigate }: CVThequeProps) {
  const { profile, user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
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
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showRecruiterAccessModal, setShowRecruiterAccessModal] = useState(false);
  const [showPacksModal, setShowPacksModal] = useState(false);
  const [activePacks, setActivePacks] = useState<any[]>([]);
  const [unitPrice, setUnitPrice] = useState<number | null>(null);

  useEffect(() => {
    loadCandidates();
    loadCart();
    if (profile?.id) {
      loadPurchasedProfiles();
      loadActivePacks();
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
      .order('is_gold', { ascending: false })
      .order('is_verified', { ascending: false })
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
    if (!profile?.id || profile.user_type !== 'recruiter') {
      setCartItems([]);
      return;
    }

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
      .eq('user_id', profile.id);

    if (data) {
      const itemsWithPrice = data.map(item => ({
        ...item,
        candidate: {
          ...item.candidate,
          profile_price: item.candidate.profile_price || calculateProfilePrice(item.candidate.experience_years || 0)
        }
      }));
      setCartItems(itemsWithPrice);
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

  const loadActivePacks = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('cvtheque_pack_purchases')
      .select('*')
      .eq('buyer_id', profile.id)
      .eq('purchase_status', 'active')
      .gt('profiles_remaining', 0)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      setActivePacks(data);

      // Calculer le prix unitaire du pack le plus ancien (FIFO)
      const oldestPack = data[0];
      const calculatedUnitPrice = Math.round(oldestPack.price_paid / oldestPack.total_profiles);
      setUnitPrice(calculatedUnitPrice);
    } else {
      setActivePacks([]);
      setUnitPrice(null);
    }
  };

  const calculateProfilePrice = (experienceYears: number) => {
    // Si le recruteur a un pack actif, utiliser le prix unitaire du pack
    if (unitPrice !== null) {
      return unitPrice;
    }

    // Sinon, utiliser les prix standards
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
    console.log('🛒 Adding to cart:', {
      candidateId,
      profileId: profile?.id,
      sessionId,
      willUseUserId: !!profile?.id
    });

    if (!profile?.id || profile.user_type !== 'recruiter') {
      setShowRecruiterAccessModal(true);
      return;
    }

    const candidate = candidates.find(c => c.id === candidateId);
    console.log('Found candidate:', candidate);

    const insertData = {
      user_id: profile.id,
      session_id: null,
      candidate_id: candidateId,
    };

    console.log('Inserting data:', insertData);

    const { data, error } = await supabase
      .from('profile_cart')
      .insert(insertData)
      .select();

    console.log('Insert result:', { data, error });

    if (!error) {
      await loadCart();
      const profileName = candidate?.title || 'Profil';
      showSuccess(
        `${profileName} ajouté au panier`,
        'Cliquez sur l\'icône panier en haut à droite pour finaliser votre achat.'
      );
    } else {
      console.error('Error adding to cart:', error);
      showError(
        'Erreur lors de l\'ajout au panier',
        error.message
      );
    }
  };

  const handleRemoveFromCart = async (itemId: string) => {
    await supabase.from('profile_cart').delete().eq('id', itemId);
    await loadCart();
  };

  const handleCheckout = async () => {
    if (!profile?.id) {
      showInfo(
        'Connexion requise',
        'Veuillez vous connecter pour finaliser votre achat'
      );
      onNavigate('login');
      return;
    }

    if (cartItems.length === 0) {
      showInfo(
        'Panier vide',
        'Ajoutez des profils à votre panier avant de procéder au paiement'
      );
      return;
    }

    // Filtrer les profils compatibles avec les packs actifs
    const getExperienceLevel = (years: number): 'junior' | 'intermediate' | 'senior' => {
      if (years >= 6) return 'senior';
      if (years >= 3) return 'intermediate';
      return 'junior';
    };

    const hasCompatiblePack = (experienceYears: number): boolean => {
      if (activePacks.length === 0) return false;

      const profileLevel = getExperienceLevel(experienceYears);

      const specificPack = activePacks.find(
        p => p.experience_level === profileLevel && p.profiles_remaining > 0
      );

      if (specificPack) return true;

      const mixedPack = activePacks.find(
        p => !p.experience_level && p.profiles_remaining > 0
      );

      return !!mixedPack;
    };

    const validCandidateIds = cartItems
      .filter(item => hasCompatiblePack(item.candidate.experience_years || 0))
      .map(item => item.candidate_id);

    // Si des packs actifs existent et qu'il y a des profils valides
    if (activePacks.length > 0 && validCandidateIds.length > 0) {
      setCartOpen(false);

      try {
        showInfo('Validation en cours...', 'Veuillez patienter');

        // Appeler la fonction automatique de consommation des packs
        const { data, error } = await supabase.rpc('consume_pack_credits', {
          p_recruiter_id: profile.id,
          p_candidate_ids: validCandidateIds
        });

        if (error) {
          console.error('Erreur lors de la consommation des packs:', error);
          showError('Erreur', 'Impossible de valider les achats. Veuillez réessayer.');
          return;
        }

        const result = data as {
          success: boolean;
          success_count: number;
          failed_count: number;
          failed_profiles: Array<{ candidate_id: string; reason: string }>;
        };

        if (result.success && result.success_count > 0) {
          // Vider le panier après succès
          const deletePromises = cartItems
            .filter(item => validCandidateIds.includes(item.candidate_id))
            .map(item =>
              supabase.from('profile_cart').delete().eq('id', item.id)
            );

          await Promise.all(deletePromises);

          await loadCart();
          await loadPurchasedProfiles();
          await loadActivePacks();

          showSuccess(
            `${result.success_count} profil${result.success_count > 1 ? 's' : ''} validé${result.success_count > 1 ? 's' : ''} automatiquement!`,
            'Les profils sont maintenant accessibles dans votre CVThèque.'
          );

          if (result.failed_count > 0) {
            showInfo(
              `${result.failed_count} profil${result.failed_count > 1 ? 's' : ''} non validé${result.failed_count > 1 ? 's' : ''}`,
              'Certains profils n\'ont pas pu être validés.'
            );
          }
        } else {
          showError(
            'Échec de validation',
            'Aucun profil n\'a pu être validé. Vérifiez vos packs actifs.'
          );
        }

      } catch (err) {
        console.error('Erreur lors du checkout:', err);
        showError('Erreur', 'Une erreur est survenue lors de la validation.');
      }
    } else if (activePacks.length === 0 || validCandidateIds.length === 0) {
      // Pas de packs actifs ou pas de profils valides → ouvrir le modal d'achat de packs
      setCartOpen(false);
      setShowPacksModal(true);
    }
  };

  const handleViewDetails = async (candidateId: string) => {
    console.log('👁️ Viewing details for:', candidateId);

    const isPurchased = purchasedProfiles.includes(candidateId);

    if (!isPurchased) {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) {
        showError('Profil introuvable', 'Impossible de trouver ce profil.');
        return;
      }

      setPreviewCandidate(candidate);
      setShowPreviewModal(true);
      return;
    }

    if (!profile?.id || profile.user_type !== 'recruiter') {
      setShowRecruiterAccessModal(true);
      return;
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('profile_purchases')
      .select('payment_status, payment_verified_by_admin')
      .eq('buyer_id', profile.id)
      .eq('candidate_id', candidateId)
      .maybeSingle();

    if (purchaseError) {
      console.error('Error checking purchase:', purchaseError);
      showError('Erreur de vérification', 'Impossible de vérifier l\'achat du profil.');
      return;
    }

    if (!purchase) {
      showError('Accès refusé', 'Vous n\'avez pas acheté ce profil.');
      return;
    }

    if (purchase.payment_status !== 'completed') {
      showInfo(
        'Paiement en attente',
        `Votre paiement n'a pas encore été confirmé. Statut: ${purchase.payment_status || 'En attente'}`
      );
      return;
    }

    if (!purchase.payment_verified_by_admin) {
      showInfo(
        'Validation en attente',
        'Votre paiement a été reçu mais est en cours de validation par notre équipe. Vous recevrez une notification dès que l\'accès sera activé.'
      );
      return;
    }

    const { data: fullCandidate, error: candidateError } = await supabase
      .from('candidate_profiles')
      .select(`
        *,
        profile:profiles!candidate_profiles_profile_id_fkey(
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('id', candidateId)
      .maybeSingle();

    if (candidateError || !fullCandidate) {
      console.error('Error loading candidate:', candidateError);
      showError('Erreur de chargement', 'Impossible de charger le profil complet.');
      return;
    }

    setSelectedCandidate(fullCandidate);
    setIsModalOpen(true);
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
        activePacks={activePacks}
      />

      {selectedCandidate && (
        <CandidateProfileModal
          candidate={selectedCandidate}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCandidate(null);
          }}
        />
      )}

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
            {profile?.user_type === 'recruiter' && (
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
            )}
          </div>

          {activePacks.length > 0 && profile?.user_type === 'recruiter' && (
            <div className="mb-6 space-y-3">
              <div className="text-sm font-semibold text-gray-700 px-1">Vos Packs Actifs</div>
              {activePacks.map((pack) => {
                const unitPrice = Math.round(pack.price_paid / pack.total_profiles);
                const levelLabels: Record<string, string> = {
                  junior: 'Junior',
                  intermediate: 'Intermédiaire',
                  senior: 'Senior'
                };
                const levelColors: Record<string, string> = {
                  junior: 'from-orange-50 to-orange-100 border-orange-300',
                  intermediate: 'from-green-50 to-green-100 border-green-300',
                  senior: 'from-blue-50 to-blue-100 border-blue-300'
                };
                const iconColors: Record<string, string> = {
                  junior: 'bg-orange-500',
                  intermediate: 'bg-green-500',
                  senior: 'bg-blue-500'
                };
                const textColors: Record<string, string> = {
                  junior: 'text-orange-900',
                  intermediate: 'text-green-900',
                  senior: 'text-blue-900'
                };

                const level = pack.experience_level || 'mixed';
                const gradient = levelColors[level] || 'from-gray-50 to-gray-100 border-gray-300';
                const iconColor = iconColors[level] || 'bg-gray-500';
                const textColor = textColors[level] || 'text-gray-900';
                const label = levelLabels[level] || 'Mixte';

                return (
                  <div key={pack.id} className={`bg-gradient-to-r ${gradient} border-2 rounded-xl p-4 shadow-md`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center shadow-md`}>
                          <Circle className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div>
                          <div className={`font-bold ${textColor} text-base`}>{pack.pack_name}</div>
                          <div className={`text-xs ${textColor} opacity-75`}>
                            {label} • {unitPrice.toLocaleString('fr-GN')} GNF/profil
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${textColor}`}>{pack.profiles_remaining}</div>
                        <div className={`text-xs ${textColor} opacity-75 font-medium`}>crédits</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-2 text-center">
              <div className="text-lg font-bold text-gray-900">{candidates.length}</div>
              <div className="text-xs text-gray-600">Profils disponibles</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-3 text-center hover:shadow-lg transition-all">
              <div className="flex items-center justify-center mb-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                  <Circle className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
              <div className="text-lg font-bold text-orange-900">{stats.junior}</div>
              <div className="text-xs text-orange-700 font-semibold mb-1">Profils Junior</div>
              {profile?.user_type === 'recruiter' && (
                <div className="text-xs text-orange-600 font-medium bg-orange-200/50 px-2 py-0.5 rounded-full inline-block">
                  {unitPrice ? `${unitPrice.toLocaleString('fr-GN')} GNF` : '4.000 GNF'}
                </div>
              )}
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 p-3 text-center hover:shadow-lg transition-all">
              <div className="flex items-center justify-center mb-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                  <Hexagon className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
              <div className="text-lg font-bold text-green-900">{stats.intermediate}</div>
              <div className="text-xs text-green-700 font-semibold mb-1">Profils Intermédiaires</div>
              {profile?.user_type === 'recruiter' && (
                <div className="text-xs text-green-600 font-medium bg-green-200/50 px-2 py-0.5 rounded-full inline-block">
                  {unitPrice ? `${unitPrice.toLocaleString('fr-GN')} GNF` : '8.000 GNF'}
                </div>
              )}
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-3 text-center hover:shadow-lg transition-all">
              <div className="flex items-center justify-center mb-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
              <div className="text-lg font-bold text-blue-900">{stats.senior}</div>
              <div className="text-xs text-blue-700 font-semibold mb-1">Profils Senior</div>
              {profile?.user_type === 'recruiter' && (
                <div className="text-xs text-blue-600 font-medium bg-blue-200/50 px-2 py-0.5 rounded-full inline-block">
                  {unitPrice ? `${unitPrice.toLocaleString('fr-GN')} GNF` : '15.000 GNF'}
                </div>
              )}
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
                    viewerUserType={profile?.user_type}
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

      {/* Modal de prévisualisation du profil */}
      {previewCandidate && (
        <CandidatePreviewModal
          candidate={previewCandidate}
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewCandidate(null);
          }}
          onAddToCart={() => {
            handleAddToCart(previewCandidate.id);
            setShowPreviewModal(false);
            setPreviewCandidate(null);
          }}
          isInCart={cartItems.some(item => item.candidate_id === previewCandidate.id)}
          viewerUserType={profile?.user_type}
        />
      )}

      {/* Modal d'accès refusé */}
      <RecruiterAccessModal
        isOpen={showRecruiterAccessModal}
        onClose={() => setShowRecruiterAccessModal(false)}
        onRedirect={() => {
          setShowRecruiterAccessModal(false);
          onNavigate('login');
        }}
      />

      {/* Modal des packs CVThèque */}
      {showPacksModal && profile?.id && (
        <CVThequePacksModal
          userId={profile.id}
          userEmail={user?.email || ''}
          onClose={() => setShowPacksModal(false)}
          onSuccess={() => {
            setShowPacksModal(false);
            loadCart();
            loadPurchasedProfiles();
            showSuccess(
              'Pack acheté avec succès',
              'Votre achat sera activé après validation du paiement'
            );
          }}
        />
      )}
    </div>
  );
}
