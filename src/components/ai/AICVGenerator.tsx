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
  Coins,
  CheckCircle2,
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

  // Gestion des crédits
  const [creditBalance, setCreditBalance] = useState(0);
  const [cvCost, setCVCost] = useState(50);
  const [letterCost, setLetterCost] = useState(30);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [error, setError] = useState('');

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

    setLoadingCredits(true);
    try {
      const { data: balance, error } = await supabase.rpc('get_user_credit_balance', {
        p_user_id: user.id
      });

      if (error) throw error;

      setCreditBalance(balance || 0);

      const { data: costs } = await supabase
        .from('service_credit_costs')
        .select('service_code, credits_cost')
        .in('service_code', ['cv_generation', 'cover_letter_generation']);

      if (costs) {
        const cvService = costs.find(c => c.service_code === 'cv_generation');
        const letterService = costs.find(c => c.service_code === 'cover_letter_generation');

        if (cvService) setCVCost(cvService.credits_cost);
        if (letterService) setLetterCost(letterService.credits_cost);
      }
    } catch (error: any) {
      console.error('Erreur:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const generateCV = async () => {
    if (!user) return;

    if (creditBalance < cvCost) {
      setError(`Crédits insuffisants. Requis: ${cvCost} crédits, Disponibles: ${creditBalance} crédits`);
      return;
    }

    setGeneratingCV(true);
    setError('');

    try {
      const { data: creditResult } = await supabase.rpc('use_credits_for_service', {
        p_user_id: user.id,
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

      setCreditBalance(creditResult.new_balance);

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setError('Profil non trouvé. Veuillez compléter votre profil.');
        return;
      }

      const cvData: CVContent = {
        personalInfo: {
          fullName: profile.full_name || '',
          email: user.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          linkedIn: profile.linkedin_url || '',
          portfolio: profile.portfolio_url || '',
        },
        summary: profile.bio || 'Professionnel motivé et passionné',
        targetPosition: targetPosition || profile.desired_position || '',
        experience: {
          years: profile.experience_years || 0,
          level: profile.experience_level || 'junior',
          details: profile.work_history || [],
        },
        education: {
          level: profile.education_level || 'bachelors',
          details: profile.education_history || [],
        },
        skills: profile.skills || [],
        languages: profile.languages || [],
        certifications: profile.certifications || [],
        style: style,
      };

      setCVContent(cvData);
      setActiveTab('cv');

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

  const generateLetter = async () => {
    if (!user) return;

    if (creditBalance < letterCost) {
      setError(`Crédits insuffisants. Requis: ${letterCost} crédits, Disponibles: ${creditBalance} crédits`);
      return;
    }

    if (!targetPosition || !targetCompany) {
      setError('Veuillez renseigner le poste et l\'entreprise cibles');
      return;
    }

    setGeneratingLetter(true);
    setError('');

    try {
      const { data: creditResult } = await supabase.rpc('use_credits_for_service', {
        p_user_id: user.id,
        p_service_code: 'cover_letter_generation',
        p_metadata: {
          target_position: targetPosition,
          target_company: targetCompany
        }
      });

      if (!creditResult.success) {
        setError(creditResult.message || 'Crédits insuffisants');
        return;
      }

      setCreditBalance(creditResult.new_balance);

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setError('Profil non trouvé. Veuillez compléter votre profil.');
        return;
      }

      const letter = {
        candidateName: profile.full_name,
        candidateEmail: user.email,
        targetPosition,
        targetCompany,
        experience: profile.experience_years,
        skills: profile.skills,
        content: `Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de ${targetPosition} au sein de ${targetCompany}.

Fort(e) de ${profile.experience_years} années d'expérience en tant que ${profile.experience_level}, j'ai développé une expertise solide dans les domaines suivants : ${(profile.skills || []).slice(0, 5).join(', ')}.

Mon parcours professionnel m'a permis d'acquérir des compétences clés parfaitement alignées avec les exigences de ce poste. Ma capacité à ${(profile.skills || []).slice(0, 3).join(', ')} me permettra de contribuer efficacement aux objectifs de ${targetCompany}.

${profile.bio || 'Je suis particulièrement motivé(e) par cette opportunité car elle correspond parfaitement à mon projet professionnel.'}

Convaincu(e) que mon profil saura répondre à vos attentes, je serais ravi(e) de vous rencontrer lors d'un entretien afin de vous présenter plus en détail mes motivations et mes compétences.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${profile.full_name}`,
      };

      setLetterContent(letter);
      setActiveTab('letter');

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Lettre générée avec succès',
        message: `Votre lettre de motivation est prête! (${letterCost} crédits utilisés)`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Erreur: ' + error.message);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const downloadCV = () => {
    if (!cvContent) return;
    alert('Téléchargement PDF à venir');
  };

  const downloadLetter = () => {
    if (!letterContent) return;
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
          Génération Documents IA
        </h1>
        <p className="text-gray-600">
          Créez votre CV et lettre de motivation professionnels en quelques clics
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 mb-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="w-5 h-5" />
              <span className="text-sm text-blue-100">Lettre IA</span>
            </div>
            <p className="text-2xl font-bold">{letterCost} ⚡</p>
          </div>
        </div>

        {(creditBalance < cvCost || creditBalance < letterCost) && !loadingCredits && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <p className="text-sm text-yellow-200 mb-2">⚠️ Solde insuffisant pour certains services</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <input
                type="text"
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                placeholder="Ex: Développeur Full Stack"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
                <option value="modern">Moderne</option>
                <option value="classic">Classique</option>
                <option value="creative">Créatif</option>
                <option value="professional">Professionnel</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateCV}
            disabled={generatingCV || loadingCredits || creditBalance < cvCost}
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

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lettre de Motivation IA</h2>
              <p className="text-sm text-gray-600">Coût: {letterCost} crédits</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poste visé *
              </label>
              <input
                type="text"
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                placeholder="Ex: Développeur Full Stack"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entreprise cible *
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Ex: SOTELGUI"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={generateLetter}
            disabled={generatingLetter || loadingCredits || creditBalance < letterCost}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {generatingLetter ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Génération en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Générer ma lettre ({letterCost} ⚡)</span>
              </>
            )}
          </button>

          {letterContent && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">Lettre générée avec succès!</p>
              </div>
              <button
                onClick={downloadLetter}
                className="w-full mt-2 bg-white border-2 border-green-600 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Télécharger PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {(cvContent || letterContent) && (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-4 border-b-2 border-gray-200 mb-6">
            {cvContent && (
              <button
                onClick={() => setActiveTab('cv')}
                className={`px-6 py-3 font-medium border-b-2 -mb-0.5 ${
                  activeTab === 'cv'
                    ? 'text-blue-900 border-blue-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Aperçu CV
              </button>
            )}
            {letterContent && (
              <button
                onClick={() => setActiveTab('letter')}
                className={`px-6 py-3 font-medium border-b-2 -mb-0.5 ${
                  activeTab === 'letter'
                    ? 'text-purple-900 border-purple-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <Mail className="w-5 h-5 inline mr-2" />
                Aperçu Lettre
              </button>
            )}
          </div>

          {activeTab === 'cv' && cvContent && (
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
          )}

          {activeTab === 'letter' && letterContent && (
            <div className="prose max-w-none whitespace-pre-line">
              <p>{letterContent.content}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
