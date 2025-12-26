import { useEffect, useState } from 'react';
import {
  Building2, Users, Landmark, Briefcase, GraduationCap, User,
  CheckCircle2, Sparkles, BarChart3, Database, FileText, TrendingUp,
  Award, Shield, Zap, Target, ArrowRight, Hammer, School
} from 'lucide-react';
import { b2bLeadsService, B2BPageConfig } from '../services/b2bLeadsService';
import B2BLeadForm from '../components/b2b/B2BLeadForm';
import { useSEO } from '../hooks/useSEO';

export default function B2BSolutions() {
  const [pageConfig, setPageConfig] = useState<B2BPageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useSEO({
    title: 'Solutions B2B pour Entreprises et Institutions | JobGuinée',
    description: 'Solutions RH complètes pour entreprises : externalisation recrutement, ATS digital, CVthèque, formation et conseil RH en Guinée.',
    keywords: 'solutions b2b, recrutement entreprise, ATS, CVthèque, formation professionnelle, conseil RH, Guinée'
  });

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
      {/* Hero Section */}
      {heroSection && (
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
                {heroSection.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                {heroSection.subtitle}
              </p>

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
      )}

      {/* Target Audience Section */}
      {targetAudienceSection && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {targetAudienceSection.title}
              </h2>
              <p className="text-xl text-gray-600">
                {targetAudienceSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {targetAudienceSection.content?.audiences?.map((audience: any, index: number) => {
                const IconComponent = getIcon(audience.icon);
                return (
                  <a
                    key={index}
                    href={audience.link}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-8 border-2 border-transparent hover:border-[#FF8C00]"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#FF8C00] transition">
                      {audience.name}
                    </h3>
                    <div className="flex items-center text-[#0E2F56] font-medium">
                      En savoir plus
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Outsourcing Section */}
      {outsourcingSection && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-[#FF8C00] text-white rounded-full text-sm font-bold mb-4">
                SERVICE CLÉ
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {outsourcingSection.title}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {outsourcingSection.subtitle}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <p className="text-lg text-gray-700 mb-8">
                {outsourcingSection.content?.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outsourcingSection.content?.steps?.map((step: string, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#0E2F56] text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">{step}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-8 py-4 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white font-bold rounded-xl transition inline-flex items-center gap-2"
                >
                  Confier un recrutement à JobGuinée
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

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

      {/* Why Choose Section */}
      {whyChooseSection && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {whyChooseSection.title}
              </h2>
              <p className="text-xl text-gray-600">
                {whyChooseSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyChooseSection.content?.reasons?.map((reason: any, index: number) => {
                const icons = [Target, Shield, Zap, BarChart3, Users];
                const IconComponent = icons[index % icons.length];
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-[#FF8C00]/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {reason.title}
                    </h3>
                    <p className="text-gray-600">
                      {reason.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
            <B2BLeadForm onSuccess={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
