import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SubmitStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitStoryModal({ isOpen, onClose, onSuccess }: SubmitStoryModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<string[]>(['']);
  const [formData, setFormData] = useState({
    author_name: '',
    profile_photo_url: '',
    job_title: '',
    company: '',
    industry: '',
    location: '',
    summary: '',
    story_title: '',
    story_excerpt: '',
    story_content: '',
    linkedin_url: '',
    email: '',
    phone: '',
    years_experience: 0,
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...achievements];
    newAchievements[index] = value;
    setAchievements(newAchievements);
  };

  const addAchievement = () => {
    setAchievements([...achievements, '']);
  };

  const removeAchievement = (index: number) => {
    const newAchievements = achievements.filter((_, i) => i !== index);
    setAchievements(newAchievements);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour partager votre histoire');
      return;
    }

    setLoading(true);

    try {
      const filteredAchievements = achievements.filter(a => a.trim() !== '');

      const { error } = await supabase
        .from('success_stories')
        .insert([
          {
            ...formData,
            achievements: filteredAchievements,
            created_by: user.id,
            published: false,
          },
        ]);

      if (error) throw error;

      alert('Votre histoire a été soumise avec succès! Elle sera publiée après modération.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting story:', error);
      alert('Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-20">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full animate-in fade-in zoom-in duration-300 mb-20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-[#FF8C00] to-orange-600 p-6 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Upload className="w-6 h-6" />
              Partager Mon Histoire
            </h2>
            <p className="text-orange-100 mt-2">
              Inspirez des milliers de professionnels guinéens avec votre parcours
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Votre histoire sera examinée par notre équipe avant publication pour garantir la qualité du contenu.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="author_name"
                    required
                    value={formData.author_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    placeholder="Votre nom complet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Poste actuel *
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    required
                    value={formData.job_title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    placeholder="Ex: Directeur RH"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    placeholder="Nom de votre entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Secteur d'activité *
                  </label>
                  <select
                    name="industry"
                    required
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Technologie">Technologie</option>
                    <option value="Télécommunications">Télécommunications</option>
                    <option value="Mines & Ressources">Mines & Ressources</option>
                    <option value="Agriculture & Développement">Agriculture & Développement</option>
                    <option value="Hôtellerie & Tourisme">Hôtellerie & Tourisme</option>
                    <option value="Conseil & Formation">Conseil & Formation</option>
                    <option value="Finance & Banque">Finance & Banque</option>
                    <option value="Santé">Santé</option>
                    <option value="Éducation">Éducation</option>
                    <option value="Commerce & Distribution">Commerce & Distribution</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Localisation
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    placeholder="Ex: Conakry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Années d'expérience *
                  </label>
                  <input
                    type="number"
                    name="years_experience"
                    required
                    min="0"
                    value={formData.years_experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    placeholder="Ex: 10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  URL photo de profil
                </label>
                <input
                  type="url"
                  name="profile_photo_url"
                  value={formData.profile_photo_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Lien vers votre photo professionnelle</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Résumé professionnel * (max 200 caractères)
                </label>
                <textarea
                  name="summary"
                  required
                  maxLength={200}
                  value={formData.summary}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  placeholder="Décrivez votre profil professionnel en quelques mots..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.summary.length}/200 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Titre de votre histoire *
                </label>
                <input
                  type="text"
                  name="story_title"
                  required
                  value={formData.story_title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  placeholder="Ex: De Stagiaire à Directeur : Mon Parcours"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Extrait de votre histoire * (min 50 caractères)
                </label>
                <textarea
                  name="story_excerpt"
                  required
                  minLength={50}
                  value={formData.story_excerpt}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  placeholder="Un court résumé accrocheur de votre histoire..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.story_excerpt.length} caractères (min 50)
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Votre histoire complète * (min 100 caractères)
                </label>
                <textarea
                  name="story_content"
                  required
                  minLength={100}
                  value={formData.story_content}
                  onChange={handleChange}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  placeholder="Racontez votre parcours, vos défis, vos victoires..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.story_content.length} caractères (min 100)
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Réalisations clés
                </label>
                <div className="space-y-2">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => handleAchievementChange(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        placeholder={`Réalisation ${index + 1}`}
                      />
                      {achievements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAchievement(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addAchievement}
                  className="mt-2 flex items-center gap-2 px-4 py-2 text-[#FF8C00] hover:bg-orange-50 rounded-lg transition font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une réalisation
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4">Coordonnées (optionnel)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      placeholder="URL LinkedIn"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      placeholder="+224 XXX XX XX XX"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Envoi en cours...' : 'Soumettre mon histoire'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
