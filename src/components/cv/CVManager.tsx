import { useState, useEffect } from 'react';
import { FileText, Plus, Copy, Archive, Trash2, Eye, Download, Star, Edit3, Check, X, MoreVertical, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cvVersionService, CVVersion } from '../../services/cvVersionService';

interface CVManagerProps {
  onCreateNew?: () => void;
  onEditCV?: (cvId: string) => void;
  onViewCV?: (cvId: string) => void;
}

export default function CVManager({ onCreateNew, onEditCV, onViewCV }: CVManagerProps) {
  const { user } = useAuth();
  const [cvVersions, setCVVersions] = useState<CVVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (user) {
      loadCVVersions();
    }
  }, [user]);

  const loadCVVersions = async () => {
    if (!user) return;

    setLoading(true);
    const result = await cvVersionService.getUserCVVersions(user.id);

    if (result.success && result.data) {
      setCVVersions(result.data);
    }
    setLoading(false);
  };

  const handleDuplicate = async (cv: CVVersion) => {
    if (!user) return;

    setActionLoading(cv.id);
    const result = await cvVersionService.duplicateCVVersion(cv.id);

    if (result.success) {
      await loadCVVersions();
    } else {
      alert('Erreur lors de la duplication: ' + result.error);
    }
    setActionLoading(null);
    setOpenMenuId(null);
  };

  const handleArchive = async (cv: CVVersion) => {
    if (!user) return;
    if (!confirm(`Archiver le CV "${cv.cv_title}" ?`)) return;

    setActionLoading(cv.id);
    const result = await cvVersionService.archiveCV(cv.id);

    if (result.success) {
      await loadCVVersions();
    } else {
      alert('Erreur lors de l\'archivage: ' + result.error);
    }
    setActionLoading(null);
    setOpenMenuId(null);
  };

  const handleDelete = async (cv: CVVersion) => {
    if (!user) return;
    if (!confirm(`Supprimer définitivement le CV "${cv.cv_title}" ?\n\nCette action est irréversible.`)) return;

    setActionLoading(cv.id);
    const result = await cvVersionService.deleteCVVersion(cv.id);

    if (result.success) {
      await loadCVVersions();
    } else {
      alert('Erreur lors de la suppression: ' + result.error);
    }
    setActionLoading(null);
    setOpenMenuId(null);
  };

  const handleSetActive = async (cv: CVVersion) => {
    if (!user) return;

    setActionLoading(cv.id);
    const result = await cvVersionService.setActiveCV(cv.id, user.id);

    if (result.success) {
      await loadCVVersions();
    } else {
      alert('Erreur: ' + result.error);
    }
    setActionLoading(null);
    setOpenMenuId(null);
  };

  const handleSetDefault = async (cv: CVVersion) => {
    if (!user) return;

    setActionLoading(cv.id);
    const result = await cvVersionService.setDefaultCV(cv.id, user.id);

    if (result.success) {
      await loadCVVersions();
    } else {
      alert('Erreur: ' + result.error);
    }
    setActionLoading(null);
    setOpenMenuId(null);
  };

  const handleRename = async (cv: CVVersion) => {
    if (!editTitle.trim()) return;

    setActionLoading(cv.id);
    const result = await cvVersionService.updateCVVersion(cv.id, {
      cv_title: editTitle.trim()
    });

    if (result.success) {
      await loadCVVersions();
      setEditingTitleId(null);
      setEditTitle('');
    } else {
      alert('Erreur lors du renommage: ' + result.error);
    }
    setActionLoading(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Vous devez être connecté pour gérer vos CV</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">Chargement de vos CV...</p>
      </div>
    );
  }

  if (cvVersions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun CV créé
        </h3>
        <p className="text-gray-600 mb-6">
          Commencez par créer votre premier CV professionnel
        </p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Créer mon premier CV
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes CV</h2>
          <p className="text-gray-600 mt-1">{cvVersions.length} CV créé{cvVersions.length > 1 ? 's' : ''}</p>
        </div>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Nouveau CV
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cvVersions.map((cv) => (
          <div
            key={cv.id}
            className={`relative bg-white rounded-xl border-2 p-6 transition-all ${
              cv.is_active
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {cv.is_active && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  <Check className="w-3 h-3" />
                  Actif
                </span>
              </div>
            )}

            {cv.is_default && (
              <div className="absolute top-3 left-3">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
            )}

            <div className="mt-2 mb-4">
              {editingTitleId === cv.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(cv);
                      if (e.key === 'Escape') {
                        setEditingTitleId(null);
                        setEditTitle('');
                      }
                    }}
                  />
                  <button
                    onClick={() => handleRename(cv)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    disabled={actionLoading === cv.id}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTitleId(null);
                      setEditTitle('');
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {cv.cv_title}
                </h3>
              )}
              {cv.professional_title && (
                <p className="text-sm text-gray-600 mt-1 truncate">{cv.professional_title}</p>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Version {cv.version_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDate(cv.updated_at)}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{cv.view_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <span>{cv.download_count}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onViewCV && (
                <button
                  onClick={() => onViewCV(cv.id)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Voir
                </button>
              )}
              {onEditCV && (
                <button
                  onClick={() => onEditCV(cv.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Éditer
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === cv.id ? null : cv.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  disabled={actionLoading === cv.id}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {openMenuId === cv.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => {
                        setEditingTitleId(cv.id);
                        setEditTitle(cv.cv_title);
                        setOpenMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 className="w-4 h-4" />
                      Renommer
                    </button>

                    <button
                      onClick={() => handleDuplicate(cv)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="w-4 h-4" />
                      Dupliquer
                    </button>

                    {!cv.is_active && (
                      <button
                        onClick={() => handleSetActive(cv)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Check className="w-4 h-4" />
                        Définir comme actif
                      </button>
                    )}

                    {!cv.is_default && (
                      <button
                        onClick={() => handleSetDefault(cv)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Star className="w-4 h-4" />
                        Définir par défaut
                      </button>
                    )}

                    {cv.is_active && (
                      <button
                        onClick={() => handleArchive(cv)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Archive className="w-4 h-4" />
                        Archiver
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(cv)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {actionLoading === cv.id && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
