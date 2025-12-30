import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, User, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { b2bLeadsService, B2BLead } from '../../services/b2bLeadsService';
import { b2bPipelineService } from '../../services/b2bPipelineService';
import { seoLandingPagesService } from '../../services/seoLandingPagesService';

interface B2BLeadFormProps {
  onSuccess?: () => void;
  sourcePage?: string;
  landingPageId?: string;
  prefilledData?: {
    primary_need?: string;
    message?: string;
  };
}

export default function B2BLeadForm({ onSuccess, sourcePage, landingPageId, prefilledData }: B2BLeadFormProps) {
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: '' as B2BLead['organization_type'],
    sector: '',
    primary_need: (prefilledData?.primary_need as B2BLead['primary_need']) || ('' as B2BLead['primary_need']),
    urgency: 'normale' as B2BLead['urgency'],
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    message: prefilledData?.message || ''
  });

  // Track session for conversion tracking
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

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
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Demande envoyée avec succès !
        </h3>
        <p className="text-gray-600 mb-4">
          Merci pour votre intérêt. Un expert JobGuinée vous contactera dans les plus brefs délais.
        </p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="text-[#0E2F56] hover:underline font-medium"
        >
          Envoyer une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Parlez à un expert JobGuinée
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <p className="text-xs text-gray-500 text-center">
        En envoyant ce formulaire, vous acceptez d'être contacté par JobGuinée concernant vos besoins RH.
      </p>
    </form>
  );
}
