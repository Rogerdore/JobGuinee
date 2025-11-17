import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { calculateRecruiterCompletion, getCompletionStatus, getMissingRecruiterFields } from '../../utils/profileCompletion';
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link as LinkIcon,
  Calendar,
  Users,
  Award,
  Save,
  CheckCircle,
  Loader,
  Image as ImageIcon,
  X,
  AlertCircle
} from 'lucide-react';

interface RecruiterProfileFormProps {
  onProfileComplete?: () => void;
}

export default function RecruiterProfileForm({ onProfileComplete }: RecruiterProfileFormProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    full_name: '',
    job_title: '',
    bio: '',
    phone: '',
    linkedin_url: '',
    avatar_url: ''
  });

  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    industry: '',
    size: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    employee_count: '',
    founded_year: '',
    logo_url: '',
    culture_description: '',
    benefits: [] as string[],
    social_media: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });

  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    const percentage = calculateRecruiterCompletion(profileData, companyData);
    setCompletionPercentage(percentage);
  }, [profileData, companyData]);

  const loadData = async () => {
    if (!user) return;

    try {
      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          job_title: profile.job_title || '',
          bio: profile.bio || '',
          phone: profile.phone || '',
          linkedin_url: profile.linkedin_url || '',
          avatar_url: profile.avatar_url || ''
        });

        if (profile.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .maybeSingle();

          if (companyData) {
            setCompany(companyData);
            setCompanyData({
              name: companyData.name || '',
              description: companyData.description || '',
              industry: companyData.industry || '',
              size: companyData.size || '',
              location: companyData.location || '',
              address: companyData.address || '',
              phone: companyData.phone || '',
              email: companyData.email || '',
              website: companyData.website || '',
              employee_count: companyData.employee_count || '',
              founded_year: companyData.founded_year?.toString() || '',
              logo_url: companyData.logo_url || '',
              culture_description: companyData.culture_description || '',
              benefits: companyData.benefits || [],
              social_media: companyData.social_media || {
                facebook: '',
                twitter: '',
                linkedin: '',
                instagram: ''
              }
            });

            // Set logo preview if exists
            if (companyData.logo_url) {
              setLogoPreview(companyData.logo_url);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2MB');
      return;
    }

    try {
      setUploadingLogo(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Update company data state
      setCompanyData({ ...companyData, logo_url: publicUrl });

      setMessage({ type: 'success', text: 'Logo téléchargé avec succès!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement du logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setCompanyData({ ...companyData, logo_url: '' });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          job_title: profileData.job_title,
          bio: profileData.bio,
          phone: profileData.phone,
          linkedin_url: profileData.linkedin_url,
          avatar_url: profileData.avatar_url,
          profile_completed: true,
          profile_completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      let companyId = profile?.company_id;

      if (companyData.name) {
        if (company) {
          const { error: updateError } = await supabase
            .from('companies')
            .update({
              name: companyData.name,
              description: companyData.description,
              industry: companyData.industry,
              size: companyData.size,
              location: companyData.location,
              address: companyData.address,
              phone: companyData.phone,
              email: companyData.email,
              website: companyData.website,
              employee_count: companyData.employee_count,
              founded_year: companyData.founded_year ? parseInt(companyData.founded_year) : null,
              logo_url: companyData.logo_url,
              culture_description: companyData.culture_description,
              benefits: companyData.benefits,
              social_media: companyData.social_media
            })
            .eq('id', company.id);

          if (updateError) throw updateError;
        } else {
          const { data: newCompany, error: insertError } = await supabase
            .from('companies')
            .insert({
              profile_id: user.id,
              name: companyData.name,
              description: companyData.description,
              industry: companyData.industry,
              size: companyData.size,
              location: companyData.location,
              address: companyData.address,
              phone: companyData.phone,
              email: companyData.email,
              website: companyData.website,
              employee_count: companyData.employee_count,
              founded_year: companyData.founded_year ? parseInt(companyData.founded_year) : null,
              logo_url: companyData.logo_url,
              culture_description: companyData.culture_description,
              benefits: companyData.benefits,
              social_media: companyData.social_media
            })
            .select()
            .single();

          if (insertError) throw insertError;
          if (newCompany) {
            companyId = newCompany.id;
            setCompany(newCompany);

            await supabase
              .from('profiles')
              .update({ company_id: newCompany.id })
              .eq('id', user.id);
          }
        }
      }

      await refreshProfile();
      setMessage({ type: 'success', text: 'Profil enregistré avec succès!' });

      if (onProfileComplete) {
        setTimeout(() => {
          onProfileComplete();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !companyData.benefits.includes(newBenefit.trim())) {
      setCompanyData({
        ...companyData,
        benefits: [...companyData.benefits, newBenefit.trim()]
      });
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setCompanyData({
      ...companyData,
      benefits: companyData.benefits.filter(b => b !== benefit)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const completionStatus = getCompletionStatus(completionPercentage);
  const missingFields = getMissingRecruiterFields(profileData, companyData);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-[#0E2F56] rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Mon Profil Recruteur</h1>
        <p className="text-blue-100">Complétez votre profil pour maximiser votre visibilité auprès des candidats</p>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Complétion du profil</span>
            <span className="text-2xl font-bold">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionPercentage < 50 ? 'bg-red-500' :
                completionPercentage < 80 ? 'bg-orange-500' :
                completionPercentage < 100 ? 'bg-blue-400' :
                'bg-green-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-200 mt-2">{completionStatus.message}</p>
        </div>
      </div>

      {completionPercentage < 80 && missingFields.length > 0 && (
        <div className={`${completionStatus.bgColor} border ${completionStatus.borderColor} rounded-xl p-6`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-6 h-6 ${completionStatus.color} flex-shrink-0 mt-1`} />
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-2 ${completionStatus.color}`}>
                Champs requis pour atteindre 80% (nécessaire pour Premium)
              </h3>
              <ul className="space-y-1">
                {missingFields.map((field, index) => (
                  <li key={index} className={`text-sm ${completionStatus.color}`}>
                    • {field}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <X className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Informations Personnelles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet *
            </label>
            <input
              type="text"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              placeholder="Ex: Amadou Diallo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poste / Fonction *
            </label>
            <input
              type="text"
              value={profileData.job_title}
              onChange={(e) => setProfileData({ ...profileData, job_title: e.target.value })}
              placeholder="Ex: Responsable RH"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              placeholder="+224 XXX XX XX XX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn
            </label>
            <input
              type="url"
              value={profileData.linkedin_url}
              onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biographie professionnelle
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Décrivez votre parcours et votre rôle..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Informations Entreprise</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              value={companyData.name}
              onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
              placeholder="Ex: TechCorp Guinea"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de l'entreprise
            </label>
            <div className="space-y-3">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                <label
                  htmlFor="logo-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer ${
                    uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      {logoPreview ? 'Changer le logo' : 'Télécharger le logo'}
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 2MB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secteur d'activité *
            </label>
            <select
              value={companyData.industry}
              onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner...</option>
              <option value="Technologie">Technologie</option>
              <option value="Finance">Finance</option>
              <option value="Santé">Santé</option>
              <option value="Éducation">Éducation</option>
              <option value="Commerce">Commerce</option>
              <option value="Construction">Construction</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Tourisme">Tourisme</option>
              <option value="Industrie">Industrie</option>
              <option value="Services">Services</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taille de l'entreprise
            </label>
            <select
              value={companyData.size}
              onChange={(e) => setCompanyData({ ...companyData, size: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              <option value="1-10">1-10 employés</option>
              <option value="11-50">11-50 employés</option>
              <option value="51-200">51-200 employés</option>
              <option value="201-500">201-500 employés</option>
              <option value="500+">500+ employés</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre d'employés
            </label>
            <input
              type="text"
              value={companyData.employee_count}
              onChange={(e) => setCompanyData({ ...companyData, employee_count: e.target.value })}
              placeholder="Ex: 150"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville / Localisation
            </label>
            <input
              type="text"
              value={companyData.location}
              onChange={(e) => setCompanyData({ ...companyData, location: e.target.value })}
              placeholder="Ex: Conakry"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de création
            </label>
            <input
              type="number"
              value={companyData.founded_year}
              onChange={(e) => setCompanyData({ ...companyData, founded_year: e.target.value })}
              placeholder="Ex: 2010"
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse complète
            </label>
            <input
              type="text"
              value={companyData.address}
              onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
              placeholder="Ex: Quartier Kaloum, Rue KA-001, Conakry"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email entreprise
            </label>
            <input
              type="email"
              value={companyData.email}
              onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
              placeholder="contact@entreprise.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone entreprise
            </label>
            <input
              type="tel"
              value={companyData.phone}
              onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
              placeholder="+224 XXX XX XX XX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site web
            </label>
            <input
              type="url"
              value={companyData.website}
              onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
              placeholder="https://www.entreprise.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description de l'entreprise
            </label>
            <textarea
              value={companyData.description}
              onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
              placeholder="Décrivez votre entreprise, son activité, ses valeurs..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Culture d'entreprise
            </label>
            <textarea
              value={companyData.culture_description}
              onChange={(e) => setCompanyData({ ...companyData, culture_description: e.target.value })}
              placeholder="Décrivez l'environnement de travail, les valeurs, l'ambiance..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avantages employés
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                placeholder="Ex: Assurance santé"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {companyData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                >
                  {benefit}
                  <button
                    onClick={() => removeBenefit(benefit)}
                    className="hover:text-blue-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <Globe className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Réseaux Sociaux</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="url"
              value={companyData.social_media.facebook}
              onChange={(e) => setCompanyData({
                ...companyData,
                social_media: { ...companyData.social_media, facebook: e.target.value }
              })}
              placeholder="https://facebook.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter
            </label>
            <input
              type="url"
              value={companyData.social_media.twitter}
              onChange={(e) => setCompanyData({
                ...companyData,
                social_media: { ...companyData.social_media, twitter: e.target.value }
              })}
              placeholder="https://twitter.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn
            </label>
            <input
              type="url"
              value={companyData.social_media.linkedin}
              onChange={(e) => setCompanyData({
                ...companyData,
                social_media: { ...companyData.social_media, linkedin: e.target.value }
              })}
              placeholder="https://linkedin.com/company/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              type="url"
              value={companyData.social_media.instagram}
              onChange={(e) => setCompanyData({
                ...companyData,
                social_media: { ...companyData.social_media, instagram: e.target.value }
              })}
              placeholder="https://instagram.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveProfile}
          disabled={saving || !profileData.full_name || !profileData.job_title || !companyData.name || !companyData.industry}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-[#0E2F56] text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          {saving ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer le profil
            </>
          )}
        </button>
      </div>
    </div>
  );
}
