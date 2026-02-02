import { School, CheckCircle2, TrendingUp, Clock, Shield, Users, Target, ArrowRight, Zap, BarChart3, FileText, Award, GraduationCap } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface SolutionFormationProps {
  onNavigate?: (page: string) => void;
}

export default function SolutionFormation({ onNavigate = () => {} }: SolutionFormationProps) {
  useSEO({
    title: 'Solutions pour Centres de Formation et Formateurs en Guinée | JobGuinée',
    description: 'Plateforme dédiée aux centres de formation et formateurs : publication formations, visibilité, gestion inscriptions, matching candidats-formations.',
    keywords: 'centre formation guinée, formateur indépendant conakry, plateforme formation professionnelle, vendre formations guinée',
    canonical: 'https://jobguinee.com/solutions/centres-formation'
  });

  const problems = [
    {
      title: "Visibilité limitée",
      description: "Difficulté à faire connaître vos formations et attirer des participants"
    },
    {
      title: "Gestion manuelle",
      description: "Traitement des inscriptions et suivi des participants chronophages"
    },
    {
      title: "Ciblage imprécis",
      description: "Pas d'outils pour identifier et atteindre les profils qui ont besoin de vos formations"
    },
    {
      title: "Concurrence informelle",
      description: "Besoin de se démarquer dans un marché de la formation en développement"
    }
  ];

  const solutions = [
    {
      icon: GraduationCap,
      title: "Catalogue de formations",
      description: "Publiez et mettez en avant vos formations sur la plateforme leader en Guinée"
    },
    {
      icon: Target,
      title: "Matching candidats-formations",
      description: "Système intelligent qui recommande vos formations aux bons profils"
    },
    {
      icon: Users,
      title: "Gestion des inscriptions",
      description: "Centralisez et gérez toutes les demandes d'inscription en un seul endroit"
    },
    {
      icon: Zap,
      title: "Mise en avant premium",
      description: "Boostez la visibilité de vos formations pour maximiser les inscriptions"
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Inscriptions augmentées",
      value: "+150%"
    },
    {
      icon: Clock,
      title: "Temps gagné",
      value: "70% moins de gestion"
    },
    {
      icon: BarChart3,
      title: "Statistiques",
      description: "Analyse de performance détaillée"
    },
    {
      icon: Shield,
      title: "Crédibilité",
      description: "Image professionnelle renforcée"
    }
  ];

  const useCases = [
    {
      context: "Centre de formation informatique",
      challenge: "Remplir les sessions de formation en bureautique",
      solution: "Publication catalogue + boost premium + matching",
      result: "Sessions complètes 2 semaines avant démarrage"
    },
    {
      context: "Formateur indépendant",
      challenge: "Développer activité coaching carrière",
      solution: "Profil certifié + publication programmes",
      result: "15 nouveaux clients en 3 mois"
    },
    {
      context: "École professionnelle",
      challenge: "Promouvoir nouvelles formations techniques",
      solution: "Campagne ciblée + partenariats entreprises",
      result: "Objectif inscriptions dépassé de 40%"
    }
  ];

  const whyChoose = [
    {
      title: "Audience qualifiée",
      description: "Accès direct à des milliers de professionnels et candidats en quête de formation"
    },
    {
      title: "Outils de promotion",
      description: "Mises en avant, badges premium, recommandations automatiques"
    },
    {
      title: "Simplicité d'utilisation",
      description: "Publiez vos formations en quelques clics et gérez tout depuis un tableau de bord"
    },
    {
      title: "Partenariats entreprises",
      description: "Connexion avec des entreprises cherchant à former leurs équipes"
    }
  ];

  const formationTypes = [
    "Formations professionnelles certifiantes",
    "Ateliers et séminaires ponctuels",
    "Coaching individuel ou en groupe",
    "Formations en présentiel ou en ligne",
    "Programmes de reconversion professionnelle",
    "Formations continues pour salariés"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1F3C88] to-[#2a4fa3] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <School className="w-5 h-5" />
              <span className="text-sm font-semibold">Solutions Centres de Formation</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Développez votre activité de formation professionnelle
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Touchez plus de candidats, remplissez vos sessions et gérez facilement vos inscriptions
            </p>
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-[#F57C00] hover:bg-[#E65100] text-white font-bold rounded-xl transition inline-flex items-center gap-2 shadow-lg text-lg"
            >
              Créer mon compte formateur
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* À qui s'adresse cette solution */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
            À qui s'adresse cette solution ?
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 border-l-4 border-[#1F3C88] p-6 rounded-r-lg">
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Cette solution s'adresse aux <strong>centres de formation professionnelle, écoles techniques,
                organismes de certification, formateurs indépendants, coachs professionnels</strong> opérant en Guinée.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>Contexte guinéen :</strong> Le marché de la formation professionnelle se développe en Guinée
                avec une demande croissante pour le développement des compétences. Les centres de formation cherchent
                à augmenter leur visibilité, attirer plus de participants et professionnaliser leur gestion.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Problématiques courantes :</strong> Manque de visibilité en ligne, dépendance au bouche-à-oreille,
                gestion manuelle des inscriptions, difficulté à remplir les sessions, absence d'outils marketing,
                concurrence croissante.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Types de formations */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Types de formations que vous pouvez proposer
          </h3>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formationTypes.map((type, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problèmes résolus */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Problèmes que nous résolvons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {problems.map((problem, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-[#1F3C88] transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{problem.title}</h3>
                    <p className="text-gray-600">{problem.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions proposées */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Solutions JobGuinée pour formateurs
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Plateforme complète pour promouvoir et gérer vos formations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-8 border-2 border-blue-100 hover:border-[#1F3C88] transition">
                  <div className="w-16 h-16 bg-[#1F3C88] rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{solution.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{solution.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bénéfices concrets */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Bénéfices concrets pour votre activité
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-transparent hover:border-[#F57C00] transition">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#F57C00] to-[#E65100] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  {'value' in benefit ? (
                    <p className="text-2xl font-bold text-[#1F3C88]">{benefit.value}</p>
                  ) : (
                    <p className="text-gray-600">{benefit.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Formateurs qui réussissent avec JobGuinée
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Découvrez comment nos partenaires développent leur activité de formation
          </p>
          <div className="space-y-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-[#F57C00]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">CONTEXTE</h4>
                    <p className="font-bold text-gray-900">{useCase.context}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">DÉFI</h4>
                    <p className="text-gray-700">{useCase.challenge}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">SOLUTION</h4>
                    <p className="text-gray-700">{useCase.solution}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">RÉSULTAT</h4>
                    <p className="text-green-700 font-semibold">{useCase.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi choisir JobGuinée */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Pourquoi choisir JobGuinée ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whyChoose.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-[#F57C00]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-br from-[#1F3C88] to-[#2a4fa3] rounded-2xl p-8 text-white text-center">
            <Award className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Plateforme leader pour la formation professionnelle</h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Des milliers de professionnels utilisent JobGuinée pour trouver des formations de qualité
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F57C00] to-[#E65100]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à remplir vos sessions de formation ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Créez votre compte formateur gratuitement et publiez votre première formation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-[#1F3C88] font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              <School className="w-5 h-5" />
              Créer mon compte formateur
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold rounded-xl transition inline-flex items-center justify-center gap-2 text-lg"
            >
              En savoir plus
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
