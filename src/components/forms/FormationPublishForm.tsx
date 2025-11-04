import { useState, useEffect } from 'react';
import { Save, X, Plus, Monitor, Users, Building2, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { supabase, TrainerProfile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FormationPublishFormProps {
  trainerProfile: TrainerProfile;
  formationId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormationPublishForm({
  trainerProfile,
  formationId,
  onClose,
  onSuccess
}: FormationPublishFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedOrgType, setSelectedOrgType] = useState<'individual' | 'company' | 'institute'>('individual');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const [commonData, setCommonData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Débutant',
    price: 0,
    format: 'presential' as 'presential' | 'online' | 'hybrid',
    duration: '',
    max_participants: 0,
    language: 'Français',
    prerequisites: '',
    objectives: [] as string[],
    certification: false,
    certification_details: '',
    thumbnail_url: '',
    start_date: '',
    end_date: '',
    status: 'draft' as 'draft' | 'published'
  });

  const [individualData, setIndividualData] = useState({
    individual_location: '',
    individual_schedule: '',
    individual_materials_included: false,
    individual_materials_list: [] as string[]
  });

  const [companyData, setCompanyData] = useState({
    company_location: '',
    company_custom_program: false,
    company_group_discount: false,
    company_corporate_training: false,
    company_trainer_team: [] as string[]
  });

  const [instituteData, setInstituteData] = useState({
    institute_campus_location: '',
    institute_accredited: false,
    institute_diploma_level: '',
    institute_admission_requirements: '',
    institute_scholarships_available: false
  });

  useEffect(() => {
    if (formationId) {
      loadFormation();
    }
  }, [formationId]);

  const loadFormation = async () => {
    if (!formationId) return;

    try {
      const { data, error } = await supabase
        .from('formations')
        .select('*')
        .eq('id', formationId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCommonData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          level: data.level || 'Débutant',
          price: data.price || 0,
          format: data.format || 'presential',
          duration: data.duration || '',
          max_participants: data.max_participants || 0,
          language: data.language || 'Français',
          prerequisites: data.prerequisites || '',
          objectives: data.objectives || [],
          certification: data.certification || false,
          certification_details: data.certification_details || '',
          thumbnail_url: data.thumbnail_url || '',
          start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
          end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
          status: data.status || 'draft'
        });

        const orgType = (data as any).organization_type || 'individual';
        setSelectedOrgType(orgType);

        if (data.thumbnail_url) {
          setCoverImagePreview(data.thumbnail_url);
        }

        if ((data as any).media_urls && Array.isArray((data as any).media_urls)) {
          setMediaUrls((data as any).media_urls);
        }

        if (orgType === 'individual') {
          setIndividualData({
            individual_location: data.individual_location || '',
            individual_schedule: data.individual_schedule || '',
            individual_materials_included: data.individual_materials_included || false,
            individual_materials_list: data.individual_materials_list || []
          });
        } else if (orgType === 'company') {
          setCompanyData({
            company_location: data.company_location || '',
            company_custom_program: data.company_custom_program || false,
            company_group_discount: data.company_group_discount || false,
            company_corporate_training: data.company_corporate_training || false,
            company_trainer_team: data.company_trainer_team || []
          });
        } else if (orgType === 'institute') {
          setInstituteData({
            institute_campus_location: data.institute_campus_location || '',
            institute_accredited: data.institute_accredited || false,
            institute_diploma_level: data.institute_diploma_level || '',
            institute_admission_requirements: data.institute_admission_requirements || '',
            institute_scholarships_available: data.institute_scholarships_available || false
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading formation:', error);
      setMessage('Erreur lors du chargement');
    }
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImage || !user) return null;

    try {
      const fileExt = coverImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('formation-covers')
        .upload(fileName, coverImage);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('formation-covers')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading cover:', error);
      return null;
    }
  };

  const uploadMediaFiles = async (): Promise<string[]> => {
    if (mediaFiles.length === 0 || !user) return [];

    try {
      const uploadedUrls: string[] = [];

      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('formation-media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('formation-media')
          .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading media:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadingMedia(true);
    setMessage('');

    try {
      let thumbnailUrl = commonData.thumbnail_url;
      if (coverImage) {
        const uploadedCover = await uploadCoverImage();
        if (uploadedCover) {
          thumbnailUrl = uploadedCover;
        }
      }

      const uploadedMedia = await uploadMediaFiles();
      const allMediaUrls = [...mediaUrls, ...uploadedMedia];

      let formationData: any = {
        ...commonData,
        thumbnail_url: thumbnailUrl,
        media_urls: allMediaUrls,
        trainer_id: trainerProfile.id,
        provider: trainerProfile.organization_name || 'Non défini',
        organization_type: selectedOrgType
      };

      if (selectedOrgType === 'individual') {
        formationData = { ...formationData, ...individualData };
      } else if (selectedOrgType === 'company') {
        formationData = { ...formationData, ...companyData };
      } else if (selectedOrgType === 'institute') {
        formationData = { ...formationData, ...instituteData };
      }

      setUploadingMedia(false);

      if (formationId) {
        const { error } = await supabase
          .from('formations')
          .update(formationData)
          .eq('id', formationId);

        if (error) throw error;
        setMessage('Formation mise à jour avec succès!');
      } else {
        const { error } = await supabase
          .from('formations')
          .insert(formationData);

        if (error) throw error;
        setMessage('Formation créée avec succès!');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      setMessage('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleObjectivesChange = (value: string) => {
    const objectives = value.split('\n').filter(o => o.trim());
    setCommonData({ ...commonData, objectives });
  };

  const handleMaterialsChange = (value: string) => {
    const materials = value.split('\n').filter(m => m.trim());
    setIndividualData({ ...individualData, individual_materials_list: materials });
  };

  const handleTrainerTeamChange = (value: string) => {
    const team = value.split('\n').filter(t => t.trim());
    setCompanyData({ ...companyData, company_trainer_team: team });
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setCoverImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Veuillez sélectionner une image');
      }
    }
  };

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length !== files.length) {
      alert('Seules les images et vidéos sont acceptées');
    }

    setMediaFiles(prev => [...prev, ...validFiles]);
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {formationId ? 'Modifier la Formation' : 'Publier une Formation'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('Erreur') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Informations Générales</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'Organisation *
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedOrgType('individual')}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedOrgType === 'individual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Indépendant</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrgType('company')}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedOrgType === 'company'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Entreprise</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrgType('institute')}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedOrgType === 'institute'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Institut</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la Formation *
              </label>
              <input
                type="text"
                value={commonData.title}
                onChange={(e) => setCommonData({ ...commonData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={commonData.description}
                onChange={(e) => setCommonData({ ...commonData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={commonData.category}
                  onChange={(e) => setCommonData({ ...commonData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez</option>
                  <option value="Développement">Développement</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Business">Business</option>
                  <option value="Langues">Langues</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Management">Management</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau *
                </label>
                <select
                  value={commonData.level}
                  onChange={(e) => setCommonData({ ...commonData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                  <option value="Tous niveaux">Tous niveaux</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format de Formation *
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setCommonData({ ...commonData, format: 'presential' })}
                  className={`p-4 rounded-lg border-2 transition ${
                    commonData.format === 'presential'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Présentiel</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCommonData({ ...commonData, format: 'online' })}
                  className={`p-4 rounded-lg border-2 transition ${
                    commonData.format === 'online'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Monitor className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">En Ligne</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCommonData({ ...commonData, format: 'hybrid' })}
                  className={`p-4 rounded-lg border-2 transition ${
                    commonData.format === 'hybrid'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Hybride</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée *
                </label>
                <input
                  type="text"
                  value={commonData.duration}
                  onChange={(e) => setCommonData({ ...commonData, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 3 mois, 40h"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (GNF) *
                </label>
                <input
                  type="number"
                  value={commonData.price}
                  onChange={(e) => setCommonData({ ...commonData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participants Max
                </label>
                <input
                  type="number"
                  value={commonData.max_participants}
                  onChange={(e) => setCommonData({ ...commonData, max_participants: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de Début
                </label>
                <input
                  type="date"
                  value={commonData.start_date}
                  onChange={(e) => setCommonData({ ...commonData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de Fin
                </label>
                <input
                  type="date"
                  value={commonData.end_date}
                  onChange={(e) => setCommonData({ ...commonData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prérequis
              </label>
              <textarea
                value={commonData.prerequisites}
                onChange={(e) => setCommonData({ ...commonData, prerequisites: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez les prérequis nécessaires..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objectifs d'Apprentissage
              </label>
              <textarea
                value={commonData.objectives.join('\n')}
                onChange={(e) => handleObjectivesChange(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Un objectif par ligne..."
              />
              <p className="text-xs text-gray-500 mt-1">Un objectif par ligne</p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commonData.certification}
                  onChange={(e) => setCommonData({ ...commonData, certification: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Certification fournie
                </span>
              </label>
            </div>

            {commonData.certification && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Détails de la Certification
                </label>
                <input
                  type="text"
                  value={commonData.certification_details}
                  onChange={(e) => setCommonData({ ...commonData, certification_details: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Certificat de compétence reconnu"
                />
              </div>
            )}
          </div>

          <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-bold text-gray-900">Médias de la Formation</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de Couverture *
              </label>
              <div className="space-y-4">
                {coverImagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={coverImagePreview}
                      alt="Couverture"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null);
                        setCoverImagePreview('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Cliquez pour uploader</span> l'image de couverture
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG ou JPEG</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images et Vidéos Supplémentaires
              </label>
              <div className="space-y-4">
                {(mediaUrls.length > 0 || mediaFiles.length > 0) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaUrls.map((url, index) => (
                      <div key={`url-${index}`} className="relative group">
                        {url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video
                            src={url}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`Media ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaUrl(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {mediaFiles.map((file, index) => (
                      <div key={`file-${index}`} className="relative group">
                        {file.type.startsWith('video/') ? (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                        ) : (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaFile(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Cliquez pour ajouter</span> des médias
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Images ou vidéos</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaFilesChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {selectedOrgType === 'individual' && (
            <div className="space-y-6 pt-6 border-t">
              <h3 className="text-lg font-bold text-gray-900">Informations Formateur Indépendant</h3>

              {commonData.format !== 'online' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu de Formation
                  </label>
                  <input
                    type="text"
                    value={individualData.individual_location}
                    onChange={(e) => setIndividualData({ ...individualData, individual_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horaires Disponibles
                </label>
                <textarea
                  value={individualData.individual_schedule}
                  onChange={(e) => setIndividualData({ ...individualData, individual_schedule: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Lundi-Vendredi 9h-17h"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={individualData.individual_materials_included}
                    onChange={(e) => setIndividualData({ ...individualData, individual_materials_included: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Matériel de formation inclus
                  </span>
                </label>
              </div>

              {individualData.individual_materials_included && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liste du Matériel
                  </label>
                  <textarea
                    value={individualData.individual_materials_list.join('\n')}
                    onChange={(e) => handleMaterialsChange(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Un élément par ligne..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Un élément par ligne</p>
                </div>
              )}
            </div>
          )}

          {selectedOrgType === 'company' && (
            <div className="space-y-6 pt-6 border-t">
              <h3 className="text-lg font-bold text-gray-900">Informations Entreprise</h3>

              {commonData.format !== 'online' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centre de Formation
                  </label>
                  <input
                    type="text"
                    value={companyData.company_location}
                    onChange={(e) => setCompanyData({ ...companyData, company_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={companyData.company_custom_program}
                    onChange={(e) => setCompanyData({ ...companyData, company_custom_program: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Programmes personnalisés disponibles
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={companyData.company_group_discount}
                    onChange={(e) => setCompanyData({ ...companyData, company_group_discount: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Réduction groupe disponible
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={companyData.company_corporate_training}
                    onChange={(e) => setCompanyData({ ...companyData, company_corporate_training: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Formation corporate disponible
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipe de Formateurs
                </label>
                <textarea
                  value={companyData.company_trainer_team.join('\n')}
                  onChange={(e) => handleTrainerTeamChange(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Un formateur par ligne..."
                />
                <p className="text-xs text-gray-500 mt-1">Un formateur par ligne</p>
              </div>
            </div>
          )}

          {selectedOrgType === 'institute' && (
            <div className="space-y-6 pt-6 border-t">
              <h3 className="text-lg font-bold text-gray-900">Informations Institut</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campus
                </label>
                <input
                  type="text"
                  value={instituteData.institute_campus_location}
                  onChange={(e) => setInstituteData({ ...instituteData, institute_campus_location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instituteData.institute_accredited}
                    onChange={(e) => setInstituteData({ ...instituteData, institute_accredited: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Programme accrédité
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instituteData.institute_scholarships_available}
                    onChange={(e) => setInstituteData({ ...instituteData, institute_scholarships_available: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Bourses disponibles
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau de Diplôme
                </label>
                <select
                  value={instituteData.institute_diploma_level}
                  onChange={(e) => setInstituteData({ ...instituteData, institute_diploma_level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez</option>
                  <option value="Certificate">Certificat</option>
                  <option value="Diploma">Diplôme</option>
                  <option value="Licence">Licence</option>
                  <option value="Master">Master</option>
                  <option value="Doctorat">Doctorat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conditions d'Admission
                </label>
                <textarea
                  value={instituteData.institute_admission_requirements}
                  onChange={(e) => setInstituteData({ ...instituteData, institute_admission_requirements: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez les conditions d'admission..."
                />
              </div>
            </div>
          )}

          <div className="pt-6 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={commonData.status}
              onChange={(e) => setCommonData({ ...commonData, status: e.target.value as 'draft' | 'published' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || uploadingMedia}
              className="flex items-center gap-2 px-6 py-3 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition font-medium disabled:bg-gray-400"
            >
              <Save className="w-5 h-5" />
              {uploadingMedia ? 'Upload en cours...' : loading ? 'Enregistrement...' : formationId ? 'Mettre à jour' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
