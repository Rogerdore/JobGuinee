import { X, Upload, Plus, Trash2, Image, Video } from 'lucide-react';
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [achievements, setAchievements] = useState<string[]>(['']);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [galleryMedia, setGalleryMedia] = useState<Array<{file: File; type: 'image' | 'video'; preview: string; caption: string}>>([]);
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

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La photo ne doit pas dépasser 5MB');
        return;
      }
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia: Array<{file: File; type: 'image' | 'video'; preview: string; caption: string}> = [];

    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} dépasse 50MB et ne sera pas ajouté`);
        return;
      }

      const type = file.type.startsWith('image/') ? 'image' : 'video';
      newMedia.push({
        file,
        type,
        preview: URL.createObjectURL(file),
        caption: ''
      });
    });

    setGalleryMedia([...galleryMedia, ...newMedia]);
  };

  const removeGalleryItem = (index: number) => {
    const newGallery = galleryMedia.filter((_, i) => i !== index);
    setGalleryMedia(newGallery);
  };

  const updateGalleryCaption = (index: number, caption: string) => {
    const newGallery = [...galleryMedia];
    newGallery[index].caption = caption;
    setGalleryMedia(newGallery);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('success-stories')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('success-stories')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour partager votre histoire');
      return;
    }

    setLoading(true);
    setUploadingPhoto(true);

    try {
      let profilePhotoUrl = formData.profile_photo_url;

      if (profilePhoto) {
        profilePhotoUrl = await uploadFile(profilePhoto, 'profiles');
      }

      const filteredAchievements = achievements.filter(a => a.trim() !== '');

      const { data: storyData, error: storyError } = await supabase
        .from('success_stories')
        .insert([
          {
            ...formData,
            profile_photo_url: profilePhotoUrl,
            achievements: filteredAchievements,
            created_by: user.id,
            published: false,
          },
        ])
        .select()
        .single();

      if (storyError) throw storyError;

      setUploadingPhoto(false);
      setUploadingMedia(true);

      if (galleryMedia.length > 0) {
        const mediaPromises = galleryMedia.map(async (item, index) => {
          const mediaUrl = await uploadFile(item.file, item.type === 'image' ? 'gallery/images' : 'gallery/videos');

          return {
            story_id: storyData.id,
            media_type: item.type,
            media_url: mediaUrl,
            caption: item.caption,
            display_order: index,
          };
        });

        const mediaData = await Promise.all(mediaPromises);

        const { error: mediaError } = await supabase
          .from('story_media')
          .insert(mediaData);

        if (mediaError) throw mediaError;
      }

      alert('Votre histoire a été soumise avec succès! Elle sera publiée après modération.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting story:', error);
      alert('Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
      setUploadingMedia(false);
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
                    <option value="Administration">Administration</option>
                    <option value="Agriculture">Agriculture / Agroalimentaire</option>
                    <option value="Architecture">Architecture / Urbanisme</option>
                    <option value="Assurance">Assurance</option>
                    <option value="Audit">Audit / Conseil</option>
                    <option value="Automobile">Automobile</option>
                    <option value="Banque">Banque</option>
                    <option value="BTP">BTP / Construction</option>
                    <option value="Commerce">Commerce / Distribution</option>
                    <option value="Communication">Communication / Marketing</option>
                    <option value="Comptabilité">Comptabilité / Gestion</option>
                    <option value="Culture">Culture / Arts</option>
                    <option value="Défense">Défense / Sécurité</option>
                    <option value="Design">Design / Création</option>
                    <option value="Droit">Droit / Juridique</option>
                    <option value="Éducation">Éducation / Formation</option>
                    <option value="Énergie">Énergie / Utilities</option>
                    <option value="Environnement">Environnement / Développement Durable</option>
                    <option value="Finance">Finance</option>
                    <option value="Hôtellerie">Hôtellerie / Restauration</option>
                    <option value="Immobilier">Immobilier</option>
                    <option value="Industrie">Industrie / Manufacturing</option>
                    <option value="Ingénierie">Ingénierie</option>
                    <option value="IT">IT / Informatique</option>
                    <option value="Logistique">Logistique / Supply Chain</option>
                    <option value="Médias">Médias / Presse</option>
                    <option value="Mines">Mines / Métallurgie</option>
                    <option value="ONG">ONG / Humanitaire</option>
                    <option value="Pétrole">Pétrole / Gaz</option>
                    <option value="Pharmacie">Pharmacie</option>
                    <option value="Production">Production / Manufacturing</option>
                    <option value="Qualité">Qualité / HSE</option>
                    <option value="Recherche">Recherche & Développement</option>
                    <option value="Ressources Humaines">Ressources Humaines</option>
                    <option value="Santé">Santé / Médical</option>
                    <option value="Services">Services aux Entreprises</option>
                    <option value="Sport">Sport / Loisirs</option>
                    <option value="Télécommunications">Télécommunications</option>
                    <option value="Tourisme">Tourisme</option>
                    <option value="Transport">Transport / Logistique</option>
                    <option value="Vente">Vente / Commercial</option>
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
                  Photo de profil *
                </label>
                <div className="flex items-start gap-4">
                  {profilePhotoPreview && (
                    <img
                      src={profilePhotoPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                    />
                  )}
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#FF8C00] hover:bg-orange-50 transition cursor-pointer">
                      <Image className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {profilePhoto ? profilePhoto.name : 'Choisir une photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                        required={!formData.profile_photo_url}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG. Max: 5MB</p>
                  </div>
                </div>
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
                  Votre histoire complète * (100-500 caractères)
                </label>
                <textarea
                  name="story_content"
                  required
                  minLength={100}
                  maxLength={500}
                  value={formData.story_content}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  placeholder="Racontez votre parcours, vos défis, vos victoires..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.story_content.length}/500 caractères (min 100)
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
                <h3 className="font-bold text-gray-900 mb-4">Galerie Photos & Vidéos (optionnel)</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#FF8C00] hover:bg-orange-50 transition cursor-pointer">
                    <Upload className="w-6 h-6 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Ajouter photos et vidéos
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleGalleryMediaChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    Images: JPG, PNG. Vidéos: MP4, MOV. Max 50MB par fichier
                  </p>

                  {galleryMedia.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {galleryMedia.map((item, index) => (
                        <div key={index} className="relative bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <button
                            type="button"
                            onClick={() => removeGalleryItem(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="mb-2">
                            {item.type === 'image' ? (
                              <img
                                src={item.preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-800 rounded flex items-center justify-center">
                                <Video className="w-12 h-12 text-white" />
                              </div>
                            )}
                          </div>

                          <input
                            type="text"
                            value={item.caption}
                            onChange={(e) => updateGalleryCaption(index, e.target.value)}
                            placeholder="Légende (optionnel)"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#FF8C00] focus:border-transparent"
                          />

                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {item.type === 'image' ? <Image className="w-3 h-3 inline mr-1" /> : <Video className="w-3 h-3 inline mr-1" />}
                            {item.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

              {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-[#FF8C00] border-t-transparent rounded-full animate-spin"></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900">
                        {uploadingPhoto ? 'Upload de la photo de profil...' : uploadingMedia ? 'Upload de la galerie...' : 'Envoi en cours...'}
                      </p>
                      <p className="text-xs text-blue-700">
                        Veuillez patienter, cela peut prendre quelques instants
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
