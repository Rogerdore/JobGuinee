import { useEffect, useState } from 'react';
import { BookOpen, Clock, Award, DollarSign } from 'lucide-react';
import { supabase, Formation } from '../lib/supabase';

interface FormationsProps {
  onNavigate: (page: string) => void;
}

export default function Formations({ onNavigate }: FormationsProps) {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    const { data } = await supabase
      .from('formations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) setFormations(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Formations & Coaching Carrière</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Développez vos compétences et boostez votre carrière avec nos programmes de formation
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
            <p className="mt-4 text-gray-600">Chargement des formations...</p>
          </div>
        ) : formations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune formation disponible pour le moment</p>
            <p className="text-gray-400 mt-2">De nouvelles formations seront bientôt disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formations.map((formation) => (
              <div
                key={formation.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition overflow-hidden"
              >
                {formation.cover_image ? (
                  <img
                    src={formation.cover_image}
                    alt={formation.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}

                <div className="p-6">
                  {formation.category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
                      {formation.category}
                    </span>
                  )}

                  <h3 className="font-bold text-xl text-gray-900 mb-3">{formation.title}</h3>

                  {formation.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{formation.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    {formation.instructor && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Award className="w-4 h-4" />
                        <span>Par {formation.instructor}</span>
                      </div>
                    )}

                    {formation.duration_hours && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formation.duration_hours} heures</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-lg font-bold text-orange-600">
                      <DollarSign className="w-5 h-5" />
                      <span>{formation.price.toLocaleString()} GNF</span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Système de paiement en cours d\'intégration')}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
                  >
                    S'inscrire maintenant
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="mt-16 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-2xl p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Coaching Carrière Personnalisé</h2>
            <p className="text-xl text-blue-100 mb-8">
              Bénéficiez d'un accompagnement personnalisé pour atteindre vos objectifs professionnels
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="font-bold mb-2">Définition d'objectifs</h3>
                <p className="text-sm text-blue-100">Clarifiez votre projet professionnel</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="text-4xl mb-2">📝</div>
                <h3 className="font-bold mb-2">Optimisation CV</h3>
                <p className="text-sm text-blue-100">Valorisez votre parcours</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <div className="text-4xl mb-2">💼</div>
                <h3 className="font-bold mb-2">Préparation entretiens</h3>
                <p className="text-sm text-blue-100">Réussissez vos entretiens</p>
              </div>
            </div>
            <button
              onClick={() => alert('Service de coaching disponible prochainement')}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition shadow-lg text-lg"
            >
              Réserver une session
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
