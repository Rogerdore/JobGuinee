import { useState } from 'react';
import { Briefcase, X, Loader, DollarSign, Calendar, MapPin, Building2, GraduationCap, FileText, Users } from 'lucide-react';

interface JobPublishFormProps {
  onPublish: (data: JobFormData) => void;
  onClose: () => void;
}

export interface JobFormData {
  title: string;
  description: string;
  department: string;
  location: string;
  contract_type: string;
  experience_level: string;
  salary_min?: number;
  salary_max?: number;
  education_level: string;
  skills: string[];
  responsibilities: string;
  requirements: string;
  benefits: string;
  deadline?: string;
}

export default function JobPublishForm({ onPublish, onClose }: JobPublishFormProps) {
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    department: '',
    location: '',
    contract_type: 'CDI',
    experience_level: 'Intermediaire',
    salary_min: undefined,
    salary_max: undefined,
    education_level: 'Licence',
    skills: [],
    responsibilities: '',
    requirements: '',
    benefits: '',
    deadline: '',
  });

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handlePublish = async () => {
    if (!formData.title || !formData.location || !formData.description) return;

    setLoading(true);
    await onPublish(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Publier une offre d'emploi</h2>
              <p className="text-sm text-blue-100">Créez et publiez votre offre de recrutement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          <div className="bg-orange-50 border-2 border-[#FF8C00]/30 rounded-xl p-4">
            <p className="text-sm text-gray-800">
              <span className="font-semibold text-[#FF8C00]">📋 Information :</span> Remplissez tous les champs requis (*) pour publier votre offre.
              Les candidats pourront voir tous les détails de votre annonce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Intitulé du poste *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="Ex: Ingénieur Maintenance Industrielle"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Localisation *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="Ex: Conakry, Boké, Kamsar"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Département / Service
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="Ex: Département Technique"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type de contrat *
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
              >
                <option value="CDI">CDI (Contrat à Durée Indéterminée)</option>
                <option value="CDD">CDD (Contrat à Durée Déterminée)</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance / Consultant</option>
                <option value="Alternance">Alternance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Niveau d'expérience
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
              >
                <option value="Débutant">Débutant (0-1 an)</option>
                <option value="Junior">Junior (1-3 ans)</option>
                <option value="Intermediaire">Intermédiaire (3-5 ans)</option>
                <option value="Senior">Senior (5-10 ans)</option>
                <option value="Expert">Expert (10+ ans)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <GraduationCap className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Niveau d'études requis
              </label>
              <select
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
              >
                <option value="Bac">Baccalauréat</option>
                <option value="Bac+2">Bac+2 (BTS/DUT)</option>
                <option value="Licence">Licence (Bac+3)</option>
                <option value="Master">Master (Bac+5)</option>
                <option value="Doctorat">Doctorat (Bac+8)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Salaire minimum (GNF)
              </label>
              <input
                type="number"
                value={formData.salary_min || ''}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="Ex: 5000000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Salaire maximum (GNF)
              </label>
              <input
                type="number"
                value={formData.salary_max || ''}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="Ex: 8000000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Date limite de candidature
              </label>
              <input
                type="date"
                value={formData.deadline || ''}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-[#FF8C00]" />
                Description du poste *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                placeholder="Décrivez le contexte et les objectifs du poste..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Missions et responsabilités
              </label>
              <textarea
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                placeholder="• Mission 1&#10;• Mission 2&#10;• Mission 3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Profil et exigences
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                placeholder="• Exigence 1&#10;• Exigence 2&#10;• Exigence 3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Compétences requises
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="Ex: Python, Leadership, Gestion de projet..."
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-blue-900 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Avantages et conditions
              </label>
              <textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                placeholder="• Avantage 1&#10;• Avantage 2&#10;• Avantage 3"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handlePublish}
              disabled={!formData.title || !formData.location || !formData.description || loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0E2F56] to-blue-700 hover:from-[#1a4275] hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Publication en cours...
                </>
              ) : (
                <>
                  <Briefcase className="w-5 h-5" />
                  Publier l'offre
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
