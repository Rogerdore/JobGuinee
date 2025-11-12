import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  FileText,
  Mail,
  Download,
  Eye,
  Trash2,
  Calendar,
  Briefcase,
  Building,
  Sparkles,
  Loader,
  ChevronRight,
} from 'lucide-react';

interface AIDocument {
  id: string;
  document_type: 'cv' | 'cover_letter';
  title: string;
  content: any;
  style: string;
  target_position?: string;
  target_company_name?: string;
  status: string;
  download_count: number;
  created_at: string;
}

interface MyAIDocumentsProps {
  onBack?: () => void;
}

export default function MyAIDocuments({ onBack }: MyAIDocumentsProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<AIDocument | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'cv' | 'cover_letter'>('all');

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, filterType]);

  const loadDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_ai_documents', {
        p_user_id: user.id,
        p_document_type: filterType === 'all' ? null : filterType,
        p_limit: 50,
      });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm('Supprimer ce document?')) return;

    try {
      const { error } = await supabase
        .from('ai_generated_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      setDocuments(documents.filter((d) => d.id !== docId));
      setSelectedDoc(null);
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const downloadDocument = async (doc: AIDocument) => {
    try {
      await supabase.rpc('increment_document_download', {
        p_document_id: doc.id,
      });

      alert(`Téléchargement de "${doc.title}" (fonctionnalité PDF à venir)`);
      loadDocuments();
    } catch (error: any) {
      console.error('Erreur:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredDocs = documents;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 text-blue-900 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>Retour</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Documents IA</h1>
            <p className="text-gray-600">
              Retrouvez tous vos CV et lettres générés par l'intelligence artificielle
            </p>
          </div>
          <div className="bg-blue-50 px-6 py-3 rounded-lg">
            <div className="text-sm text-gray-600">Total documents</div>
            <div className="text-3xl font-bold text-blue-900">{documents.length}</div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-8">
        {[
          { value: 'all', label: 'Tous', icon: Sparkles },
          { value: 'cv', label: 'CV', icon: FileText },
          { value: 'cover_letter', label: 'Lettres', icon: Mail },
        ].map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.value}
              onClick={() => setFilterType(filter.value as any)}
              className={`px-6 py-3 rounded-lg font-medium transition flex items-center space-x-2 ${
                filterType === filter.value
                  ? 'bg-blue-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun document</h3>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas encore généré de documents avec l'IA
          </p>
          <button
            onClick={onBack}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition"
          >
            Générer mon premier document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer border-2 ${
                  selectedDoc?.id === doc.id ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        doc.document_type === 'cv'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-green-100 text-green-900'
                      }`}
                    >
                      {doc.document_type === 'cv' ? (
                        <FileText className="w-6 h-6" />
                      ) : (
                        <Mail className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{doc.title}</h3>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                        {doc.target_position && (
                          <span className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{doc.target_position}</span>
                          </span>
                        )}
                        {doc.target_company_name && (
                          <span className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{doc.target_company_name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(doc.created_at)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Download className="w-4 h-4" />
                          <span>{doc.download_count} téléchargements</span>
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doc.style === 'modern'
                              ? 'bg-blue-100 text-blue-900'
                              : doc.style === 'classic'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-purple-100 text-purple-900'
                          }`}
                        >
                          {doc.style}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadDocument(doc);
                      }}
                      className="p-2 text-blue-900 hover:bg-blue-50 rounded-lg transition"
                      title="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-900" />
                <span>Aperçu</span>
              </h3>

              {!selectedDoc ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Sélectionnez un document pour voir l'aperçu
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-2">{selectedDoc.title}</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(selectedDoc.created_at)}</span>
                      </div>
                      {selectedDoc.target_position && (
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{selectedDoc.target_position}</span>
                        </div>
                      )}
                      {selectedDoc.target_company_name && (
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4" />
                          <span>{selectedDoc.target_company_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => downloadDocument(selectedDoc)}
                      className="w-full bg-blue-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-800 transition flex items-center justify-center space-x-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Télécharger PDF</span>
                    </button>
                    <button
                      onClick={() => downloadDocument(selectedDoc)}
                      className="w-full border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center space-x-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Télécharger Word</span>
                    </button>
                    <button
                      onClick={() => deleteDocument(selectedDoc.id)}
                      className="w-full border-2 border-red-300 text-red-600 px-4 py-3 rounded-lg font-medium hover:bg-red-50 transition flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
