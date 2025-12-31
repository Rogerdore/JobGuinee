import { X, CheckCircle2, Briefcase, MapPin, Calendar, DollarSign, Eye, Clock, Users } from 'lucide-react';
import { JobFormData } from '../../types/jobFormTypes';
import { generateJobDescription } from '../../services/jobDescriptionService';

interface JobPreviewModalProps {
  jobData: JobFormData;
  onClose: () => void;
  onPublish: () => void;
}

export default function JobPreviewModal({ jobData, onClose, onPublish }: JobPreviewModalProps) {
  const fullDescription = generateJobDescription(jobData);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Prévisualisation de l'offre</h2>
              <p className="text-sm text-blue-100">Vérifiez votre offre avant publication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{jobData.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#0E2F56]" />
                    <span className="font-medium">{jobData.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#0E2F56]" />
                    <span>{jobData.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#FF8C00]" />
                    <span>Date limite: {jobData.deadline}</span>
                  </div>
                </div>
              </div>
              {jobData.company_logo_url && (
                <img
                  src={jobData.company_logo_url}
                  alt={jobData.company_name}
                  className="w-20 h-20 object-cover rounded-xl border-2 border-blue-300"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                {jobData.contract_type}
              </span>
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
                {jobData.category}
              </span>
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium flex items-center gap-1">
                <Users className="w-4 h-4" />
                {jobData.position_count} {jobData.position_count > 1 ? 'postes' : 'poste'}
              </span>
              <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {jobData.position_level}
              </span>
              {jobData.is_premium && (
                <span className="px-3 py-1 bg-[#FF8C00] text-white rounded-full text-sm font-medium">
                  ⭐ Premium
                </span>
              )}
            </div>
          </div>

          <div className="prose max-w-none">
            <div
              className="text-gray-700 leading-relaxed job-description-preview"
              dangerouslySetInnerHTML={{
                __html: fullDescription
                  .replace(/\n/g, '<br/>')
                  .replace(/# (.+)/g, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
                  .replace(/## (.+)/g, '<h3 class="text-xl font-bold text-gray-900 mt-5 mb-3">$1</h3>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                  .replace(/• /g, '&bull; ')
              }}
            />
          </div>

          {jobData.salary_range && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-700" />
                <h4 className="font-bold text-gray-900">Rémunération</h4>
              </div>
              <p className="text-gray-700">
                <strong>{jobData.salary_range}</strong> ({jobData.salary_type})
              </p>
            </div>
          )}

          {jobData.languages.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-2">Langues requises</h4>
              <div className="flex flex-wrap gap-2">
                {jobData.languages.map((lang, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              <strong className="text-gray-900">Visibilité:</strong> {jobData.visibility}
              {jobData.auto_share && <span className="ml-2">| 🔄 Partage automatique activé</span>}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong className="text-gray-900">Durée:</strong> {jobData.publication_duration}
              {jobData.auto_renewal && <span className="ml-2">| 🔁 Renouvellement automatique</span>}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl border-t-2 border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition"
          >
            Modifier l'offre
          </button>
          <button
            onClick={onPublish}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0E2F56] to-blue-700 hover:from-[#1a4275] hover:to-blue-800 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Confirmer et publier
          </button>
        </div>
      </div>
    </div>
  );
}
