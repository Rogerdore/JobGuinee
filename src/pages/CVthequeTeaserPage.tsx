import React, { useEffect, useState } from 'react';
import { User, Briefcase, Award, MapPin, Lock, Star, ArrowRight } from 'lucide-react';
import { seoCvthequeService, CvthequeTeaserPage } from '../services/seoCvthequeService';
import { seoService } from '../services/seoService';

interface CVthequeTeaserPageProps {
  slug: string;
  onNavigate: (page: string, param?: string) => void;
}

export default function CVthequeTeaserPage({ slug, onNavigate }: CVthequeTeaserPageProps) {
  const [pageData, setPageData] = useState<CvthequeTeaserPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, [slug]);

  async function loadPageData() {
    if (!slug) return;

    setLoading(true);

    const data = await seoCvthequeService.getPage(slug);
    if (!data) {
      setLoading(false);
      return;
    }

    setPageData(data);

    await seoCvthequeService.incrementViewCount(slug);

    const seoConfig = await seoService.getConfig();
    const metaTags = seoService.buildMetaTags(
      {
        ...data,
        id: data.id || '',
        page_path: `/cvtheque/${slug}`,
        page_type: data.page_type,
        is_active: data.is_active || true
      },
      seoConfig
    );
    seoService.updateDocumentHead(metaTags);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des profils...</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Page non trouvée</h1>
          <button
            onClick={() => onNavigate('cvtheque')}
            className="mt-4 inline-block text-orange-600 hover:text-orange-700"
          >
            Retour à la CVthèque
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center text-sm mb-4">
            <button onClick={() => onNavigate('home')} className="hover:underline">Accueil</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate('cvtheque')} className="hover:underline">CVthèque</button>
            <span className="mx-2">/</span>
            <span className="text-blue-200">{pageData.h1}</span>
          </nav>

          <h1 className="text-4xl font-bold mb-4">{pageData.h1}</h1>

          {pageData.intro_text && (
            <p className="text-xl text-blue-100 max-w-3xl">{pageData.intro_text}</p>
          )}

          <div className="mt-6 flex items-center gap-4 text-blue-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-semibold">{pageData.profile_count} profils disponibles</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Aperçu Anonymisé - Accès Limité
              </h2>
              <p className="text-gray-700 mb-4">
                Vous consultez un aperçu anonymisé de nos profils. Pour accéder aux coordonnées complètes
                (nom, email, téléphone, CV détaillé), abonnez-vous à notre CVthèque Premium.
              </p>
              <button
                onClick={() => onNavigate('cvtheque')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Lock className="w-5 h-5" />
                Débloquer l'accès complet
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {pageData.sample_profiles && pageData.sample_profiles.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {pageData.sample_profiles.map((profile, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-lg">
                  Aperçu
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{profile.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {profile.experience_years} ans d'expérience
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {profile.sector && (
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Secteur</p>
                        <p className="text-sm text-gray-900">{profile.sector}</p>
                      </div>
                    </div>
                  )}

                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">Compétences</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 5).map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{profile.skills.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => onNavigate('cvtheque')}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Voir le profil complet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg p-8 mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <Star className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Accédez à {pageData.profile_count}+ Profils Complets
            </h2>
            <p className="text-xl text-blue-100 mb-6">
              Débloquez l'accès complet à notre CVthèque pour consulter les coordonnées, CV détaillés
              et contacter directement les candidats.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('cvtheque')}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2"
              >
                Découvrir nos offres CVthèque
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate('b2b-solutions')}
                className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold"
              >
                Solutions Entreprise
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Pourquoi choisir JobGuinée CVthèque ?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Base de données complète</h3>
              <p className="text-gray-600 text-sm">
                Des milliers de CV de professionnels qualifiés en Guinée
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Profils vérifiés</h3>
              <p className="text-gray-600 text-sm">
                Profils authentiques et régulièrement mis à jour
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Recherche avancée</h3>
              <p className="text-gray-600 text-sm">
                Filtres puissants pour trouver le candidat idéal rapidement
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('cvtheque')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Accéder à la CVthèque
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
