import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Star,
  File,
  FileCheck,
  Award,
  Briefcase,
  Plus,
  X,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Loader,
  MoreVertical,
} from 'lucide-react';

interface Document {
  id: string;
  user_id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  is_primary: boolean;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface DocumentStats {
  total_documents: number;
  total_size: number;
  cv_count: number;
  certificate_count: number;
  other_count: number;
}

export default function DocumentManager() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total_documents: 0,
    total_size: 0,
    cv_count: 0,
    certificate_count: 0,
    other_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    document_type: 'cv',
    description: '',
    is_primary: false,
    tags: [] as string[],
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (user) {
      loadDocuments();
      loadStats();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_documents_stats', {
        p_user_id: user.id,
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error: any) {
      console.error('Erreur stats:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (maximum 10MB)');
        return;
      }

      setUploadFile(file);
      if (!uploadForm.document_name) {
        setUploadForm({ ...uploadForm, document_name: file.name.split('.')[0] });
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadFile) return;

    setUploading(true);
    try {
      // 1. Upload du fichier dans storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('candidate-documents')
        .getPublicUrl(fileName);

      // 3. Créer l'entrée dans la base de données
      const { error: dbError } = await supabase.from('candidate_documents').insert({
        user_id: user.id,
        document_name: uploadForm.document_name,
        document_type: uploadForm.document_type,
        file_url: urlData.publicUrl,
        file_name: uploadFile.name,
        file_size: uploadFile.size,
        file_type: uploadFile.type,
        is_primary: uploadForm.is_primary,
        description: uploadForm.description || null,
        tags: uploadForm.tags,
      });

      if (dbError) throw dbError;

      alert('Document téléchargé avec succès!');
      resetUploadForm();
      loadDocuments();
      loadStats();
    } catch (error: any) {
      console.error('Erreur upload:', error);
      alert('Erreur lors du téléchargement: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${doc.document_name}" ?`)) return;

    try {
      // 1. Supprimer le fichier du storage
      const filePath = doc.file_url.split('/candidate-documents/')[1];
      if (filePath) {
        await supabase.storage.from('candidate-documents').remove([filePath]);
      }

      // 2. Supprimer l'entrée de la base de données
      const { error } = await supabase
        .from('candidate_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      alert('Document supprimé avec succès!');
      loadDocuments();
      loadStats();
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleSetPrimary = async (doc: Document) => {
    if (doc.document_type !== 'cv') {
      alert('Seuls les CV peuvent être définis comme principaux');
      return;
    }

    try {
      const { error } = await supabase
        .from('candidate_documents')
        .update({ is_primary: true })
        .eq('id', doc.id);

      if (error) throw error;

      alert('CV principal mis à jour!');
      loadDocuments();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const filePath = doc.file_url.split('/candidate-documents/')[1];
      if (!filePath) {
        // Si c'est une URL publique directe, on ouvre dans un nouvel onglet
        window.open(doc.file_url, '_blank');
        return;
      }

      const { data, error } = await supabase.storage
        .from('candidate-documents')
        .download(filePath);

      if (error) throw error;

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement: ' + error.message);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      document_name: '',
      document_type: 'cv',
      description: '',
      is_primary: false,
      tags: [],
    });
    setUploadFile(null);
    setTagInput('');
    setShowUploadModal(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !uploadForm.tags.includes(tagInput.trim())) {
      setUploadForm({
        ...uploadForm,
        tags: [...uploadForm.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setUploadForm({
      ...uploadForm,
      tags: uploadForm.tags.filter((t) => t !== tag),
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'cv':
        return FileText;
      case 'certificate':
      case 'diploma':
        return Award;
      case 'cover_letter':
        return FileCheck;
      case 'portfolio':
        return Briefcase;
      default:
        return File;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      cv: 'CV',
      cover_letter: 'Lettre de motivation',
      certificate: 'Certificat',
      diploma: 'Diplôme',
      portfolio: 'Portfolio',
      recommendation: 'Recommandation',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesType = selectedType === 'all' || doc.document_type === selectedType;
    const matchesSearch =
      searchQuery === '' ||
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <FileText className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.total_documents}</p>
          <p className="text-sm opacity-90">Documents</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <FileCheck className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.cv_count}</p>
          <p className="text-sm opacity-90">CV</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <Award className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{stats.certificate_count}</p>
          <p className="text-sm opacity-90">Certificats</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <Briefcase className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{formatFileSize(stats.total_size)}</p>
          <p className="text-sm opacity-90">Espace utilisé</p>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="cv">CV</option>
              <option value="cover_letter">Lettres de motivation</option>
              <option value="certificate">Certificats</option>
              <option value="diploma">Diplômes</option>
              <option value="portfolio">Portfolio</option>
              <option value="recommendation">Recommandations</option>
              <option value="other">Autres</option>
            </select>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un document</span>
          </button>
        </div>
      </div>

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || selectedType !== 'all'
              ? 'Aucun document trouvé'
              : 'Aucun document'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedType !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par ajouter votre CV et vos certificats'}
          </p>
          {!searchQuery && selectedType === 'all' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition"
            >
              Ajouter mon premier document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const Icon = getDocumentIcon(doc.document_type);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-blue-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-900" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {doc.document_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getDocumentTypeLabel(doc.document_type)}
                      </p>
                    </div>
                  </div>
                  {doc.is_primary && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                </div>

                {doc.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center space-x-2"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Télécharger</span>
                  </button>
                  {doc.document_type === 'cv' && !doc.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(doc)}
                      className="p-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition"
                      title="Définir comme principal"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Ajouter un document</h2>
                <button
                  onClick={resetUploadForm}
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-6">
              {/* Upload de fichier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                    required
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    {uploadFile ? (
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{uploadFile.name}</p>
                        <p className="text-gray-500">{formatFileSize(uploadFile.size)}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                        <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Nom du document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du document *
                </label>
                <input
                  type="text"
                  value={uploadForm.document_name}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, document_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: CV 2024"
                  required
                />
              </div>

              {/* Type de document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de document *
                </label>
                <select
                  value={uploadForm.document_type}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, document_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="cv">CV</option>
                  <option value="cover_letter">Lettre de motivation</option>
                  <option value="certificate">Certificat</option>
                  <option value="diploma">Diplôme</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="recommendation">Recommandation</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ajoutez une description..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (optionnel)
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ajouter un tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uploadForm.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* CV principal */}
              {uploadForm.document_type === 'cv' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={uploadForm.is_primary}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, is_primary: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_primary" className="text-sm text-gray-700">
                    Définir comme CV principal
                  </label>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Information</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Vos documents sont stockés de manière sécurisée. Seul vous pouvez y accéder.
                      Vous pouvez les télécharger, modifier ou supprimer à tout moment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex-1 bg-blue-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Téléchargement...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Télécharger le document</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetUploadForm}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
