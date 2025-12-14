import { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  FolderOpen,
  Search,
  Calendar,
  Download,
  Eye,
  Filter,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { candidateDocumentService } from '../../services/candidateDocumentService';

interface CoverLetterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: string, fileName?: string) => void;
  candidateId: string;
}

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  document_category: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
}

type ImportMode = 'choose' | 'upload' | 'documents';
type SortBy = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';

export default function CoverLetterImportModal({
  isOpen,
  onClose,
  onImport,
  candidateId
}: CoverLetterImportModalProps) {
  const [mode, setMode] = useState<ImportMode>('choose');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  useEffect(() => {
    if (isOpen && mode === 'documents') {
      loadDocuments();
    }
  }, [isOpen, mode, candidateId]);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, sortBy]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await candidateDocumentService.getDocumentsByCandidate(candidateId);

      const coverLetters = docs.filter(
        doc => doc.document_category === 'cover_letter' ||
               doc.document_type.toLowerCase().includes('lettre')
      );

      setDocuments(coverLetters);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.document_name.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        case 'date_asc':
          return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
        case 'name_asc':
          return a.document_name.localeCompare(b.document_name);
        case 'name_desc':
          return b.document_name.localeCompare(a.document_name);
        default:
          return 0;
      }
    });

    setFilteredDocuments(filtered);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['.txt', '.doc', '.docx', '.pdf'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      alert('Format de fichier non supporté. Utilisez: TXT, DOC, DOCX ou PDF');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        onImport(content, selectedFile.name);
        resetAndClose();
      };

      if (selectedFile.type === 'text/plain') {
        reader.readAsText(selectedFile);
      } else {
        const content = `Fichier importé: ${selectedFile.name}\n\n[Contenu du fichier ${selectedFile.type}]`;
        onImport(content, selectedFile.name);
        resetAndClose();
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Erreur lors de la lecture du fichier');
    }
  };

  const handleDocumentImport = async (doc: Document) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.storage
        .from('candidate-documents')
        .download(doc.file_url);

      if (error) throw error;

      const text = await data.text();
      onImport(text, doc.document_name);
      resetAndClose();
    } catch (error) {
      console.error('Error importing document:', error);
      alert('Erreur lors de l\'import du document');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setMode('choose');
    setSearchQuery('');
    setSelectedFile(null);
    setPreviewDocument(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Importer une lettre de motivation
          </h2>
          <button
            onClick={resetAndClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'choose' && (
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('upload')}
                className="group p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Télécharger un fichier
                </h3>
                <p className="text-sm text-gray-600">
                  Depuis votre ordinateur, Dropbox, Drive, etc.
                </p>
              </button>

              <button
                onClick={() => setMode('documents')}
                className="group p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition">
                  <FolderOpen className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mes documents
                </h3>
                <p className="text-sm text-gray-600">
                  Importer depuis votre centre de documents
                </p>
              </button>
            </div>
          )}

          {mode === 'upload' && (
            <div className="max-w-xl mx-auto">
              <button
                onClick={() => setMode('choose')}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1 text-sm font-medium"
              >
                ← Retour
              </button>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Télécharger un fichier
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Formats acceptés : TXT, DOC, DOCX, PDF
                </p>
                <input
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cover-letter-upload"
                />
                <label
                  htmlFor="cover-letter-upload"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer transition"
                >
                  Choisir un fichier
                </label>

                {selectedFile && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleUploadSubmit}
                      disabled={loading}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      {loading ? 'Import en cours...' : 'Importer ce fichier'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'documents' && (
            <div>
              <button
                onClick={() => setMode('choose')}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1 text-sm font-medium"
              >
                ← Retour
              </button>

              <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un document..."
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
                  >
                    <option value="date_desc">Plus récent</option>
                    <option value="date_asc">Plus ancien</option>
                    <option value="name_asc">Nom A-Z</option>
                    <option value="name_desc">Nom Z-A</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchQuery
                      ? 'Aucun document ne correspond à votre recherche'
                      : 'Aucune lettre de motivation trouvée dans vos documents'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition group"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {doc.document_name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(doc.uploaded_at)}
                          </span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDocumentImport(doc)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
