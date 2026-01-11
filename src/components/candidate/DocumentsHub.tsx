import { useState, useEffect } from 'react';
import {
  FileText, Upload, Download, Eye, Star, Archive, Trash2,
  Search, Filter, Plus, RefreshCw, Calendar, Tag, Sparkles,
  File, FileCheck, Award, Folder, BarChart3, Clock, CheckCircle,
  AlertCircle, ExternalLink, Copy, Share2, Edit3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  candidateDocumentService,
  CandidateDocument,
  DocumentType,
  DocumentStats
} from '../../services/candidateDocumentService';
import { documentEditorService } from '../../services/documentEditorService';
import SuccessModal from '../notifications/SuccessModal';
import DocumentEditor from './DocumentEditor';

export default function DocumentsHub() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CandidateDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<CandidateDocument | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [availableToImport, setAvailableToImport] = useState(0);
  const [autoImportDone, setAutoImportDone] = useState(false);
  const [showImportSuggestion, setShowImportSuggestion] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id, showArchived]);

  useEffect(() => {
    if (profile?.id && documents.length === 0 && !loading && !autoImportDone) {
      checkAvailableDocuments();
    }
  }, [profile?.id, documents.length, loading, autoImportDone]);

  const loadData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const [docs, statistics, availableCount] = await Promise.all([
        candidateDocumentService.getAllDocuments(profile.id, showArchived),
        candidateDocumentService.getDocumentStats(profile.id),
        candidateDocumentService.countAvailableDocuments(profile.id)
      ]);
      setDocuments(docs);
      setStats(statistics);
      setAvailableToImport(availableCount);

      if (docs.length === 0 && availableCount > 0 && !autoImportDone) {
        setShowImportSuggestion(true);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailableDocuments = async () => {
    if (!profile?.id) return;

    try {
      const count = await candidateDocumentService.countAvailableDocuments(profile.id);
      setAvailableToImport(count);

      if (count > 0 && documents.length === 0) {
        setShowImportSuggestion(true);
      }
    } catch (error) {
      console.error('Error checking available documents:', error);
    }
  };

  const handleImportExisting = async () => {
    if (!profile?.id) return;

    setLoading(true);
    setShowImportSuggestion(false);
    try {
      const count = await candidateDocumentService.aggregateFromExistingSources(profile.id);
      setAutoImportDone(true);
      if (count > 0) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Import réussi !',
          message: `${count} document${count > 1 ? 's ont' : ' a'} été importé${count > 1 ? 's' : ''} avec succès dans votre centre de documentation.`
        });
      } else {
        setNotification({
          show: true,
          type: 'info',
          title: 'Aucun nouveau document',
          message: 'Tous vos documents disponibles ont déjà été importés dans votre centre de documentation.'
        });
      }
      loadData();
    } catch (error) {
      console.error('Error importing documents:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Erreur d\'importation',
        message: 'Une erreur est survenue lors de l\'importation de vos documents. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, documentType: DocumentType, customTitle?: string) => {
    if (!profile?.id) return;

    setUploadProgress(true);
    try {
      await candidateDocumentService.uploadDocument(profile.id, {
        file,
        document_type: documentType,
        document_source: 'upload',
        tags: [],
        metadata: customTitle ? { custom_title: customTitle } : {},
        is_primary: documents.filter(d => d.document_type === documentType && !d.archived_at).length === 0
      });

      loadData();
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSetPrimary = async (documentId: string) => {
    try {
      await candidateDocumentService.setPrimaryDocument(documentId);
      loadData();
    } catch (error) {
      console.error('Error setting primary:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleArchive = async (documentId: string) => {
    if (!confirm('Archiver ce document ?')) return;

    try {
      await candidateDocumentService.archiveDocument(documentId);
      loadData();
    } catch (error) {
      console.error('Error archiving:', error);
      alert('Erreur lors de l\'archivage');
    }
  };

  const handleRestore = async (documentId: string) => {
    try {
      await candidateDocumentService.restoreDocument(documentId);
      loadData();
    } catch (error) {
      console.error('Error restoring:', error);
      alert('Erreur lors de la restauration');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Supprimer définitivement ce document ? Cette action est irréversible.')) return;

    try {
      await candidateDocumentService.deleteDocument(documentId);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleOpen = async (doc: CandidateDocument) => {
    try {
      await candidateDocumentService.trackUsage(doc.id, 'viewed');

      const bucket = doc.document_type === 'cv' ? 'candidate-cvs'
        : doc.document_type === 'cover_letter' ? 'candidate-cover-letters'
        : doc.document_type === 'certificate' ? 'candidate-certificates'
        : 'candidate-cvs';

      const filePath = doc.file_url.split('/').slice(-2).join('/');

      const { data: signedUrl, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      if (error || !signedUrl) {
        console.error('Error creating signed URL:', error);
        setNotification({
          show: true,
          type: 'error',
          title: 'Erreur d\'ouverture',
          message: 'Impossible d\'ouvrir le fichier. Veuillez réessayer.'
        });
        return;
      }

      window.open(signedUrl.signedUrl, '_blank');

      setNotification({
        show: true,
        type: 'success',
        title: 'Document ouvert',
        message: `${doc.file_name} a été ouvert dans un nouvel onglet.`
      });

      loadData();
    } catch (error) {
      console.error('Error opening document:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Erreur d\'ouverture',
        message: 'Impossible d\'ouvrir le fichier. Veuillez réessayer.'
      });
    }
  };

  const handleDownload = async (doc: CandidateDocument) => {
    try {
      await candidateDocumentService.trackUsage(doc.id, 'downloaded');

      const bucket = doc.document_type === 'cv' ? 'candidate-cvs'
        : doc.document_type === 'cover_letter' ? 'candidate-cover-letters'
        : doc.document_type === 'certificate' ? 'candidate-certificates'
        : 'candidate-cvs';

      const filePath = doc.file_url.split('/').slice(-2).join('/');

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error || !data) {
        console.error('Download error:', error);
        setNotification({
          show: true,
          type: 'error',
          title: 'Erreur de téléchargement',
          message: 'Impossible de télécharger le fichier.'
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNotification({
        show: true,
        type: 'success',
        title: 'Téléchargement réussi',
        message: `${doc.file_name} a été téléchargé avec succès.`
      });

      loadData();
    } catch (error) {
      console.error('Error downloading:', error);
      setNotification({
        show: true,
        type: 'error',
        title: 'Erreur de téléchargement',
        message: 'Impossible de télécharger le fichier. Veuillez réessayer.'
      });
    }
  };

  const handleView = async (doc: CandidateDocument) => {
    try {
      await candidateDocumentService.trackUsage(doc.id, 'viewed');
      setSelectedDocument(doc);
      loadData();
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleEdit = (doc: CandidateDocument) => {
    if (documentEditorService.isEditable(doc)) {
      setEditingDocument(doc);
    } else {
      alert('Ce type de document ne peut pas être édité directement.');
    }
  };

  const handleEditorClose = () => {
    setEditingDocument(null);
    loadData();
  };

  const filteredDocuments = documents.filter(doc => {
    if (filterType !== 'all' && doc.document_type !== filterType) return false;
    if (filterSource !== 'all' && doc.document_source !== filterSource) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesFileName = doc.file_name.toLowerCase().includes(search);
      const matchesCustomTitle = doc.metadata?.custom_title?.toLowerCase().includes(search);
      const matchesTags = doc.tags.some(tag => tag.toLowerCase().includes(search));
      if (!matchesFileName && !matchesCustomTitle && !matchesTags) {
        return false;
      }
    }
    return true;
  });

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'cv': return FileText;
      case 'cover_letter': return FileCheck;
      case 'certificate': return Award;
      default: return File;
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels = {
      cv: 'CV',
      cover_letter: 'Lettre de motivation',
      certificate: 'Certificat',
      other: 'Autre'
    };
    return labels[type];
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      upload: 'Upload manuel',
      ai_generated: 'Généré par IA',
      application: 'Candidature',
      formation: 'Formation',
      system: 'Système'
    };
    return labels[source] || source;
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      upload: 'bg-blue-100 text-blue-700',
      ai_generated: 'bg-purple-100 text-purple-700',
      application: 'bg-green-100 text-green-700',
      formation: 'bg-orange-100 text-orange-700',
      system: 'bg-gray-100 text-gray-700'
    };
    return colors[source] || 'bg-gray-100 text-gray-700';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0E2F56]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Centre de Documentation</h2>
            <p className="text-blue-100">Gérez tous vos documents professionnels en un seul endroit</p>
          </div>
          <Folder className="w-12 h-12 text-white opacity-20" />
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-xs text-blue-100 mb-1">Total</div>
              <div className="text-2xl font-bold">{stats.total_documents}</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-xs text-blue-100 mb-1">CV</div>
              <div className="text-2xl font-bold">{stats.by_type.cv}</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-xs text-blue-100 mb-1">Lettres</div>
              <div className="text-2xl font-bold">{stats.by_type.cover_letter}</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-xs text-blue-100 mb-1">Certificats</div>
              <div className="text-2xl font-bold">{stats.by_type.certificate}</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-xs text-blue-100 mb-1">Utilisations</div>
              <div className="text-2xl font-bold">{stats.total_usage}</div>
            </div>
          </div>
        )}
      </div>

      {showImportSuggestion && availableToImport > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-1">
              {availableToImport} document{availableToImport > 1 ? 's' : ''} disponible{availableToImport > 1 ? 's' : ''} à importer
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Nous avons détecté des documents dans votre profil et vos candidatures. Voulez-vous les importer dans votre centre de documentation ?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleImportExisting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Oui, importer maintenant
              </button>
              <button
                onClick={() => setShowImportSuggestion(false)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition text-sm"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Téléverser un document
          </button>
          <button
            onClick={handleImportExisting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2 relative"
          >
            <Sparkles className="w-4 h-4" />
            Importer documents existants
            {availableToImport > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {availableToImport}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              showArchived
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Masquer archivés' : 'Voir archivés'}
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as DocumentType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Tous types</option>
            <option value="cv">CV</option>
            <option value="cover_letter">Lettres</option>
            <option value="certificate">Certificats</option>
            <option value="other">Autres</option>
          </select>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' ? 'Aucun document trouvé' : 'Aucun document'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterType !== 'all'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par téléverser votre premier document'}
          </p>
          {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Téléverser un document
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
                className={`bg-white border rounded-xl p-4 hover:shadow-lg transition ${
                  doc.archived_at ? 'opacity-60 border-gray-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#0E2F56]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate" title={doc.metadata?.custom_title || doc.file_name}>
                        {doc.metadata?.custom_title || doc.file_name}
                      </h3>
                      {doc.metadata?.custom_title && (
                        <p className="text-xs text-gray-500 truncate" title={doc.file_name}>{doc.file_name}</p>
                      )}
                      <p className="text-xs text-gray-500">v{doc.version}</p>
                    </div>
                  </div>
                  {doc.is_primary && !doc.archived_at && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Tag className="w-3 h-3" />
                    <span>{getDocumentTypeLabel(doc.document_type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getSourceColor(doc.document_source)}`}>
                      {getSourceLabel(doc.document_source)}
                    </span>
                    {doc.file_size && (
                      <span className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                  {doc.usage_count > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BarChart3 className="w-3 h-3" />
                      <span>Utilisé {doc.usage_count} fois</span>
                    </div>
                  )}
                  {doc.last_used_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Dernier usage: {formatDate(doc.last_used_at)}</span>
                    </div>
                  )}
                </div>

                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        +{doc.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  {!doc.archived_at ? (
                    <>
                      <button
                        onClick={() => handleOpen(doc)}
                        className="flex-1 px-3 py-2 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg transition flex items-center justify-center gap-1 text-sm font-medium"
                        title="Ouvrir avec l'application par défaut"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ouvrir
                      </button>
                      {documentEditorService.isEditable(doc) && (
                        <button
                          onClick={() => handleEdit(doc)}
                          className="flex-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                          title="Modifier en ligne"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(doc)}
                        className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                        title="Télécharger sur votre ordinateur"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleView(doc)}
                        className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                        title="Aperçu rapide"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!doc.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(doc.id)}
                          className="flex-1 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                          title="Définir comme principal"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleArchive(doc.id)}
                        className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                        title="Archiver"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestore(doc.id)}
                        className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Restaurer
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          uploading={uploadProgress}
          onComplete={(successCount, errorCount) => {
            if (successCount > 0) {
              setNotification({
                show: true,
                type: 'success',
                title: 'Documents téléversés !',
                message: `${successCount} document${successCount > 1 ? 's ont' : ' a'} été téléversé${successCount > 1 ? 's' : ''} avec succès.${errorCount > 0 ? ` ${errorCount} échec${errorCount > 1 ? 's' : ''}.` : ''}`
              });
            } else if (errorCount > 0) {
              setNotification({
                show: true,
                type: 'error',
                title: 'Erreur de téléversement',
                message: `Échec du téléversement de ${errorCount} document${errorCount > 1 ? 's' : ''}.`
              });
            }
          }}
        />
      )}

      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onEdit={() => {
            setEditingDocument(selectedDocument);
            setSelectedDocument(null);
          }}
        />
      )}

      {editingDocument && (
        <DocumentEditor
          document={editingDocument}
          onClose={handleEditorClose}
          onSave={handleEditorClose}
        />
      )}

      <SuccessModal
        isOpen={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
}

interface UploadModalProps {
  onClose: () => void;
  onUpload: (file: File, documentType: DocumentType, customTitle?: string) => Promise<void>;
  uploading: boolean;
  onComplete: (successCount: number, errorCount: number) => void;
}

interface DocumentToUpload {
  id: string;
  file: File;
  documentType: DocumentType;
  customTitle: string;
}

function UploadModal({ onClose, onUpload, uploading, onComplete }: UploadModalProps) {
  const [documentsToUpload, setDocumentsToUpload] = useState<DocumentToUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      addFiles(filesArray);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      addFiles(filesArray);
    }
  };

  const addFiles = (files: File[]) => {
    const newDocuments: DocumentToUpload[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      documentType: 'other' as DocumentType,
      customTitle: ''
    }));
    setDocumentsToUpload(prev => [...prev, ...newDocuments]);
  };

  const removeDocument = (id: string) => {
    setDocumentsToUpload(prev => prev.filter(doc => doc.id !== id));
  };

  const updateDocumentType = (id: string, type: DocumentType) => {
    setDocumentsToUpload(prev =>
      prev.map(doc => doc.id === id ? { ...doc, documentType: type } : doc)
    );
  };

  const updateDocumentTitle = (id: string, title: string) => {
    setDocumentsToUpload(prev =>
      prev.map(doc => doc.id === id ? { ...doc, customTitle: title } : doc)
    );
  };

  const handleSubmit = async () => {
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < documentsToUpload.length; i++) {
      setUploadingIndex(i);
      const doc = documentsToUpload[i];
      try {
        await onUpload(doc.file, doc.documentType, doc.customTitle || undefined);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }
    setUploadingIndex(null);
    setDocumentsToUpload([]);
    onComplete(successCount, errorCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Téléverser des documents</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-sm text-gray-500 mb-4">ou</p>
            <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer inline-block">
              Choisir des fichiers
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              PDF, DOC, DOCX, JPG, PNG (max 10MB par fichier)
            </p>
          </div>

          {documentsToUpload.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">
                  Documents à téléverser ({documentsToUpload.length})
                </h4>
              </div>

              {documentsToUpload.map((doc, index) => (
                <div
                  key={doc.id}
                  className={`bg-gray-50 border rounded-lg p-4 ${
                    uploadingIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm mb-1">{doc.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Type de document
                          </label>
                          <select
                            value={doc.documentType}
                            onChange={(e) => updateDocumentType(doc.id, e.target.value as DocumentType)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={uploadingIndex !== null}
                          >
                            <option value="cv">CV</option>
                            <option value="cover_letter">Lettre de motivation</option>
                            <option value="certificate">Certificat / Attestation</option>
                            <option value="other">Autre document</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Titre personnalisé (optionnel)
                          </label>
                          <input
                            type="text"
                            value={doc.customTitle}
                            onChange={(e) => updateDocumentTitle(doc.id, e.target.value)}
                            placeholder="Ex: CV Développeur Senior"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={uploadingIndex !== null}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                      disabled={uploadingIndex !== null}
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {uploadingIndex === index && (
                    <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Téléversement en cours...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={uploadingIndex !== null}
          >
            {documentsToUpload.length > 0 && uploadingIndex === null ? 'Annuler' : 'Fermer'}
          </button>
          {documentsToUpload.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={uploadingIndex !== null}
              className="flex-1 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadingIndex !== null ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Téléversement ({uploadingIndex + 1}/{documentsToUpload.length})
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Téléverser {documentsToUpload.length} document{documentsToUpload.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DocumentPreviewModalProps {
  document: CandidateDocument;
  onClose: () => void;
  onEdit: () => void;
}

function DocumentPreviewModal({ document, onClose, onEdit }: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');
  const [previewError, setPreviewError] = useState(false);

  const isPDF = document.file_type?.includes('pdf');
  const isImage = document.file_type?.includes('image');
  const isEditable = documentEditorService.isEditable(document);

  useEffect(() => {
    loadPreview();
  }, [document.id]);

  const loadPreview = async () => {
    setLoading(true);
    setPreviewError(false);

    if (isPDF || isImage) {
      setLoading(false);
      return;
    }

    try {
      const docContent = await documentEditorService.fetchDocumentContent(document);
      setContent(docContent.html);
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{document.file_name}</h3>
            <p className="text-sm text-gray-500">Version {document.version}</p>
          </div>
          <div className="flex items-center gap-2">
            {isEditable && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Modifier
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-2"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#0E2F56]" />
            </div>
          ) : previewError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Erreur lors du chargement de l'aperçu
              </p>
              <a
                href={document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg transition inline-flex items-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          ) : isPDF || isImage ? (
            <iframe
              src={document.file_url}
              className="w-full h-full min-h-[600px] border rounded"
              title={document.file_name}
            />
          ) : content ? (
            <div className="prose max-w-none p-4 bg-gray-50 rounded-lg">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Aperçu non disponible pour ce type de fichier
              </p>
              <div className="flex gap-3 justify-center">
                {isEditable && (
                  <button
                    onClick={onEdit}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition inline-flex items-center gap-2"
                  >
                    <Edit3 className="w-5 h-5" />
                    Modifier le document
                  </button>
                )}
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg transition inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Ouvrir dans un nouvel onglet
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
