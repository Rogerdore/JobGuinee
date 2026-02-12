import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { ArrowRight, CheckCircle, Users, Briefcase } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string, state?: any) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  useSEO({
    customMeta: {
      title: "JobGuinée | Plateforme d’emploi et de recrutement en Guinée",
      description: "JobGuinée est la plateforme d’emploi et de recrutement en Guinée. Choisissez votre parcours : candidat ou recruteur."
    }
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* HERO */}
      <section className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 text-primary-700">
            La plateforme d’emploi et de recrutement en Guinée
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Choisissez votre parcours et accédez à un espace professionnel
            conçu pour <strong>trouver un emploi</strong> ou{" "}
            <strong>recruter efficacement</strong>.
          </p>
        </div>
      </section>

      {/* CHOIX DES PARCOURS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* CANDIDAT */}
          <div className="bg-white rounded-2xl border shadow-sm p-10 text-center hover:shadow-lg transition group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              Candidat / Chercheur d’emploi
            </h2>
            <p className="text-gray-600 mb-8">
              Créez votre profil professionnel, consultez des offres d’emploi
              réelles et postulez directement auprès des entreprises.
            </p>
            <button
              onClick={() => onNavigate('signup', 'candidate')}
              className="inline-block bg-[#FF8C00] hover:bg-[#e67e00] text-white font-semibold px-7 py-3 rounded-xl transition shadow-lg hover:shadow-xl"
            >
              Créer un compte candidat &amp; postuler
            </button>
          </div>

          {/* RECRUTEUR */}
          <div className="bg-white rounded-2xl border shadow-sm p-10 text-center hover:shadow-lg transition group">
            <div className="w-16 h-16 bg-orange-50 text-[#FF8C00] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              Recruteur / Entreprise
            </h2>
            <p className="text-gray-600 mb-8">
              Publiez vos offres d’emploi, recevez des candidatures qualifiées
              et gérez vos recrutements dans un espace professionnel dédié.
            </p>
            <button
              onClick={() => onNavigate('signup', 'recruiter')}
              className="inline-block bg-[#0E2F56] hover:bg-[#0a2340] text-white font-semibold px-7 py-3 rounded-xl transition shadow-lg hover:shadow-xl"
            >
              Créer un compte recruteur &amp; publier des offres
            </button>
          </div>

        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12 text-primary-700">
            Comment fonctionne JobGuinée ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-700">
            <div className="p-6">
              <div className="text-primary-600 font-bold text-4xl mb-4">1</div>
              <h3 className="font-semibold mb-2 text-xl">Inscription</h3>
              <p>Créez votre compte candidat ou recruteur en quelques minutes.</p>
            </div>

            <div className="p-6">
              <div className="text-primary-600 font-bold text-4xl mb-4">2</div>
              <h3 className="font-semibold mb-2 text-xl">Espace dédié</h3>
              <p>Accédez à votre espace professionnel personnalisé.</p>
            </div>

            <div className="p-6">
              <div className="text-primary-600 font-bold text-4xl mb-4">3</div>
              <h3 className="font-semibold mb-2 text-xl">Action</h3>
              <p>Postulez aux offres ou publiez des postes efficacement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI JOBGUINÉE */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8 text-primary-700">
            Pourquoi choisir JobGuinée ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div className="flex items-center gap-3 justify-center md:justify-start bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span className="font-medium">Adaptée aux réalités du marché guinéen</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span className="font-medium">Données personnelles sécurisées</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span className="font-medium">Recrutement structuré et transparent</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
              <span className="font-medium">Mise en relation directe candidats / entreprises</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-white py-16 border-t">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-primary-700">
            Prêt à commencer avec JobGuinée ?
          </h2>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('signup', 'candidate')}
              className="bg-[#FF8C00] hover:bg-[#e67e00] text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 group"
            >
              <span>Créer mon compte candidat</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('signup', 'recruiter')}
              className="bg-[#0E2F56] hover:bg-[#0a2340] text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 group"
            >
              <span>Créer mon compte recruteur</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

    </main>
  );
}
