import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, Loader, Upload, Sparkles, ArrowLeft, FileDown } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import { useServiceCost } from '../../hooks/usePricing';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import CreditBalance from '../credits/CreditBalance';
import TemplateSelector from './TemplateSelector';
import { IAConfigService } from '../../services/iaConfigService';
import PDFService from '../../services/pdfService';

interface CVData {
  nom: string;
  titre: string;
  email: string;
  telephone: string;
  lieu: string;
  resume: string;
  competences: string[];
  experiences: Array<{
    poste: string;
    entreprise: string;
    periode: string;
    missions: string[];
  }>;
  formations: Array<{
    diplome: string;
    ecole: string;
    annee: string;
  }>;
}

interface EnhancedAICVGeneratorProps {
  onNavigate?: (page: string) => void;
}

export default function EnhancedAICVGenerator({ onNavigate }: EnhancedAICVGeneratorProps = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const serviceCost = useServiceCost(SERVICES.AI_CV_GENERATION) || 50;
  const [cvData, setCVData] = useState<CVData>({
    nom: '',
    titre: '',
    email: '',
    telephone: '',
    lieu: '',
    resume: '',
    competences: [],
    experiences: [],
    formations: [],
  });
  const [generatedCV, setGeneratedCV] = useState<string>('');
  const [generatedFormat, setGeneratedFormat] = useState<string>('html');
  const [useExistingProfile, setUseExistingProfile] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { consumeCredits } = useConsumeCredits();

  useEffect(() => {
    if (useExistingProfile && user) {
      loadProfile();
    }
  }, [useExistingProfile, user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCVData({
          nom: profile.full_name || '',
          titre: profile.title || '',
          email: profile.email || '',
          telephone: profile.phone || '',
          lieu: profile.location || '',
          resume: profile.bio || '',
          competences: profile.skills || [],
          experiences: (profile.experience || []).map((exp: any) => ({
            poste: exp.position || exp.title || '',
            entreprise: exp.company || '',
            periode: `${exp.start_date || ''} - ${exp.end_date || 'Présent'}`,
            missions: exp.description ? [exp.description] : []
          })),
          formations: (profile.education || []).map((edu: any) => ({
            diplome: edu.degree || '',
            ecole: edu.institution || edu.school || '',
            annee: edu.year || edu.graduation_year || ''
          })),
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCV = async () => {
    if (!user) {
      alert('Vous devez être connecté');
      return;
    }

    if (!cvData.nom || !cvData.titre) {
      alert('Veuillez remplir au moins le nom et le titre');
      return;
    }

    setShowCreditModal(true);
  };

  const confirmGeneration = async () => {
    setShowCreditModal(false);
    setGenerating(true);

    try {
      const creditResult = await consumeCredits(SERVICES.AI_CV_GENERATION);
      if (!creditResult.success) {
        alert(creditResult.message);
        return;
      }

      const config = await IAConfigService.getConfig('ai_cv_generation');
      if (!config) {
        throw new Error('Configuration IA non trouvée');
      }

      const template = selectedTemplateId
        ? await IAConfigService.getTemplate(selectedTemplateId)
        : await IAConfigService.getDefaultTemplate('ai_cv_generation');

      if (!template) {
        throw new Error('Template non trouvé');
      }

      const outputData = {
        nom: cvData.nom,
        titre: cvData.titre,
        email: cvData.email,
        telephone: cvData.telephone,
        resume: cvData.resume,
        competences: cvData.competences,
        experiences: cvData.experiences,
        formations: cvData.formations
      };

      const finalCV = IAConfigService.applyTemplate(outputData, template.template_structure);

      setGeneratedCV(finalCV);
      setGeneratedFormat(template.format);

      await supabase.from('ai_cv_generations').insert({
        user_id: user.id,
        profile_data: cvData,
        generated_cv: finalCV,
        format: template.format,
        template_id: template.id
      });

      alert('CV généré avec succès!');
    } catch (error) {
      console.error('Error generating CV:', error);
      alert('Erreur lors de la génération du CV');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCV = () => {
    const blob = new Blob([generatedCV], {
      type: generatedFormat === 'html' ? 'text/html' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-${cvData.nom.replace(/\s+/g, '-')}.${generatedFormat === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    try {
      let htmlContent = generatedCV;

      if (generatedFormat === 'markdown') {
        htmlContent = await PDFService.convertMarkdownToHTML(generatedCV);
      } else if (generatedFormat === 'text') {
        htmlContent = `<pre style="font-family: Arial; white-space: pre-wrap;">${generatedCV}</pre>`;
      }

      htmlContent = PDFService.cleanHtmlForPDF(htmlContent);

      await PDFService.generateAndDownload({
        htmlContent,
        fileName: `cv-${cvData.nom.replace(/\s+/g, '-')}.pdf`
      });

      alert('PDF téléchargé avec succès!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const addExperience = () => {
    setCVData({
      ...cvData,
      experiences: [...cvData.experiences, { poste: '', entreprise: '', periode: '', missions: [] }]
    });
  };

  const addFormation = () => {
    setCVData({
      ...cvData,
      formations: [...cvData.formations, { diplome: '', ecole: '', annee: '' }]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          {onNavigate && (
            <button
              onClick={() => onNavigate('premium-ai')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          )}
          <CreditBalance />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Générateur de CV IA</h1>
              <p className="text-gray-600">Créez un CV professionnel avec l'aide de l'IA</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>Coût:</strong> {serviceCost} crédits par génération
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={useExistingProfile}
                onChange={(e) => setUseExistingProfile(e.target.checked)}
                className="rounded"
              />
              Utiliser mon profil existant
            </label>
          </div>

          <TemplateSelector
            serviceCode="ai_cv_generation"
            selectedTemplateId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
            className="mb-6"
          />

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={cvData.nom}
                onChange={(e) => setCVData({ ...cvData, nom: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre professionnel *
              </label>
              <input
                type="text"
                value={cvData.titre}
                onChange={(e) => setCVData({ ...cvData, titre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Développeur Full Stack"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={cvData.email}
                onChange={(e) => setCVData({ ...cvData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="jean@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={cvData.telephone}
                onChange={(e) => setCVData({ ...cvData, telephone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="+224 XXX XX XX XX"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Résumé professionnel
            </label>
            <textarea
              value={cvData.resume}
              onChange={(e) => setCVData({ ...cvData, resume: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Décrivez votre profil professionnel en quelques lignes..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compétences (séparées par des virgules)
            </label>
            <input
              type="text"
              value={cvData.competences.join(', ')}
              onChange={(e) => setCVData({ ...cvData, competences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="JavaScript, React, Node.js, PostgreSQL"
            />
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleGenerateCV}
              disabled={generating || !cvData.nom || !cvData.titre}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {generating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Générer mon CV ({serviceCost} crédits)
                </>
              )}
            </button>
          </div>
        </div>

        {generatedCV && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Votre CV Généré</h2>
              <div className="flex gap-3">
                <button
                  onClick={downloadCV}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger {generatedFormat.toUpperCase()}
                </button>
                {(generatedFormat === 'html' || generatedFormat === 'markdown') && (
                  <button
                    onClick={downloadPDF}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Télécharger PDF
                  </button>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-gray-50">
              {generatedFormat === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: generatedCV }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">{generatedCV}</pre>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreditModal && (
        <CreditConfirmModal
          serviceName="Génération CV IA"
          cost={serviceCost}
          onConfirm={confirmGeneration}
          onCancel={() => setShowCreditModal(false)}
        />
      )}
    </div>
  );
}
