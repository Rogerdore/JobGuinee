import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { calculateRecruiterCompletion, getCompletionStatus, getMissingRecruiterFields } from '../../utils/profileCompletion';
import { validateAllRecruiterFields } from '../../utils/validationHelpers';
import SuccessModal from '../notifications/SuccessModal';
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
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    professional_email: '',
    job_title: '',
    bio: '',
    phone: '',
    linkedin_url: '',
    avatar_url: '',
    profile_visibility: 'public'
  });

  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    industry: '',
    company_type: '',
    origin_country: '',
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

  const [recruitmentRole, setRecruitmentRole] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          professional_email: profile.professional_email || '',
          job_title: profile.job_title || '',
          bio: profile.bio || '',
          phone: profile.phone || '',
          linkedin_url: profile.linkedin_url || '',
          avatar_url: profile.avatar_url || '',
          profile_visibility: profile.profile_visibility || 'public'
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
              company_type: companyData.company_type || '',
              origin_country: companyData.origin_country || '',
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
          }
        }

        const { data: recruiterData } = await supabase
          .from('recruiter_profiles')
          .select('recruitment_role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (recruiterData) {
          setRecruitmentRole(recruiterData.recruitment_role || '');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Format non supporté',
        message: 'Veuillez utiliser un fichier JPG, PNG, GIF ou WebP.'
      });
      return;
    }

    if (file.size > maxSize) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Fichier trop volumineux',
        message: 'La taille maximale autorisée est de 5MB.'
      });
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      if (companyData.logo_url) {
        const oldPath = companyData.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('company-logos')
            .remove([oldPath]);
        }
      }

      const { error: uploadError, data } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setCompanyData({ ...companyData, logo_url: publicUrl });

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Logo uploadé',
        message: 'Le logo de votre entreprise a été uploadé avec succès!'
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Erreur d\'upload',
        message: 'Une erreur est survenue lors de l\'upload du logo.'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const validation = validateAllRecruiterFields(profileData, companyData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Erreurs de validation',
        message: 'Veuillez corriger les erreurs dans le formulaire avant de continuer.'
      });
      return;
    }

    setValidationErrors({});
    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          professional_email: profileData.professional_email,
          job_title: profileData.job_title,
          bio: profileData.bio,
          phone: profileData.phone,
          linkedin_url: profileData.linkedin_url,
          avatar_url: profileData.avatar_url,
          profile_visibility: profileData.profile_visibility,
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
              company_type: companyData.company_type,
              origin_country: companyData.origin_country,
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
              company_type: companyData.company_type,
              origin_country: companyData.origin_country,
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

      const { data: existingRecruiterProfile } = await supabase
        .from('recruiter_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRecruiterProfile) {
        await supabase
          .from('recruiter_profiles')
          .update({
            recruitment_role: recruitmentRole,
            job_title: profileData.job_title,
            bio: profileData.bio,
            linkedin_url: profileData.linkedin_url,
            company_id: companyId
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('recruiter_profiles')
          .insert({
            user_id: user.id,
            profile_id: user.id,
            recruitment_role: recruitmentRole,
            job_title: profileData.job_title,
            bio: profileData.bio,
            linkedin_url: profileData.linkedin_url,
            company_id: companyId
          });
      }

      await refreshProfile();

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Profil enregistré avec succès!',
        message: 'Votre profil recruteur a été mis à jour et sauvegardé avec succès.'
      });

      if (onProfileComplete) {
        setTimeout(() => {
          onProfileComplete();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Erreur d\'enregistrement',
        message: error.message || 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.'
      });
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


      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Informations Personnelles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={profileData.first_name}
              onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
              placeholder="Ex: Amadou"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom
            </label>
            <input
              type="text"
              value={profileData.last_name}
              onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
              placeholder="Ex: Diallo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
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
            <p className="mt-1 text-xs text-gray-500">
              Si vous remplissez le prénom et nom séparément, le nom complet sera automatiquement créé
            </p>
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
              Rôle dans le recrutement
            </label>
            <select
              value={recruitmentRole}
              onChange={(e) => setRecruitmentRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              <option value="RH interne">RH interne</option>
              <option value="Cabinet de recrutement">Cabinet de recrutement</option>
              <option value="Consultant RH">Consultant RH</option>
              <option value="Chasseur de têtes">Chasseur de têtes</option>
              <option value="Responsable recrutement">Responsable recrutement</option>
              <option value="Autre">Autre</option>
            </select>
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                validationErrors.phone
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {validationErrors.phone && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email professionnel
            </label>
            <input
              type="email"
              value={profileData.professional_email}
              onChange={(e) => setProfileData({ ...profileData, professional_email: e.target.value })}
              placeholder="votre.email@entreprise.com"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                validationErrors.professional_email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {validationErrors.professional_email ? (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.professional_email}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Email distinct de votre email de connexion (optionnel)
              </p>
            )}
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                validationErrors.linkedin_url
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {validationErrors.linkedin_url && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.linkedin_url}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibilité du profil
            </label>
            <select
              value={profileData.profile_visibility}
              onChange={(e) => setProfileData({ ...profileData, profile_visibility: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public (visible pour les candidats)</option>
              <option value="private">Privé (interne uniquement)</option>
            </select>
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de l'entreprise
            </label>
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      uploadingLogo
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-blue-300 hover:border-blue-500 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Upload en cours...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Cliquez pour uploader le logo
                        </span>
                      </>
                    )}
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Formats acceptés: JPG, PNG, GIF, WebP (max 5MB)
                </p>
              </div>

              {companyData.logo_url && (
                <div className="relative group">
                  <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={companyData.logo_url}
                      alt="Logo entreprise"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompanyData({ ...companyData, logo_url: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    title="Supprimer le logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'entreprise
            </label>
            <select
              value={companyData.company_type}
              onChange={(e) => setCompanyData({ ...companyData, company_type: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              <option value="Privée">Entreprise privée</option>
              <option value="Publique">Entreprise publique</option>
              <option value="ONG">ONG / Association</option>
              <option value="Startup">Startup</option>
              <option value="Cabinet de recrutement">Cabinet de recrutement</option>
              <option value="Multinationale">Multinationale</option>
              <option value="PME">PME</option>
              <option value="Grande entreprise">Grande entreprise</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays d'origine
            </label>
            <input
              type="text"
              value={companyData.origin_country}
              onChange={(e) => setCompanyData({ ...companyData, origin_country: e.target.value })}
              placeholder="Ex: Guinée, France, etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                validationErrors.company_email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {validationErrors.company_email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.company_email}
              </p>
            )}
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                validationErrors.company_phone
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {validationErrors.company_phone && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.company_phone}
              </p>
            )}
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                validationErrors.website
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {validationErrors.website && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.website}
              </p>
            )}
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

      <SuccessModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        autoClose={modalConfig.type === 'success'}
        autoCloseDelay={3000}
      />
    </div>
  );
}
