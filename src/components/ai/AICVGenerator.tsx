import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  FileText,
  Mail,
  Sparkles,
  Download,
  Eye,
  Loader,
  AlertCircle,
  Briefcase,
  Building,
  ChevronRight,
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
}

export default function AICVGenerator({ onBack }: AICVGeneratorProps) {
  const { user } = useAuth();
  const [generatingCV, setGeneratingCV] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [activeTab, setActiveTab] = useState<'cv' | 'letter'>('cv');
  const [cvContent, setCVContent] = useState<CVContent | null>(null);
  const [letterContent, setLetterContent] = useState<any>(null);
  const [credits, setCredits] = useState({ cv: 0, letter: 0 });

  const [style, setStyle] = useState('modern');
  const [targetPosition, setTargetPosition] = useState('');
  const [targetCompany, setTargetCompany] = useState('');

  useEffect(() => {
    if (user) {
      loadCredits();
    }
  }, [user]);

  const loadCredits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_premium_status', {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (data?.credits) {
        setCredits({
          cv: data.credits.cv_generation?.available || 0,
          letter: data.credits.cover_letter_generation?.available || 0,
        });
      }
    } catch (error: any) {
      console.error('Erreur:', error);
    }
  };

  const generateCV = async () => {
    if (!user) return;

    setGeneratingCV(true);
    try {
      const { data, error } = await supabase.rpc('generate_cv_with_ai', {
        p_user_id: user.id,
        p_style: style,
        p_target_position: targetPosition || null,
        p_target_job_id: null,
      });

      if (error) throw error;

      if (!data.success) {
        if (data.error === 'insufficient_credits') {
          alert(`Crédits insuffisants. Disponibles: ${data.available_credits}`);
        } else {
          alert('Erreur: ' + (data.message || data.error));
        }
        return;
      }

      setCVContent(data.content);
      setActiveTab('cv');
      await loadCredits();

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'CV généré avec succès',
        message: 'Votre CV professionnel est prêt!',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setGeneratingCV(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!user || !targetPosition || !targetCompany) {
      alert('Veuillez renseigner le poste et l\'entreprise');
      return;
    }

    setGeneratingLetter(true);
    try {
      const { data, error } = await supabase.rpc('generate_cover_letter_with_ai', {
        p_user_id: user.id,
        p_target_position: targetPosition,
        p_target_company: targetCompany,
        p_target_job_id: null,
        p_style: style,
      });

      if (error) throw error;

      if (!data.success) {
        if (data.error === 'insufficient_credits') {
          alert(`Crédits insuffisants. Disponibles: ${data.available_credits}`);
        } else {
          alert('Erreur: ' + (data.message || data.error));
        }
        return;
      }

      setLetterContent(data.content);
      setActiveTab('letter');
      await loadCredits();

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Lettre générée avec succès',
        message: 'Votre lettre de motivation est prête!',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setGeneratingLetter(false);
    }
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Créer mon CV et ma Lettre avec l'IA
            </h1>
            <p className="text-gray-600">
              Générez des documents professionnels en quelques secondes
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-600">Crédits CV</div>
              <div className="text-2xl font-bold text-blue-900">{credits.cv}</div>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-600">Crédits Lettre</div>
              <div className="text-2xl font-bold text-green-900">{credits.letter}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-8 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('cv')}
          className={`px-6 py-3 font-medium transition-all border-b-2 -mb-0.5 ${
            activeTab === 'cv'
              ? 'text-blue-900 border-blue-900'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Curriculum Vitae</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('letter')}
          className={`px-6 py-3 font-medium transition-all border-b-2 -mb-0.5 ${
            activeTab === 'letter'
              ? 'text-blue-900 border-blue-900'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Lettre de Motivation</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <span>Paramètres</span>
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'classic', label: 'Classique' },
                  { value: 'modern', label: 'Moderne' },
                  { value: 'creative', label: 'Créatif' },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`p-3 rounded-lg border-2 transition ${
                      style === s.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Poste visé {activeTab === 'letter' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                placeholder="Ex: Développeur Full Stack"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {activeTab === 'letter' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  Entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Ex: SOTELGUI"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  L'IA utilise vos informations de profil pour générer un document professionnel.
                </div>
              </div>
            </div>

            {activeTab === 'cv' ? (
              <button
                onClick={generateCV}
                disabled={generatingCV || credits.cv < 1}
                className="w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4 rounded-lg font-medium hover:from-blue-800 hover:to-blue-600 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {generatingCV ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Générer mon CV</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={generateCoverLetter}
                disabled={generatingLetter || credits.letter < 1}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-lg font-medium hover:from-green-700 hover:to-green-600 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {generatingLetter ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Générer ma Lettre</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Eye className="w-6 h-6 text-blue-900" />
            <span>Prévisualisation</span>
          </h3>

          {!cvContent && !letterContent ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'cv' ? (
                  <FileText className="w-10 h-10 text-gray-400" />
                ) : (
                  <Mail className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <p className="text-gray-500">
                {activeTab === 'cv' ? 'Votre CV apparaîtra ici' : 'Votre lettre apparaîtra ici'}
              </p>
            </div>
          ) : activeTab === 'cv' && cvContent ? (
            <div className="space-y-6">
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {cvContent.personalInfo.fullName}
                  </h2>
                  <p className="text-blue-900 font-medium mt-1">
                    {cvContent.targetPosition || 'Professionnel'}
                  </p>
                  <div className="text-sm text-gray-600 mt-2">
                    {cvContent.personalInfo.email}
                  </div>
                </div>

                {cvContent.summary && (
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 mb-2">Profil</h3>
                    <p className="text-gray-700 text-sm">{cvContent.summary}</p>
                  </div>
                )}

                {cvContent.skills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 mb-2">Compétences</h3>
                    <div className="flex flex-wrap gap-2">
                      {cvContent.skills.slice(0, 8).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button className="w-full bg-blue-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-800 transition flex items-center justify-center space-x-2 mt-4">
                  <Download className="w-5 h-5" />
                  <span>Télécharger PDF</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'letter' && letterContent ? (
            <div className="space-y-6">
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <div className="mb-4 text-sm">
                  <p className="text-gray-900 font-medium">
                    {letterContent.targetInfo.company}
                  </p>
                  <p className="text-gray-600">
                    Objet: {letterContent.targetInfo.position}
                  </p>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">
                    {letterContent.letterText}
                  </p>
                </div>

                <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center space-x-2 mt-4">
                  <Download className="w-5 h-5" />
                  <span>Télécharger PDF</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
