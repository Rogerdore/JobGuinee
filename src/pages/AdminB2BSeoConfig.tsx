import { useEffect, useState } from 'react';
import {
  Save, Eye, Search, RefreshCw, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Globe, FileText, Settings, ToggleLeft,
  ToggleRight, ArrowLeft
} from 'lucide-react';
import { b2bLeadsService, B2BPageConfig } from '../services/b2bLeadsService';
import AdminLayout from '../components/AdminLayout';

export default function AdminB2BSeoConfig() {
  const [pageConfig, setPageConfig] = useState<B2BPageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [globalSeo, setGlobalSeo] = useState({
    title: 'Solutions B2B RH en Guinée | Recrutement, Externalisation & IA – JobGuinée',
    description: 'Solutions RH B2B complètes : externalisation du recrutement, ATS, matching IA, formation et conseil RH pour entreprises et institutions en Guinée et Afrique de l\'Ouest.',
    keywords: 'solutions b2b rh guinée, externalisation recrutement, ATS digital, CVthèque intelligente, formation professionnelle, conseil RH, recrutement minier, recrutement PME, cabinet RH, matching IA recrutement'
  });

  useEffect(() => {
    loadPageConfig();
  }, []);

  const loadPageConfig = async () => {
    setIsLoading(true);
    const result = await b2bLeadsService.getAllPageConfig();
    if (result.success && result.data) {
      setPageConfig(result.data);

      const heroSection = result.data.find(s => s.section_name === 'hero');
      if (heroSection?.seo_config) {
        setGlobalSeo(prev => ({
          ...prev,
          ...(heroSection.seo_config as any)
        }));
      }
    }
    setIsLoading(false);
  };

  const handleSectionUpdate = async (sectionName: string, updates: Partial<B2BPageConfig>) => {
    setIsSaving(true);
    setSaveStatus('idle');

    const result = await b2bLeadsService.updatePageConfig(sectionName, updates);

    if (result.success) {
      setSaveStatus('success');
      await loadPageConfig();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }

    setIsSaving(false);
  };

  const handleToggleSection = async (sectionName: string, isActive: boolean) => {
    await handleSectionUpdate(sectionName, { is_active: !isActive });
  };

  const handleGlobalSeoSave = async () => {
    await handleSectionUpdate('hero', {
      seo_config: globalSeo
    });
  };

  const getSectionIcon = (sectionName: string) => {
    const icons: Record<string, any> = {
      hero: Globe,
      target_audience: Users,
      outsourcing: Briefcase,
      digital_solutions: Cpu,
      training: GraduationCap,
      consulting: FileText,
      offers: Package,
      why_choose: Award
    };
    return icons[sectionName] || FileText;
  };

  const renderPreview = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-[#0E2F56]" />
          <h3 className="text-lg font-bold text-gray-900">
            Aperçu Google - Résultat de recherche
          </h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Globe className="w-4 h-4" />
              <span>jobguinee.com › solutions-b2b</span>
            </div>
            <h4 className="text-xl text-blue-600 hover:underline cursor-pointer mb-1">
              {globalSeo.title}
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {globalSeo.description}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Mots-clés ciblés :</p>
            <div className="flex flex-wrap gap-2">
              {globalSeo.keywords.split(',').slice(0, 5).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                >
                  {keyword.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500">Longueur du titre :</p>
                <p className={`font-bold ${globalSeo.title.length > 60 ? 'text-orange-600' : 'text-green-600'}`}>
                  {globalSeo.title.length} caractères {globalSeo.title.length > 60 ? '(trop long)' : '(optimal)'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Longueur de la description :</p>
                <p className={`font-bold ${globalSeo.description.length > 160 ? 'text-orange-600' : 'text-green-600'}`}>
                  {globalSeo.description.length} caractères {globalSeo.description.length > 160 ? '(trop long)' : '(optimal)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Configuration SEO - Solutions B2B
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez le référencement et le contenu de la page Solutions B2B
                </p>
              </div>
            </div>

            {saveStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">Modifications enregistrées avec succès</p>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium">Erreur lors de l'enregistrement</p>
              </div>
            )}
          </div>

          {/* Global SEO Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-[#FF8C00]" />
                <h2 className="text-xl font-bold text-gray-900">
                  SEO Global de la page
                </h2>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Masquer' : 'Aperçu'} Google
              </button>
            </div>

            {showPreview && (
              <div className="mb-6">
                {renderPreview()}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title (Balise titre)
                </label>
                <input
                  type="text"
                  value={globalSeo.title}
                  onChange={(e) => setGlobalSeo(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56]"
                  placeholder="Titre SEO (50-60 caractères recommandés)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {globalSeo.title.length} caractères -
                  {globalSeo.title.length < 50 && ' Trop court'}
                  {globalSeo.title.length >= 50 && globalSeo.title.length <= 60 && ' ✓ Optimal'}
                  {globalSeo.title.length > 60 && ' Trop long (sera tronqué)'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={globalSeo.description}
                  onChange={(e) => setGlobalSeo(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] resize-none"
                  placeholder="Description SEO (155-160 caractères recommandés)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {globalSeo.description.length} caractères -
                  {globalSeo.description.length < 150 && ' Trop court'}
                  {globalSeo.description.length >= 150 && globalSeo.description.length <= 165 && ' ✓ Optimal'}
                  {globalSeo.description.length > 165 && ' Trop long (sera tronqué)'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mots-clés SEO (séparés par des virgules)
                </label>
                <textarea
                  value={globalSeo.keywords}
                  onChange={(e) => setGlobalSeo(prev => ({ ...prev, keywords: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] resize-none"
                  placeholder="mot-clé 1, mot-clé 2, mot-clé 3, ..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {globalSeo.keywords.split(',').length} mots-clés définis
                </p>
              </div>

              <button
                onClick={handleGlobalSeoSave}
                disabled={isSaving}
                className="w-full py-3 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer le SEO global
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sections Configuration */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-[#FF8C00]" />
              <h2 className="text-xl font-bold text-gray-900">
                Configuration des sections
              </h2>
            </div>

            <div className="space-y-4">
              {pageConfig.map((section) => {
                const IconComponent = getSectionIcon(section.section_name);
                const isExpanded = expandedSection === section.section_name;

                return (
                  <div
                    key={section.id}
                    className="border-2 border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 bg-gray-50">
                      <div className="flex items-center gap-3 flex-1">
                        <IconComponent className="w-5 h-5 text-[#0E2F56]" />
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {section.title || section.section_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {section.subtitle || 'Section ' + section.section_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleSection(section.section_name, section.is_active)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                            section.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {section.is_active ? (
                            <>
                              <ToggleRight className="w-5 h-5" />
                              Activé
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5" />
                              Désactivé
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setExpandedSection(isExpanded ? null : section.section_name)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t-2 border-gray-200 bg-white">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Titre de la section
                            </label>
                            <input
                              type="text"
                              value={section.title || ''}
                              onChange={(e) => {
                                const updatedConfig = pageConfig.map(s =>
                                  s.section_name === section.section_name
                                    ? { ...s, title: e.target.value }
                                    : s
                                );
                                setPageConfig(updatedConfig);
                              }}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56]"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Sous-titre
                            </label>
                            <input
                              type="text"
                              value={section.subtitle || ''}
                              onChange={(e) => {
                                const updatedConfig = pageConfig.map(s =>
                                  s.section_name === section.section_name
                                    ? { ...s, subtitle: e.target.value }
                                    : s
                                );
                                setPageConfig(updatedConfig);
                              }}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56]"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Contenu JSON (avancé)
                            </label>
                            <textarea
                              value={JSON.stringify(section.content, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  const updatedConfig = pageConfig.map(s =>
                                    s.section_name === section.section_name
                                      ? { ...s, content: parsed }
                                      : s
                                  );
                                  setPageConfig(updatedConfig);
                                } catch (error) {
                                  // Invalid JSON, don't update
                                }
                              }}
                              rows={6}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] resize-none font-mono text-sm"
                            />
                          </div>

                          <button
                            onClick={() => handleSectionUpdate(section.section_name, {
                              title: section.title,
                              subtitle: section.subtitle,
                              content: section.content
                            })}
                            disabled={isSaving}
                            className="w-full py-2 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Enregistrer cette section
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={loadPageConfig}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
              >
                <RefreshCw className="w-5 h-5" />
                Actualiser
              </button>
              <a
                href="/solutions-b2b"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
              >
                <Eye className="w-5 h-5" />
                Voir la page
              </a>
              <button
                onClick={handleGlobalSeoSave}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FF8C00] hover:bg-[#FF8C00]/90 rounded-lg font-medium transition"
              >
                <Save className="w-5 h-5" />
                Tout enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Missing imports that need to be added
import { Users, Briefcase, GraduationCap, Package, Award, Cpu } from 'lucide-react';
