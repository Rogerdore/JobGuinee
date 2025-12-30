import React, { useEffect, useState } from 'react';
import { Briefcase, MapPin, Building2, TrendingUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { seoMarketplaceService, MarketplacePage } from '../services/seoMarketplaceService';
import { seoService } from '../services/seoService';
import { schemaService } from '../services/schemaService';
import { supabase } from '../lib/supabase';

interface Job {
  id: string;
  title: string;
  company_name?: string;
  location?: string;
  sector?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  created_at: string;
  companies?: {
    name: string;
    logo_url?: string;
  };
}

interface JobMarketplacePageProps {
  slug: string;
  onNavigate: (page: string, param?: string) => void;
}

export default function JobMarketplacePage({ slug, onNavigate }: JobMarketplacePageProps) {
  const [pageData, setPageData] = useState<MarketplacePage | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 20;

  useEffect(() => {
    loadPageData();
  }, [slug, currentPage]);

  async function loadPageData() {
    if (!slug) return;

    setLoading(true);

    const data = await seoMarketplaceService.getPage(slug);
    if (!data) {
      setLoading(false);
      return;
    }

    setPageData(data);

    await seoMarketplaceService.incrementViewCount(slug);

    const seoConfig = await seoService.getConfig();
    const metaTags = seoService.buildMetaTags(
      {
        ...data,
        id: data.id || '',
        page_path: `/emplois/${slug}`,
        page_type: data.page_type,
        is_active: data.is_active || true
      },
      seoConfig
    );
    seoService.updateDocumentHead(metaTags);

    await loadJobs(data);
    setLoading(false);
  }

  async function loadJobs(data: MarketplacePage) {
    let query = supabase
      .from('jobs')
      .select('*, companies(name, logo_url)', { count: 'exact' })
      .eq('status', 'published');

    if (data.page_type === 'metier' && data.metier) {
      query = query.ilike('title', `%${data.metier}%`);
    } else if (data.page_type === 'secteur' && data.secteur) {
      query = query.eq('sector', data.secteur);
    } else if (data.page_type === 'ville' && data.ville) {
      query = query.eq('location', data.ville);
    } else if (data.page_type === 'niveau' && data.niveau) {
      query = query.eq('experience_level', data.niveau);
    }

    const offset = (currentPage - 1) * jobsPerPage;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + jobsPerPage - 1);

    const { data: jobsData, error, count } = await query;

    if (!error && jobsData) {
      setJobs(jobsData);
      setTotalJobs(count || 0);

      if (jobsData.length > 0 && currentPage === 1) {
        const schemas = jobsData.slice(0, 10).map(job =>
          schemaService.generateJobPostingSchema({
            ...job,
            company_name: job.companies?.name || job.company_name
          })
        );

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
        document.head.appendChild(script);
      }
    }
  }

  function changePage(newPage: number) {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des offres d'emploi...</p>
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
            onClick={() => onNavigate('jobs')}
            className="mt-4 inline-block text-orange-600 hover:text-orange-700"
          >
            Retour aux offres d'emploi
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center text-sm mb-4">
            <button onClick={() => onNavigate('home')} className="hover:underline">Accueil</button>
            <span className="mx-2">/</span>
            <button onClick={() => onNavigate('jobs')} className="hover:underline">Emplois</button>
            <span className="mx-2">/</span>
            <span className="text-orange-200">{pageData.h1}</span>
          </nav>

          <h1 className="text-4xl font-bold mb-4">{pageData.h1}</h1>

          {pageData.intro_text && (
            <p className="text-xl text-orange-100 max-w-3xl">{pageData.intro_text}</p>
          )}

          <div className="mt-6 flex items-center gap-4 text-orange-100">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              <span className="font-semibold">{totalJobs} offres disponibles</span>
            </div>
            {pageData.page_type === 'ville' && pageData.ville && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{pageData.ville}</span>
              </div>
            )}
            {pageData.page_type === 'secteur' && pageData.secteur && (
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span>{pageData.secteur}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune offre disponible</h2>
            <p className="text-gray-600 mb-6">
              Il n'y a pas d'offres d'emploi correspondant à ces critères pour le moment.
            </p>
            <button
              onClick={() => onNavigate('jobs')}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Voir toutes les offres
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Affichage de {(currentPage - 1) * jobsPerPage + 1} à {Math.min(currentPage * jobsPerPage, totalJobs)} sur {totalJobs} offres
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={!hasNextPage}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              {jobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => onNavigate('job-detail', job.id)}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left w-full"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {job.companies?.logo_url && (
                          <img
                            src={job.companies.logo_url}
                            alt={job.companies.name}
                            className="w-12 h-12 object-contain rounded"
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 hover:text-orange-600">
                            {job.title}
                          </h3>
                          <p className="text-gray-600">
                            {job.companies?.name || job.company_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        {job.sector && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{job.sector}</span>
                          </div>
                        )}
                        {job.contract_type && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            {job.contract_type}
                          </span>
                        )}
                        {(job.salary_min || job.salary_max) && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>
                              {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()} GNF
                            </span>
                          </div>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-gray-600 mt-3 line-clamp-2">
                          {job.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => changePage(pageNum)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-orange-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Trouvez votre emploi idéal en Guinée
          </h2>
          <p className="text-gray-600 mb-6">
            JobGuinée est la plateforme N°1 de l'emploi en Guinée. Nous connectons les talents guinéens
            avec les meilleures opportunités professionnelles du pays. Postulez en ligne, suivez vos candidatures
            et décrochez votre prochain emploi.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => onNavigate('jobs')}
              className="text-center p-4 rounded-lg border border-gray-200 hover:border-orange-500 transition-colors"
            >
              <Briefcase className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Toutes les offres</h3>
              <p className="text-sm text-gray-600">Parcourez toutes nos offres d'emploi</p>
            </button>

            <button
              onClick={() => onNavigate('cvtheque')}
              className="text-center p-4 rounded-lg border border-gray-200 hover:border-orange-500 transition-colors"
            >
              <Building2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">CVthèque</h3>
              <p className="text-sm text-gray-600">Accédez à notre base de CV</p>
            </button>

            <button
              onClick={() => onNavigate('formations')}
              className="text-center p-4 rounded-lg border border-gray-200 hover:border-orange-500 transition-colors"
            >
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Formations</h3>
              <p className="text-sm text-gray-600">Développez vos compétences</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
