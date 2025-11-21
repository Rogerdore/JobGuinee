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
} from 'lucide-react';

interface CoverLetterGeneratorProps {
  onBack?: () => void;
}

interface CoverLetterVersion {
  title: string;
  description: string;
  content: string;
  style: string;
}

type WorkflowStep = 'job-selection' | 'generating' | 'version-selection' | 'editing' | 'completed';

export default function AICoverLetterGenerator({ onBack }: CoverLetterGeneratorProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('job-selection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [letterVersions, setLetterVersions] = useState<CoverLetterVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<CoverLetterVersion | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [creditCost] = useState(20);

  useEffect(() => {
    if (user) {
      loadJobs();
      loadCandidateProfile();
    }
  }, [user]);

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setJobs(data);
    }
  };

  const loadCandidateProfile = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setCandidateProfile(profile);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateLetters = async () => {
    if (!selectedJob || !candidateProfile) return;

    setCurrentStep('generating');
    setLoading(true);
    setError('');

    try {
      const { data: creditResult } = await supabase.rpc('consume_service_credits', {
        p_service_code: 'cover_letter_generation',
        p_metadata: {
          job_id: selectedJob.id,
          job_title: selectedJob.title,
          company_name: selectedJob.companies?.name
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
        company_name: selectedJob.companies?.name,
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
            company_name: selectedJob.companies?.name,
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Sélectionner une offre</h2>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
            {creditCost} ⚡ crédits
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un poste ou une entreprise..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedJob?.id === job.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building className="w-3 h-3" />
                    <span>{job.companies?.name || 'Entreprise'}</span>
                  </div>
                  {job.location && (
                    <p className="text-xs text-gray-500 mt-1">{job.location}</p>
                  )}
                </div>
                {selectedJob?.id === job.id && (
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
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
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>Générer 2 versions ({creditCost} ⚡)</span>
        </button>
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div className="max-w-2xl mx-auto text-center py-12">
      <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Génération en cours...
      </h2>
      <p className="text-gray-600 mb-4">
        Notre IA analyse votre profil et l'offre d'emploi pour créer 2 versions de lettre personnalisées
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
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
            <Loader className="w-4 h-4 text-blue-600 animate-spin" />
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">{version.title}</h3>
              <p className="text-blue-100 text-sm">{version.description}</p>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {version.content.substring(0, 500)}...
                </pre>
              </div>

              <button
                onClick={() => selectVersion(version)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center space-x-2"
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
          className="text-blue-600 hover:text-blue-700 font-medium"
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>{selectedVersion?.title}</strong> - {selectedVersion?.description}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
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
            className="text-blue-600 hover:text-blue-700 font-medium"
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
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
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
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
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
