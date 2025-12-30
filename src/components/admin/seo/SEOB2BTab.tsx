import { useState, useEffect } from 'react';
import {
  Building2, TrendingUp, Eye, MousePointer, RefreshCw, Save, CheckCircle,
  AlertCircle, ExternalLink, FileText, Award, Target
} from 'lucide-react';
import { seoB2BPagesService, B2BPage } from '../../../services/seoB2BPagesService';
import { b2bLeadsService } from '../../../services/b2bLeadsService';

export default function SEOB2BTab() {
  const [pages, setPages] = useState<B2BPage[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await seoB2BPagesService.generateB2BPages();

      setStats({
        total_pages: 6,
        active_pages: 6,
        total_visits: 0,
        total_leads: 0,
        conversion_rate: 0
      });
    } catch (error) {
      console.error('Error loading B2B SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePages = async () => {
    setGenerating(true);
    try {
      const result = await seoB2BPagesService.generateB2BPages();
      showMessage('success', `Pages B2B générées avec succès! ${result.created} créées, ${result.updated} mises à jour`);
      loadData();
    } catch (error) {
      showMessage('error', 'Erreur lors de la génération des pages');
    } finally {
      setGenerating(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-600" />
            SEO Solutions B2B
          </h2>
          <p className="text-gray-600 mt-1">
            Gestion des pages B2B orientées conversion entreprise
          </p>
        </div>
        <button
          onClick={generatePages}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Génération...' : 'Générer Pages B2B'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.total_pages}</span>
            </div>
            <p className="text-blue-100 font-medium">Pages B2B Totales</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.active_pages}</span>
            </div>
            <p className="text-green-100 font-medium">Pages Actives</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.total_visits}</span>
            </div>
            <p className="text-purple-100 font-medium">Visites Totales</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.total_leads}</span>
            </div>
            <p className="text-orange-100 font-medium">Leads Générés</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Pages B2B SEO</h3>
          <p className="text-sm text-gray-600">Landing pages optimisées pour conversion entreprise</p>
        </div>

        <div className="divide-y divide-gray-200">
          <PageItem
            title="Hub Solutions Entreprises"
            slug="solutions-entreprises"
            description="Page centrale présentant toutes les solutions B2B"
            icon={Building2}
            color="blue"
          />

          <PageItem
            title="Externalisation de Recrutement"
            slug="externalisation-recrutement"
            description="Service RPO complet pour entreprises"
            icon={Users}
            color="green"
          />

          <PageItem
            title="Logiciel ATS"
            slug="logiciel-ats"
            description="ATS nouvelle génération pour recruteurs"
            icon={TrendingUp}
            color="purple"
          />

          <PageItem
            title="CVthèque Premium"
            slug="cvtheque-premium"
            description="Accès base de données CV qualifiés"
            icon={Database}
            color="orange"
          />

          <PageItem
            title="Solutions Cabinets RH"
            slug="solutions-cabinets-rh"
            description="Outils professionnels pour cabinets"
            icon={Briefcase}
            color="indigo"
          />

          <PageItem
            title="Formations & Coaching"
            slug="formations-coaching-rh"
            description="Programmes de formation RH sur mesure"
            icon={Award}
            color="pink"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Architecture SEO B2B Stratégique
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Mots-clés longue traîne B2B:</strong> "externalisation recrutement guinée", "cabinet recrutement conakry", "logiciel ats guinée"</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Schema.org enrichi:</strong> Product, Service, LocalBusiness, Organization</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Conversion optimisée:</strong> CTA multiples, formulaires intelligents, social proof</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Mobile-first:</strong> Design responsive avec Core Web Vitals optimisés</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold mb-2">
              Prochaine étape : Multilingue FR/EN
            </h4>
            <p className="text-white/90">
              Préparez des versions anglaises pour cibler les entreprises internationales en Guinée
            </p>
          </div>
          <ExternalLink className="w-8 h-8 opacity-80" />
        </div>
      </div>
    </div>
  );
}

interface PageItemProps {
  title: string;
  slug: string;
  description: string;
  icon: any;
  color: string;
}

function PageItem({ title, slug, description, icon: Icon, color }: PageItemProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600'
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition">
            {title}
          </h4>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">/b2b/{slug}</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/b2b/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Voir
          </a>
        </div>
      </div>
    </div>
  );
}

import { Users, Database, Briefcase } from 'lucide-react';
