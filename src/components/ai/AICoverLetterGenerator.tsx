import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { callAIService } from '../../utils/aiService';
import {
  FileText,
  Briefcase,
  Building,
  Search,
  Loader,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronRight,
  Sparkles,
  Download,
  Save,
  Edit3,
  Target,
  Info,
  Lightbulb,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface CoverLetterGeneratorProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  preSelectedJob?: any;
}

interface CoverLetterVersion {
  title: string;
  description: string;
  content: string;
  style: string;
}

type WorkflowStep = 'job-selection' | 'generating' | 'version-selection' | 'editing' | 'completed';

export default function AICoverLetterGenerator({ onBack, onNavigate, preSelectedJob }: CoverLetterGeneratorProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('job-selection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedJob, setSelectedJob] = useState<any>(preSelectedJob || null);

  const [letterVersions, setLetterVersions] = useState<CoverLetterVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<CoverLetterVersion | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [creditCost] = useState(20);

  useEffect(() => {
    if (user) {
      loadCandidateProfile();
    }
  }, [user]);

  useEffect(() => {
    if (preSelectedJob) {
      setSelectedJob(preSelectedJob);
    }
  }, [preSelectedJob]);

  const loadCandidateProfile = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setCandidateProfile(profile);
  };

  const generateLetters = async () => {
    if (!selectedJob || !candidateProfile) return;

    setCurrentStep('generating');
    setLoading(true);
    setError('');

    try {
      const { data: creditResult } = await supabase.rpc('consume_global_credits', {
        p_service_code: 'cover_letter_generation',
        p_metadata: {
          job_id: selectedJob.id,
          job_title: selectedJob.title,
          company_name: selectedJob.companies?.name || selectedJob.company_name
        }
      });

      if (!creditResult?.success) {
        throw new Error(creditResult?.message || 'Crédits insuffisants');
      }

      const fullProfile = {
        personal_info: {
          full_name: candidateProfile.full_name,
          email: user.email,
          phone: candidateProfile.phone,
          location: candidateProfile.location,
        },
        professional_summary: candidateProfile.bio || candidateProfile.professional_goal,
        experience_years: candidateProfile.experience_years,
        professional_status: candidateProfile.professional_status,
        work_experience: candidateProfile.work_experience,
        education: candidateProfile.education,
        skills: candidateProfile.skills,
        languages: candidateProfile.languages,
        certifications: candidateProfile.certifications,
      };

      const jobContent = {
        title: selectedJob.title,
        company_name: selectedJob.companies?.name || selectedJob.company_name,
        company_description: selectedJob.companies?.description,
        description: selectedJob.description,
        requirements: selectedJob.requirements,
        responsibilities: selectedJob.responsibilities,
        location: selectedJob.location,
        contract_type: selectedJob.contract_type,
      };

      const prompt = `Tu es un expert en rédaction de lettres de motivation professionnelles. Tu dois générer DEUX versions distinctes d'une lettre de motivation.

=== PROFIL DU CANDIDAT ===
${JSON.stringify(fullProfile, null, 2)}

=== OFFRE D'EMPLOI ===
${JSON.stringify(jobContent, null, 2)}

=== INSTRUCTIONS ===
Génère DEUX versions de lettre de motivation en JSON avec cette structure exacte :

{
  "version_A": {
    "title": "Version Professionnelle & Structurée",
    "description": "Lettre formelle suivant les codes classiques",
    "content": "[Lettre complète ici]"
  },
  "version_B": {
    "title": "Version Convaincante & Orientée Résultats",
    "description": "Lettre dynamique mettant en avant les réalisations",
    "content": "[Lettre complète ici]"
  }
}

CRITÈRES pour les DEUX versions :
- En-tête avec coordonnées du candidat
- Date et lieu
- Coordonnées de l'entreprise
- Objet : Candidature pour [Poste]
- Formule d'appel appropriée
- 3-4 paragraphes structurés
- Formule de politesse finale
- Signature

VERSION A (Professionnelle) :
- Ton formel et respectueux
- Structure classique
- Vocabulaire soutenu
- Présentation chronologique des expériences

VERSION B (Orientée Résultats) :
- Ton dynamique et engageant
- Focus sur les réalisations concrètes
- Chiffres et résultats mesurables
- Mise en avant de la valeur ajoutée

Les deux lettres doivent être COMPLÈTES, DIFFÉRENTES et PRÊTES à l'emploi.
Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`;

      const aiResult = await callAIService({
        service_type: 'cover_letter',
        prompt: prompt,
        max_tokens: 2500,
        temperature: 0.8,
      });

      if (!aiResult.success || !aiResult.data) {
        throw new Error(aiResult.error || 'Erreur lors de la génération');
      }

      let parsedResult;
      try {
        const content = aiResult.data.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          parsedResult = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        throw new Error('Format de réponse IA invalide');
      }

      const versions: CoverLetterVersion[] = [
        {
          title: parsedResult.version_A?.title || 'Version Professionnelle',
          description: parsedResult.version_A?.description || 'Lettre formelle et structurée',
          content: parsedResult.version_A?.content || '',
          style: 'professional',
        },
        {
          title: parsedResult.version_B?.title || 'Version Orientée Résultats',
          description: parsedResult.version_B?.description || 'Lettre dynamique avec résultats',
          content: parsedResult.version_B?.content || '',
          style: 'results-oriented',
        },
      ];

      setLetterVersions(versions);
      setCurrentStep('version-selection');

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Lettres générées avec succès',
        message: `2 versions de lettre pour ${selectedJob.title} sont prêtes!`,
        type: 'success',
      });

    } catch (err: any) {
      console.error('Error generating letters:', err);
      setError(err.message || 'Erreur lors de la génération');
      setCurrentStep('job-selection');
    } finally {
      setLoading(false);
    }
  };

  const selectVersion = (version: CoverLetterVersion) => {
    setSelectedVersion(version);
    setEditedContent(version.content);
    setCurrentStep('editing');
  };

  const saveToDocuments = async () => {
    if (!user || !selectedVersion || !selectedJob) return;

    try {
      const documentName = `Lettre - ${selectedJob.title} - ${new Date().toLocaleDateString('fr-FR')}`;

      const { error: saveError } = await supabase
        .from('candidate_documents')
        .insert({
          user_id: user.id,
          document_type: 'cover_letter',
          file_name: documentName,
          content: editedContent,
          metadata: {
            job_id: selectedJob.id,
            job_title: selectedJob.title,
            company_name: selectedJob.companies?.name || selectedJob.company_name,
            version_style: selectedVersion.style,
          },
        });

      if (saveError) throw saveError;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Lettre sauvegardée',
        message: `"${documentName}" a été enregistrée dans vos documents`,
        type: 'success',
      });

      setCurrentStep('completed');
    } catch (err: any) {
      setError('Erreur lors de la sauvegarde: ' + err.message);
    }
  };

  const downloadAsWord = () => {
    alert('Export Word à venir - Fonctionnalité en développement');
  };

  const downloadAsPDF = () => {
    alert('Export PDF à venir - Fonctionnalité en développement');
  };

  const renderJobSelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Génération de Lettre de Motivation IA
        </h1>
        <p className="text-gray-600">
          Sélectionnez une offre d'emploi pour générer 2 versions de lettre personnalisées
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Sélectionner une offre</h2>
          <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-semibold">
            {creditCost} ⚡ crédits
          </div>
        </div>

        {selectedJob ? (
          <div className="border-2 border-indigo-500 rounded-lg p-4 bg-indigo-50 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900 text-lg">{selectedJob.title}</h3>
                </div>
                <div className="flex items-center space-x-2 text-gray-700 mb-1">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">{selectedJob.companies?.name || selectedJob.company_name || 'Entreprise'}</span>
                </div>
                {selectedJob.location && (
                  <p className="text-sm text-gray-600 mt-1">{selectedJob.location}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-indigo-600 hover:text-indigo-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">Aucune offre sélectionnée</p>
            <button
              onClick={() => onNavigate?.('jobs')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition inline-flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Parcourir les offres d'emploi</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Retour
          </button>
        )}
        <button
          onClick={generateLetters}
          disabled={!selectedJob || loading}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-indigo-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>Générer 2 versions ({creditCost} ⚡)</span>
        </button>
      </div>

      <div className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Comment fonctionne notre Générateur de Lettre IA ?
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Notre intelligence artificielle analyse votre profil complet et l'offre d'emploi sélectionnée pour créer
              des lettres de motivation 100% personnalisées et optimisées ATS.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-6 h-6" />
            <h3 className="text-xl font-bold">Notre Mission : Votre Succès</h3>
          </div>
          <p className="leading-relaxed mb-4">
            Nous savons qu'écrire une lettre de motivation peut être chronophage et stressant. Notre générateur IA est conçu pour
            <strong> vous assister dans la création de lettres percutantes</strong> qui mettent en valeur votre profil unique
            tout en correspondant parfaitement aux attentes de chaque offre d'emploi.
          </p>
          <p className="leading-relaxed">
            L'objectif ? <strong>Maximiser vos chances d'être remarqué</strong> en produisant des lettres professionnelles,
            personnalisées et optimisées pour passer les filtres ATS tout en captivant les recruteurs humains.
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Le Processus de Génération Intelligente</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Analyse de votre profil complet</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  L'IA étudie vos expériences professionnelles, formations, compétences, langues, certifications et objectifs de carrière
                  pour comprendre votre parcours unique et identifier vos points forts.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Analyse approfondie de l'offre d'emploi</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  L'IA décortique l'intitulé du poste, les responsabilités, les exigences, les compétences recherchées et la culture de l'entreprise
                  pour comprendre exactement ce que le recruteur attend du candidat idéal.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                3
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Mise en correspondance intelligente (Matching)</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  L'IA identifie les <strong>correspondances parfaites</strong> entre votre profil et l'offre : quelles expériences mettre en avant,
                  quelles compétences souligner, quels résultats chiffrés mentionner pour démontrer que vous êtes LE candidat idéal.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                4
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Génération de 2 versions personnalisées</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  L'IA crée deux lettres complètes et distinctes adaptées à votre style :
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700 ml-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-indigo-600">•</span>
                    <span><strong>Version Professionnelle :</strong> Ton formel, structure classique, vocabulaire soutenu</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-indigo-600">•</span>
                    <span><strong>Version Orientée Résultats :</strong> Ton dynamique, focus sur vos réalisations et chiffres clés</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-indigo-600">
                5
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Optimisation automatique ATS</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Chaque lettre générée respecte automatiquement les <strong>critères ATS</strong> : format simple, mots-clés pertinents,
                  structure claire, sans éléments graphiques complexes. Votre lettre passera les filtres automatiques !
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-purple-600">
                6
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Personnalisation finale par vous</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Vous gardez le contrôle total ! Choisissez la version qui vous plaît, <strong>éditez et personnalisez</strong> le contenu
                  selon vos préférences, puis exportez en Word ou PDF. Votre lettre, votre style !
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Pourquoi adapter chaque lettre à chaque offre ?</h3>
          </div>
          <div className="space-y-3 text-gray-700">
            <p className="leading-relaxed">
              <strong>Statistiques clés :</strong>
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start space-x-2">
                <span className="text-red-600 font-bold">✗</span>
                <span><strong>Lettres génériques :</strong> Taux de réponse de seulement 5-10%</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Lettres personnalisées :</strong> Taux de réponse de 40-60% (jusqu'à 6x plus efficace !)</span>
              </li>
            </ul>
            <p className="leading-relaxed mt-4">
              Les recruteurs reçoivent des centaines de candidatures. Ils repèrent <strong>immédiatement</strong> les lettres génériques
              ("Madame, Monsieur, Je me permets de vous adresser ma candidature..."). Une lettre personnalisée montre votre réelle motivation,
              votre connaissance de l'entreprise et démontre que vous avez pris le temps de comprendre le poste.
            </p>
            <p className="leading-relaxed bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
              <strong>Notre générateur fait ce travail pour vous en quelques secondes</strong>, en créant des lettres uniques qui parlent
              directement à chaque recruteur et mettent en avant précisément ce qu'ils recherchent.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-green-800">BONNES PRATIQUES</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Format texte pur :</strong> Utilisez un format Word (.docx) ou texte brut, évitez les PDF complexes</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Structure classique :</strong> En-tête, formule d'appel, 3-4 paragraphes, formule de politesse</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Mots-clés de l'offre :</strong> Reprenez les compétences et qualifications mentionnées dans l'annonce</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Nom de l'entreprise :</strong> Mentionnez explicitement le nom de l'entreprise et le poste visé</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Personnalisation :</strong> Adaptez chaque lettre à l'offre spécifique, évitez les lettres génériques</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700"><strong>Langage professionnel :</strong> Ton formel et respectueux, vocabulaire du secteur d'activité</span>
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
                <span className="text-gray-700"><strong>Formatage complexe :</strong> Colonnes, zones de texte, WordArt ou effets spéciaux</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Images et logos :</strong> Aucune image, photo ou graphique dans la lettre</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Lettre générique :</strong> "À qui de droit" ou lettres non personnalisées</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Trop long :</strong> Plus d'une page (800 mots maximum)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Langage familier :</strong> Argot, abréviations SMS, émojis ou expressions trop décontractées</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">✗</span>
                <span className="text-gray-700"><strong>Redondance avec le CV :</strong> Ne répétez pas tout votre CV, apportez une valeur ajoutée</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
            <p className="text-purple-900 text-sm leading-relaxed">
              <strong>Astuce d'expert :</strong> Même avec une lettre optimisée ATS, relisez-la attentivement pour vous assurer qu'elle reflète
              votre personnalité et votre réelle motivation. Les recruteurs humains apprécient l'authenticité et la sincérité.
              Pensez à mentionner des éléments spécifiques sur l'entreprise qui montrent que vous avez fait vos recherches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div className="max-w-2xl mx-auto text-center py-12">
      <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Génération en cours...
      </h2>
      <p className="text-gray-600 mb-4">
        Notre IA analyse votre profil et l'offre d'emploi pour créer 2 versions de lettre personnalisées
      </p>
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left">
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Analyse du profil candidat</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Analyse de l'offre d'emploi</span>
          </li>
          <li className="flex items-center space-x-2">
            <Loader className="w-4 h-4 text-indigo-600 animate-spin" />
            <span>Génération des 2 versions...</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderVersionSelection = () => (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choisissez votre version
        </h1>
        <p className="text-gray-600">
          2 versions ont été générées - Sélectionnez celle qui vous correspond le mieux
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {letterVersions.map((version, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">{version.title}</h3>
              <p className="text-indigo-100 text-sm">{version.description}</p>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {version.content.substring(0, 500)}...
                </pre>
              </div>

              <button
                onClick={() => selectVersion(version)}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
              >
                <Edit3 className="w-5 h-5" />
                <span>Choisir cette version</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setCurrentStep('job-selection')}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Retour à la sélection
        </button>
      </div>
    </div>
  );

  const renderEditing = () => (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Éditeur de lettre
        </h1>
        <p className="text-gray-600">
          Modifiez votre lettre avant de la sauvegarder ou de l'exporter
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-sm text-indigo-900">
              <strong>{selectedVersion?.title}</strong> - {selectedVersion?.description}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            placeholder="Contenu de la lettre..."
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 Modifiez le texte selon vos besoins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={downloadAsWord}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Télécharger Word</span>
          </button>

          <button
            onClick={downloadAsPDF}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Télécharger PDF</span>
          </button>

          <button
            onClick={saveToDocuments}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Sauvegarder</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setCurrentStep('version-selection')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Choisir une autre version
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompleted = () => (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Lettre sauvegardée avec succès !
      </h2>
      <p className="text-gray-600 mb-6">
        Votre lettre de motivation est maintenant disponible dans votre espace Documents
      </p>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => {
            setCurrentStep('job-selection');
            setSelectedJob(null);
            setSelectedVersion(null);
            setEditedContent('');
          }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Créer une nouvelle lettre
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Retour au tableau de bord
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {onBack && currentStep === 'job-selection' && (
        <div className="max-w-4xl mx-auto mb-4">
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-2"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>Retour</span>
          </button>
        </div>
      )}

      {error && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Erreur</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto">
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'job-selection' && renderJobSelection()}
      {currentStep === 'generating' && renderGenerating()}
      {currentStep === 'version-selection' && renderVersionSelection()}
      {currentStep === 'editing' && renderEditing()}
      {currentStep === 'completed' && renderCompleted()}
    </div>
  );
}
