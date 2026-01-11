import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Save, Download, Copy, X, RefreshCw, AlertCircle,
  CheckCircle, FileText, Edit3
} from 'lucide-react';
import { CandidateDocument } from '../../services/candidateDocumentService';
import {
  documentEditorService,
  DocumentContent,
  SaveDocumentOptions
} from '../../services/documentEditorService';

interface DocumentEditorProps {
  document: CandidateDocument;
  onClose: () => void;
  onSave?: () => void;
}

export default function DocumentEditor({ document, onClose, onSave }: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState<DocumentContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: ''
  });

  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    loadDocumentContent();
  }, [document.id]);

  const loadDocumentContent = async () => {
    setLoading(true);
    try {
      const docContent = await documentEditorService.fetchDocumentContent(document);
      setOriginalContent(docContent);
      setContent(docContent.html);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading document:', error);
      showNotification('error', 'Erreur lors du chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (originalContent) {
      setHasChanges(value !== originalContent.html);
    }
  };

  const handleSave = async (createNewVersion: boolean = false) => {
    if (!hasChanges && !createNewVersion) {
      showNotification('info', 'Aucune modification à enregistrer');
      return;
    }

    if (!originalContent?.editable) {
      showNotification('error', 'Ce document ne peut pas être modifié');
      return;
    }

    setSaving(true);
    try {
      const options: SaveDocumentOptions = {
        documentId: document.id,
        content,
        createNewVersion,
        metadata: {
          editor_used: 'rich_text_editor',
          last_modification: new Date().toISOString()
        }
      };

      await documentEditorService.saveDocument(options);

      showNotification(
        'success',
        createNewVersion
          ? 'Nouvelle version créée avec succès !'
          : 'Document sauvegardé avec succès !'
      );

      setHasChanges(false);

      if (onSave) {
        onSave();
      }

      setTimeout(() => {
        if (createNewVersion) {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error('Error saving document:', error);
      showNotification('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (format: 'html' | 'txt' = 'html') => {
    try {
      await documentEditorService.downloadDocument(document, content, format);
      showNotification('success', 'Document téléchargé !');
    } catch (error) {
      console.error('Error downloading:', error);
      showNotification('error', 'Erreur lors du téléchargement');
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer ?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: 'info', message: '' });
    }, 3000);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'align',
    'color',
    'background',
    'link'
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 animate-spin text-[#0E2F56]" />
          <p className="text-gray-600">Chargement du document...</p>
        </div>
      </div>
    );
  }

  if (!originalContent?.editable) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <h3 className="text-xl font-bold text-gray-900">Document non éditable</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Ce type de fichier ne peut pas être édité directement. Veuillez télécharger le fichier
            et le modifier avec un logiciel approprié.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-[#0E2F56]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{document.file_name}</h3>
              <p className="text-sm text-gray-500">Version {document.version}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Modifications non enregistrées
              </span>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-2"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              placeholder="Commencez à écrire..."
              className="document-editor-quill"
              style={{ height: 'calc(95vh - 250px)' }}
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
            disabled={saving}
          >
            <X className="w-4 h-4" />
            Annuler
          </button>

          <button
            onClick={() => handleDownload('html')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition flex items-center gap-2"
            disabled={saving}
            title="Télécharger en HTML"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>

          <button
            onClick={() => handleSave(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
            disabled={saving || !hasChanges}
            title="Créer une nouvelle version"
          >
            <Copy className="w-4 h-4" />
            Nouvelle version
          </button>

          <button
            onClick={() => handleSave(false)}
            className="px-4 py-2 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg transition flex items-center gap-2 flex-1"
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {notification.show && (
        <div className="fixed top-4 right-4 z-[60] animate-fade-in">
          <div
            className={`rounded-lg p-4 shadow-lg flex items-center gap-3 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
            <p
              className={`text-sm font-medium ${
                notification.type === 'success'
                  ? 'text-green-900'
                  : notification.type === 'error'
                  ? 'text-red-900'
                  : 'text-blue-900'
              }`}
            >
              {notification.message}
            </p>
          </div>
        </div>
      )}

      <style>{`
        .document-editor-quill .ql-container {
          border: none;
          font-size: 15px;
          line-height: 1.6;
        }
        .document-editor-quill .ql-editor {
          min-height: 400px;
          padding: 20px;
        }
        .document-editor-quill .ql-editor:focus {
          outline: none;
        }
        .document-editor-quill .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px 8px 0 0;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
