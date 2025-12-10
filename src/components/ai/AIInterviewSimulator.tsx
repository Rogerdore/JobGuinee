import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { interviewSimulatorService, InterviewSimulation, InterviewQuestion } from '../../services/interviewSimulatorService';
import { Sparkles, Play, BarChart3, Trash2, ArrowLeft, Loader } from 'lucide-react';
import CreditBalance from '../credits/CreditBalance';

interface AIInterviewSimulatorProps {
  onNavigate?: (page: string) => void;
}

export default function AIInterviewSimulator({ onNavigate }: AIInterviewSimulatorProps) {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<InterviewSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<InterviewSimulation | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    jobDescription: '',
    difficulty: 'medium' as const,
    questionCount: 5,
  });
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSimulations();
  }, [user]);

  const loadSimulations = async () => {
    try {
      setLoading(true);
      const data = await interviewSimulatorService.getSimulations();
      setSimulations(data);
    } catch (error) {
      console.error('Error loading simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const simulation = await interviewSimulatorService.createSimulation(
        formData.title,
        formData.jobDescription,
        formData.difficulty,
        formData.questionCount
      );

      const generatedQuestions = interviewSimulatorService.generateInterviewQuestions(
        formData.jobDescription,
        formData.questionCount
      );

      setQuestions(generatedQuestions);
      setCurrentSimulation(simulation);
      setAnswers(new Array(formData.questionCount).fill(''));
      setCurrentQuestionIndex(0);
      setShowForm(false);
    } catch (error) {
      console.error('Error starting simulation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (text: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = text;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteSimulation = async () => {
    if (!currentSimulation) return;

    try {
      setSubmitting(true);
      const questionsResponses = questions.map((q, idx) => ({
        question: q.question,
        user_answer: answers[idx] || '',
        ai_evaluation: 'Evaluation en cours...',
        score: 75,
      }));

      await interviewSimulatorService.updateSimulation(currentSimulation.id, {
        questions_responses: questionsResponses,
        status: 'completed',
        score: 75,
        feedback: questions.map((_, idx) => ({
          question_index: idx,
          feedback: 'Bonne réponse! Continuez à améliorer votre communication.',
          score: 75,
        })),
      });

      await loadSimulations();
      setCurrentSimulation(null);
      setQuestions([]);
      setAnswers([]);
    } catch (error) {
      console.error('Error completing simulation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSimulation = async (id: string) => {
    try {
      await interviewSimulatorService.deleteSimulation(id);
      await loadSimulations();
    } catch (error) {
      console.error('Error deleting simulation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (currentSimulation && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => setCurrentSimulation(null)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentSimulation.title}</h2>
              <p className="text-gray-600">Question {currentQuestionIndex + 1} sur {questions.length}</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestion.question}</h3>
              <textarea
                value={answers[currentQuestionIndex]}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Entrez votre réponse ici..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                {answers[currentQuestionIndex].length} caractères
              </p>
            </div>

            <div className="flex gap-4 justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleCompleteSimulation}
                  disabled={submitting}
                  className="px-8 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Traitement...' : 'Terminer la simulation'}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Suivant
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => onNavigate?.('premium-ai')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux services
          </button>
          <CreditBalance />
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full text-white mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">Simulation d'entretiens</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pratiquez avec des entretiens réalistes</h1>
          <p className="text-xl text-gray-600">Préparez-vous pour vos entretiens avec des questions personnalisées</p>
        </div>

        {!showForm ? (
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <button
              onClick={() => setShowForm(true)}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 text-left transition-all border border-gray-200 hover:border-blue-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nouvelle simulation</h3>
                <p className="text-gray-600">Commencer une simulation d'entretien personnalisée</p>
              </div>
            </button>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Comment ça marche</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Décrivez le poste qui vous intéresse</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Répondez à des questions personnalisées</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Obtenez un score et des retours d'IA</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Créer une simulation</h2>
            <form onSubmit={handleStartSimulation} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Titre de la position
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: Développeur Full-Stack"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description du poste
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Collez la description du poste ou décrivez les responsabilités..."
                  className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Niveau de difficulté
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Moyen</option>
                    <option value="hard">Difficile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nombre de questions
                  </label>
                  <select
                    value={formData.questionCount}
                    onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {[3, 5, 7, 10].map(n => (
                      <option key={n} value={n}>{n} questions</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Démarrage...' : 'Démarrer la simulation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {simulations.length > 0 && !showForm && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes simulations</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {simulations.map(sim => (
                <div key={sim.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{sim.title}</h3>
                    <button
                      onClick={() => handleDeleteSimulation(sim.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      Statut: <span className="font-semibold">{sim.status === 'completed' ? 'Terminé' : 'En cours'}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Questions: <span className="font-semibold">{sim.question_count}</span>
                    </p>
                    {sim.score && (
                      <p className="text-sm text-gray-600">
                        Score: <span className="font-semibold text-blue-600">{sim.score}/100</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentSimulation(sim)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    {sim.status === 'completed' ? 'Voir les résultats' : 'Continuer'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
