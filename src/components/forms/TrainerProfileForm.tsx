import { useState, useEffect } from 'react';
import { Save, User, Building2, GraduationCap } from 'lucide-react';
import { supabase, TrainerProfile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TrainerProfileFormProps {
  trainerProfile: TrainerProfile | null;
  onUpdate: () => void;
}

export default function TrainerProfileForm({ trainerProfile, onUpdate }: TrainerProfileFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [organizationType, setOrganizationType] = useState<'individual' | 'company' | 'institute'>(
    trainerProfile?.organization_type || 'individual'
  );

  const [individualData, setIndividualData] = useState({
    bio: trainerProfile?.bio || '',
    experience_years: trainerProfile?.experience_years || 0,
    individual_phone: (trainerProfile as any)?.individual_phone || '',
    individual_address: (trainerProfile as any)?.individual_address || '',
    individual_skills: (trainerProfile as any)?.individual_skills || [],
    specializations: trainerProfile?.specializations || [],
    website: trainerProfile?.website || '',
    linkedin_url: trainerProfile?.linkedin_url || '',
    hourly_rate: trainerProfile?.hourly_rate || 0
  });

  const [companyData, setCompanyData] = useState({
    company_name: (trainerProfile as any)?.company_name || '',
    company_registration_number: (trainerProfile as any)?.company_registration_number || '',
    company_contact_person: (trainerProfile as any)?.company_contact_person || '',
    company_contact_position: (trainerProfile as any)?.company_contact_position || '',
    company_email: (trainerProfile as any)?.company_email || '',
    company_phone: (trainerProfile as any)?.company_phone || '',
    company_address: (trainerProfile as any)?.company_address || '',
    company_city: (trainerProfile as any)?.company_city || '',
    company_country: (trainerProfile as any)?.company_country || 'Guinée',
    company_sector: (trainerProfile as any)?.company_sector || '',
    company_size: (trainerProfile as any)?.company_size || '',
    company_description: (trainerProfile as any)?.company_description || '',
    bio: trainerProfile?.bio || '',
    website: trainerProfile?.website || '',
    specializations: trainerProfile?.specializations || []
  });

  const [instituteData, setInstituteData] = useState({
    institute_name: (trainerProfile as any)?.institute_name || '',
    institute_registration_number: (trainerProfile as any)?.institute_registration_number || '',
    institute_contact_person: (trainerProfile as any)?.institute_contact_person || '',
    institute_contact_position: (trainerProfile as any)?.institute_contact_position || '',
    institute_email: (trainerProfile as any)?.institute_email || '',
    institute_phone: (trainerProfile as any)?.institute_phone || '',
    institute_address: (trainerProfile as any)?.institute_address || '',
    institute_city: (trainerProfile as any)?.institute_city || '',
    institute_country: (trainerProfile as any)?.institute_country || 'Guinée',
    institute_type: (trainerProfile as any)?.institute_type || '',
    institute_description: (trainerProfile as any)?.institute_description || '',
    bio: trainerProfile?.bio || '',
    website: trainerProfile?.website || '',
    specializations: trainerProfile?.specializations || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let updateData: any = {
        organization_type: organizationType,
        updated_at: new Date().toISOString()
      };

      if (organizationType === 'individual') {
        updateData = {
          ...updateData,
          ...individualData,
          individual_skills: individualData.individual_skills,
          specializations: individualData.specializations,
          organization_name: profile?.full_name || ''
        };
      } else if (organizationType === 'company') {
        updateData = {
          ...updateData,
          ...companyData,
          specializations: companyData.specializations,
          organization_name: companyData.company_name
        };
      } else if (organizationType === 'institute') {
        updateData = {
          ...updateData,
          ...instituteData,
          specializations: instituteData.specializations,
          organization_name: instituteData.institute_name
        };
      }

      const { error } = await supabase
        .from('trainer_profiles')
        .update(updateData)
        .eq('id', trainerProfile?.id);

      if (error) throw error;

      setMessage('Profil mis à jour avec succès!');
      setTimeout(() => {
        setMessage('');
        onUpdate();
      }, 2000);
    } catch (error: any) {
      setMessage('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsChange = (value: string) => {
    const skills = value.split(',').map(s => s.trim()).filter(s => s);
    setIndividualData({ ...individualData, individual_skills: skills });
  };

  const handleSpecializationsChange = (value: string, type: 'individual' | 'company' | 'institute') => {
    const specs = value.split(',').map(s => s.trim()).filter(s => s);
    if (type === 'individual') {
      setIndividualData({ ...individualData, specializations: specs });
    } else if (type === 'company') {
      setCompanyData({ ...companyData, specializations: specs });
    } else {
      setInstituteData({ ...instituteData, specializations: specs });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Erreur') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type d'Organisation
        </label>
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setOrganizationType('individual')}
            className={`p-4 rounded-lg border-2 transition ${
              organizationType === 'individual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-semibold">Indépendant</div>
          </button>
          <button
            type="button"
            onClick={() => setOrganizationType('company')}
            className={`p-4 rounded-lg border-2 transition ${
              organizationType === 'company'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-semibold">Entreprise</div>
          </button>
          <button
            type="button"
            onClick={() => setOrganizationType('institute')}
            className={`p-4 rounded-lg border-2 transition ${
              organizationType === 'institute'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-semibold">Institut</div>
          </button>
        </div>
      </div>

      {organizationType === 'individual' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Informations Personnelles</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom Complet
              </label>
              <input
                type="text"
                value={profile?.full_name || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                value={individualData.individual_phone}
                onChange={(e) => setIndividualData({ ...individualData, individual_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={individualData.individual_address}
              onChange={(e) => setIndividualData({ ...individualData, individual_address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Années d'Expérience *
            </label>
            <input
              type="number"
              value={individualData.experience_years}
              onChange={(e) => setIndividualData({ ...individualData, experience_years: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biographie *
            </label>
            <textarea
              value={individualData.bio}
              onChange={(e) => setIndividualData({ ...individualData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Parlez de votre parcours et de votre expertise..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compétences et Expertises
            </label>
            <input
              type="text"
              value={individualData.individual_skills.join(', ')}
              onChange={(e) => handleSkillsChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Formation professionnelle, Coaching, Consulting"
            />
            <p className="text-xs text-gray-500 mt-1">Séparez les compétences par des virgules</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domaines de Spécialisation
            </label>
            <input
              type="text"
              value={individualData.specializations.join(', ')}
              onChange={(e) => handleSpecializationsChange(e.target.value, 'individual')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Développement Web, Marketing Digital, Management"
            />
            <p className="text-xs text-gray-500 mt-1">Séparez les domaines par des virgules</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Web
              </label>
              <input
                type="url"
                value={individualData.website}
                onChange={(e) => setIndividualData({ ...individualData, website: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://votresite.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn
              </label>
              <input
                type="url"
                value={individualData.linkedin_url}
                onChange={(e) => setIndividualData({ ...individualData, linkedin_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/votreprofil"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarif Horaire (GNF)
            </label>
            <input
              type="number"
              value={individualData.hourly_rate}
              onChange={(e) => setIndividualData({ ...individualData, hourly_rate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 50000"
              min="0"
            />
          </div>
        </div>
      )}

      {organizationType === 'company' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Informations sur l'Entreprise</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'Entreprise *
              </label>
              <input
                type="text"
                value={companyData.company_name}
                onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro d'Immatriculation
              </label>
              <input
                type="text"
                value={companyData.company_registration_number}
                onChange={(e) => setCompanyData({ ...companyData, company_registration_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <h4 className="text-md font-semibold text-gray-800 mt-6">Personne de Contact</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du Contact *
              </label>
              <input
                type="text"
                value={companyData.company_contact_person}
                onChange={(e) => setCompanyData({ ...companyData, company_contact_person: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poste du Contact *
              </label>
              <input
                type="text"
                value={companyData.company_contact_position}
                onChange={(e) => setCompanyData({ ...companyData, company_contact_position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <h4 className="text-md font-semibold text-gray-800 mt-6">Coordonnées</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de l'Entreprise *
              </label>
              <input
                type="email"
                value={companyData.company_email}
                onChange={(e) => setCompanyData({ ...companyData, company_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                value={companyData.company_phone}
                onChange={(e) => setCompanyData({ ...companyData, company_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse *
            </label>
            <input
              type="text"
              value={companyData.company_address}
              onChange={(e) => setCompanyData({ ...companyData, company_address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <input
                type="text"
                value={companyData.company_city}
                onChange={(e) => setCompanyData({ ...companyData, company_city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays
              </label>
              <input
                type="text"
                value={companyData.company_country}
                onChange={(e) => setCompanyData({ ...companyData, company_country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur d'Activité
              </label>
              <input
                type="text"
                value={companyData.company_sector}
                onChange={(e) => setCompanyData({ ...companyData, company_sector: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Technologie, Formation, Consulting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille de l'Entreprise
              </label>
              <select
                value={companyData.company_size}
                onChange={(e) => setCompanyData({ ...companyData, company_size: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionnez</option>
                <option value="1-10">1-10 employés</option>
                <option value="11-50">11-50 employés</option>
                <option value="51-200">51-200 employés</option>
                <option value="201-500">201-500 employés</option>
                <option value="500+">500+ employés</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description de l'Entreprise *
            </label>
            <textarea
              value={companyData.company_description}
              onChange={(e) => setCompanyData({ ...companyData, company_description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Présentez votre entreprise et vos services..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domaines de Formation
            </label>
            <input
              type="text"
              value={companyData.specializations.join(', ')}
              onChange={(e) => handleSpecializationsChange(e.target.value, 'company')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Développement Web, Marketing Digital, Management"
            />
            <p className="text-xs text-gray-500 mt-1">Séparez les domaines par des virgules</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Web
            </label>
            <input
              type="url"
              value={companyData.website}
              onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://votreentreprise.com"
            />
          </div>
        </div>
      )}

      {organizationType === 'institute' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Informations sur l'Institut</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'Institut *
              </label>
              <input
                type="text"
                value={instituteData.institute_name}
                onChange={(e) => setInstituteData({ ...instituteData, institute_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro d'Agrément
              </label>
              <input
                type="text"
                value={instituteData.institute_registration_number}
                onChange={(e) => setInstituteData({ ...instituteData, institute_registration_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'Institut *
            </label>
            <select
              value={instituteData.institute_type}
              onChange={(e) => setInstituteData({ ...instituteData, institute_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionnez</option>
              <option value="public">Public</option>
              <option value="private">Privé</option>
              <option value="university">Université</option>
              <option value="vocational">Centre de Formation Professionnelle</option>
              <option value="research">Centre de Recherche</option>
            </select>
          </div>

          <h4 className="text-md font-semibold text-gray-800 mt-6">Personne de Contact</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du Contact *
              </label>
              <input
                type="text"
                value={instituteData.institute_contact_person}
                onChange={(e) => setInstituteData({ ...instituteData, institute_contact_person: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poste du Contact *
              </label>
              <input
                type="text"
                value={instituteData.institute_contact_position}
                onChange={(e) => setInstituteData({ ...instituteData, institute_contact_position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <h4 className="text-md font-semibold text-gray-800 mt-6">Coordonnées</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de l'Institut *
              </label>
              <input
                type="email"
                value={instituteData.institute_email}
                onChange={(e) => setInstituteData({ ...instituteData, institute_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                value={instituteData.institute_phone}
                onChange={(e) => setInstituteData({ ...instituteData, institute_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse *
            </label>
            <input
              type="text"
              value={instituteData.institute_address}
              onChange={(e) => setInstituteData({ ...instituteData, institute_address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <input
                type="text"
                value={instituteData.institute_city}
                onChange={(e) => setInstituteData({ ...instituteData, institute_city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays
              </label>
              <input
                type="text"
                value={instituteData.institute_country}
                onChange={(e) => setInstituteData({ ...instituteData, institute_country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description de l'Institut *
            </label>
            <textarea
              value={instituteData.institute_description}
              onChange={(e) => setInstituteData({ ...instituteData, institute_description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Présentez votre institut et vos programmes..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domaines de Formation
            </label>
            <input
              type="text"
              value={instituteData.specializations.join(', ')}
              onChange={(e) => handleSpecializationsChange(e.target.value, 'institute')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Informatique, Ingénierie, Sciences Sociales"
            />
            <p className="text-xs text-gray-500 mt-1">Séparez les domaines par des virgules</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Web
            </label>
            <input
              type="url"
              value={instituteData.website}
              onChange={(e) => setInstituteData({ ...instituteData, website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://votreinstitut.edu"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition font-medium disabled:bg-gray-400"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Enregistrement...' : 'Enregistrer les Modifications'}
        </button>
      </div>
    </form>
  );
}
