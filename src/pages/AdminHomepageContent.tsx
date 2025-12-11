import { useState, useEffect } from 'react';
import { Save, Plus, Edit, Trash2, Video, FileText, Eye, EyeOff, Upload, X, ArrowLeft, GripVertical } from 'lucide-react';
import { homepageContentService, VideoSettings, Guide } from '../services/homepageContentService';
import { useAuth } from '../contexts/AuthContext';

const categories = [
  { value: 'candidate', label: 'Candidat' },
  { value: 'recruiter', label: 'Recruteur' },
  { value: 'trainer', label: 'Formateur/Organisme' },
  { value: 'ia', label: 'IA' },
  { value: 'general', label: 'Général' }
];

const iconsList = ['FileText', 'Download', 'Sparkles', 'User', 'Briefcase', 'GraduationCap', 'Book', 'Video', 'HelpCircle'];

export default function AdminHomepageContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'video' | 'guides'>('video');
  const [videoSettings, setVideoSettings] = useState<VideoSettings | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settings, allGuides] = await Promise.all([
        homepageContentService.getVideoSettings(),
        homepageContentService.getAllGuides()
      ]);
      setVideoSettings(settings);
      setGuides(allGuides);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVideo = async () => {
    if (!videoSettings) return;
    setSaving(true);
    const success = await homepageContentService.updateVideoSettings(videoSettings);
    if (success) {
      alert('Configuration vidéo sauvegardée!');
    }
    setSaving(false);
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const url = type === 'video'
        ? await homepageContentService.uploadVideo(file, user.id)
        : await homepageContentService.uploadThumbnail(file, user.id);

      if (url) {
        setVideoSettings(prev => prev ? {
          ...prev,
          [type === 'video' ? 'video_file_url' : 'thumbnail_url']: url
        } : null);
      }
    } catch (error) {
      alert('Erreur lors de l\'upload');
    }
  };

  const handleSaveGuide = async (guideData: Partial<Guide>) => {
    setSaving(true);
    try {
      if (editingGuide?.id) {
        await homepageContentService.updateGuide(editingGuide.id, guideData);
      } else {
        await homepageContentService.createGuide(guideData as any);
      }
      await loadData();
      setShowGuideModal(false);
      setEditingGuide(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuide = async (id: string) => {
    if (!confirm('Supprimer ce guide?')) return;
    await homepageContentService.deleteGuide(id);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contenu Page d'Accueil</h1>
            <p className="text-gray-600 mt-2">Gérez la vidéo et les guides utilisateurs</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-6 py-4 font-medium flex items-center space-x-2 ${
                activeTab === 'video'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Video className="w-5 h-5" />
              <span>Vidéo</span>
            </button>
            <button
              onClick={() => setActiveTab('guides')}
              className={`px-6 py-4 font-medium flex items-center space-x-2 ${
                activeTab === 'guides'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Guides</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'video' && videoSettings && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={videoSettings.is_enabled}
                      onChange={(e) => setVideoSettings({ ...videoSettings, is_enabled: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="font-medium text-gray-900">Section activée</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                    <input
                      type="text"
                      value={videoSettings.title}
                      onChange={(e) => setVideoSettings({ ...videoSettings, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position vidéo</label>
                    <select
                      value={videoSettings.layout}
                      onChange={(e) => setVideoSettings({ ...videoSettings, layout: e.target.value as 'left' | 'right' })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="left">Gauche</option>
                      <option value="right">Droite</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={videoSettings.description}
                    onChange={(e) => setVideoSettings({ ...videoSettings, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Vidéo (YouTube/Vimeo)</label>
                  <input
                    type="text"
                    value={videoSettings.video_url || ''}
                    onChange={(e) => setVideoSettings({ ...videoSettings, video_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OU Upload Vidéo</label>
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Cliquez pour uploader</span>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoFileUpload(e, 'video')}
                      className="hidden"
                    />
                  </label>
                  {videoSettings.video_file_url && (
                    <p className="text-sm text-green-600 mt-2">✓ Vidéo uploadée</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image miniature</label>
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleVideoFileUpload(e, 'thumbnail')}
                      className="hidden"
                    />
                    {videoSettings.thumbnail_url ? (
                      <img src={videoSettings.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-600">Cliquez pour uploader</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveVideo}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'guides' && (
              <div>
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => {
                      setEditingGuide(null);
                      setShowGuideModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Ajouter un guide</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {guides.map((guide) => (
                    <div
                      key={guide.id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {categories.find(c => c.value === guide.category)?.label}
                          </span>
                          {!guide.is_active && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              Désactivé
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900">{guide.title}</h4>
                        {guide.description && (
                          <p className="text-sm text-gray-600 mt-1">{guide.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingGuide(guide);
                            setShowGuideModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGuide(guide.id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showGuideModal && (
        <GuideModal
          guide={editingGuide}
          onSave={handleSaveGuide}
          onClose={() => {
            setShowGuideModal(false);
            setEditingGuide(null);
          }}
        />
      )}
    </div>
  );
}

function GuideModal({ guide, onSave, onClose }: { guide: Guide | null; onSave: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<Guide>>(guide || {
    title: '',
    description: '',
    category: 'general',
    icon: 'FileText',
    file_url: '',
    file_type: 'external_link',
    is_active: true,
    display_order: 0
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{guide ? 'Modifier' : 'Ajouter'} un guide</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icône</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {iconsList.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL ou lien externe *</label>
            <input
              type="text"
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://..."
              required
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Guide actif</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
