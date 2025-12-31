import { useEffect, useState } from 'react';
import {
  Building2, Users, Landmark, Briefcase, GraduationCap, User,
  CheckCircle2, Sparkles, BarChart3, Database, FileText, TrendingUp,
  Award, Shield, Zap, Target, ArrowRight, Hammer, School, HelpCircle,
  ChevronDown, ChevronUp, Cpu, Clock, Globe, UserCheck, Phone, MessageCircle,
  Send, Mail, MessageSquare, Handshake
} from 'lucide-react';
import { b2bLeadsService, B2BPageConfig } from '../services/b2bLeadsService';
import B2BLeadForm from '../components/b2b/B2BLeadForm';
import { useSEO } from '../hooks/useSEO';
import { schemaService } from '../services/schemaService';

interface B2BSolutionsProps {
  onNavigate?: (page: string) => void;
}

export default function B2BSolutions({ onNavigate = () => {} }: B2BSolutionsProps) {
  const [pageConfig, setPageConfig] = useState<B2BPageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Qu'est-ce que l'externalisation du recrutement et comment fonctionne-t-elle ?",
      answer: "L'externalisation du recrutement consiste à confier à JobGuinée la gestion complète de vos processus de recrutement. Nous prenons en charge l'analyse du besoin, la rédaction et publication d'annonces, la présélection des candidats, les entretiens, et la présentation de shortlists qualifiées. Vous gagnez du temps et bénéficiez de notre expertise locale du marché de l'emploi guinéen."
    },
    {
      question: "Quels types d'entreprises peuvent bénéficier des solutions B2B de JobGuinée ?",
      answer: "Nos solutions s'adressent aux entreprises privées (PME, grandes entreprises, secteur minier), institutions publiques et internationales, ONG, cabinets RH et agences de placement, ainsi qu'aux centres de formation et formateurs indépendants. Chaque solution est adaptable selon votre taille et vos besoins spécifiques."
    },
    {
      question: "Comment fonctionne le matching IA pour les recruteurs ?",
      answer: "Notre système de matching par intelligence artificielle analyse automatiquement les CV de notre CVthèque et les compare aux critères de vos offres d'emploi. Il génère des scores de compatibilité, identifie les meilleurs profils et vous présente des rapports détaillés pour accélérer vos décisions de recrutement."
    },
    {
      question: "Proposez-vous des solutions de formation pour les entreprises ?",
      answer: "Oui, nous offrons une plateforme complète pour les organismes de formation : publication d'annonces de formations, mise en avant premium, accès à notre réseau de talents, et possibilité de développer des programmes de formation sur mesure adaptés aux besoins spécifiques de votre organisation."
    },
    {
      question: "Qu'est-ce qu'un pack Enterprise et quels sont ses avantages ?",
      answer: "Les packs Enterprise sont des offres tout-en-un combinant plusieurs services (ATS, CVthèque, matching IA, crédits, support prioritaire). Ils sont conçus pour les organisations ayant des besoins récurrents en recrutement et offrent des tarifs préférentiels ainsi qu'un accompagnement personnalisé."
    }
  ];

  useEffect(() => {
    loadPageConfig();
  }, []);

  const loadPageConfig = async () => {
    const result = await b2bLeadsService.getPageConfig();
    if (result.success && result.data) {
      setPageConfig(result.data);
    }
    setIsLoading(false);
  };

  const getConfigSection = (sectionName: string) => {
    return pageConfig.find(section => section.section_name === sectionName);
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      building: Building2,
      hammer: Hammer,
      landmark: Landmark,
      users: Users,
      school: School,
      user: User
    };
    return icons[iconName] || Building2;
  };

  const heroSection = getConfigSection('hero');
  const seoConfig = (heroSection?.seo_config as any) || {};

  useSEO({
    title: seoConfig.title || 'Solutions B2B RH en Guinée | Externalisation Recrutement, ATS, CVthèque | JobGuinée',
    description: seoConfig.description || 'Solutions RH B2B professionnelles en Guinée : externalisation complète du recrutement, logiciel ATS nouvelle génération, CVthèque premium, matching IA, formation RH et conseil stratégique. Accompagnement PME, mines, ONG, institutions.',
    keywords: seoConfig.keywords || 'solutions b2b rh guinée, externalisation recrutement guinée, cabinet recrutement guinée, ATS logiciel guinée, CVthèque premium guinée, recrutement clé en main, mission rh externalisée, recrutement minier guinée, recrutement industriel, conseil rh guinée, formation rh entreprise, matching ia recrutement',
    canonical: 'https://jobguinee.com/b2b-solutions',
    ogType: 'website',
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'JobGuinée',
        'url': 'https://jobguinee.com',
        'logo': 'https://jobguinee.com/logo.png',
        'description': 'Leader des solutions RH B2B en Guinée. Externalisation de recrutement, ATS, CVthèque, formation et conseil RH pour entreprises, ONG et institutions.',
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': 'GN',
          'addressLocality': 'Conakry',
          'addressRegion': 'Conakry'
        },
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'Service Client B2B',
          'availableLanguage': ['fr', 'en']
        },
        'sameAs': [
          'https://linkedin.com/company/jobguinee',
          'https://facebook.com/jobguinee'
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Solutions B2B RH JobGuinée',
        'description': 'Suite complète de solutions RH pour entreprises en Guinée : externalisation recrutement, ATS, CVthèque, matching IA, formations',
        'brand': {
          '@type': 'Brand',
          'name': 'JobGuinée'
        },
        'offers': {
          '@type': 'AggregateOffer',
          'priceCurrency': 'GNF',
          'availability': 'https://schema.org/InStock',
          'url': 'https://jobguinee.com/b2b-solutions'
        },
        'category': 'Solutions RH Entreprise',
        'audience': {
          '@type': 'Audience',
          'audienceType': 'Entreprises, ONG, Institutions, Cabinets RH'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Externalisation de Recrutement en Guinée',
        'provider': {
          '@type': 'Organization',
          'name': 'JobGuinée'
        },
        'serviceType': 'RPO - Recruitment Process Outsourcing',
        'areaServed': {
          '@type': 'Country',
          'name': 'Guinée'
        },
        'description': 'Service complet d\'externalisation de recrutement : sourcing, présélection, évaluation, entretiens et recommandations. Expertise marché guinéen.',
        'termsOfService': 'https://jobguinee.com/terms'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'ATS JobGuinée',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web',
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'GNF'
        },
        'description': 'Logiciel ATS (Applicant Tracking System) pour gérer vos recrutements en Guinée. Interface intuitive, automatisations IA, analytics.',
        'featureList': ['Gestion candidatures', 'Matching IA', 'Analytics temps réel', 'Collaboration équipe']
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqItems.map(item => ({
          '@type': 'Question',
          'name': item.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.answer
          }
        }))
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Accueil',
            'item': 'https://jobguinee.com'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Solutions B2B',
            'item': 'https://jobguinee.com/b2b-solutions'
          }
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'JobGuinée',
        'image': 'https://jobguinee.com/logo.png',
        'priceRange': 'Sur devis',
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': 'GN',
          'addressLocality': 'Conakry'
        },
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': '9.6412',
          'longitude': '-13.5784'
        },
        'url': 'https://jobguinee.com',
        'telephone': '+224XXXXXXXXX',
        'openingHoursSpecification': {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          'opens': '08:00',
          'closes': '18:00'
        }
      }
    ]
  });
  const targetAudienceSection = getConfigSection('target_audience');
  const outsourcingSection = getConfigSection('outsourcing');
  const digitalSolutionsSection = getConfigSection('digital_solutions');
  const trainingSection = getConfigSection('training');
  const consultingSection = getConfigSection('consulting');
  const offersSection = getConfigSection('offers');
  const whyChooseSection = getConfigSection('why_choose');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - SEO Optimized */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Solutions B2B RH – Recrutement, Externalisation & Solutions Digitales
            </h1>
            <h2 className="text-xl md:text-2xl mb-8 text-gray-200 font-semibold">
              Des solutions RH complètes pour entreprises, institutions, cabinets et acteurs de la formation en Guinée
            </h2>
            <div className="text-left max-w-3xl mx-auto mb-8 text-base md:text-lg leading-relaxed text-gray-100">
              <p className="mb-4">
                JobGuinée accompagne les entreprises, institutions, ONG, cabinets RH et organismes de formation dans la gestion complète de leurs besoins en ressources humaines. De l'externalisation du recrutement à la digitalisation des processus RH, en passant par la formation, le conseil et l'intelligence artificielle, nos solutions B2B s'adaptent à tous les niveaux d'organisation et de maturité RH.
              </p>
              <p>
                Que vous soyez une PME guinéenne, une société minière internationale, une ONG humanitaire ou un cabinet de recrutement, nous mettons à votre disposition des outils digitaux performants combinés à une expertise humaine locale pour optimiser vos recrutements et développer vos talents.
              </p>
            </div>

              {heroSection.content?.points && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  {heroSection.content.points.map((point: string, index: number) => (
                    <div key={index} className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                      <CheckCircle2 className="w-5 h-5 text-[#FF8C00] flex-shrink-0" />
                      <span className="text-sm font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-8 py-4 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white font-bold rounded-xl transition flex items-center gap-2"
                >
                  {heroSection.content?.cta_primary || 'Confier un recrutement'}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl transition border-2 border-white/20"
                >
                  {heroSection.content?.cta_secondary || 'Parler à un expert'}
                </button>
              </div>
            </div>
          </div>
        </section>

      {/* Contact Admin Section - Distinct & Highlighted */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#FF8C00] to-[#FF8C00]/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Besoin d'un accompagnement personnalisé ?
            </h3>
            <p className="text-white/90 text-lg">
              Contactez directement notre équipe pour discuter de vos besoins RH
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a
              href="https://wa.me/224XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition p-8 flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-600 mb-1">WhatsApp Admin</p>
                <p className="text-2xl font-bold text-gray-900">+224 XXX XX XX XX</p>
                <p className="text-sm text-gray-600 mt-1">Réponse rapide sous 1h</p>
              </div>
              <ArrowRight className="w-6 h-6 text-green-600 group-hover:translate-x-1 transition" />
            </a>

            <a
              href="tel:+224XXXXXXXXX"
              className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition p-8 flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-600 mb-1">Téléphone Admin</p>
                <p className="text-2xl font-bold text-gray-900">+224 XXX XX XX XX</p>
                <p className="text-sm text-gray-600 mt-1">Du lundi au vendredi, 8h-18h</p>
              </div>
              <ArrowRight className="w-6 h-6 text-blue-600 group-hover:translate-x-1 transition" />
            </a>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/90 text-sm">
              Ou remplissez le formulaire ci-dessous pour être recontacté sous 24h
            </p>
          </div>
        </div>
      </section>

      {/* Target Audience Section - SEO Enhanced */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              À qui s'adressent nos solutions RH ?
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Des solutions adaptées à chaque type d'organisation en Guinée
            </p>
            <div className="max-w-4xl mx-auto text-gray-700 leading-relaxed">
              <p className="mb-4">
                JobGuinée propose des solutions RH sur mesure pour répondre aux besoins spécifiques de chaque secteur d'activité. Notre expertise du marché guinéen et nos outils digitaux nous permettent d'accompagner efficacement les PME locales, les grands projets miniers, les institutions internationales, les cabinets RH partenaires et les organismes de formation professionnelle.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Entreprises et PME */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-8 border-2 border-transparent hover:border-[#FF8C00]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Solutions RH pour entreprises et PME
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Que vous soyez une startup, une PME en croissance ou une grande entreprise établie en Guinée, nos solutions de recrutement, d'ATS digital et de CVthèque vous permettent de structurer vos processus RH et d'accéder aux meilleurs talents du marché local. Optimisez vos recrutements avec nos outils digitaux et notre accompagnement personnalisé.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center text-[#0E2F56] font-medium group-hover:text-[#FF8C00]"
              >
                Découvrir nos solutions entreprise
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Secteur Minier */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-8 border-2 border-transparent hover:border-[#FF8C00]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Hammer className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Solutions RH pour mines et grands projets
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Le secteur minier guinéen nécessite des solutions RH robustes et scalables. Nos services d'externalisation de recrutement, de matching IA et notre CVthèque spécialisée vous permettent de recruter rapidement des profils techniques qualifiés (ingénieurs, géologues, techniciens) tout en respectant les exigences de conformité et de contentu local.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center text-[#0E2F56] font-medium group-hover:text-[#FF8C00]"
              >
                Solutions pour le secteur minier
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* ONG et Institutions */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-8 border-2 border-transparent hover:border-[#FF8C00]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Solutions RH pour ONG et institutions
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Les organisations internationales, ONG humanitaires et institutions publiques guinéennes bénéficient de nos processus de recrutement conformes aux standards internationaux. Accédez à notre réseau de professionnels qualifiés et gérez vos recrutements de manière transparente et efficace avec nos outils de reporting avancés.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center text-[#0E2F56] font-medium group-hover:text-[#FF8C00]"
              >
                Solutions pour ONG et institutions
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Cabinets RH */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-8 border-2 border-transparent hover:border-[#FF8C00]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Solutions pour cabinets RH et agences
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Cabinets de recrutement, agences de placement et consultants RH en Guinée : renforcez votre offre de services avec notre plateforme B2B. Accédez à notre CVthèque premium, utilisez nos outils d'ATS pour gérer vos missions clients, et proposez des services de matching IA à valeur ajoutée pour vous démarquer sur le marché.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center text-[#0E2F56] font-medium group-hover:text-[#FF8C00]"
              >
                Devenir partenaire cabinet RH
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Centres de formation */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-8 border-2 border-transparent hover:border-[#FF8C00]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <School className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Solutions pour centres de formation et formateurs
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Organismes de formation professionnelle, centres de coaching et formateurs indépendants : publiez vos programmes de formation sur JobGuinée, bénéficiez de notre mise en avant premium et accédez à un réseau qualifié de professionnels guinéens cherchant à développer leurs compétences. Développez votre visibilité et remplissez vos sessions de formation.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center text-[#0E2F56] font-medium group-hover:text-[#FF8C00]"
              >
                Solutions pour la formation
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Formateurs individuels */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-8 border-2 border-transparent hover:border-[#FF8C00]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Solutions pour coachs et consultants
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Coachs professionnels, consultants en développement personnel et experts métiers : utilisez JobGuinée pour promouvoir vos services de coaching individuel ou collectif. Créez votre profil formateur premium, publiez vos offres de coaching et connectez-vous avec des professionnels et entreprises guinéennes en quête d'accompagnement personnalisé.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center text-[#0E2F56] font-medium group-hover:text-[#FF8C00]"
              >
                Devenir coach partenaire
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Outsourcing Section - SEO Pillar */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-[#FF8C00] text-white rounded-full text-sm font-bold mb-4">
              SERVICE CLÉ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Externalisation du recrutement en Guinée – Service clé en main
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Confiez-nous la gestion complète de vos recrutements et concentrez-vous sur votre coeur de métier
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-8">
              <p className="mb-4">
                L'externalisation du recrutement (ou RPO - Recruitment Process Outsourcing) consiste à déléguer tout ou partie de vos processus de recrutement à JobGuinée. Cette solution est particulièrement adaptée aux entreprises qui souhaitent recruter efficacement en Guinée sans mobiliser leurs équipes internes sur des tâches chronophages de sourcing, de tri de CV et de présélection.
              </p>
              <p className="mb-4">
                Notre service d'externalisation de recrutement prend en charge l'intégralité du processus, depuis l'analyse de votre besoin jusqu'à la présentation d'une shortlist de candidats qualifiés, présélectionnés et documentés. Vous gagnez du temps précieux, réduisez vos coûts de recrutement et bénéficiez de notre connaissance approfondie du marché de l'emploi guinéen.
              </p>
              <p>
                Que vous ayez besoin de recruter un cadre dirigeant, des profils techniques pour le secteur minier, des experts en finance ou des agents administratifs, JobGuinée mobilise son réseau, ses outils digitaux (ATS, CVthèque, matching IA) et son expertise RH locale pour identifier les meilleurs talents disponibles en Guinée.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-[#FF8C00]" />
                Notre processus d'externalisation de recrutement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0E2F56] text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-lg">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Analyse et cadrage du besoin</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Nous analysons en détail votre besoin en recrutement : profil recherché, compétences techniques et soft skills, expérience requise, niveau de rémunération, contexte organisationnel. Nous définissons ensemble les critères de sélection et le processus de validation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0E2F56] text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-lg">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Sourcing multi-canal et diffusion</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Nous rédigeons une annonce attractive et la diffusons sur JobGuinée et nos canaux partenaires. Nous activons également notre CVthèque de talents guinéens et effectuons un sourcing proactif via notre réseau professionnel pour identifier des candidats passifs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0E2F56] text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-lg">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Présélection et évaluation professionnelle</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Notre équipe RH analyse tous les CV reçus, effectue des entretiens téléphoniques de préqualification, vérifie les références professionnelles et évalue l'adéquation des candidats avec votre culture d'entreprise et vos exigences techniques.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0E2F56] text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-lg">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Shortlist documentée et rapport RH</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Nous vous présentons une shortlist de 3 à 5 candidats présélectionnés, accompagnée de fiches détaillées, d'évaluations professionnelles et d'un rapport RH complet. Nous organisons et coordonnons les entretiens finaux avec votre équipe.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-[#FF8C00]" />
                Avantages de l'externalisation de recrutement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FF8C00] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Gain de temps significatif</p>
                    <p className="text-sm text-gray-600">Libérez vos équipes RH des tâches opérationnelles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FF8C00] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Expertise locale du marché</p>
                    <p className="text-sm text-gray-600">Connaissance approfondie du marché de l'emploi guinéen</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FF8C00] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Qualité et fiabilité</p>
                    <p className="text-sm text-gray-600">Processus structuré et candidats vérifiés</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FF8C00] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Réduction des coûts</p>
                    <p className="text-sm text-gray-600">Pas de frais fixes, tarification à la performance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowForm(true)}
                className="px-8 py-4 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white font-bold rounded-xl transition inline-flex items-center gap-2 text-lg shadow-lg"
              >
                Confier un recrutement à JobGuinée
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-sm text-gray-600 mt-4">
                Réponse sous 24h • Devis personnalisé gratuit • Sans engagement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Solutions Section */}
      {digitalSolutionsSection && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Sparkles className="w-12 h-12 text-[#FF8C00] mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {digitalSolutionsSection.title}
              </h2>
              <p className="text-xl text-gray-600">
                {digitalSolutionsSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {digitalSolutionsSection.content?.solutions?.map((solution: any, index: number) => {
                const icons = [BarChart3, Sparkles, Database, FileText, TrendingUp];
                const IconComponent = icons[index % icons.length];
                return (
                  <a
                    key={index}
                    href={solution.link}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-6 border-2 border-transparent hover:border-[#0E2F56]"
                  >
                    <IconComponent className="w-10 h-10 text-[#FF8C00] mb-4 group-hover:scale-110 transition" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {solution.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {solution.description}
                    </p>
                    <div className="flex items-center text-[#0E2F56] font-medium text-sm">
                      Découvrir
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Training Section */}
      {trainingSection && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-yellow-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <GraduationCap className="w-12 h-12 text-[#FF8C00] mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {trainingSection.title}
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  {trainingSection.subtitle}
                </p>
                <p className="text-gray-700 mb-6">
                  {trainingSection.content?.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {trainingSection.content?.services?.map((service: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#FF8C00] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{service}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/formations"
                    className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-bold rounded-xl transition text-center"
                  >
                    Publier une formation
                  </a>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-white hover:bg-gray-50 text-[#0E2F56] font-bold rounded-xl transition border-2 border-[#0E2F56]"
                  >
                    Devenir formateur partenaire
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                      <School className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-bold text-gray-900">Formations certifiantes</p>
                        <p className="text-sm text-gray-600">Programmes reconnus</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                      <Users className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-bold text-gray-900">Coaching individuel</p>
                        <p className="text-sm text-gray-600">Accompagnement personnalisé</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                      <Target className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="font-bold text-gray-900">Formation sur mesure</p>
                        <p className="text-sm text-gray-600">Adaptée à vos besoins</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Consulting Section */}
      {consultingSection && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Briefcase className="w-12 h-12 text-[#0E2F56] mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {consultingSection.title}
              </h2>
              <p className="text-xl text-gray-600">
                {consultingSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consultingSection.content?.services?.map((service: string, index: number) => (
                <div key={index} className="bg-gradient-to-br from-[#0E2F56] to-[#1a4275] rounded-2xl shadow-lg p-6 text-white">
                  <CheckCircle2 className="w-8 h-8 text-[#FF8C00] mb-4" />
                  <p className="font-semibold">{service}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offers Section */}
      {offersSection && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {offersSection.title}
              </h2>
              <p className="text-xl text-gray-600">
                {offersSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {offersSection.content?.packs?.map((pack: any, index: number) => (
                <a
                  key={index}
                  href={pack.link}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-6 text-center border-2 border-transparent hover:border-[#FF8C00]"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-[#FF8C00]/80 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {pack.name}
                  </h3>
                  <div className="flex items-center justify-center text-[#0E2F56] font-medium text-sm">
                    Découvrir
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                  </div>
                </a>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowForm(true)}
                className="px-8 py-4 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-bold rounded-xl transition inline-flex items-center gap-2"
              >
                Demander un devis personnalisé
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Section - SEO EEAT */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir JobGuinée comme partenaire RH ?
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Un partenaire RH local qui combine expertise humaine et technologies digitales
            </p>
            <div className="max-w-4xl mx-auto text-gray-700 leading-relaxed text-left">
              <p>
                JobGuinée se positionne comme le leader des solutions RH B2B en Guinée grâce à une combinaison unique d'expertise locale du marché de l'emploi, d'outils technologiques performants (ATS, matching IA, CVthèque) et d'un accompagnement humain personnalisé. Nos équipes RH basées à Conakry comprennent les spécificités du recrutement en Guinée et vous garantissent des solutions adaptées à votre contexte organisationnel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-[#FF8C00]/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Expertise locale
              </h3>
              <p className="text-gray-600">
                Connaissance approfondie du marché de l'emploi guinéen, des secteurs d'activité et des attentes des candidats locaux
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-[#FF8C00]/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Équipes RH professionnelles
              </h3>
              <p className="text-gray-600">
                Des consultants RH expérimentés qui maîtrisent les processus de recrutement et accompagnent vos projets de A à Z
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-[#FF8C00]/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Données fiables
              </h3>
              <p className="text-gray-600">
                Vérification systématique des CV, des références professionnelles et conformité aux standards de sécurité des données
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-[#FF8C00]/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Solutions hybrides (humain + IA)
              </h3>
              <p className="text-gray-600">
                Le meilleur des deux mondes : intelligence artificielle pour l'efficacité et expertise humaine pour la pertinence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Section - Integrated from PartnerHub */}
      <section id="devenir-partenaire" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full mb-4">
              <Handshake className="w-5 h-5" />
              <span className="font-bold">Partenariat Professionnel</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Devenir partenaire JobGuinée
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Publiez vos offres d'emploi et accédez à nos solutions RH professionnelles
            </p>
          </div>

          {/* Important Notice - Business Rules */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white border-2 border-green-500 rounded-2xl shadow-xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Règles de publication pour les partenaires
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-gray-800 leading-relaxed">
                    <p>
                      <strong>Pour publier une offre d'emploi sur JobGuinée</strong>, un partenaire doit soit{' '}
                      <strong className="text-green-700">confier la publication à l'administrateur JobGuinée</strong>, soit{' '}
                      <strong className="text-green-700">créer un compte recruteur</strong> afin de publier et gérer ses offres en toute autonomie.
                    </p>
                    <p className="mt-3">
                      Aucune publication directe n'est autorisée sans compte ou validation administrative.
                      Cette politique garantit la qualité des offres et la sécurité de tous nos utilisateurs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Partner Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {/* Option 1 - Admin Publication */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-green-500 transition">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Option 1 : Confier la publication à JobGuinée
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Notre équipe prend en charge la publication complète de vos offres d'emploi avec accompagnement personnalisé
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Publication gérée par l'équipe JobGuinée</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Accompagnement personnalisé du début à la fin</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Optimisation et visibilité maximale garanties</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Traçabilité administrative complète</span>
                </div>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                Contacter l'administrateur
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Option 2 - Create Account */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border-2 border-green-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                  RECOMMANDÉ
                </span>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Option 2 : Créer un compte recruteur
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Publiez en toute autonomie et accédez à tous nos outils RH professionnels
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Publication autonome de vos offres</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Accès ATS complet et pipeline de candidatures</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">CVthèque premium et matching IA</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Packs Enterprise disponibles</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('signup')}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              >
                <User className="w-5 h-5" />
                Créer un compte recruteur
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Partner Benefits */}
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
              Pourquoi devenir partenaire ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-transparent hover:border-green-500 transition">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Publication simplifiée
                </h4>
                <p className="text-gray-600">
                  Publiez vos offres en quelques clics. Nous nous occupons de la diffusion et de la qualité.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-transparent hover:border-blue-500 transition">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Candidatures qualifiées
                </h4>
                <p className="text-gray-600">
                  Recevez uniquement des candidatures correspondant précisément à vos critères.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-transparent hover:border-purple-500 transition">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Visibilité maximale
                </h4>
                <p className="text-gray-600">
                  Bénéficiez de notre audience de +50,000 candidats actifs en Guinée.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-[#0E2F56] to-[#1a4275] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Prêt à devenir partenaire JobGuinée ?
              </h3>
              <p className="text-blue-100 mb-6">
                Rejoignez les entreprises, cabinets RH et institutions qui nous font confiance pour leurs recrutements en Guinée
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-8 py-4 bg-white text-[#0E2F56] font-bold rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  Démarrer maintenant
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="https://wa.me/224XXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Parler à un expert
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Targeted Diffusion Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white px-6 py-3 rounded-full mb-4">
              <Send className="w-5 h-5" />
              <span className="font-bold">Nouveau service</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Diffusion Ciblée Multicanale
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Maximisez la visibilité de vos annonces en touchant directement les candidats qualifiés via Email, SMS et WhatsApp
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#FF8C00]">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Principe de la diffusion ciblée
              </h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Après validation de votre annonce d'emploi ou de formation, vous pouvez la diffuser à une audience précisément ciblée issue de notre CVthèque premium.
                Filtrez par métier, secteur, localisation, expérience et niveau de profil pour atteindre uniquement les candidats qui correspondent vraiment à votre besoin.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  Disponible uniquement pour les annonces validées
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Avantages Business
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Gain de temps considérable</p>
                    <p className="text-sm text-gray-600">Touchez des centaines de candidats en quelques clics</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Ciblage précis</p>
                    <p className="text-sm text-gray-600">Filtres avancés pour atteindre les bons profils</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Taux de réponse élevé</p>
                    <p className="text-sm text-gray-600">Messages enrichis avec image et CTA cliquable</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Tracking des performances</p>
                    <p className="text-sm text-gray-600">Suivez les clics et l'engagement en temps réel</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#0E2F56] to-[#1a4275] rounded-2xl p-8 text-white mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">Canaux de diffusion disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2">Email</h4>
                <p className="text-blue-100 mb-3">
                  Messages enrichis avec visuels professionnels et call-to-action direct
                </p>
                <p className="text-2xl font-bold">500 GNF</p>
                <p className="text-sm text-blue-200">par candidat</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2">SMS</h4>
                <p className="text-blue-100 mb-3">
                  Messages courts et percutants avec lien tracké vers votre annonce
                </p>
                <p className="text-2xl font-bold">1 000 GNF</p>
                <p className="text-sm text-blue-200">par candidat</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2">WhatsApp</h4>
                <p className="text-blue-100 mb-3">
                  Messages multimédias avec image, texte riche et engagement maximal
                </p>
                <p className="text-2xl font-bold">3 000 GNF</p>
                <p className="text-sm text-blue-200">par candidat</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Comment ça fonctionne ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#FF8C00] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  1
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Publiez votre annonce</h4>
                <p className="text-sm text-gray-600">
                  Créez et publiez votre offre d'emploi ou formation
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#FF8C00] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  2
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Validation Admin</h4>
                <p className="text-sm text-gray-600">
                  Attendez la validation de votre annonce par notre équipe
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#FF8C00] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  3
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Configurez la diffusion</h4>
                <p className="text-sm text-gray-600">
                  Choisissez vos critères, canaux et quantités
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#FF8C00] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  4
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Paiement & Lancement</h4>
                <p className="text-sm text-gray-600">
                  Payez via Orange Money et la diffusion est lancée
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <Shield className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Paiement sécurisé et simple
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  Payez facilement via Orange Money, envoyez la preuve de paiement par WhatsApp ou SMS,
                  et votre diffusion est lancée dès validation par notre équipe.
                  Vous gardez le contrôle total de votre budget avec des tarifs transparents.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-[#FF8C00] transition shadow-lg hover:shadow-xl font-bold text-lg"
            >
              <Send className="w-6 h-6" />
              <span>Demander une démonstration</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-600 mt-3">
              Contactez-nous pour en savoir plus sur la diffusion ciblée
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section - SEO Optimized */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-[#FF8C00] mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes sur nos solutions B2B
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur nos services RH pour entreprises
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    {item.question}
                  </h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[#FF8C00] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#FF8C00] flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-5 pt-2">
                    <p className="text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-600 mb-4">
              Vous avez d'autres questions sur nos solutions B2B ?
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-bold rounded-xl transition inline-flex items-center gap-2"
            >
              Contactez notre équipe
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Lead Form Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-[#0E2F56]">
        <div className="max-w-4xl mx-auto">
          <B2BLeadForm onSuccess={() => setShowForm(false)} />
        </div>
      </section>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <B2BLeadForm
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
