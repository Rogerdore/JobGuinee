import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePremiumEligibility } from '../../hooks/usePremiumEligibility';
import { callAIService } from '../../utils/aiService';
import { getCVTemplatePrompt, CV_TEMPLATES } from '../../utils/cvTemplates';
import {
  FileText,
  Sparkles,
  Download,
  Eye,
  Loader,
  AlertCircle,
  Briefcase,
  Building,
  ChevronRight,
  Coins,
  CheckCircle2,
  Search,
  X,
  Lightbulb,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

interface CVContent {
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    portfolio?: string;
  };
  summary: string;
  targetPosition?: string;
  experience: {
    years: number;
    level: string;
    details: any[];
  };
  education: {
    level: string;
    details: any[];
  };
  skills: string[];
  languages: any[];
  certifications: any[];
  style: string;
}

interface AICVGeneratorProps {
  onBack?: () => void;
  onNavigateToJobs?: () => void;
  preSelectedJob?: any;
}

export default function AICVGenerator({ onBack, onNavigateToJobs, preSelectedJob }: AICVGeneratorProps) {
  const { user } = useAuth();
  const cvEligibility = usePremiumEligibility('cv_generation');
  const [generatingCV, setGeneratingCV] = useState(false);
  const [cvContent, setCVContent] = useState<CVContent | null>(null);

  // Gestion des crédits
  const [creditBalance, setCreditBalance] = useState(0);
  const [cvBalance, setCVBalance] = useState(0);
  const [cvCost, setCVCost] = useState(50);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [error, setError] = useState('');

  const [style, setStyle] = useState('modern');
  const [targetPosition, setTargetPosition] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadCredits();
    }
  }, [user]);

  useEffect(() => {
    if (preSelectedJob) {
      selectJobAsTarget(preSelectedJob);
    }
  }, [preSelectedJob]);

  const selectJobAsTarget = (job: any) => {
    setTargetPosition(job.title);
    setTargetCompany(job.company_name);
    setSelectedJob(job);
  };

  const clearJobSelection = () => {
    setSelectedJob(null);
    setTargetPosition('');
    setTargetCompany('');
  };

  const loadCredits = async () => {
    if (!user) {
      console.log('AICVGenerator: No user, skipping loadCredits');
      return;
    }

    console.log('AICVGenerator: Starting loadCredits for user:', user.id);
    setLoadingCredits(true);
    try {
      const { data: services, error: servicesError } = await supabase
        .from('premium_services')
        .select('id, code')
        .eq('code', 'cv_generation');

      if (servicesError) {
        console.error('Error loading services:', servicesError);
      }
      console.log('Services loaded:', services);

      const { data: userCredits, error: creditsError } = await supabase
        .from('user_service_credits')
        .select('service_id, credits_balance')
        .eq('user_id', user.id);

      if (creditsError) {
        console.error('Error loading user credits:', creditsError);
      }
      console.log('User credits loaded:', userCredits);

      let cvBal = 0;

      if (services && userCredits) {
        services.forEach(service => {
          const credit = userCredits.find(uc => uc.service_id === service.id);
          if (credit && service.code === 'cv_generation') {
            cvBal = credit.credits_balance;
          }
        });
      }

      setCreditBalance(cvBal);
      setCVBalance(cvBal);

      console.log('Credits loaded:', {
        cvBalance: cvBal
      });

      const { data: costs } = await supabase
        .from('service_credit_costs')
        .select('service_code, credits_cost')
        .eq('service_code', 'cv_generation');

      if (costs && costs.length > 0) {
        setCVCost(costs[0].credits_cost);
        console.log('Costs loaded:', {
          cvCost: costs[0].credits_cost
        });
      }
    } catch (error: any) {
      console.error('Erreur:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const generateCV = async () => {
    if (!user) return;

    if (cvBalance < cvCost) {
      setError(`Crédits insuffisants pour le CV. Requis: ${cvCost} crédits, Disponibles: ${cvBalance} crédits`);
      return;
    }

    setGeneratingCV(true);
    setError('');

    try {
      const { data: creditResult } = await supabase.rpc('consume_service_credits', {
        p_service_code: 'cv_generation',
        p_metadata: {
          style,
          target_position: targetPosition
        }
      });

      if (!creditResult.success) {
        setError(creditResult.message || 'Crédits insuffisants');
        return;
      }

      setCVBalance(creditResult.new_balance);
      setCreditBalance(creditResult.new_balance);

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setError('Profil non trouvé. Veuillez compléter votre profil candidat depuis votre tableau de bord.');
        return;
      }

      const templatePrompt = getCVTemplatePrompt(style);

      const experienceDetails = (profile.work_experience || []).map((exp: any, idx: number) =>
        `Expérience ${idx + 1}:
- Poste: ${exp.position || exp.title || 'Non spécifié'}
- Entreprise: ${exp.company || 'Non spécifié'}
- Période: ${exp.start_date || ''} - ${exp.end_date || 'Présent'}
- Missions: ${exp.description || exp.responsibilities || 'Non spécifié'}`
      ).join('\n\n');

      const educationDetails = (profile.education || []).map((edu: any, idx: number) =>
        `Formation ${idx + 1}:
- Diplôme: ${edu.degree || edu.diploma || 'Non spécifié'}
- Établissement: ${edu.institution || edu.school || 'Non spécifié'}
- Année: ${edu.year || edu.graduation_year || 'Non spécifié'}`
      ).join('\n\n');

      const prompt = `${templatePrompt}

=== INFORMATIONS DU CANDIDAT ===

Nom complet: ${profile.full_name}
Email: ${user.email}
Localisation: ${profile.location || 'Guinée'}
Téléphone: ${profile.phone || 'À compléter'}

Poste visé: ${targetPosition || profile.title || 'Professionnel qualifié'}
Niveau d'expérience: ${profile.professional_status || 'Intermédiaire'}
Années d'expérience: ${profile.experience_years || 0} ans

COMPÉTENCES:
${(profile.skills || []).join(', ') || 'Polyvalent, Adaptable, Travail d\'équipe'}

EXPÉRIENCES PROFESSIONNELLES:
${experienceDetails || 'Expérience à détailler selon le profil'}

FORMATION:
${educationDetails || 'Formation académique'}

LANGUES:
${(profile.languages || []).map((lang: any) => `${lang.language || lang}: ${lang.level || 'Courant'}`).join(', ') || 'Français: Courant'}

BIOGRAPHIE/OBJECTIF:
${profile.bio || profile.professional_goal || 'Professionnel motivé et engagé dans son domaine'}

=== INSTRUCTIONS ===
Génère un CV COMPLET et PROFESSIONNEL en utilisant TOUTES les informations ci-dessus.
Remplis TOUTES les sections du template.
Sois créatif et impactant dans la présentation.
Utilise des verbes d'action et mets en avant les résultats concrets.`;

      const aiResult = await callAIService({
        service_type: 'cv_generation',
        prompt: prompt,
        context: {
          profile,
          targetPosition,
          style
        },
        max_tokens: 2000
      });

      if (!aiResult.success || !aiResult.data) {
        setError(aiResult.error || 'Erreur lors de la génération IA');
        return;
      }

      const cvData: CVContent = {
        personalInfo: {
          fullName: profile.full_name || '',
          email: user.email || '',
          phone: '',
          location: profile.location || '',
          linkedIn: '',
          portfolio: '',
        },
        summary: aiResult.data.content,
        targetPosition: targetPosition || profile.title || '',
        experience: {
          years: profile.experience_years || 0,
          level: profile.professional_status || 'junior',
          details: profile.work_experience || [],
        },
        education: {
          level: 'bachelors',
          details: profile.education || [],
        },
        skills: profile.skills || [],
        languages: profile.languages || [],
        certifications: [],
        style: style,
      };

      setCVContent(cvData);

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'CV généré avec succès',
        message: `Votre CV professionnel est prêt! (${cvCost} crédits utilisés)`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Erreur: ' + error.message);
    } finally {
      setGeneratingCV(false);
    }
  };


  const downloadCV = () => {
    if (!cvContent) return;
    alert('Téléchargement PDF à venir');
  };


  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 text-blue-900 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>Retour</span>
          </button>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Génération de CV IA
        </h1>
        <p className="text-gray-600">
          Créez votre CV professionnel en quelques clics
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 mb-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-5 h-5" />
              <span className="text-sm text-blue-100">Votre solde</span>
            </div>
            <p className="text-3xl font-bold">{loadingCredits ? '...' : creditBalance} ⚡</p>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5" />
              <span className="text-sm text-blue-100">CV IA</span>
            </div>
            <p className="text-2xl font-bold">{cvCost} ⚡</p>
          </div>
        </div>

        {creditBalance < cvCost && !loadingCredits && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <p className="text-sm text-yellow-200 mb-2">⚠️ Solde insuffisant</p>
            <button className="bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition text-sm">
              Acheter des crédits
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">CV Professionnel IA</h2>
              <p className="text-sm text-gray-600">Coût: {cvCost} crédits</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poste visé
              </label>

              {selectedJob ? (
                <div className="border-2 border-blue-500 rounded-lg p-3 bg-blue-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{selectedJob.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="w-3 h-3" />
                        <span>{selectedJob.company_name}</span>
                      </div>
                      {selectedJob.location && (
                        <p className="text-xs text-gray-500 mt-1">{selectedJob.location}</p>
                      )}
                    </div>
                    <button
                      onClick={clearJobSelection}
                      className="text-gray-400 hover:text-red-600 transition"
                      title="Supprimer la sélection"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-blue-700 font-medium">✓ Offre sélectionnée</p>
                </div>
              ) : (
                <>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={targetPosition}
                      onChange={(e) => setTargetPosition(e.target.value)}
                      placeholder="Ex: Développeur Full Stack"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {onNavigateToJobs && (
                      <button
                        onClick={onNavigateToJobs}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                        title="Parcourir les offres du site"
                      >
                        <Search className="w-5 h-5" />
                        <span>Offres</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Cliquez sur "Offres" pour sélectionner une offre spécifique du site
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style du CV
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="modern">🟦 Moderne - Épuré, minimaliste</option>
                <option value="classic">🟩 Classique - Structuré, sobre</option>
                <option value="professional">🟧 Professionnel - Axé résultats</option>
                <option value="creative">🟪 Créatif - Visuel, dynamique</option>
              </select>
              {style && (
                <p className="text-xs text-gray-500 mt-2">
                  {CV_TEMPLATES[style as keyof typeof CV_TEMPLATES]?.description}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={generateCV}
            disabled={generatingCV || loadingCredits || !cvEligibility.isEligible}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {generatingCV ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Génération en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Générer mon CV ({cvCost} ⚡)</span>
              </>
            )}
          </button>

          {cvContent && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">CV généré avec succès!</p>
              </div>
              <button
                onClick={downloadCV}
                className="w-full mt-2 bg-white border-2 border-green-600 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Télécharger PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-8 border-2 border-amber-200">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Conseils pour un CV ATS-Friendly
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Les systèmes ATS (Applicant Tracking System) sont utilisés par 75% des recruteurs pour filtrer les candidatures.
              Un CV optimisé ATS augmente vos chances de 60% d'être remarqué par les recruteurs.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Qu'est-ce qu'un CV ATS-Friendly ?</h3>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            Un CV ATS-friendly est un CV optimisé pour être correctement lu et analysé par les logiciels de recrutement automatisés (ATS).
            Ces systèmes scannent votre CV à la recherche de mots-clés, compétences et expériences pertinentes avant même qu'un recruteur humain ne le voie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-green-800">À FAIRE</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Format simple :</strong> Utilisez un format Word (.docx) ou PDF standard sans éléments graphiques complexes</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Police standard :</strong> Arial, Calibri, Times New Roman (taille 10-12pt)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Sections claires :</strong> Titres standards (Expérience, Formation, Compétences)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Mots-clés :</strong> Intégrez les compétences et termes de l'offre d'emploi</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Texte sélectionnable :</strong> Tout le contenu doit être en texte (pas en image)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Ordre chronologique :</strong> Listez vos expériences de la plus récente à la plus ancienne</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-red-800">À ÉVITER</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Tableaux complexes :</strong> Les ATS ont du mal à lire les tableaux et colonnes multiples</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Images et graphiques :</strong> Photos, logos, icônes et graphiques ne sont pas lus par les ATS</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>En-têtes/pieds de page :</strong> Informations importantes dans ces zones peuvent être ignorées</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Polices fantaisistes :</strong> Évitez les polices décoratives ou scripts</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Abréviations :</strong> Écrivez "Master" au lieu de "M." ou "Directeur" au lieu de "Dir."</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Titres créatifs :</strong> Utilisez "Expérience professionnelle" plutôt que "Mon parcours"</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-3">Pourquoi choisir notre générateur IA ?</h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>100% ATS-Compatible :</strong> Nos CV sont conçus pour être parfaitement lisibles par tous les systèmes ATS du marché</span>
                </p>
                <p className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Format optimisé :</strong> Structure claire, polices standards et mise en page simple mais professionnelle</span>
                </p>
                <p className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Mots-clés intelligents :</strong> L'IA intègre automatiquement les termes pertinents selon votre secteur</span>
                </p>
                <p className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Personnalisation rapide :</strong> Adaptez facilement votre CV pour chaque offre d'emploi</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-amber-100 border-2 border-amber-300 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-amber-900 text-sm leading-relaxed">
              <strong>Conseil professionnel :</strong> Même avec un CV optimisé ATS, n'oubliez pas que votre CV sera lu par un humain après avoir passé le filtre automatique.
              Assurez-vous qu'il reste agréable à lire et mette en valeur vos réalisations concrètes avec des chiffres et résultats mesurables.
            </p>
          </div>
        </div>
      </div>

      {cvContent && (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-900 flex items-center space-x-2">
              <FileText className="w-6 h-6" />
              <span>Aperçu du CV</span>
            </h2>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">{cvContent.personalInfo.fullName}</h2>
            <div className="mb-6 text-gray-600 space-y-1">
              <p>{cvContent.personalInfo.email}</p>
              {cvContent.personalInfo.phone && <p>{cvContent.personalInfo.phone}</p>}
              {cvContent.personalInfo.location && <p>{cvContent.personalInfo.location}</p>}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Résumé</h3>
              <p>{cvContent.summary}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Compétences</h3>
              <div className="flex flex-wrap gap-2">
                {cvContent.skills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
