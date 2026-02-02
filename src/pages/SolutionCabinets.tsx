import { Users, CheckCircle2, TrendingUp, Clock, Shield, Target, ArrowRight, Zap, BarChart3, FileText, Award, Briefcase } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface SolutionCabinetsProps {
  onNavigate?: (page: string) => void;
}

export default function SolutionCabinets({ onNavigate = () => {} }: SolutionCabinetsProps) {
  useSEO({
    title: 'Solutions pour Cabinets RH et Agences de Placement en Guinée | JobGuinée',
    description: 'Outils professionnels pour cabinets RH et agences de placement : ATS multi-clients, CVthèque premium, white-label, partenariat commercial.',
    keywords: 'cabinet rh guinée, agence placement conakry, outils recrutement professionnel, partenariat rh guinée',
    canonical: 'https://jobguinee.com/solutions/cabinets-rh-agences'
  });

  const problems = [
    {
      title: "Gestion multi-clients complexe",
      description: "Difficulté à organiser les recrutements pour plusieurs entreprises simultanément"
    },
    {
      title: "Accès limité aux talents",
      description: "Base de candidats restreinte et dépendance aux réseaux personnels"
    },
    {
      title: "Outils inadaptés",
      description: "Utilisation d'Excel et emails, absence de système professionnel centralisé"
    },
    {
      title: "Concurrence accrue",
      description: "Besoin de se différencier avec des services et outils modernes"
    }
  ];

  const solutions = [
    {
      icon: Briefcase,
      title: "ATS multi-clients",
      description: "Gérez tous vos clients et missions de recrutement dans un seul système organisé"
    },
    {
      icon: Users,
      title: "CVthèque premium illimitée",
      description: "Accès à des milliers de profils qualifiés pour servir vos clients rapidement"
    },
    {
      icon: Zap,
      title: "Matching IA avancé",
      description: "Identifiez les meilleurs candidats automatiquement pour chaque mission"
    },
    {
      icon: Target,
      title: "Solution white-label",
      description: "Personnalisez la plateforme à votre marque pour vos clients"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Productivité multipliée",
      value: "3x plus de missions"
    },
    {
      icon: Users,
      title: "Base candidats",
      value: "+10 000 profils"
    },
    {
      icon: BarChart3,
      title: "Suivi performance",
      description: "Statistiques détaillées par client"
    },
    {
      icon: Shield,
      title: "Professionnalisation",
      description: "Image modernisée et crédible"
    }
  ];

  const useCases = [
    {
      context: "Cabinet RH à Conakry",
      challenge: "5 clients simultanés avec 15 postes à pourvoir",
      solution: "ATS multi-clients + CVthèque + matching IA",
      result: "Tous les postes pourvus en 1 mois, clients satisfaits"
    },
    {
      context: "Agence de placement",
      challenge: "Développer l'activité et attirer nouveaux clients",
      solution: "Solution white-label + accès CVthèque premium",
      result: "Doublement du chiffre d'affaires en 6 mois"
    },
    {
      context: "Consultant RH indépendant",
      challenge: "Structurer l'activité et gagner en crédibilité",
      solution: "Partenariat JobGuinée + outils professionnels",
      result: "Signature de 3 contrats entreprises importantes"
    }
  ];

  const whyChoose = [
    {
      title: "Outils professionnels complets",
      description: "ATS, CVthèque, matching IA, reporting : tout ce dont un cabinet RH a besoin"
    },
    {
      title: "Modèle partenariat gagnant-gagnant",
      description: "Commissions attractives et support commercial pour développer votre activité"
    },
    {
      title: "Formation et accompagnement",
      description: "Nous vous formons et vous accompagnons pour maximiser l'utilisation des outils"
    },
    {
      title: "Réseau et visibilité",
      description: "Profitez de la notoriété de JobGuinée pour attirer plus de clients"
    }
  ];

  const partnershipBenefits = [
    "Accès illimité à la CVthèque premium JobGuinée",
    "Solution ATS personnalisable aux couleurs de votre cabinet",
    "Commissions attractives sur les ventes générées",
    "Support technique et commercial dédié",
    "Formation complète aux outils et méthodologies",
    "Leads qualifiés transmis selon votre zone géographique"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1F3C88] to-[#2a4fa3] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">Solutions Cabinets RH et Agences</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Développez votre cabinet RH avec des outils de pointe
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              ATS multi-clients, CVthèque premium, matching IA : tout pour professionnaliser et accélérer votre activité
            </p>
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-[#F57C00] hover:bg-[#E65100] text-white font-bold rounded-xl transition inline-flex items-center gap-2 shadow-lg text-lg"
            >
              Devenir partenaire
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
                Cette solution s'adresse aux <strong>cabinets de recrutement, agences de placement, chasseurs de têtes,
                consultants RH indépendants</strong> opérant en Guinée.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>Contexte guinéen :</strong> Le marché guinéen du conseil RH est en développement. Les cabinets
                et consultants cherchent à professionnaliser leurs services, accéder à plus de talents, gérer plusieurs
                clients efficacement et se différencier de la concurrence.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Problématiques courantes :</strong> Gestion manuelle fastidieuse, base candidats limitée,
                difficulté à scaler l'activité, manque d'outils modernes, image pas assez professionnelle,
                concurrence d'autres cabinets mieux équipés.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problèmes RH résolus */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Problèmes que nous résolvons pour vous
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
            Solutions JobGuinée pour cabinets RH
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Des outils professionnels conçus pour les besoins des cabinets de recrutement
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
            Bénéfices concrets pour votre cabinet
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

      {/* Partenariat */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Programme Partenariat JobGuinée
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Rejoignez notre réseau de partenaires et développez votre activité
          </p>
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {partnershipBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-lg text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={() => onNavigate('b2b-solutions')}
                className="px-8 py-4 bg-gradient-to-r from-[#F57C00] to-[#E65100] hover:from-[#E65100] hover:to-[#D84315] text-white font-bold rounded-xl transition inline-flex items-center gap-2 shadow-lg text-lg"
              >
                Rejoindre le programme partenaire
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Cabinets RH qui réussissent avec JobGuinée
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Découvrez comment nos partenaires développent leur activité
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
            Pourquoi devenir partenaire JobGuinée ?
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
            <h3 className="text-2xl font-bold mb-4">Leader du recrutement digital en Guinée</h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Associez votre cabinet à la plateforme N°1 en Guinée pour renforcer votre crédibilité
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F57C00] to-[#E65100]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à booster votre cabinet RH ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Devenez partenaire JobGuinée et accédez à tous nos outils professionnels
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-[#1F3C88] font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              <Users className="w-5 h-5" />
              Devenir partenaire
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('b2b-solutions')}
              className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold rounded-xl transition inline-flex items-center justify-center gap-2 text-lg"
            >
              Demander une démo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
