import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useModalContext } from '../contexts/ModalContext';
import {
  Briefcase,
  Building,
  UserPlus,
  Mail,
  ExternalLink,
  Save,
  AlertCircle,
  Plus
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import RichTextEditor from '../components/forms/RichTextEditor';

interface Partner {
  id: string;
  name: string;
  email: string;
  logo_url?: string;
  type: string;
}

type ApplicationMode =
  | 'company_account'
  | 'internal_admin'
  | 'external_email'
  | 'invited_partner'
  | 'external_link';

interface Props {
  onNavigate: (page: string) => void;
}

const AdminJobCreate: React.FC<Props> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    contract_type: '',
    salary_range: '',
    description: '',
    requirements: '',
    benefits: '',
    deadline: '',
    published_by_admin: true,
    publication_source: 'jobguinee' as 'jobguinee' | 'partenaire',
    application_mode: 'internal_admin' as ApplicationMode,
    partner_id: '',
    partner_type: '',
    partner_name: '',
    partner_email: '',
    partner_logo_url: '',
    external_apply_url: '',
    admin_notes: ''
  });

  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    type: 'cabinet',
    logo_url: '',
    notes: ''
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    const { data } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (data) setPartners(data);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'partner_id' && value) {
      const partner = partners.find(p => p.id === value);
      if (partner) {
        setFormData(prev => ({
          ...prev,
          partner_name: partner.name,
          partner_email: partner.email,
          partner_logo_url: partner.logo_url || '',
          partner_type: partner.type
        }));
      }
    }
  };

  const handleCreatePartner = async () => {
    if (!newPartner.name || !newPartner.email) {
      showWarning('Information', 'Nom et email requis');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('partners')
      .insert({
        ...newPartner,
        invited_by: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      showError('Erreur', 'Erreur lors de la création du partenaire. Veuillez réessayer.');
      return;
    }

    setPartners(prev => [...prev, data]);
    setFormData(prev => ({
      ...prev,
      partner_id: data.id,
      partner_name: data.name,
      partner_email: data.email,
      partner_logo_url: data.logo_url || '',
      partner_type: data.type
    }));

    setNewPartner({ name: '', email: '', type: 'cabinet', logo_url: '', notes: '' });
    setShowPartnerForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const jobData: any = {
        title: formData.title,
        company_name: formData.company_name,
        location: formData.location,
        contract_type: formData.contract_type,
        salary_range: formData.salary_range,
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        deadline: formData.deadline,
        published_by_admin: true,
        admin_publisher_id: user.id,
        publication_source: formData.publication_source,
        application_mode: formData.application_mode,
        admin_notes: formData.admin_notes,
        status: 'active',
        is_visible: true
      };

      if (formData.publication_source === 'partenaire' && formData.partner_id) {
        jobData.partner_id = formData.partner_id;
        jobData.partner_name = formData.partner_name;
        jobData.partner_email = formData.partner_email;
        jobData.partner_logo_url = formData.partner_logo_url;
        jobData.partner_type = formData.partner_type;
      }

      if (formData.application_mode === 'external_email') {
        jobData.partner_email = formData.partner_email;
      }

      if (formData.application_mode === 'external_link') {
        jobData.external_apply_url = formData.external_apply_url;
      }

      const { error } = await supabase
        .from('jobs')
        .insert(jobData);

      if (error) throw error;

      showSuccess('Publié', 'Offre publiée avec succès');
      onNavigate('admin-job-moderation');
    } catch (error) {
      console.error('Error creating job:', error);
      showError('Erreur', 'Erreur lors de la publication. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Publier une offre d'emploi
          </h1>
          <p className="text-gray-600">
            Publication directe par l'administration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Informations générales
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du poste *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localisation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de contrat *
                  </label>
                  <select
                    required
                    value={formData.contract_type}
                    onChange={(e) => handleChange('contract_type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fourchette salariale
                  </label>
                  <input
                    type="text"
                    value={formData.salary_range}
                    onChange={(e) => handleChange('salary_range', e.target.value)}
                    placeholder="Ex: 500,000 - 800,000 GNF"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite de candidature
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleChange('deadline', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Description du poste</h2>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => handleChange('description', value)}
              placeholder="Décrivez le poste..."
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Prérequis</h2>
            <RichTextEditor
              value={formData.requirements}
              onChange={(value) => handleChange('requirements', value)}
              placeholder="Listez les compétences et qualifications requises..."
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Avantages</h2>
            <RichTextEditor
              value={formData.benefits}
              onChange={(value) => handleChange('benefits', value)}
              placeholder="Décrivez les avantages..."
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Source de publication
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publié par
                </label>
                <select
                  value={formData.publication_source}
                  onChange={(e) => handleChange('publication_source', e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="jobguinee">JobGuinée</option>
                  <option value="partenaire">Partenaire</option>
                </select>
              </div>

              {formData.publication_source === 'partenaire' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Partenaire
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPartnerForm(!showPartnerForm)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Nouveau partenaire
                    </button>
                  </div>

                  {showPartnerForm ? (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
                      <input
                        type="text"
                        placeholder="Nom du partenaire"
                        value={newPartner.name}
                        onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newPartner.email}
                        onChange={(e) => setNewPartner(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <select
                        value={newPartner.type}
                        onChange={(e) => setNewPartner(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="cabinet">Cabinet de recrutement</option>
                        <option value="institution">Institution</option>
                        <option value="entreprise">Entreprise</option>
                        <option value="autre">Autre</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCreatePartner}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Créer
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPartnerForm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={formData.partner_id}
                      onChange={(e) => handleChange('partner_id', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un partenaire</option>
                      {partners.map(partner => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} ({partner.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Mode de réception des candidatures
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="application_mode"
                  value="internal_admin"
                  checked={formData.application_mode === 'internal_admin'}
                  onChange={(e) => handleChange('application_mode', e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Admin JobGuinée uniquement</div>
                  <div className="text-sm text-gray-600">
                    Les candidatures sont visibles uniquement par l'administration
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="application_mode"
                  value="external_email"
                  checked={formData.application_mode === 'external_email'}
                  onChange={(e) => handleChange('application_mode', e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Email automatique + Copie JobGuinée</div>
                  <div className="text-sm text-gray-600">
                    Envoi automatique à l'email indiqué + archivage JobGuinée
                  </div>
                </div>
              </label>

              {formData.application_mode === 'external_email' && (
                <div className="ml-12">
                  <input
                    type="email"
                    placeholder="Email de réception"
                    value={formData.partner_email}
                    onChange={(e) => handleChange('partner_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="application_mode"
                  value="invited_partner"
                  checked={formData.application_mode === 'invited_partner'}
                  onChange={(e) => handleChange('application_mode', e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Partenaire invité</div>
                  <div className="text-sm text-gray-600">
                    Le partenaire reçoit un compte pour gérer les candidatures
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="application_mode"
                  value="external_link"
                  checked={formData.application_mode === 'external_link'}
                  onChange={(e) => handleChange('application_mode', e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Lien externe</div>
                  <div className="text-sm text-gray-600">
                    Redirection vers un site externe + tracking
                  </div>
                </div>
              </label>

              {formData.application_mode === 'external_link' && (
                <div className="ml-12">
                  <input
                    type="url"
                    placeholder="https://example.com/apply"
                    value={formData.external_apply_url}
                    onChange={(e) => handleChange('external_apply_url', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Notes internes (Admin uniquement)
            </h2>
            <textarea
              value={formData.admin_notes}
              onChange={(e) => handleChange('admin_notes', e.target.value)}
              placeholder="Notes privées pour l'équipe administrative..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Publication...' : 'Publier l\'offre'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('admin-job-moderation')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminJobCreate;
