import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, User, MessageSquare, Send, CheckCircle2, AlertCircle, Upload, DollarSign, Briefcase, Users as UsersIcon, X } from 'lucide-react';
import { b2bLeadsService, B2BLead } from '../../services/b2bLeadsService';
import { b2bPipelineService } from '../../services/b2bPipelineService';
import { seoLandingPagesService } from '../../services/seoLandingPagesService';
import { useAuth } from '../../contexts/AuthContext';

interface B2BLeadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  sourcePage?: string;
  landingPageId?: string;
  prefilledData?: {
    primary_need?: string;
    message?: string;
  };
}

export default function B2BLeadForm({ onSuccess, onCancel, sourcePage, landingPageId, prefilledData }: B2BLeadFormProps) {
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: '' as B2BLead['organization_type'],
    sector: '',
    primary_need: (prefilledData?.primary_need as B2BLead['primary_need']) || ('' as B2BLead['primary_need']),
    urgency: 'normale' as B2BLead['urgency'],
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    message: prefilledData?.message || '',
    mission_type: '',
    positions_count: 1,
    seniority_level: '',
    estimated_budget: '',
    budget_currency: 'GNF' as string,
    preferred_contact_method: 'email',
    preferred_contact_time: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Track session for conversion tracking
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

  // Auto-fill if user is logged in as recruiter
  useEffect(() => {
    if (user && profile && profile.user_type === 'recruiter') {
      setFormData(prev => ({
        ...prev,
        organization_name: (profile as any).company_name || '',
        contact_name: profile.full_name || '',
        contact_email: user.email || '',
        contact_phone: (profile as any).phone || ''
      }));
    }
  }, [user, profile]);

  useEffect(() => {
    // Track landing on form (conversion funnel)
    if (landingPageId) {
      seoLandingPagesService.trackConversion({
        session_id: sessionId,
        landing_page_id: landingPageId,
        landing_page_slug: sourcePage || window.location.pathname,
        entry_url: window.location.href,
        pages_visited: [window.location.pathname],
        converted: false
      });
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const organizationTypes = [
    { value: 'entreprise', label: 'Entreprise / PME' },
    { value: 'institution', label: 'Institution publique' },
    { value: 'ong', label: 'ONG / Organisation internationale' },
    { value: 'cabinet_rh', label: 'Cabinet RH / Agence' },
    { value: 'centre_formation', label: 'Centre de formation' },
    { value: 'formateur', label: 'Formateur / Coach indépendant' },
    { value: 'autre', label: 'Autre' }
  ];

  const primaryNeeds = [
    { value: 'externalisation_recrutement', label: 'Externalisation du recrutement' },
    { value: 'ats_digital', label: 'Solutions digitales & ATS' },
    { value: 'cvtheque', label: 'Accès CVthèque' },
    { value: 'formation', label: 'Formation & Coaching' },
    { value: 'conseil_rh', label: 'Conseil RH & Accompagnement' },
    { value: 'pack_enterprise', label: 'Pack Enterprise' },
    { value: 'autre', label: 'Autre besoin' }
  ];

  const urgencyLevels = [
    { value: 'immediate', label: 'Immédiat (sous 48h)' },
    { value: 'urgent', label: 'Urgent (cette semaine)' },
    { value: 'normale', label: 'Normal (ce mois)' },
    { value: 'planifie', label: 'Planifié (ultérieur)' }
  ];

  const missionTypes = [
    { value: 'recrutement_poste_unique', label: 'Recrutement d\'un poste unique' },
    { value: 'recrutement_multiple', label: 'Recrutement de plusieurs postes' },
    { value: 'chasse_tete', label: 'Chasse de têtes' },
    { value: 'evaluation_candidats', label: 'Évaluation de candidats' },
    { value: 'interim_management', label: 'Intérim management' },
    { value: 'audit_rh', label: 'Audit RH' },
    { value: 'autre', label: 'Autre mission' }
  ];

  const seniorityLevels = [
    { value: 'junior', label: 'Junior (0-3 ans)' },
    { value: 'intermediaire', label: 'Intermédiaire (3-7 ans)' },
    { value: 'senior', label: 'Senior (7-15 ans)' },
    { value: 'expert', label: 'Expert (15+ ans)' },
    { value: 'cadre', label: 'Cadre / Manager' },
    { value: 'direction', label: 'Direction / Executive' }
  ];

  const contactMethods = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'any', label: 'Tous moyens' }
  ];

  const sectors = [
    'Mines & Ressources naturelles',
    'Banque & Finance',
    'Télécommunications',
    'BTP & Infrastructure',
    'Énergie',
    'Transport & Logistique',
    'Santé',
    'Éducation & Formation',
    'Commerce & Distribution',
    'Agriculture & Agroalimentaire',
    'Industrie',
    'Services',
    'ONG & Développement',
    'Administration publique',
    'Autre'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organization_type || !formData.primary_need) {
      setSubmitStatus('error');
      setErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    // 1. Create lead
    const result = await b2bLeadsService.createLead(formData);

    if (result.success && result.data) {
      // 2. Create pipeline entry with SEO tracking
      await b2bPipelineService.createFromLead(result.data.id!, {
        source_page: sourcePage || window.location.pathname,
        source_type: landingPageId ? 'seo' : 'direct',
        landing_page_id: landingPageId,
        utm_params: {
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
        }
      });

      // 3. Track conversion
      if (landingPageId) {
        await seoLandingPagesService.trackConversion({
          session_id: sessionId,
          landing_page_id: landingPageId,
          landing_page_slug: sourcePage || window.location.pathname,
          entry_url: window.location.href,
          pages_visited: [window.location.pathname],
          converted: true,
          conversion_type: 'lead_form',
          lead_id: result.data.id,
          converted_at: new Date().toISOString()
        });
      }

      setSubmitStatus('success');
      setFormData({
        organization_name: '',
        organization_type: '' as B2BLead['organization_type'],
        sector: '',
        primary_need: '' as B2BLead['primary_need'],
        urgency: 'normale',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        message: ''
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } else {
      setSubmitStatus('error');
      setErrorMessage(result.error || 'Une erreur est survenue');
    }

    setIsSubmitting(false);
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600"></div>

        {/* Animated checkmark */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Success message */}
        <div className="mb-6">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Demande envoyée avec succès !
          </h3>
          <p className="text-lg text-gray-700 mb-4">
            Merci pour votre intérêt, <strong>{formData.contact_name}</strong>
          </p>
          <p className="text-gray-600">
            Votre demande a été transmise à notre équipe B2B et apparaît en temps réel dans notre système.
          </p>
        </div>

        {/* What happens next */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Prochaines étapes
          </h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <p className="text-gray-700">
                <strong>Confirmation email :</strong> Vous recevrez un accusé de réception sous quelques minutes à <span className="text-blue-600">{formData.contact_email}</span>
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <p className="text-gray-700">
                <strong>Analyse de votre besoin :</strong> Un spécialiste JobGuinée étudie votre demande (sous 2-4h)
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <p className="text-gray-700">
                <strong>Prise de contact :</strong> Nous vous contactons par {formData.contact_phone ? 'téléphone ou email' : 'email'} sous 24h pour discuter de votre projet
              </p>
            </li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Besoin urgent ?</strong> Contactez-nous directement :
          </p>
          <div className="flex items-center justify-center gap-4 text-blue-600">
            <a href="tel:+224621000000" className="flex items-center gap-2 hover:underline">
              <Phone className="w-4 h-4" />
              +224 621 00 00 00
            </a>
            <a href="mailto:b2b@jobguinee.com" className="flex items-center gap-2 hover:underline">
              <Mail className="w-4 h-4" />
              b2b@jobguinee.com
            </a>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setSubmitStatus('idle')}
            className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Envoyer une nouvelle demande
          </button>
          {onSuccess && (
            <button
              onClick={onSuccess}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
            >
              Fermer
            </button>
          )}
        </div>

        {/* Reference number */}
        <p className="text-xs text-gray-400 mt-6">
          Référence de votre demande : #{Date.now().toString().slice(-8)}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6 relative">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Parlez à un spécialiste JobGuinée
        </h3>
        <p className="text-gray-600">
          Remplissez ce formulaire et un conseiller vous contactera sous 24h
        </p>
      </div>

      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Building2 className="w-4 h-4 inline mr-2" />
            Nom de l'organisation *
          </label>
          <input
            type="text"
            name="organization_name"
            value={formData.organization_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
            placeholder="Ex: Entreprise ABC"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Type d'organisation *
          </label>
          <select
            name="organization_type"
            value={formData.organization_type}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
          >
            <option value="">Sélectionnez...</option>
            {organizationTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Secteur d'activité *
          </label>
          <select
            name="sector"
            value={formData.sector}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
          >
            <option value="">Sélectionnez...</option>
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Besoin RH principal *
          </label>
          <select
            name="primary_need"
            value={formData.primary_need}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
          >
            <option value="">Sélectionnez...</option>
            {primaryNeeds.map(need => (
              <option key={need.value} value={need.value}>{need.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Urgence
          </label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
          >
            {urgencyLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Nom du contact *
          </label>
          <input
            type="text"
            name="contact_name"
            value={formData.contact_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
            placeholder="Prénom et nom"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email *
          </label>
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
            placeholder="email@exemple.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Téléphone
          </label>
          <input
            type="tel"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
            placeholder="+224 XXX XX XX XX"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Message détaillé
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
          placeholder="Décrivez votre besoin en détail..."
        />
      </div>

      <div className="flex gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${onCancel ? 'flex-1' : 'w-full'} py-4 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Envoyer ma demande
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        En envoyant ce formulaire, vous acceptez d'être contacté par JobGuinée concernant vos besoins RH.
      </p>
    </form>
  );
}
