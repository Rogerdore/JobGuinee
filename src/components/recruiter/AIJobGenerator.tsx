import { useState } from 'react';
import { Wand2, X, Loader, Coins } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import CreditBalance from '../credits/CreditBalance';

interface AIJobGeneratorProps {
  onGenerate: (data: JobGenerationData) => void;
  onClose: () => void;
}

export interface JobGenerationData {
  job_title: string;
  department: string;
  experience_level: string;
  contract_type: string;
  location: string;
}

export default function AIJobGenerator({ onGenerate, onClose }: AIJobGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const { consumeCredits } = useConsumeCredits();
  const [formData, setFormData] = useState<JobGenerationData>({
    job_title: '',
    department: '',
    experience_level: 'Intermediaire',
    contract_type: 'CDI',
    location: '',
  });

  const handleGenerate = async () => {
    if (!formData.job_title || !formData.location) return;

    setLoading(true);

    const creditResult = await consumeCredits(
      SERVICES.AI_CV_GENERATION,
      { jobTitle: formData.job_title, location: formData.location }
    );

    if (!creditResult.success) {
      alert(creditResult.message);
      setLoading(false);
      return;
    }

    await onGenerate(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-900 rounded-lg">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Générateur IA d'offres</h2>
              <p className="text-sm text-gray-600">Créez une offre professionnelle en quelques secondes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-900">
                <span className="font-semibold">Coût :</span> 50 crédits
              </span>
            </div>
            <CreditBalance />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Service Premium :</span> Notre IA va générer automatiquement une description complète,
              les missions principales, le profil recherché, les compétences clés et les mentions légales guinéennes.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intitulé du poste *
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Ingénieur Maintenance Industrielle"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Département / Site
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Production, Maintenance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Conakry, Boké"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'expérience
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Junior">Junior (0-2 ans)</option>
                <option value="Intermediaire">Intermédiaire (3-5 ans)</option>
                <option value="Senior">Senior (6-10 ans)</option>
                <option value="Expert">Expert (10+ ans)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de contrat
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleGenerate}
              disabled={!formData.job_title || !formData.location || loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-900 hover:from-blue-700 hover:to-blue-950 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Générer avec l'IA
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
