import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, Loader, Upload, Sparkles, ArrowLeft } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import { useServiceCost } from '../../hooks/usePricing';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import CreditBalance from '../credits/CreditBalance';

interface CVData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  skills: string[];
  languages: string[];
}

interface AICVGeneratorProps {
  onNavigate?: (page: string) => void;
}

export default function AICVGenerator({ onNavigate }: AICVGeneratorProps = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const serviceCost = useServiceCost(SERVICES.AI_CV_GENERATION) || 50;
  const [cvData, setCVData] = useState<CVData>({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
  });
  const [generatedCV, setGeneratedCV] = useState<string>('');
  const [useExistingProfile, setUseExistingProfile] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const { consumeCredits } = useConsumeCredits();

  useEffect(() => {
    if (useExistingProfile && user) {
      loadProfileData();
    }
  }, [useExistingProfile, user]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profile && candidateProfile) {
        setCVData({
          fullName: profile.full_name || '',
          title: candidateProfile.desired_position || '',
          email: profile.email || '',
          phone: candidateProfile.phone || '',
          location: candidateProfile.location || '',
          summary: candidateProfile.bio || '',
          experience: candidateProfile.experience || [],
          education: candidateProfile.education || [],
          skills: candidateProfile.skills || [],
          languages: candidateProfile.languages || [],
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    setShowCreditModal(true);
  };

  const handleCreditConfirm = async (success: boolean, result?: any) => {
    if (!success) {
      alert(result?.message || 'Erreur lors de la consommation des crédits');
      return;
    }

    await generateCV();
  };

  const generateCV = async () => {
    setGenerating(true);
    try {
      const cvHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - ${cvData.fullName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 210mm; margin: 0 auto; padding: 20mm; background: white; }
    .header { border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1e40af; font-size: 32px; margin-bottom: 5px; }
    .header .title { color: #f97316; font-size: 18px; font-weight: 600; margin-bottom: 10px; }
    .contact { color: #666; font-size: 14px; }
    .contact span { margin-right: 15px; }
    .section { margin-bottom: 25px; }
    .section h2 { color: #1e40af; font-size: 20px; border-bottom: 2px solid #f97316; padding-bottom: 5px; margin-bottom: 15px; }
    .summary { text-align: justify; color: #555; }
    .experience-item, .education-item { margin-bottom: 20px; }
    .experience-item h3, .education-item h3 { color: #333; font-size: 16px; margin-bottom: 5px; }
    .meta { color: #666; font-size: 14px; font-style: italic; margin-bottom: 8px; }
    .description { color: #555; text-align: justify; }
    .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .skill-item { background: #f0f9ff; padding: 8px 12px; border-radius: 5px; color: #1e40af; font-size: 14px; }
    @media print { body { margin: 0; } .container { padding: 10mm; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${cvData.fullName}</h1>
      <div class="title">${cvData.title}</div>
      <div class="contact">
        <span>📧 ${cvData.email}</span>
        <span>📱 ${cvData.phone}</span>
        <span>📍 ${cvData.location}</span>
      </div>
    </div>

    ${cvData.summary ? `
    <div class="section">
      <h2>Profil Professionnel</h2>
      <p class="summary">${cvData.summary}</p>
    </div>
    ` : ''}

    ${cvData.experience.length > 0 ? `
    <div class="section">
      <h2>Expérience Professionnelle</h2>
      ${cvData.experience.map(exp => `
        <div class="experience-item">
          <h3>${exp.position}</h3>
          <div class="meta">${exp.company} • ${exp.period}</div>
          <p class="description">${exp.description}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${cvData.education.length > 0 ? `
    <div class="section">
      <h2>Formation</h2>
      ${cvData.education.map(edu => `
        <div class="education-item">
          <h3>${edu.degree}</h3>
          <div class="meta">${edu.institution} • ${edu.year}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${cvData.skills.length > 0 ? `
    <div class="section">
      <h2>Compétences</h2>
      <div class="skills-grid">
        ${cvData.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
      </div>
    </div>
    ` : ''}

    ${cvData.languages.length > 0 ? `
    <div class="section">
      <h2>Langues</h2>
      <p>${cvData.languages.join(' • ')}</p>
    </div>
    ` : ''}
  </div>
</body>
</html>
      `;

      setGeneratedCV(cvHTML);

      await supabase.from('ai_cv_generations').insert({
        user_id: user!.id,
        profile_data: cvData,
        generated_cv: cvHTML,
        format: 'html',
      });

    } catch (error) {
      console.error('Error generating CV:', error);
      alert('Erreur lors de la génération du CV');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCV = () => {
    const blob = new Blob([generatedCV], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV-${cvData.fullName.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {onNavigate && (
        <button
          onClick={() => onNavigate('premium-ai')}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour aux Services IA</span>
        </button>
      )}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Générateur de CV IA</h1>
            <p className="text-gray-600">Créez un CV professionnel en quelques clics</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useExistingProfile}
              onChange={(e) => setUseExistingProfile(e.target.checked)}
              className="w-5 h-5 text-blue-600"
            />
            <span className="text-gray-700">Utiliser mon profil existant</span>
          </label>
        </div>

        {!useExistingProfile && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nom complet"
                value={cvData.fullName}
                onChange={(e) => setCVData({ ...cvData, fullName: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Titre / Poste souhaité"
                value={cvData.title}
                onChange={(e) => setCVData({ ...cvData, title: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              placeholder="Résumé professionnel"
              value={cvData.summary}
              onChange={(e) => setCVData({ ...cvData, summary: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Coût: <span className="font-bold text-blue-600">50 crédits</span>
          </div>
          <CreditBalance />
        </div>

        <button
          onClick={handleGenerateClick}
          disabled={generating || !cvData.fullName}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Générer mon CV IA
            </>
          )}
        </button>
      </div>

      {generatedCV && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Aperçu du CV</h2>
            <button
              onClick={downloadCV}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Télécharger HTML
            </button>
          </div>
          <div
            className="border border-gray-200 rounded-lg p-8 bg-gray-50"
            dangerouslySetInnerHTML={{ __html: generatedCV }}
          />
        </div>
      )}

      <CreditConfirmModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onConfirm={handleCreditConfirm}
        serviceCode={SERVICES.AI_CV_GENERATION}
        serviceName="Génération de CV IA"
        serviceCost={serviceCost}
        description="Créez un CV professionnel avec mise en forme automatique"
        inputPayload={{ fullName: cvData.fullName, title: cvData.title }}
      />
    </div>
  );
}