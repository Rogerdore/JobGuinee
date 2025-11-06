import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Briefcase, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string;
  };
  onSuccess: () => void;
  onCustomApply: () => void;
}

export default function QuickApplyModal({ isOpen, onClose, job, onSuccess, onCustomApply }: QuickApplyModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const hasCompleteProfile = profile?.full_name && user?.email && profile?.phone;

  const handleQuickApply = async () => {
    if (job.id.startsWith('sample-')) {
      setError('Impossible de postuler aux offres d\'exemple. Veuillez postuler à des offres réelles.');
      return;
    }

    if (!hasCompleteProfile) {
      setError('Votre profil est incomplet. Veuillez compléter votre candidature manuellement.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const nameParts = profile.full_name?.split(' ') || ['', ''];
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          candidate_id: user!.id,
          first_name: firstName,
          last_name: lastName,
          email: user!.email,
          phone: profile.phone,
          cv_url: profile.cv_url || '',
          message: 'Candidature rapide via le profil enregistré',
          status: 'pending'
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Vous avez déjà postulé à cette offre');
        }
        throw insertError;
      }

      const { data: jobData } = await supabase
        .from('jobs')
        .select('recruiter_id')
        .eq('id', job.id)
        .single();

      if (jobData?.recruiter_id) {
        await supabase.functions.invoke('send-application-notification', {
          body: {
            candidateName: profile.full_name,
            candidateEmail: user!.email,
            jobTitle: job.title,
            company: job.company,
            recruiterId: jobData.recruiter_id
          }
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error('Quick apply error:', err);
      setError(err.message || 'Erreur lors de la candidature rapide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="bg-gradient-to-r from-[#0E2F56] to-[#1a4275] px-6 py-4 flex items-center justify-between text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Postuler rapidement</h2>
              <p className="text-sm text-blue-100">{job.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Votre profil enregistré</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Nom:</strong> {profile?.full_name || 'Non renseigné'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Téléphone:</strong> {profile?.phone || 'Non renseigné'}</p>
                <p><strong>CV:</strong> {profile?.cv_url ? 'Disponible' : 'Non téléchargé'}</p>
              </div>
            </div>

            {!hasCompleteProfile && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Votre profil est incomplet. Pour postuler en un clic, complétez d'abord votre profil.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleQuickApply}
              disabled={loading || !hasCompleteProfile}
              className="w-full px-6 py-3 bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Postuler en un clic
                </>
              )}
            </button>

            <button
              onClick={onCustomApply}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Personnaliser ma candidature
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
