import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import {
  UserPlus,
  Building2,
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  X,
  Check,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader,
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: 'candidate' | 'recruiter';
  created_at: string;
}

interface AdminProfilesProps {
  onNavigate: (page: string) => void;
}

export default function AdminProfiles({ onNavigate }: AdminProfilesProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'candidate' | 'recruiter'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    user_type: 'candidate' as 'candidate' | 'recruiter',
    // Candidate specific
    location: '',
    desired_position: '',
    experience_years: '',
    // Recruiter specific
    company_name: '',
    company_size: '',
    industry: '',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, user_type, created_at')
        .in('user_type', ['candidate', 'recruiter'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Erreur chargement profils:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreatingProfile(true);
    try {
      // 1. Créer l'utilisateur Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            user_type: formData.user_type,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // 2. Mettre à jour le profil de base
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          user_type: formData.user_type,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // 3. Créer le profil spécifique
      if (formData.user_type === 'candidate') {
        const { error: candidateError } = await supabase
          .from('candidate_profiles')
          .insert({
            id: authData.user.id,
            location: formData.location || null,
            desired_position: formData.desired_position || null,
            experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          });

        if (candidateError) throw candidateError;
      } else {
        // Créer d'abord la company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.company_name,
            size: formData.company_size || null,
            industry: formData.industry || null,
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Puis le profil recruteur
        const { error: recruiterError } = await supabase
          .from('recruiter_profiles')
          .insert({
            id: authData.user.id,
            company_id: companyData.id,
            job_title: 'Recruteur',
          });

        if (recruiterError) throw recruiterError;
      }

      alert(`Profil ${formData.user_type === 'candidate' ? 'candidat' : 'recruteur'} créé avec succès!`);
      setShowCreateModal(false);
      resetForm();
      loadProfiles();
    } catch (error: any) {
      console.error('Erreur création profil:', error);
      alert('Erreur lors de la création: ' + error.message);
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) return;

    try {
      // Supprimer l'utilisateur via l'admin API
      const { error } = await supabase.auth.admin.deleteUser(profileId);
      if (error) throw error;

      alert('Profil supprimé avec succès!');
      loadProfiles();
    } catch (error: any) {
      console.error('Erreur suppression profil:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      user_type: 'candidate',
      location: '',
      desired_position: '',
      experience_years: '',
      company_name: '',
      company_size: '',
      industry: '',
    });
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || profile.user_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: profiles.length,
    candidates: profiles.filter((p) => p.user_type === 'candidate').length,
    recruiters: profiles.filter((p) => p.user_type === 'recruiter').length,
  };

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Profils</h1>
              <p className="text-gray-600 mt-2">Créer et gérer les profils candidats et recruteurs</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition"
            >
              <UserPlus className="w-5 h-5" />
              <span>Créer un profil</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Profils</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Candidats</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.candidates}</p>
              </div>
              <Briefcase className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recruteurs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.recruiters}</p>
              </div>
              <Building2 className="w-12 h-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === 'all'
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterType('candidate')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === 'candidate'
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Candidats
              </button>
              <button
                onClick={() => setFilterType('recruiter')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === 'recruiter'
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Recruteurs
              </button>
            </div>
          </div>
        </div>

        {/* Profiles List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun profil trouvé</h3>
            <p className="text-gray-600">Commencez par créer un nouveau profil</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Nom</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Téléphone</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Date création</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                          {profile.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{profile.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{profile.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{profile.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          profile.user_type === 'candidate'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {profile.user_type === 'candidate' ? 'Candidat' : 'Recruteur'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Profile Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Créer un nouveau profil</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Type de profil */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de profil *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, user_type: 'candidate' })}
                      className={`p-4 border-2 rounded-lg transition ${
                        formData.user_type === 'candidate'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Briefcase className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="font-medium text-gray-900">Candidat</p>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, user_type: 'recruiter' })}
                      className={`p-4 border-2 rounded-lg transition ${
                        formData.user_type === 'recruiter'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="font-medium text-gray-900">Recruteur</p>
                    </button>
                  </div>
                </div>

                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Mamadou Diallo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: mamadou@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Min. 6 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: +224 XXX XXX XXX"
                    />
                  </div>
                </div>

                {/* Champs spécifiques candidat */}
                {formData.user_type === 'candidate' && (
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-gray-900">Informations Candidat</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Localisation
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Conakry"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Poste souhaité
                        </label>
                        <input
                          type="text"
                          value={formData.desired_position}
                          onChange={(e) =>
                            setFormData({ ...formData, desired_position: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          onChange={(e) =>
                            setFormData({ ...formData, experience_years: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: 3"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Champs spécifiques recruteur */}
                {formData.user_type === 'recruiter' && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-gray-900">Informations Recruteur</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom de l'entreprise *
                        </label>
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) =>
                            setFormData({ ...formData, company_name: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: TechCorp"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Taille entreprise
                        </label>
                        <select
                          value={formData.company_size}
                          onChange={(e) =>
                            setFormData({ ...formData, company_size: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="1-10">1-10 employés</option>
                          <option value="11-50">11-50 employés</option>
                          <option value="51-200">51-200 employés</option>
                          <option value="201-500">201-500 employés</option>
                          <option value="500+">500+ employés</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secteur d'activité
                        </label>
                        <input
                          type="text"
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Technologies"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={creatingProfile}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={creatingProfile}
                  className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {creatingProfile ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Créer le profil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
