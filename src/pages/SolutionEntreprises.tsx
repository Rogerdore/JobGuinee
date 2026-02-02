import { Building2, CheckCircle2, TrendingUp, Clock, Shield, Users, Target, ArrowRight, Zap, BarChart3, FileText, Award } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface SolutionEntreprisesProps {
  onNavigate?: (page: string) => void;
}

export default function SolutionEntreprises({ onNavigate = () => {} }: SolutionEntreprisesProps) {
  useSEO({
    title: 'Solutions RH pour Entreprises et PME en Guinée | JobGuinée',
    description: 'Solutions RH complètes pour entreprises et PME guinéennes : recrutement digitalisé, ATS moderne, gestion des candidatures, CVthèque premium. Optimisez vos processus RH.',
    keywords: 'solutions rh pme guinée, recrutement entreprise conakry, ats logiciel guinée, gestion candidatures pme, digitalisation rh guinée',
    canonical: 'https://jobguinee.com/solutions/entreprises-pme'
  });

  const problems = [
    {
      title: "Recrutement chronophage",
      description: "Tri manuel des CV, difficultés à identifier les bons profils rapidement"
    },
    {
      title: "Manque de visibilité",
      description: "Difficultés à attirer des candidats qualifiés sur les offres d'emploi"
    },
    {
      title: "Processus non structuré",
      description: "Absence de suivi des candidatures et de pipeline organisé"
    },
    {
      title: "Coûts élevés",
      description: "Dépendance aux cabinets de recrutement pour chaque poste"
    }
  ];

  const solutions = [
    {
      icon: FileText,
      title: "Logiciel ATS moderne",
      description: "Gérez toutes vos candidatures dans un système centralisé avec pipeline visuel"
    },
    {
      icon: Users,
      title: "CVthèque premium",
      description: "Accédez à des milliers de profils qualifiés vérifiés en Guinée"
    },
    {
      icon: Zap,
      title: "Matching IA",
      description: "L'intelligence artificielle identifie automatiquement les meilleurs candidats"
    },
    {
      icon: Target,
      title: "Publication autonome",
      description: "Publiez vos offres en quelques clics sur la plateforme leader en Guinée"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Gain de temps considérable",
      value: "70% de temps économisé sur le tri des CV"
    },
    {
      icon: TrendingUp,
      title: "Réduction des coûts",
      value: "Jusqu'à 50% d'économies sur les frais de recrutement"
    },
    {
      icon: Shield,
      title: "Traçabilité complète",
      description: "Historique de toutes les actions et conformité RH"
    },
    {
      icon: BarChart3,
      title: "Décisions éclairées",
      description: "Statistiques et rapports pour optimiser vos recrutements"
    }
  ];

  const useCases = [
    {
      context: "PME commerciale à Conakry",
      challenge: "Besoin de recruter 5 commerciaux rapidement",
      solution: "Publication d'offre + matching IA + présélection automatique",
      result: "Embauches réalisées en 2 semaines au lieu de 2 mois"
    },
    {
      context: "Entreprise de BTP",
      challenge: "Recrutement récurrent d'ouvriers qualifiés",
      solution: "Pack Enterprise + accès CVthèque illimité",
      result: "Réduction de 60% du temps de recrutement et des coûts"
    },
    {
      context: "Entreprise de services",
      challenge: "Structurer le processus RH pour la première fois",
      solution: "Formation à l'ATS + accompagnement personnalisé",
      result: "Professionnalisation RH complète en 1 mois"
    }
  ];

  const whyChoose = [
    {
      title: "Expertise locale",
      description: "Connaissance approfondie du marché de l'emploi guinéen et de ses spécificités"
    },
    {
      title: "Conformité RH",
      description: "Outils conformes aux normes guinéennes et meilleures pratiques internationales"
    },
    {
      title: "Outils digitaux modernes",
      description: "Technologie de pointe accessible depuis Conakry et toute la Guinée"
    },
    {
      title: "Accompagnement personnalisé",
      description: "Support dédié pour vous aider à optimiser vos processus RH"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1F3C88] to-[#2a4fa3] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Solutions pour Entreprises et PME</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Optimisez votre recrutement avec des outils RH professionnels
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Gagnez du temps, réduisez vos coûts et recrutez les meilleurs talents en Guinée grâce à notre plateforme tout-en-un
            </p>
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-[#F57C00] hover:bg-[#E65100] text-white font-bold rounded-xl transition inline-flex items-center gap-2 shadow-lg text-lg"
            >
              Créer mon compte gratuitement
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
                Cette solution s'adresse aux <strong>entreprises et PME guinéennes</strong> de tous secteurs :
                commerce, services, industrie, BTP, distribution, agro-alimentaire, technologie, etc.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>Contexte guinéen :</strong> Les PME représentent la majorité du tissu économique guinéen.
                Elles font face à des défis RH spécifiques : manque d'outils professionnels, difficulté à attirer
                les talents, processus de recrutement informels.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Problématiques RH courantes :</strong> Tri manuel fastidieux des CV, absence de traçabilité
                des candidatures, dépendance aux réseaux personnels, coûts élevés des cabinets de recrutement,
                difficulté à évaluer objectivement les candidats.
              </p>
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
            Des outils professionnels conçus pour les besoins des entreprises guinéennes
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
            Bénéfices concrets pour votre entreprise
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
            Exemples concrets d'utilisation
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Découvrez comment des entreprises guinéennes optimisent leurs recrutements
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
            <h3 className="text-2xl font-bold mb-4">Plateforme leader en Guinée</h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Plus de 10 000 candidats qualifiés, des centaines d'entreprises nous font confiance pour leurs recrutements
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F57C00] to-[#E65100]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à digitaliser votre recrutement ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Créez votre compte gratuitement et publiez votre première offre dès aujourd'hui
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-[#1F3C88] font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              <Building2 className="w-5 h-5" />
              Créer mon compte recruteur
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
