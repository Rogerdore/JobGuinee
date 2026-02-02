import { Hammer, CheckCircle2, TrendingUp, Clock, Shield, Users, Target, ArrowRight, Zap, BarChart3, FileText, Award, AlertTriangle } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface SolutionMinesProps {
  onNavigate?: (page: string) => void;
}

export default function SolutionMines({ onNavigate = () => {} }: SolutionMinesProps) {
  useSEO({
    title: 'Solutions RH Mines et Grands Projets en Guinée | JobGuinée',
    description: 'Solutions RH spécialisées pour secteur minier et grands projets en Guinée : recrutement masse, conformité, gestion multi-sites, CVthèque technique.',
    keywords: 'recrutement mines guinée, rh secteur minier, recrutement grands projets conakry, conformité rh guinée, recrutement technique',
    canonical: 'https://jobguinee.com/solutions/mines-grands-projets'
  });

  const problems = [
    {
      title: "Recrutement en volume",
      description: "Besoin de recruter des dizaines voire centaines de profils en peu de temps"
    },
    {
      title: "Profils techniques spécialisés",
      description: "Difficulté à trouver des compétences pointues : géologues, foreurs, mécaniciens, etc."
    },
    {
      title: "Conformité stricte",
      description: "Exigences de traçabilité, vérifications, normes internationales HSE"
    },
    {
      title: "Gestion multi-sites",
      description: "Coordination des recrutements entre Conakry et sites miniers éloignés"
    }
  ];

  const solutions = [
    {
      icon: Users,
      title: "Recrutement en masse",
      description: "Capacité à gérer simultanément des centaines de candidatures avec tri automatisé"
    },
    {
      icon: Target,
      title: "CVthèque technique",
      description: "Accès aux profils spécialisés : ingénieurs, techniciens, ouvriers qualifiés miniers"
    },
    {
      icon: Shield,
      title: "Conformité et traçabilité",
      description: "Système sécurisé avec historique complet et rapports d'audit détaillés"
    },
    {
      icon: Zap,
      title: "Externalisation complète",
      description: "Notre équipe gère l'intégralité de votre processus de recrutement"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Rapidité d'exécution",
      value: "Mobilisation en 48h"
    },
    {
      icon: Shield,
      title: "Conformité garantie",
      value: "100% traçable"
    },
    {
      icon: BarChart3,
      title: "Reporting détaillé",
      description: "Tableaux de bord pour Direction et RH"
    },
    {
      icon: Users,
      title: "Volume géré",
      description: "Jusqu'à 500 candidatures simultanées"
    }
  ];

  const useCases = [
    {
      context: "Compagnie minière internationale",
      challenge: "Recruter 150 ouvriers qualifiés pour nouvelle exploitation",
      solution: "Campagne ciblée + tri IA + présélection terrain",
      result: "150 recrutements en 6 semaines avec conformité totale"
    },
    {
      context: "Projet d'infrastructure majeur",
      challenge: "Besoin urgent de 50 ingénieurs et techniciens BTP",
      solution: "Accès CVthèque premium + chasse directe",
      result: "Équipe constituée en 1 mois, projet démarré à temps"
    },
    {
      context: "Société minière junior",
      challenge: "Structurer le recrutement pour phase d'exploration",
      solution: "ATS Enterprise + accompagnement personnalisé",
      result: "Processus RH professionnel et conforme aux normes"
    }
  ];

  const whyChoose = [
    {
      title: "Expertise secteur minier",
      description: "Connaissance approfondie des métiers miniers et de leurs spécificités en Guinée"
    },
    {
      title: "Réseau technique étendu",
      description: "Accès à des milliers de profils techniques : ingénieurs, géologues, foreurs, mécaniciens"
    },
    {
      title: "Conformité internationale",
      description: "Processus alignés sur les standards HSE et normes internationales du secteur"
    },
    {
      title: "Réactivité et mobilisation",
      description: "Équipe dédiée capable de se mobiliser rapidement sur tout le territoire guinéen"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1F3C88] to-[#2a4fa3] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Hammer className="w-5 h-5" />
              <span className="text-sm font-semibold">Solutions Mines et Grands Projets</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Recrutement d'excellence pour le secteur minier guinéen
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Gestion complète des recrutements en volume avec conformité internationale et expertise technique
            </p>
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-[#F57C00] hover:bg-[#E65100] text-white font-bold rounded-xl transition inline-flex items-center gap-2 shadow-lg text-lg"
            >
              Demander une démo
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
                Cette solution s'adresse aux <strong>compagnies minières, sociétés d'exploration, projets d'infrastructure,
                entreprises BTP</strong> et tout acteur impliqué dans les grands projets industriels en Guinée.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>Contexte guinéen :</strong> La Guinée possède d'immenses ressources minières (bauxite, fer, or, diamant).
                Le secteur minier est stratégique mais fait face à des défis RH majeurs : pénurie de profils techniques,
                exigences de conformité strictes, recrutements en volume, gestion multi-sites.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Problématiques RH courantes :</strong> Recrutement massif d'ouvriers qualifiés, recherche d'ingénieurs
                et techniciens spécialisés, vérifications de conformité, respect des normes HSE, coordination entre Conakry
                et sites distants, reporting pour investisseurs internationaux.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Alerte spécifique secteur */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-orange-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#F57C00]">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-[#F57C00] flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Spécificités secteur minier et grands projets
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Le recrutement dans le secteur minier nécessite une approche spécialisée : volumes importants,
                  compétences techniques pointues, conformité stricte, délais serrés. JobGuinée dispose de l'expertise
                  et des ressources pour répondre à ces exigences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problèmes RH résolus */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Problèmes RH que nous résolvons
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
            Solutions JobGuinée proposées
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Outils et services conçus pour les exigences du secteur minier
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
            Bénéfices concrets pour votre projet
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
            Projets miniers et infrastructures réussis
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Découvrez comment nous accompagnons les grands projets en Guinée
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
            Pourquoi choisir JobGuinée pour vos projets ?
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
            <h3 className="text-2xl font-bold mb-4">Partenaire de confiance du secteur minier</h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Nous accompagnons les plus grandes compagnies minières et projets d'infrastructure en Guinée
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F57C00] to-[#E65100]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Besoin de recruter pour votre projet minier ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Contactez-nous pour discuter de vos besoins et obtenir une solution sur mesure
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-[#1F3C88] font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              <Hammer className="w-5 h-5" />
              Demander une proposition
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold rounded-xl transition inline-flex items-center justify-center gap-2 text-lg"
            >
              Nous contacter
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
