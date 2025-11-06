import { useState } from 'react';
import { X, Upload, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string;
  };
  onSuccess: () => void;
}

export default function ApplicationModal({ isOpen, onClose, job, onSuccess }: ApplicationModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: profile?.full_name?.split(' ')[0] || '',
    lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    message: ''
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'coverLetter') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5 MB');
        return;
      }
      if (type === 'cv') {
        setCvFile(file);
      } else {
        setCoverLetterFile(file);
      }
      setError('');
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('applications')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('applications')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Vous devez être connecté pour postuler');
      return;
    }

    if (job.id.startsWith('sample-')) {
      setError('Impossible de postuler aux offres d\'exemple. Veuillez postuler à des offres réelles.');
      return;
    }

    if (!cvFile) {
      setError('Veuillez télécharger votre CV');
      return;
    }

    if (!formData.phone) {
      setError('Le numéro de téléphone est requis');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cvUrl = await uploadFile(cvFile, 'cv');
      let coverLetterUrl = null;

      if (coverLetterFile) {
        coverLetterUrl = await uploadFile(coverLetterFile, 'cover-letter');
      }

      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          candidate_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          cv_url: cvUrl,
          cover_letter_url: coverLetterUrl,
          message: formData.message || null,
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
            candidateName: `${formData.firstName} ${formData.lastName}`,
            candidateEmail: formData.email,
            jobTitle: job.title,
            company: job.company,
            recruiterId: jobData.recruiter_id
          }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Application error:', err);
      setError(err.message || 'Erreur lors de la soumission de votre candidature');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Candidature envoyée!</h3>
          <p className="text-gray-600 mb-4">
            Votre candidature a été transmise avec succès au recruteur.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-900">
              <strong>Prochaines étapes:</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>✓ Email de confirmation envoyé</li>
              <li>✓ Le recruteur a été notifié</li>
              <li>✓ Suivez votre candidature dans votre espace personnel</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        <div className="bg-gradient-to-r from-[#0E2F56] to-[#1a4275] px-6 py-4 flex items-center justify-between text-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold">Postuler à l'offre</h2>
            <p className="text-sm text-blue-100">{job.title} - {job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="Votre prénom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="+224 XXX XX XX XX"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CV <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(PDF, DOC, DOCX - Max 5MB)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <input
                type="file"
                id="cv-upload"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileChange(e, 'cv')}
                className="hidden"
              />
              <label
                htmlFor="cv-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {cvFile ? (
                  <>
                    <FileText className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">{cvFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Cliquez pour télécharger votre CV
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC ou DOCX jusqu'à 5MB
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lettre de motivation <span className="text-xs text-gray-500">(Optionnel)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <input
                type="file"
                id="cover-letter-upload"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileChange(e, 'coverLetter')}
                className="hidden"
              />
              <label
                htmlFor="cover-letter-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {coverLetterFile ? (
                  <>
                    <FileText className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">{coverLetterFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(coverLetterFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Cliquez pour télécharger
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC ou DOCX jusqu'à 5MB
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message de motivation <span className="text-xs text-gray-500">(Optionnel)</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
              placeholder="Expliquez brièvement pourquoi vous êtes le candidat idéal pour ce poste..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Partagez votre motivation et mettez en avant vos atouts
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !cvFile}
              className="flex-1 px-6 py-3 bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Envoyer ma candidature
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
