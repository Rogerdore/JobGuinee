import { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  DollarSign,
  Search,
  Filter,
  MapPin,
  Monitor,
  Users,
  CheckCircle,
  Star,
  TrendingUp,
  Target,
  FileText,
  Briefcase,
  Linkedin,
  Calendar,
  Globe,
  BadgeCheck,
  AlertCircle,
  ChevronDown,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sampleFormations, formationCategories } from '../utils/sampleFormationsData';
import FormationDetailsModal from '../components/formations/FormationDetailsModal';
import EnrollmentModal from '../components/formations/EnrollmentModal';
import CoachingBookingModal from '../components/formations/CoachingBookingModal';
import TrainerApplicationModal from '../components/formations/TrainerApplicationModal';

interface Formation {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  price: number;
  category: string;
  thumbnail_url?: string;
  status: string;
  created_at: string;
}

interface FormationsProps {
  onNavigate: (page: string) => void;
}

const categories = [
  { name: 'RH & Management', icon: Users, color: 'bg-blue-100 text-blue-700' },
  { name: 'Digital', icon: Monitor, color: 'bg-purple-100 text-purple-700' },
  { name: 'Finance', icon: DollarSign, color: 'bg-green-100 text-green-700' },
  { name: 'Leadership', icon: Target, color: 'bg-orange-100 text-orange-700' },
  { name: 'Informatique', icon: Globe, color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Marketing', icon: TrendingUp, color: 'bg-pink-100 text-pink-700' },
];

const coachingServices = [
  {
    title: 'CV & Lettre de motivation',
    description: 'Création et optimisation professionnelle de votre CV et lettre',
    duration: '1h',
    price: 150000,
    icon: FileText,
  },
  {
    title: 'Préparation à l\'entretien',
    description: 'Simulations d\'entretien et conseils RH personnalisés',
    duration: '2h',
    price: 200000,
    icon: Users,
  },
  {
    title: 'Coaching LinkedIn / e-Réputation',
    description: 'Optimisation complète de votre profil professionnel',
    duration: '1h',
    price: 150000,
    icon: Linkedin,
  },
  {
    title: 'Coaching carrière complet',
    description: 'Orientation, reconversion et plan de carrière sur mesure',
    duration: '3 séances',
    price: 300000,
    icon: Briefcase,
  },
];

export default function Formations({ onNavigate }: FormationsProps) {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    const { data } = await supabase
      .from('formations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setFormations(data);
    } else {
      setFormations(sampleFormations as any);
    }
    setLoading(false);
  };

  const filteredFormations = formations.filter((formation) => {
    const matchesSearch =
      !searchQuery ||
      formation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formation.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formation.instructor?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || formation.category === selectedCategory;

    const matchesPrice =
      priceFilter === 'all' ||
      (priceFilter === 'free' && formation.price === 0) ||
      (priceFilter === 'paid' && formation.price > 0);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative bg-gradient-to-br from-[#0E2F56] via-blue-900 to-blue-800 text-white py-20"
        style={{
          backgroundImage:
            'url("https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=1920")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
        }}
      >
        <div className="absolute inset-0 bg-[#0E2F56] opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Formations & Coaching Carrière</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Développez vos compétences et boostez votre employabilité avec nos programmes de formation certifiants
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Rechercher une formation, un domaine, un formateur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition"
                >
                  <Filter className="w-5 h-5" />
                  Filtres
                </button>
              </div>

              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarif
                    </label>
                    <select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="all">Tous les tarifs</option>
                      <option value="free">Gratuit</option>
                      <option value="paid">Payant</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 bg-gradient-to-r from-[#FF8C00] to-[#e67e00] rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Vous êtes un organisme de formation ou de conseil ?</h3>
              <p className="text-white text-opacity-90">
                Publiez vos formations et prestations de conseil pour atteindre des milliers de professionnels en Guinée
              </p>
            </div>
            <button
              onClick={() => setShowTrainerModal(true)}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-[#FF8C00] font-semibold rounded-xl transition shadow-lg hover:shadow-xl inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Award className="w-5 h-5" />
              Publier une formation
            </button>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Explorer par Domaine</h2>
          <p className="text-gray-600 mb-8">Trouvez rapidement les formations qui correspondent à vos objectifs</p>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition hover:shadow-md ${
                    selectedCategory === category.name
                      ? 'border-[#0E2F56] bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-[#0E2F56]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md ${category.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
              Réinitialiser le filtre
            </button>
          )}
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Formations Disponibles</h2>
              <p className="text-gray-600">
                {filteredFormations.length} formation{filteredFormations.length > 1 ? 's' : ''} trouvée{filteredFormations.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#0E2F56]"></div>
              <p className="mt-4 text-gray-600">Chargement des formations...</p>
            </div>
          ) : filteredFormations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold">Aucune formation trouvée</p>
              <p className="text-gray-400 mt-2">Essayez de modifier vos critères de recherche</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceFilter('all');
                }}
                className="mt-4 px-6 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFormations.map((formation, index) => (
                <div
                  key={formation.id}
                  className="bg-white rounded-xl border-2 border-gray-200 card-hover overflow-hidden group animate-slide-up relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute top-4 right-4 z-10">
                    {formation.rating && (
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-gray-900">{formation.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="relative h-48 overflow-hidden">
                    {formation.image ? (
                      <img
                        src={formation.image}
                        alt={formation.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0E2F56] to-blue-700 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    {formation.category && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-white bg-opacity-95 text-[#0E2F56] text-xs font-bold rounded-full">
                          {formation.category}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2">
                      {formation.title}
                    </h3>

                    {formation.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {formation.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {formation.instructor && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Award className="w-4 h-4 text-[#FF8C00]" />
                          <span className="font-medium">{formation.instructor}</span>
                        </div>
                      )}

                      {formation.duration && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-[#FF8C00]" />
                          <span>{formation.duration}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                          <span className="text-2xl font-bold text-[#0E2F56]">
                            {formation.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600">GNF</span>
                        </div>
                        {formation.price > 0 && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <BadgeCheck className="w-4 h-4 text-green-600" />
                            <span>Certifiante</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedFormation(formation);
                          setShowDetailsModal(true);
                        }}
                        className="flex-1 py-2.5 border-2 border-[#0E2F56] text-[#0E2F56] font-semibold rounded-lg hover:bg-blue-50 transition"
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFormation(formation);
                          setShowEnrollmentModal(true);
                        }}
                        className="flex-1 py-2.5 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition"
                      >
                        S'inscrire
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-16 bg-gradient-to-br from-[#0E2F56] to-blue-800 rounded-2xl p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Coaching Carrière Personnalisé</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Bénéficiez d'un accompagnement sur mesure pour réussir votre carrière professionnelle en Guinée
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {coachingServices.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.title}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition border border-white border-opacity-20"
                >
                  <div className="w-12 h-12 bg-[#FF8C00] rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                  <p className="text-sm text-blue-100 mb-4">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-sm text-blue-100">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration}</span>
                    </div>
                    <div className="text-lg font-bold">{service.price.toLocaleString()} GNF</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowCoachingModal(true)}
              className="px-10 py-4 bg-white hover:bg-gray-50 text-[#0E2F56] font-semibold text-lg rounded-lg transition shadow-md inline-flex items-center gap-2 border-2 border-white"
            >
              <Calendar className="w-5 h-5" />
              Réserver une session de coaching
            </button>
            <p className="text-sm text-blue-100 mt-4">
              Paiement sécurisé : Orange Money • LengoPay • DigitalPay SA
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Devenez Formateur sur JobGuinée</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Partagez votre expertise et formez la prochaine génération de talents guinéens
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#0E2F56]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Publiez vos formations</h3>
              <p className="text-gray-600 text-sm">Créez et gérez facilement vos offres de formation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#FF8C00]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Touchez des milliers d'apprenants</h3>
              <p className="text-gray-600 text-sm">Accédez à notre communauté de professionnels</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Générez des revenus</h3>
              <p className="text-gray-600 text-sm">Monétisez votre savoir-faire et expertise</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowTrainerModal(true)}
              className="px-8 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white font-semibold rounded-lg transition inline-flex items-center gap-2"
            >
              <Award className="w-5 h-5" />
              Publier ma première formation
            </button>
          </div>
        </section>
      </div>

      {showDetailsModal && selectedFormation && (
        <FormationDetailsModal
          formation={selectedFormation}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedFormation(null);
          }}
          onEnroll={(formation) => {
            setShowDetailsModal(false);
            setSelectedFormation(formation);
            setShowEnrollmentModal(true);
          }}
        />
      )}

      {showEnrollmentModal && selectedFormation && (
        <EnrollmentModal
          formation={selectedFormation}
          onClose={() => {
            setShowEnrollmentModal(false);
            setSelectedFormation(null);
          }}
          onSuccess={() => {
            loadFormations();
          }}
        />
      )}

      {showCoachingModal && (
        <CoachingBookingModal
          onClose={() => setShowCoachingModal(false)}
          onSuccess={() => {}}
        />
      )}

      {showTrainerModal && (
        <TrainerApplicationModal
          onClose={() => setShowTrainerModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
