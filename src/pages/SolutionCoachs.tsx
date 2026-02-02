import { User, CheckCircle2, TrendingUp, Clock, Shield, Users, Target, ArrowRight, Zap, BarChart3, FileText, Award, Sparkles } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface SolutionCoachsProps {
  onNavigate?: (page: string) => void;
}

export default function SolutionCoachs({ onNavigate = () => {} }: SolutionCoachsProps) {
  useSEO({
    title: 'Solutions pour Coachs et Consultants RH en Guinée | JobGuinée',
    description: 'Plateforme pour coachs professionnels et consultants RH : visibilité, gestion clients, services premium, génération leads qualifiés.',
    keywords: 'coach professionnel guinée, consultant rh conakry, coaching carrière guinée, consultant indépendant',
    canonical: 'https://jobguinee.com/solutions/coachs-consultants'
  });

  const problems = [
    {
      title: "Acquisition de clients difficile",
      description: "Difficulté à trouver des clients de manière régulière et prévisible"
    },
    {
      title: "Manque de crédibilité",
      description: "Besoin de renforcer votre image professionnelle et votre légitimité"
    },
    {
      title: "Gestion administrative lourde",
      description: "Temps perdu en tâches administratives au lieu de se concentrer sur le coaching"
    },
    {
      title: "Tarification et positionnement",
      description: "Incertitude sur les tarifs à pratiquer et comment se positionner sur le marché"
    }
  ];

  const solutions = [
    {
      icon: Sparkles,
      title: "Profil coach certifié",
      description: "Créez votre vitrine professionnelle avec badges de crédibilité et témoignages clients"
    },
    {
      icon: Target,
      title: "Génération de leads",
      description: "Recevez des demandes de coaching de professionnels qualifiés et motivés"
    },
    {
      icon: FileText,
      title: "Gestion de vos services",
      description: "Publiez vos offres de coaching, gérez les réservations et suivez vos clients"
    },
    {
      icon: Zap,
      title: "Mise en avant premium",
      description: "Boostez votre visibilité pour apparaître en tête des recherches"
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Clients augmentés",
      value: "+200%"
    },
    {
      icon: Clock,
      title: "Temps libéré",
      value: "15h/mois"
    },
    {
      icon: Shield,
      title: "Crédibilité",
      description: "Image professionnelle renforcée"
    },
    {
      icon: BarChart3,
      title: "Performance",
      description: "Suivi activité et statistiques"
    }
  ];

  const useCases = [
    {
      context: "Coach carrière indépendant",
      challenge: "Développer clientèle et gagner en visibilité",
      solution: "Profil certifié + services premium + matching",
      result: "20 nouveaux clients en 4 mois"
    },
    {
      context: "Consultant RH freelance",
      challenge: "Positionner expertise audit RH entreprises",
      solution: "Publications + réseau JobGuinée + recommandations",
      result: "3 contrats long terme signés"
    },
    {
      context: "Coach professionnel",
      challenge: "Remplir agenda séances coaching",
      solution: "Réservations en ligne + boost visibilité",
      result: "Agenda complet 3 semaines à l'avance"
    }
  ];

  const whyChoose = [
    {
      title: "Audience ciblée et qualifiée",
      description: "Accès à des milliers de professionnels en recherche active de coaching et développement"
    },
    {
      title: "Outils de gestion intégrés",
      description: "Gérez vos services, réservations, clients et paiements depuis une interface unique"
    },
    {
      title: "Badges de crédibilité",
      description: "Certifications, évaluations clients, profil vérifié pour renforcer votre légitimité"
    },
    {
      title: "Réseau et partenariats",
      description: "Connexions avec entreprises cherchant des coachs pour leurs équipes"
    }
  ];

  const services = [
    "Coaching carrière et orientation professionnelle",
    "Accompagnement recherche d'emploi",
    "Préparation entretiens d'embauche",
    "Conseil CV et profil professionnel",
    "Coaching leadership et management",
    "Bilan de compétences",
    "Reconversion professionnelle",
    "Développement personnel pour professionnels"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1F3C88] to-[#2a4fa3] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <User className="w-5 h-5" />
              <span className="text-sm font-semibold">Solutions Coachs et Consultants</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Développez votre activité de coaching professionnel
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Trouvez des clients qualifiés, renforcez votre crédibilité et gérez votre activité simplement
            </p>
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-[#F57C00] hover:bg-[#E65100] text-white font-bold rounded-xl transition inline-flex items-center gap-2 shadow-lg text-lg"
            >
              Créer mon profil coach
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
                Cette solution s'adresse aux <strong>coachs professionnels, coachs carrière, consultants RH indépendants,
                conseillers en orientation, experts en développement personnel</strong> opérant en Guinée.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>Contexte guinéen :</strong> Le marché du coaching professionnel émerge en Guinée avec une demande
                croissante de professionnels cherchant à développer leur carrière, réussir leurs transitions professionnelles
                ou améliorer leurs compétences. Les coachs cherchent à structurer leur activité et trouver des clients.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Problématiques courantes :</strong> Difficulté à trouver des clients régulièrement, manque de
                visibilité en ligne, crédibilité à établir, tarifs difficiles à positionner, gestion administrative
                chronophage, absence d'outils professionnels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services proposés */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Types de services de coaching que vous pouvez proposer
          </h3>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">{service}</p>
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
            Solutions JobGuinée pour coachs
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            Plateforme complète pour développer et gérer votre activité de coaching
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
            Coachs qui réussissent avec JobGuinée
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Découvrez comment nos coachs partenaires développent leur clientèle
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
            <h3 className="text-2xl font-bold mb-4">Plateforme de référence pour le coaching professionnel</h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Rejoignez les meilleurs coachs et consultants RH de Guinée sur JobGuinée
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F57C00] to-[#E65100]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à développer votre activité de coaching ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Créez votre profil coach gratuitement et commencez à recevoir des demandes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-[#1F3C88] font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              <User className="w-5 h-5" />
              Créer mon profil coach
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
