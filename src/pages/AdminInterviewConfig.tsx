import React, { useState, useEffect } from 'react';
import { Video, Settings, Calendar, Brain, Save, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InterviewConfig {
  id?: string;
  enable_interview_scheduling: boolean;
  enable_interview_simulation: boolean;
  enable_interview_evaluation: boolean;
  enable_video_interviews: boolean;
  enable_in_person_interviews: boolean;
  enable_phone_interviews: boolean;
  enable_automatic_reminders: boolean;
  reminder_hours_before: number[];
  max_interviews_per_candidate: number;
  max_interviews_per_day: number;
  interview_duration_minutes: number;
  buffer_time_minutes: number;
  allow_rescheduling: boolean;
  max_reschedules: number;
  cancellation_hours_notice: number;
  enable_interview_feedback: boolean;
  require_interview_notes: boolean;
  enable_interview_recording: boolean;
  recording_retention_days: number;
  enable_ai_interview_analysis: boolean;
  ai_analysis_credit_cost: number;
  enable_candidate_self_scheduling: boolean;
  working_hours_start: number;
  working_hours_end: number;
  working_days: string[];
  enable_interview_templates: boolean;
  default_evaluation_criteria: string[];
  min_evaluation_score: number;
  max_evaluation_score: number;
  enable_multi_stage_interviews: boolean;
  updated_at?: string;
}

export default function AdminInterviewConfig() {
  const [activeTab, setActiveTab] = useState<'general' | 'scheduling' | 'evaluation' | 'ai'>('general');
  const [config, setConfig] = useState<InterviewConfig>({
    enable_interview_scheduling: true,
    enable_interview_simulation: true,
    enable_interview_evaluation: true,
    enable_video_interviews: true,
    enable_in_person_interviews: true,
    enable_phone_interviews: true,
    enable_automatic_reminders: true,
    reminder_hours_before: [24, 2],
    max_interviews_per_candidate: 5,
    max_interviews_per_day: 20,
    interview_duration_minutes: 60,
    buffer_time_minutes: 15,
    allow_rescheduling: true,
    max_reschedules: 2,
    cancellation_hours_notice: 24,
    enable_interview_feedback: true,
    require_interview_notes: false,
    enable_interview_recording: false,
    recording_retention_days: 30,
    enable_ai_interview_analysis: true,
    ai_analysis_credit_cost: 50,
    enable_candidate_self_scheduling: false,
    working_hours_start: 9,
    working_hours_end: 17,
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    enable_interview_templates: true,
    default_evaluation_criteria: ['Communication', 'Compétences techniques', 'Motivation', 'Culture fit'],
    min_evaluation_score: 1,
    max_evaluation_score: 5,
    enable_multi_stage_interviews: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_config')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading interview config:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const configData = {
        ...config,
        updated_at: new Date().toISOString()
      };

      if (config.id) {
        const { error } = await supabase
          .from('interview_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('interview_config')
          .insert([configData])
          .select()
          .single();

        if (error) throw error;
        if (data) setConfig(data);
      }

      setMessage({ type: 'success', text: 'Configuration enregistrée avec succès' });
    } catch (error) {
      console.error('Error saving interview config:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    const days = config.working_days.includes(day)
      ? config.working_days.filter(d => d !== day)
      : [...config.working_days, day];
    setConfig({ ...config, working_days: days });
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'scheduling', label: 'Planification', icon: Calendar },
    { id: 'evaluation', label: 'Évaluation', icon: Star },
    { id: 'ai', label: 'IA & Simulation', icon: Brain }
  ];

  const weekDays = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' },
    { id: 'sunday', label: 'Dimanche' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuration des Interviews</h1>
        <p className="mt-2 text-gray-600">
          Gérez les paramètres du système d'entretiens, planification et évaluation
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fonctionnalités Principales</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Planification d'entretiens</p>
                      <p className="text-sm text-gray-600">Permettre la planification d'entretiens avec les candidats</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_interview_scheduling}
                        onChange={(e) => setConfig({ ...config, enable_interview_scheduling: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Simulation d'entretiens</p>
                      <p className="text-sm text-gray-600">Permettre aux candidats de s'entraîner avec l'IA</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_interview_simulation}
                        onChange={(e) => setConfig({ ...config, enable_interview_simulation: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Évaluation d'entretiens</p>
                      <p className="text-sm text-gray-600">Permettre l'évaluation structurée des candidats</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_interview_evaluation}
                        onChange={(e) => setConfig({ ...config, enable_interview_evaluation: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Entretiens multi-étapes</p>
                      <p className="text-sm text-gray-600">Permettre plusieurs étapes d'entretiens (présélection, technique, final...)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_multi_stage_interviews}
                        onChange={(e) => setConfig({ ...config, enable_multi_stage_interviews: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Types d'Entretiens</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Visioconférence</p>
                      <p className="text-sm text-gray-600">Entretiens par vidéo en ligne</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_video_interviews}
                        onChange={(e) => setConfig({ ...config, enable_video_interviews: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">En présentiel</p>
                      <p className="text-sm text-gray-600">Entretiens physiques sur site</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_in_person_interviews}
                        onChange={(e) => setConfig({ ...config, enable_in_person_interviews: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Téléphone</p>
                      <p className="text-sm text-gray-600">Entretiens téléphoniques</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_phone_interviews}
                        onChange={(e) => setConfig({ ...config, enable_phone_interviews: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Limites</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entretiens max par candidat
                    </label>
                    <input
                      type="number"
                      value={config.max_interviews_per_candidate}
                      onChange={(e) => setConfig({ ...config, max_interviews_per_candidate: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entretiens max par jour
                    </label>
                    <input
                      type="number"
                      value={config.max_interviews_per_day}
                      onChange={(e) => setConfig({ ...config, max_interviews_per_day: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scheduling' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de Planification</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Auto-planification candidat</p>
                      <p className="text-sm text-gray-600">Permettre aux candidats de choisir leur créneau</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_candidate_self_scheduling}
                        onChange={(e) => setConfig({ ...config, enable_candidate_self_scheduling: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Autoriser la replanification</p>
                      <p className="text-sm text-gray-600">Permettre de modifier un entretien planifié</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allow_rescheduling}
                        onChange={(e) => setConfig({ ...config, allow_rescheduling: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Rappels automatiques</p>
                      <p className="text-sm text-gray-600">Envoyer des rappels avant l'entretien</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_automatic_reminders}
                        onChange={(e) => setConfig({ ...config, enable_automatic_reminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horaires et Durées</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée d'entretien (minutes)
                    </label>
                    <input
                      type="number"
                      value={config.interview_duration_minutes}
                      onChange={(e) => setConfig({ ...config, interview_duration_minutes: Number(e.target.value) })}
                      min="15"
                      step="15"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temps de transition (minutes)
                    </label>
                    <input
                      type="number"
                      value={config.buffer_time_minutes}
                      onChange={(e) => setConfig({ ...config, buffer_time_minutes: Number(e.target.value) })}
                      min="0"
                      step="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de début (24h)
                    </label>
                    <input
                      type="number"
                      value={config.working_hours_start}
                      onChange={(e) => setConfig({ ...config, working_hours_start: Number(e.target.value) })}
                      min="0"
                      max="23"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de fin (24h)
                    </label>
                    <input
                      type="number"
                      value={config.working_hours_end}
                      onChange={(e) => setConfig({ ...config, working_hours_end: Number(e.target.value) })}
                      min="0"
                      max="23"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Replanifications max
                    </label>
                    <input
                      type="number"
                      value={config.max_reschedules}
                      onChange={(e) => setConfig({ ...config, max_reschedules: Number(e.target.value) })}
                      min="0"
                      max="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Préavis annulation (heures)
                    </label>
                    <input
                      type="number"
                      value={config.cancellation_hours_notice}
                      onChange={(e) => setConfig({ ...config, cancellation_hours_notice: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Jours Ouvrables</h3>
                <div className="flex flex-wrap gap-3">
                  {weekDays.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleWorkingDay(day.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        config.working_days.includes(day.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evaluation' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres d'Évaluation</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Feedback obligatoire</p>
                      <p className="text-sm text-gray-600">Exiger un retour après chaque entretien</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_interview_feedback}
                        onChange={(e) => setConfig({ ...config, enable_interview_feedback: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Notes obligatoires</p>
                      <p className="text-sm text-gray-600">Exiger des notes détaillées</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.require_interview_notes}
                        onChange={(e) => setConfig({ ...config, require_interview_notes: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Templates d'évaluation</p>
                      <p className="text-sm text-gray-600">Utiliser des grilles d'évaluation prédéfinies</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_interview_templates}
                        onChange={(e) => setConfig({ ...config, enable_interview_templates: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Échelle de Notation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note minimale
                    </label>
                    <input
                      type="number"
                      value={config.min_evaluation_score}
                      onChange={(e) => setConfig({ ...config, min_evaluation_score: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note maximale
                    </label>
                    <input
                      type="number"
                      value={config.max_evaluation_score}
                      onChange={(e) => setConfig({ ...config, max_evaluation_score: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enregistrement</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Enregistrement d'entretiens</p>
                      <p className="text-sm text-gray-600">Permettre l'enregistrement audio/vidéo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_interview_recording}
                        onChange={(e) => setConfig({ ...config, enable_interview_recording: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {config.enable_interview_recording && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Durée de conservation (jours)
                      </label>
                      <input
                        type="number"
                        value={config.recording_retention_days}
                        onChange={(e) => setConfig({ ...config, recording_retention_days: Number(e.target.value) })}
                        min="1"
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Services IA</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Analyse IA d'entretiens</p>
                      <p className="text-sm text-gray-600">Analyser les entretiens avec l'IA pour des insights</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_ai_interview_analysis}
                        onChange={(e) => setConfig({ ...config, enable_ai_interview_analysis: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coûts en Crédits IA</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Analyse IA par entretien
                  </label>
                  <input
                    type="number"
                    value={config.ai_analysis_credit_cost}
                    onChange={(e) => setConfig({ ...config, ai_analysis_credit_cost: Number(e.target.value) })}
                    min="0"
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Crédits requis pour une analyse complète</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
