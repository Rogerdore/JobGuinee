import { Landmark, CheckCircle2, TrendingUp, Clock, Shield, Users, Target, ArrowRight, Zap, BarChart3, FileText, Award, Globe } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface SolutionONGProps {
  onNavigate?: (page: string) => void;
}

export default function SolutionONG({ onNavigate = () => {} }: SolutionONGProps) {
  useSEO({
    title: 'Solutions RH pour ONG et Institutions en Guinée | JobGuinée',
    description: 'Solutions RH adaptées aux ONG et institutions internationales en Guinée : recrutement transparent, conformité bailleurs, gestion projets.',
    keywords: 'recrutement ong guinée, rh institutions conakry, recrutement transparent guinée, conformité bailleurs fonds',
    canonical: 'https://jobguinee.com/solutions/ong-institutions'
  });

  const problems = [
    {
      title: "Exigences de transparence",
      description: "Obligation de documenter et justifier tous les processus de recrutement"
    },
    {
      title: "Conformité bailleurs",
      description: "Respect strict des règles imposées par les organismes financeurs internationaux"
    },
    {
      title: "Recrutements ponctuels",
      description: "Besoin de recruter rapidement pour des projets à durée déterminée"
    },
    {
      title: "Profils spécialisés",
      description: "Recherche d'expertise sectorielle : santé, éducation, agriculture, développement"
    }
  ];

  const solutions = [
    {
      icon: Shield,
      title: "Transparence totale",
      description: "Traçabilité complète avec rapports détaillés de toutes les étapes du recrutement"
    },
    {
      icon: FileText,
      title: "Documentation conforme",
      description: "Génération automatique des documents requis par les bailleurs de fonds"
    },
    {
      icon: Target,
      title: "CVthèque sectorielle",
      description: "Accès à des profils spécialisés dans les domaines humanitaires et développement"
    },
    {
      icon: Zap,
      title: "Réactivité projet",
      description: "Mobilisation rapide pour répondre aux démarrages de projets urgents"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Conformité garantie",
      value: "100% auditable"
    },
    {
      icon: Clock,
      title: "Gain de temps",
      value: "60% plus rapide"
    },
    {
      icon: FileText,
      title: "Documentation",
      description: "Rapports détaillés automatiques"
    },
    {
      icon: BarChart3,
      title: "Suivi projet",
      description: "Indicateurs et reporting personnalisés"
    }
  ];

  const useCases = [
    {
      context: "ONG internationale santé",
      challenge: "Recruter 20 agents de santé pour programme zones rurales",
      solution: "Publication ciblée + vérifications + rapports conformité",
      result: "Équipe recrutée en 3 semaines avec documentation complète"
    },
    {
      context: "Institution de développement",
      challenge: "Besoin d'experts court terme pour mission évaluation",
      solution: "Accès CVthèque + présélection rapide",
      result: "3 consultants identifiés et mobilisés en 5 jours"
    },
    {
      context: "Organisation humanitaire",
      challenge: "Structurer le recrutement conforme aux normes ECHO",
      solution: "ATS personnalisé + formation équipe RH",
      result: "Processus certifié et validé par bailleur"
    }
  ];

  const whyChoose = [
    {
      title: "Compréhension du secteur",
      description: "Connaissance approfondie des exigences ONG et organismes internationaux"
    },
    {
      title: "Conformité internationale",
      description: "Processus alignés sur les standards des bailleurs de fonds majeurs"
    },
    {
      title: "Réseau sectoriel",
      description: "Accès à des profils expérimentés dans l'humanitaire et le développement"
    },
    {
      title: "Documentation irréprochable",
      description: "Rapports et justificatifs prêts pour audits et contrôles"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1F3C88] to-[#2a4fa3] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Landmark className="w-5 h-5" />
              <span className="text-sm font-semibold">Solutions ONG et Institutions</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Recrutement transparent pour ONG et institutions
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Solutions conformes aux exigences des bailleurs internationaux avec traçabilité complète
            </p>
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-[#F57C00] hover:bg-[#E65100] text-white font-bold rounded-xl transition inline-flex items-center gap-2 shadow-lg text-lg"
            >
              Demander une présentation
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
                Cette solution s'adresse aux <strong>ONG internationales et locales, agences des Nations Unies,
                institutions de développement, projets financés par bailleurs de fonds</strong> opérant en Guinée.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>Contexte guinéen :</strong> La Guinée accueille de nombreuses ONG et projets de développement
                dans des secteurs variés : santé, éducation, agriculture, infrastructures. Ces organisations font face
                à des exigences strictes de transparence et conformité imposées par leurs bailleurs.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Problématiques RH courantes :</strong> Documentation exhaustive requise, processus de recrutement
                auditable, respect des procédures bailleurs, délais courts pour mobilisation équipes projet, recherche
                de profils spécialisés, reporting détaillé obligatoire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Label spécifique */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#F57C00]">
            <div className="flex items-start gap-4">
              <Globe className="w-8 h-8 text-[#F57C00] flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Standards internationaux
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Nos processus sont conformes aux exigences des principaux bailleurs de fonds internationaux :
                  Union Européenne, Banque Mondiale, Agences ONU, AFD, USAID, etc.
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
            Outils et services adaptés aux exigences du secteur humanitaire
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
            Bénéfices concrets pour votre organisation
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
            Projets ONG accompagnés avec succès
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Découvrez comment nous facilitons les recrutements pour le secteur humanitaire
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
            <h3 className="text-2xl font-bold mb-4">Partenaire de confiance des ONG</h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Des dizaines d'ONG et organisations internationales nous font confiance pour leurs recrutements en Guinée
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F57C00] to-[#E65100]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Besoin d'un recrutement conforme ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Discutons de vos besoins et de nos solutions adaptées aux ONG
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-[#1F3C88] font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              <Landmark className="w-5 h-5" />
              Demander une démo
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
