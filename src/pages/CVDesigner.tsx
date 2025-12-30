import { useState } from 'react';
import { FileText, Upload, Sparkles, CheckCircle, ArrowRight, Shield, Zap, Award, List } from 'lucide-react';
import Layout from '../components/Layout';
import CVUploadWithParser from '../components/profile/CVUploadWithParser';
import CVManager from '../components/cv/CVManager';
import CVWizard from '../components/cv/CVWizard';
import CVTemplateMarketplace from '../components/cv/CVTemplateMarketplace';

interface CVDesignerProps {
  onNavigate: (page: string) => void;
}

type ViewMode = 'entry' | 'manager' | 'wizard' | 'import' | 'templates';

export default function CVDesigner({ onNavigate }: CVDesignerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('entry');
  const [selectedCVId, setSelectedCVId] = useState<string | undefined>(undefined);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  if (viewMode === 'manager') {
    return (
      <Layout currentPage="cv-designer" onNavigate={onNavigate}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <button
              onClick={() => setViewMode('entry')}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 transition"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              Retour
            </button>
            <CVManager
              onCreateNew={() => setViewMode('templates')}
              onEditCV={(cvId) => {
                setSelectedCVId(cvId);
                setViewMode('wizard');
              }}
              onViewCV={(cvId) => {
                setSelectedCVId(cvId);
                alert('Prévisualisation du CV à implémenter');
              }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  if (viewMode === 'wizard') {
    return (
      <CVWizard
        cvId={selectedCVId}
        onSave={(cvId) => {
          alert('CV sauvegardé avec succès!');
          setViewMode('manager');
        }}
        onCancel={() => setViewMode('manager')}
      />
    );
  }

  if (viewMode === 'templates') {
    return (
      <Layout currentPage="cv-designer" onNavigate={onNavigate}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <button
              onClick={() => setViewMode('manager')}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 transition"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              Retour
            </button>
            <CVTemplateMarketplace
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={(templateId) => {
                setSelectedTemplateId(templateId);
                setSelectedCVId(undefined);
                setViewMode('wizard');
              }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  if (viewMode === 'import') {
    return (
      <Layout currentPage="cv-designer" onNavigate={onNavigate}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <button
              onClick={() => setViewMode('entry')}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 transition"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              Retour
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Importer votre CV existant
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Téléchargez votre CV au format PDF, DOCX ou image. Notre système d'analyse gratuit extraira automatiquement vos informations.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">
                      Parsing 100% Gratuit
                    </p>
                    <p className="text-sm text-blue-700">
                      L'analyse de votre CV est gratuite et ne consomme aucun crédit IA. Accessible à tous les candidats.
                    </p>
                  </div>
                </div>
              </div>

              <CVUploadWithParser
                onParseComplete={(data) => {
                  console.log('CV parsed successfully:', data);
                }}
              />

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Rapide</p>
                  <p className="text-xs text-gray-600 mt-1">Analyse en quelques secondes</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Sécurisé</p>
                  <p className="text-xs text-gray-600 mt-1">Vos données restent privées</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Award className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Précis</p>
                  <p className="text-xs text-gray-600 mt-1">Extraction intelligente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="cv-designer" onNavigate={onNavigate}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full mb-6 shadow-lg">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Créez ou améliorez votre CV professionnel
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Optimisé pour le marché guinéen et international. Compatible ATS. Réutilisable pour plusieurs candidatures.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <button
              onClick={() => setViewMode('manager')}
              className="inline-flex items-center gap-2 px-6 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition font-medium"
            >
              <List className="w-5 h-5" />
              Gérer mes CV existants
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div
              onClick={() => setViewMode('templates')}
              className="group bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-blue-500 p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Créer un nouveau CV
              </h3>
              <p className="text-gray-600 mb-6">
                Laissez-vous guider étape par étape pour créer un CV professionnel optimisé avec l'aide de notre assistant IA.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Wizard guidé avec suggestions IA
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Templates professionnels modernes
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Optimisation ATS automatique
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Export PDF haute qualité
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <span className="inline-flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5" />
                </span>
              </div>
            </div>

            <div
              onClick={() => setViewMode('import')}
              className="group bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-green-500 p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Importer un CV existant
              </h3>
              <p className="text-gray-600 mb-6">
                Téléchargez votre CV actuel et notre système d'analyse gratuit extraira automatiquement vos informations.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <strong>Parsing 100% gratuit</strong> (aucun crédit consommé)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Compatible PDF, DOCX, images, CV Canva
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Extraction intelligente des données
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Validation et correction facile
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <span className="inline-flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all">
                  Importer mon CV
                  <ArrowRight className="w-5 h-5" />
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Pourquoi choisir notre module CV ?
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Optimisé marché guinéen
                </h4>
                <p className="text-sm text-gray-600">
                  Adapté aux standards locaux et internationaux pour maximiser vos chances
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Compatible ATS
                </h4>
                <p className="text-sm text-gray-600">
                  Format optimisé pour passer les systèmes de tri automatique des recruteurs
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Réutilisable
                </h4>
                <p className="text-sm text-gray-600">
                  Créez plusieurs versions de votre CV pour différents postes et secteurs
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white text-center shadow-xl">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-3">
              Parsing CV 100% Gratuit
            </h3>
            <p className="text-white/90 max-w-2xl mx-auto text-lg">
              Aucun crédit IA n'est consommé lors de l'analyse de votre CV. Cette fonctionnalité est accessible à tous les candidats sans restriction.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
